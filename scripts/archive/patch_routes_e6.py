import re

file_path = "backend/src/routes/v2/aeRoutes.js"
with open(file_path, "r") as f:
    content = f.read()

# Add require for AeDocumentRuleEngine
if "AeDocumentRuleEngine" not in content:
    content = content.replace("const AeChecklistRuleEngine = require('../../services/AeChecklistRuleEngine');", "const AeChecklistRuleEngine = require('../../services/AeChecklistRuleEngine');\nconst AeDocumentRuleEngine = require('../../services/AeDocumentRuleEngine');")

# Inject document activity seeding into POST /jobs/:id/checklist/generate
doc_seed_code = """
      // Seed Document Activities
      const docMapping = AeDocumentRuleEngine.getDocumentMapping();
      
      const insertDoc = db.prepare(`
        INSERT OR IGNORE INTO ae_job_documents (job_id, document_name, state)
        VALUES (?, ?, 'MISSING')
      `);
      const getDocId = db.prepare(`SELECT id FROM ae_job_documents WHERE job_id = ? AND document_name = ?`);
      
      const insertAct = db.prepare(`
        INSERT OR IGNORE INTO ae_job_document_activities (job_document_id, activity_name, status)
        VALUES (?, ?, 'PENDING')
      `);

      for (const mapping of docMapping) {
         // Optionally, evaluate if document should be added based on job rules.
         // For now, we seed all from mapping. Unnecessary ones can be marked N/A by users or refined later.
         insertDoc.run(id, mapping.document);
         const docRecord = getDocId.get(id, mapping.document);
         if (docRecord) {
            for(const act of mapping.activities) {
               insertAct.run(docRecord.id, act);
            }
         }
      }
"""

# Place it after checklist items are inserted
if "db.prepare(`UPDATE export_jobs SET ae_progress = 0" in content and "AeDocumentRuleEngine.getDocumentMapping();" not in content:
    content = content.replace("db.prepare(`UPDATE export_jobs SET ae_progress = 0", doc_seed_code + "\n      db.prepare(`UPDATE export_jobs SET ae_progress = 0")


# Now add the document API endpoints

new_routes = """
/**
 * GET /api/v2/ae/jobs/:id/documents
 * Fetch document and their activities
 */
router.get('/jobs/:id/documents', (req, res, next) => {
  try {
    const { id } = req.params;
    
    // RBAC
    if (req.user.level_otoritas === 'Staff Dept') {
      const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
      if (!job || job.ae_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, code: 403, errorCode: 'FORBIDDEN', message: 'You are not assigned to this job' });
      }
    }

    const documents = db.prepare(`SELECT * FROM ae_job_documents WHERE job_id = ?`).all(id);
    const activities = db.prepare(`
      SELECT a.* FROM ae_job_document_activities a
      JOIN ae_job_documents d ON a.job_document_id = d.id
      WHERE d.job_id = ?
    `).all(id);

    const result = documents.map(d => {
      d.activities = activities.filter(a => a.job_document_id === d.id);
      return d;
    });

    return ApiResponse.send(req, res, result);
  } catch (error) {
    logger.error('Failed to fetch documents', { error: error.message, jobId: req.params.id });
    next(error);
  }
});

/**
 * PATCH /api/v2/ae/jobs/:id/document-activities/:activityId
 * Update document activity status
 */
router.patch('/jobs/:id/document-activities/:activityId', (req, res, next) => {
  try {
    const { id, activityId } = req.params;
    const { status, version } = req.body;

    if (!['PENDING','IN PROGRESS','COMPLETED','NOT APPLICABLE','BLOCKED'].includes(status)) {
       return res.status(400).json({ success: false, code: 400, message: 'Invalid status' });
    }

    if (req.user.level_otoritas === 'Staff Dept') {
      const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
      if (!job || job.ae_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, code: 403, errorCode: 'FORBIDDEN', message: 'Not authorized' });
      }
    }

    const activity = db.prepare(`
       SELECT a.*, d.document_name, d.state, d.job_id 
       FROM ae_job_document_activities a
       JOIN ae_job_documents d ON a.job_document_id = d.id
       WHERE a.id = ?
    `).get(activityId);

    if (!activity) return res.status(404).json({ success: false, code: 404, message: 'Activity not found' });
    if (activity.job_id != id) return res.status(400).json({ success: false, code: 400, message: 'Activity does not belong to job' });
    if (version && activity.version !== version) {
       return res.status(409).json({ success: false, code: 409, message: 'Conflict: Activity has been updated by another user.' });
    }

    const updateAct = db.prepare(`UPDATE ae_job_document_activities SET status = ?, completed_by_id = ?, completed_at = datetime('now'), version = version + 1 WHERE id = ?`);
    const updateDoc = db.prepare(`UPDATE ae_job_documents SET state = ? WHERE id = ?`);
    const insertAudit = db.prepare(`INSERT INTO ae_document_activity_audit (job_id, job_document_id, activity_id, actor_id, old_state, new_state, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    db.transaction(() => {
       updateAct.run(status, req.user.id, activityId);
       
       // Recalculate document state
       const allActivities = db.prepare(`SELECT * FROM ae_job_document_activities WHERE job_document_id = ?`).all(activity.job_document_id);
       // we must temporarily patch the array with the new status since it hasn't committed or we query after update
       const updatedActIndex = allActivities.findIndex(a => a.id == activityId);
       if (updatedActIndex >= 0) allActivities[updatedActIndex].status = status;

       const newState = AeDocumentRuleEngine.deriveDocumentState(activity.document_name, allActivities);
       if (newState !== activity.state) {
          updateDoc.run(newState, activity.job_document_id);
       }

       insertAudit.run(id, activity.job_document_id, activityId, req.user.id, activity.status + '|' + activity.state, status + '|' + newState, 'Status updated');
    })();

    // return the full document to update UI
    const updatedDocument = db.prepare(`SELECT * FROM ae_job_documents WHERE id = ?`).get(activity.job_document_id);
    updatedDocument.activities = db.prepare(`SELECT * FROM ae_job_document_activities WHERE job_document_id = ?`).all(activity.job_document_id);

    return ApiResponse.send(req, res, updatedDocument);
  } catch (error) {
    logger.error('Failed to update document activity', { error: error.message });
    next(error);
  }
});
"""

if "router.get('/jobs/:id/documents'" not in content:
    content = content.replace("module.exports = router;", new_routes + "\nmodule.exports = router;")

with open(file_path, "w") as f:
    f.write(content)
print("aeRoutes.js patched for documents.")
