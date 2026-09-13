import sys

with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

old_route = """
/**
 * PATCH /api/v2/ae/jobs/:id/document-activities/:activityId
 * Allows AE Staff to update activity status
 */
router.patch('/jobs/:id/document-activities/:activityId', (req, res, next) => {
  try {
    const { id, activityId } = req.params;
    const { status, evidence_payload, latest_remark } = req.body;

    // RBAC: Must be assignee
    const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, code: 404, message: 'Job not found' });
    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, code: 403, message: 'Not authorized' });
    }

    const activity = db.prepare(`SELECT * FROM ae_job_document_activities WHERE id = ? AND job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id = ?)`).get(activityId, id);
    if (!activity) return res.status(404).json({ success: false, code: 404, message: 'Activity not found for this job' });

    db.prepare(`
      UPDATE ae_job_document_activities 
      SET status = ?, evidence_payload = ?, latest_remark = ?, completed_at = datetime('now'), completed_by_id = ? 
      WHERE id = ?
    `).run(status, evidence_payload, latest_remark, req.user.id, activityId);

    // Sync legacy checklist item just in case UI relies on it
    try {
       // Match by name heuristics or ignore
       const docName = db.prepare(`SELECT document_name FROM ae_job_documents WHERE id = ?`).get(activity.job_document_id).document_name;
       db.prepare(`UPDATE ae_job_checklist_items SET status = ?, completed_at = datetime('now'), completed_by_id = ?, remarks = ? WHERE job_checklist_id IN (SELECT id FROM ae_job_checklists WHERE job_id = ?) AND snap_item_label = ?`).run(status, req.user.id, latest_remark, id, docName);
    } catch(e){}

    // Audit
    db.prepare(`INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, ?, 'ACTIVITY', ?, ?, ?)`).run(req.user.id, 'ACTIVITY_UPDATED', activityId, `Updated activity to ${status}`, JSON.stringify({ status, remark: latest_remark }));

    ApiResponse.send(req, res, { message: 'Activity updated' });
  } catch (error) {
    logger.error('Failed to update activity', { error: error.message });
    next(error);
  }
});
"""

new_route = """
/**
 * POST /api/v2/ae/jobs/:id/actions/:actionId/execute
 * Execute an action, capture result, update state, evaluate next step.
 */
router.post('/jobs/:id/actions/:actionId/execute', (req, res, next) => {
  try {
    const { id, actionId } = req.params;
    const { result, evidence_payload, latest_remark } = req.body;

    const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, code: 404, message: 'Job not found' });
    if (req.user.level_otoritas === 'Staff Dept' && String(job.ae_assignee_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, code: 403, message: 'Not authorized' });
    }

    const activity = db.prepare(`SELECT * FROM ae_job_document_activities WHERE id = ? AND job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id = ?)`).get(actionId, id);
    if (!activity) return res.status(404).json({ success: false, code: 404, message: 'Action not found for this job' });

    let finalStatus = 'COMPLETED';
    
    // Process Results logic based on Phase G/H
    if (result === 'FAIL') {
       finalStatus = 'COMPLETED'; // The checking activity itself is complete, but it triggers a revision
       // Create revision logic
       const doc = db.prepare(`SELECT * FROM ae_job_documents WHERE id = ?`).get(activity.job_document_id);
       const latestVer = db.prepare(`SELECT MAX(version_number) as v FROM ae_job_document_versions WHERE logical_document_id = ?`).get(doc.id).v;
       const nextVersion = (latestVer || 1) + 1;
       
       db.prepare(`INSERT INTO ae_job_document_versions (logical_document_id, version_number, reason, requested_by) VALUES (?, ?, ?, ?)`).run(doc.id, nextVersion, latest_remark || 'Revision Requested', req.user.id);
       
       // Update doc state
       db.prepare(`UPDATE ae_job_documents SET state = 'REVISED' WHERE id = ?`).run(doc.id);
       
       // Duplicate previous pending activities to new version (Optional, depending on exact workflow)
       // We just add a "REVISE" activity dynamically
       db.prepare(`INSERT INTO ae_job_document_activities (job_document_id, activity_name, status, version) VALUES (?, ?, 'PENDING', ?)`).run(doc.id, 'REVISE - ' + doc.document_name, nextVersion);

       try {
           db.prepare(`INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, 'REVISION_CREATED', 'EXPORT_JOB', ?, 'Revision created', ?)`).run(req.user.id, id, JSON.stringify({ document_id: doc.id, version: nextVersion, reason: latest_remark }));
       } catch(e){}
    }
    
    db.prepare(`
      UPDATE ae_job_document_activities 
      SET status = ?, result = ?, evidence_payload = ?, latest_remark = ?, completed_at = datetime('now'), completed_by_id = ? 
      WHERE id = ?
    `).run(finalStatus, result, evidence_payload, latest_remark, req.user.id, actionId);

    // Sync legacy checklist item just in case UI relies on it
    try {
       const docName = db.prepare(`SELECT document_name FROM ae_job_documents WHERE id = ?`).get(activity.job_document_id).document_name;
       db.prepare(`UPDATE ae_job_checklist_items SET status = ?, completed_at = datetime('now'), completed_by_id = ?, remarks = ? WHERE job_checklist_id IN (SELECT id FROM ae_job_checklists WHERE job_id = ?) AND snap_item_label = ?`).run(finalStatus, req.user.id, latest_remark, id, docName);
    } catch(e){}

    db.prepare(`INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, new_value) VALUES (?, ?, 'ACTIVITY', ?, ?, ?)`).run(req.user.id, 'ACTIVITY_EXECUTED', actionId, `Executed action with result: ${result}`, JSON.stringify({ result, remark: latest_remark }));

    ApiResponse.send(req, res, { message: 'Action executed successfully', result, finalStatus });
  } catch (error) {
    logger.error('Failed to execute action', { error: error.message });
    next(error);
  }
});
"""

if "router.patch('/jobs/:id/document-activities/:activityId'" in content:
    content = content.replace(old_route, new_route)
    with open('src/routes/v2/aeRoutes.js', 'w') as f:
        f.write(content)
    print("Patched route")
else:
    print("Could not find route")
