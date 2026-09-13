import sys

with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

new_endpoint = """
/**
 * POST /api/v2/ae/jobs/:id/actions/:actionId/execute
 * Execute a specific activity and determine disposition if FAIL.
 */
router.post('/jobs/:id/actions/:actionId/execute', requireRole(['Supervisor', 'Manager', 'Staff Dept']), (req, res, next) => {
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
});
"""

# Insert near the end of routes
idx = content.find("module.exports = router;")
if idx != -1:
    content = content[:idx] + new_endpoint + content[idx:]
    with open('src/routes/v2/aeRoutes.js', 'w') as f:
        f.write(content)
    print("Patched POST execute endpoint")
else:
    print("Could not find module.exports")
