import re

file_path = "backend/src/routes/v2/aeRoutes.js"
with open(file_path, "r") as f:
    content = f.read()

new_routes = """
/**
 * GET /api/v2/ae/jobs/:id/next-action
 * Fetch the derived next action for the job's checklist
 */
router.get('/jobs/:id/next-action', (req, res, next) => {
  try {
    const { id } = req.params;
    
    // RBAC Check for Staff
    if (req.user.level_otoritas === 'Staff Dept') {
      const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
      if (!job || job.ae_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, code: 403, errorCode: 'FORBIDDEN', message: 'You are not assigned to this job' });
      }
    }

    const jobChecklist = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(id);
    if (!jobChecklist) {
      return ApiResponse.send(req, res, { action: 'Awaiting Source Update / Pending Configuration' });
    }
    
    if (jobChecklist.status === 'PENDING CONFIGURATION') {
      return ApiResponse.send(req, res, { action: 'Awaiting Source Update' });
    }

    // Find the first applicable incomplete task
    const nextItem = db.prepare(`
      SELECT 
        i.snap_item_label, i.status
      FROM ae_job_checklist_items i
      JOIN ae_checklist_items m ON i.checklist_item_id = m.id
      JOIN ae_checklist_groups g ON m.group_id = g.id
      WHERE i.job_checklist_id = ? AND i.status IN ('NOT STARTED', 'IN PROGRESS', 'WAITING')
      ORDER BY g.sort_order ASC, m.sort_order ASC
      LIMIT 1
    `).get(jobChecklist.id);

    if (nextItem) {
      return ApiResponse.send(req, res, { action: nextItem.snap_item_label });
    } else {
      return ApiResponse.send(req, res, { action: 'All Checklist Items Completed' });
    }
  } catch (error) {
    logger.error('Failed to fetch next action', { error: error.message, jobId: req.params.id });
    next(error);
  }
});
"""

if "router.get('/jobs/:id/next-action'" not in content:
    content = content.replace("module.exports = router;", new_routes + "\nmodule.exports = router;")
    with open(file_path, "w") as f:
        f.write(content)
    print("Next action route appended successfully.")
else:
    print("Next action route already exists.")
