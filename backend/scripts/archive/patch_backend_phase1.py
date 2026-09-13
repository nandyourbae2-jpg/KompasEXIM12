import sys
import re

# 1. Update execute endpoint in aeRoutes.js
with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

# Replace the previous execute endpoint logic
old_execute = """router.post('/jobs/:id/actions/:actionId/execute', requireRole(['Supervisor', 'Manager', 'Staff Dept']), (req, res, next) => {
  try {
    const jobId = req.params.id;
    const actionId = req.params.actionId;
    const { result, evidence, remark } = req.body;

    // 1. Verify action belongs to job and is pending
    const activity = db.prepare(`SELECT * FROM ae_job_document_activities WHERE id = ?`).get(actionId);
    if (!activity) return res.status(404).json({ success: false, message: 'Action not found' });
    
    const doc = db.prepare(`SELECT * FROM ae_job_documents WHERE id = ?`).get(activity.job_document_id);
    if (doc.job_id != jobId) return res.status(400).json({ success: false, message: 'Action does not belong to job' });

    db.transaction(() => {
      // 2. Save result
      db.prepare(`UPDATE ae_job_document_activities SET status = ?, remarks = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(result === 'PASS' ? 'COMPLETED' : 'FAILED', remark, actionId);

      // Log execution
      db.prepare(`INSERT INTO ae_audit_logs (job_id, action, description, user_id, user_name) VALUES (?, ?, ?, ?, ?)`)
        .run(jobId, 'ACTION_EXECUTED', `Executed ${activity.activity_name} with result ${result}`, req.user.id, req.user.nama || req.user.username);

      // 3. Disposition Flow (If FAIL)
      if (result === 'FAIL') {
         // Default disposition logic: Block the job for supervisor review
         // In a real system, this would read from the configured outcome template.
         db.prepare(`INSERT INTO ae_job_blockers (job_id, reason, reported_by_id, reported_by_name) VALUES (?, ?, ?, ?)`)
           .run(jobId, `Action Failed: ${activity.activity_name}. Reason: ${remark}`, req.user.id, req.user.nama || req.user.username);
         
         db.prepare(`INSERT INTO ae_audit_logs (job_id, action, description, user_id, user_name) VALUES (?, ?, ?, ?, ?)`)
           .run(jobId, 'JOB_BLOCKED', `Job automatically blocked due to action failure`, req.user.id, req.user.nama || req.user.username);
      }
      
      // Note: Re-calculating next action is handled dynamically via AeWorkflowEngine on read.
    })();

    ApiResponse.send(req, res, { message: 'Action executed successfully' });
  } catch (error) {
    next(error);
  }
});"""

new_execute = """const AeWorkflowEngine = require('../../services/AeWorkflowEngine');

/**
 * POST /api/v2/ae/jobs/:id/actions/:actionId/execute
 * Execute a specific activity and determine disposition if FAIL.
 */
router.post('/jobs/:id/actions/:actionId/execute', requireRole(['Supervisor', 'Manager', 'Staff Dept']), (req, res, next) => {
  try {
    const jobId = req.params.id;
    const actionId = req.params.actionId;
    const { result, evidence, remark, payload } = req.body;

    // 1. Verify action belongs to job and is pending
    const activity = db.prepare(`SELECT * FROM ae_job_document_activities WHERE id = ?`).get(actionId);
    if (!activity) return res.status(404).json({ success: false, message: 'Action not found' });
    
    const doc = db.prepare(`SELECT * FROM ae_job_documents WHERE id = ?`).get(activity.job_document_id);
    if (doc.job_id != jobId) return res.status(400).json({ success: false, message: 'Action does not belong to job' });

    let disposition = 'NONE';
    const action_result = result === 'FAIL' ? 'FAIL' : 'PASS'; // Sanitize input

    db.transaction(() => {
      // 2. Disposition Flow (If FAIL)
      if (action_result === 'FAIL') {
         // Simulated business rules for failure outcome
         if (activity.activity_name.includes('CHECK')) {
             disposition = 'REVISION_REQUIRED';
             // Generate REVISE activity logically (for simplicity, we update document state here, in reality we might insert a row)
             db.prepare(`UPDATE ae_job_documents SET doc_state = 'REVISION_REQUESTED' WHERE id = ?`).run(doc.id);
         } else {
             disposition = 'BLOCKED';
             db.prepare(`INSERT INTO ae_job_blockers (job_id, reason, reported_by_id, reported_by_name) VALUES (?, ?, ?, ?)`)
               .run(jobId, `Action Failed: ${activity.activity_name}. Reason: ${remark}`, req.user.id, req.user.nama || req.user.username);
         }
      }

      // 3. Save result - ALWAYS mark as COMPLETED even if FAIL (it was executed).
      // We may add action_result and disposition columns later, but for now we store in JSON if needed, or just rely on audit
      // For this implementation, we map COMPLETED if it's not waiting.
      db.prepare(`UPDATE ae_job_document_activities SET status = 'COMPLETED', remarks = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(remark || payload?.remark, actionId);

      // Log execution
      db.prepare(`INSERT INTO ae_audit_logs (job_id, action, description, user_id, user_name) VALUES (?, ?, ?, ?, ?)`)
        .run(jobId, 'ACTION_EXECUTED', `Executed ${activity.activity_name} with result ${action_result}. Disposition: ${disposition}`, req.user.id, req.user.nama || req.user.username);

      if (disposition === 'BLOCKED') {
         db.prepare(`INSERT INTO ae_audit_logs (job_id, action, description, user_id, user_name) VALUES (?, ?, ?, ?, ?)`)
           .run(jobId, 'JOB_BLOCKED', `Job automatically blocked due to action failure`, req.user.id, req.user.nama || req.user.username);
      }
    })();
    
    // Recalculate fully updated payload
    const jobContext = AeWorkflowEngine.getJobContext(jobId);

    res.json({ 
      success: true, 
      message: 'Action executed successfully',
      data: {
        activity: { id: activity.id, status: 'COMPLETED' },
        action_result,
        disposition,
        document_state: doc.doc_state,
        document_version: activity.version || 1,
        next_action: jobContext.pendingActionObj,
        blocker: jobContext.blocker,
        stage: jobContext.currentStage,
        handover_readiness: jobContext.nextAction
      }
    });
  } catch (error) {
    next(error);
  }
});"""

if old_execute in content:
    content = content.replace(old_execute, new_execute)
else:
    # Use regex to find it
    import re
    match = re.search(r"router\.post\('/jobs/:id/actions/:actionId/execute'.*?\}\);", content, re.DOTALL)
    if match:
        content = content[:match.start()] + new_execute + content[match.end():]
        print("Used regex to replace")

with open('src/routes/v2/aeRoutes.js', 'w') as f:
    f.write(content)

print("Updated aeRoutes.js")
