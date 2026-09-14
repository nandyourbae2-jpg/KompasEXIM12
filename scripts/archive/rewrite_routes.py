import sys

with open('backend/src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

start_str = "router.get('/jobs/:id/workbench', (req, res, next) => {"
end_str = "module.exports = router;"

start_idx = content.find(start_str)

new_routes = """router.get('/jobs/:id/workbench', (req, res, next) => {
  try {
    const { id } = req.params;
    
    const job = db.prepare(`SELECT e.*, u.nama as ae_assignee_name FROM export_jobs e LEFT JOIN users u ON e.ae_assignee_id = u.id WHERE e.id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, code: 404, message: 'Job not found' });

    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, code: 403, message: 'Not authorized' });
    }

    // Ensure generated
    AeWorkflowEngine.autoGenerateChecklist(job.id, req.user.id);
    
    const context = AeWorkflowEngine.getJobContext(job.id);
    
    // Fetch latest versions only
    const latestVersions = db.prepare(`
        SELECT MAX(id) as latest_id FROM ae_job_document_versions v
        JOIN ae_job_documents d ON v.job_document_id = d.id
        WHERE d.job_id = ?
        GROUP BY v.job_document_id
    `).all(job.id).map(r => r.latest_id);

    let items = [];
    if (latestVersions.length > 0) {
        items = db.prepare(`
            SELECT 
                a.id, a.activity_name, a.status,
                d.document_name, d.stage_name, d.state as doc_state,
                v.version_number
            FROM ae_job_document_activities a
            JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
            JOIN ae_job_documents d ON v.job_document_id = d.id
            WHERE v.id IN (${latestVersions.map(() => '?').join(',')})
            ORDER BY d.id ASC, a.sequence_order ASC
        `).all(...latestVersions);
    }

    const workbench = {};
    for (const item of items) {
       if (!workbench[item.stage_name]) workbench[item.stage_name] = {};
       if (!workbench[item.stage_name][item.document_name]) {
           workbench[item.stage_name][item.document_name] = { activities: [] };
       }
       
       workbench[item.stage_name][item.document_name].activities.push({
           id: item.id,
           activity_name: item.activity_name,
           status: item.status,
           version: item.version_number,
           doc_state: item.doc_state
       });
    }

    const blockers = db.prepare(`SELECT * FROM ae_job_blockers WHERE job_id = ? ORDER BY opened_at DESC`).all(job.id);
    
    const opsData = db.prepare(`SELECT * FROM ae_job_operational_data WHERE job_id = ?`).get(job.id);
    if (opsData) {
        job.peb_issuer = opsData.peb_issuer;
        job.draft_final_recipient = opsData.draft_final_recipient;
        job.bl_mbl = opsData.bl_mbl;
        job.cc_non_cc = opsData.cc_non_cc;
        job.coo_form = opsData.coo_form;
        job.qc_attend = opsData.qc_attend;
    }

    res.json({
      success: true,
      data: {
        job: { ...job, ...context },
        workbench,
        blockers
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/jobs/:id/actions/:actionId/execute', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const { id, actionId } = req.params;
    const { result, evidence_payload, remark, peb_issuer, draft_final_recipient } = req.body;

    const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, code: 404, message: 'Job not found' });
    
    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
       return res.status(403).json({ success: false, code: 403, message: 'Not authorized' });
    }

    const activity = db.prepare(`SELECT * FROM ae_job_document_activities WHERE id = ?`).get(actionId);
    if (!activity) return res.status(404).json({ success: false, code: 404, message: 'Activity not found' });

    db.transaction(() => {
        // Record result
        db.prepare(`
            INSERT INTO ae_job_activity_results (job_document_activity_id, action_result, disposition, evidence_payload, catatan, executed_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            actionId, 
            result === 'FAIL' ? 'FAIL' : 'PASS', 
            result === 'FAIL' ? 'REVISION_REQUIRED' : 'NONE', 
            evidence_payload ? JSON.stringify(evidence_payload) : null,
            remark,
            req.user.id
        );

        // Update Operational Data if provided
        if (peb_issuer !== undefined || draft_final_recipient !== undefined) {
             db.prepare(`
                 UPDATE ae_job_operational_data 
                 SET peb_issuer = COALESCE(?, peb_issuer), 
                     draft_final_recipient = COALESCE(?, draft_final_recipient) 
                 WHERE job_id = ?
             `).run(peb_issuer, draft_final_recipient, id);
        }

        if (result === 'FAIL') {
            // Mark activity as completed (so it doesn't block infinitely without spawn)
            db.prepare(`UPDATE ae_job_document_activities SET status = 'COMPLETED' WHERE id = ?`).run(actionId);
            
            // Spawn V2
            const currentVer = db.prepare(`SELECT * FROM ae_job_document_versions WHERE id = ?`).get(activity.job_document_version_id);
            const doc = db.prepare(`SELECT * FROM ae_job_documents WHERE id = ?`).get(currentVer.job_document_id);
            
            const newVer = db.prepare(`INSERT INTO ae_job_document_versions (job_document_id, version_number) VALUES (?, ?)`).run(doc.id, currentVer.version_number + 1);
            
            // Re-spawn activities for this document based on the template logic.
            // For simplicity in this demo, we just duplicate the sequence of activities for V2.
            const allActs = db.prepare(`SELECT * FROM ae_job_document_activities WHERE job_document_version_id = ? ORDER BY sequence_order ASC`).all(currentVer.id);
            const insertAct = db.prepare(`INSERT INTO ae_job_document_activities (job_document_version_id, activity_name, sequence_order) VALUES (?, ?, ?)`);
            for (const act of allActs) {
                insertAct.run(newVer.lastInsertRowid, act.activity_name, act.sequence_order);
            }
        } else {
            // PASS or DONE
            db.prepare(`UPDATE ae_job_document_activities SET status = 'COMPLETED' WHERE id = ?`).run(actionId);
        }
    })();

    const context = AeWorkflowEngine.getJobContext(id);

    res.json({
      success: true,
      data: {
        job: { ...job, ...context }
      }
    });

  } catch (err) {
    next(err);
  }
});

router.put('/jobs/:id/operational-data', requireRole(['Staff Dept', 'Supervisor']), (req, res, next) => {
  try {
    const { id } = req.params;
    const { bl_mbl, cc_non_cc, coo_form, qc_attend } = req.body;
    
    const insertOps = db.prepare(`INSERT OR IGNORE INTO ae_job_operational_data (job_id) VALUES (?)`);
    insertOps.run(id);

    db.prepare(`
        UPDATE ae_job_operational_data 
        SET bl_mbl = ?, cc_non_cc = ?, coo_form = ?, qc_attend = ? 
        WHERE job_id = ?
    `).run(bl_mbl, cc_non_cc, coo_form, qc_attend, id);
    
    // Optionally update export_jobs term if needed, skipping for now
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
"""

content = content[:start_idx] + new_routes

with open('backend/src/routes/v2/aeRoutes.js', 'w') as f:
    f.write(content)
print("Rewritten aeRoutes")
