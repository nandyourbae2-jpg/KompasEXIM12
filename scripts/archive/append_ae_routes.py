import re

file_path = "backend/src/routes/v2/aeRoutes.js"
with open(file_path, "r") as f:
    content = f.read()

new_routes = """
const AeChecklistRuleEngine = require('../../services/AeChecklistRuleEngine');

/**
 * GET /api/v2/ae/jobs/:id/checklist
 * Fetch the checklist for a job
 */
router.get('/jobs/:id/checklist', (req, res, next) => {
  try {
    const { id } = req.params;
    
    // RBAC Check for Staff
    if (req.user.level_otoritas === 'Staff Dept') {
      const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
      if (!job || job.ae_assignee_id !== req.user.id) {
        return res.status(403).json({ success: false, code: 403, errorCode: 'FORBIDDEN', message: 'You are not assigned to this job' });
      }
    }

    const jobChecklist = db.prepare(`
      SELECT * FROM ae_job_checklists WHERE job_id = ?
    `).get(id);

    if (!jobChecklist) {
      return res.status(404).json({ success: false, code: 404, errorCode: 'NOT_FOUND', message: 'Checklist not generated yet' });
    }

    const items = db.prepare(`
      SELECT 
        i.*,
        u.nama as completed_by_name
      FROM ae_job_checklist_items i
      LEFT JOIN users u ON i.completed_by_id = u.id
      WHERE i.job_checklist_id = ?
      ORDER BY i.id ASC
    `).all(jobChecklist.id);

    // Group items by group_name
    const groups = {};
    items.forEach(item => {
      if (!groups[item.snap_group_name]) {
        groups[item.snap_group_name] = [];
      }
      groups[item.snap_group_name].push(item);
    });

    ApiResponse.send(req, res, {
      ...jobChecklist,
      groups
    });
  } catch (error) {
    logger.error('Failed to fetch job checklist', { error: error.message, jobId: req.params.id });
    next(error);
  }
});

/**
 * POST /api/v2/ae/jobs/:id/checklist/generate
 * Generates the checklist if source data is complete
 */
router.post('/jobs/:id/checklist/generate', requireRole(['Supervisor', 'Manager', 'Staff Dept']), (req, res, next) => {
  try {
    const { id } = req.params;
    
    // RBAC Check for Staff
    const job = db.prepare(`SELECT * FROM export_jobs WHERE id = ?`).get(id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    
    if (req.user.level_otoritas === 'Staff Dept' && job.ae_assignee_id !== req.user.id) {
      return res.status(403).json({ success: false, code: 403, message: 'You are not assigned to this job' });
    }

    // Check if source conditions are sufficient for generation
    if (!job.product_type || !job.fasilitas_kite || !job.destination) {
       // Just basic check for now
       // Insert pending configuration status
       const existing = db.prepare(`SELECT id FROM ae_job_checklists WHERE job_id = ?`).get(id);
       if (!existing) {
         db.prepare(`INSERT INTO ae_job_checklists (job_id, status) VALUES (?, 'PENDING CONFIGURATION')`).run(id);
       } else {
         db.prepare(`UPDATE ae_job_checklists SET status = 'PENDING CONFIGURATION' WHERE id = ?`).run(existing.id);
       }
       return res.status(400).json({ success: false, code: 400, message: 'Source data incomplete. Checklist is PENDING CONFIGURATION.' });
    }

    // Find active template version
    const version = db.prepare(`
      SELECT v.* FROM ae_checklist_template_versions v
      JOIN ae_checklist_templates t ON v.template_id = t.id
      WHERE t.is_active = 1 AND v.is_published = 1
      ORDER BY v.created_at DESC LIMIT 1
    `).get();

    if (!version) return res.status(500).json({ success: false, message: 'No active template version found' });

    // Begin Generation Transaction
    const transaction = db.transaction(() => {
      let jobChecklistId;
      const existing = db.prepare(`SELECT id, status FROM ae_job_checklists WHERE job_id = ?`).get(id);
      
      if (existing) {
        if (existing.status === 'GENERATED') return existing.id; // Idempotent
        db.prepare(`UPDATE ae_job_checklists SET status = 'GENERATED', template_version_id = ? WHERE id = ?`).run(version.id, existing.id);
        jobChecklistId = existing.id;
      } else {
        const result = db.prepare(`
          INSERT INTO ae_job_checklists (job_id, template_version_id, status)
          VALUES (?, ?, 'GENERATED')
        `).run(id, version.id);
        jobChecklistId = result.lastInsertRowid;
      }

      // Fetch groups and items for this version
      const groups = db.prepare(`SELECT * FROM ae_checklist_groups WHERE version_id = ?`).all(version.id);
      const itemsQuery = db.prepare(`SELECT * FROM ae_checklist_items WHERE group_id = ?`);
      const insertItem = db.prepare(`
        INSERT OR IGNORE INTO ae_job_checklist_items 
        (job_checklist_id, checklist_item_id, snap_group_name, snap_item_label, snap_is_required, snap_applicability_rules, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const grp of groups) {
        const items = itemsQuery.all(grp.id);
        for (const item of items) {
          const isApplicable = AeChecklistRuleEngine.evaluate(item.applicability_rules, job);
          const status = isApplicable ? 'NOT STARTED' : 'NOT APPLICABLE';
          
          insertItem.run(
            jobChecklistId, 
            item.id, 
            grp.name, 
            item.label, 
            item.is_required, 
            item.applicability_rules ? JSON.stringify(item.applicability_rules) : null,
            status
          );
        }
      }
      return jobChecklistId;
    });

    const finalId = transaction();
    
    // Audit
    db.prepare(`INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description) VALUES (?, 'GENERATE_CHECKLIST', 'EXPORT_JOB', ?, 'Checklist generated successfully')`).run(req.user.id, id);

    ApiResponse.send(req, res, { message: 'Checklist generated', jobChecklistId: finalId });
  } catch (error) {
    logger.error('Failed to generate checklist', { error: error.message, jobId: req.params.id });
    next(error);
  }
});

/**
 * PATCH /api/v2/ae/jobs/:id/checklist/items/:itemId
 * Update status of a checklist item
 */
router.patch('/jobs/:id/checklist/items/:itemId', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { status, remarks, blocked_reason } = req.body;

    // RBAC Check for Staff
    const job = db.prepare(`SELECT ae_assignee_id FROM export_jobs WHERE id = ?`).get(id);
    if (!job || job.ae_assignee_id !== req.user.id) {
      return res.status(403).json({ success: false, code: 403, errorCode: 'FORBIDDEN', message: 'You are not assigned to this job' });
    }

    const item = db.prepare(`SELECT * FROM ae_job_checklist_items WHERE id = ?`).get(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });

    // Status Validation
    const validStatuses = ['NOT STARTED', 'IN PROGRESS', 'WAITING', 'COMPLETED', 'NOT APPLICABLE', 'BLOCKED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE ae_job_checklist_items 
        SET status = coalesce(?, status),
            remarks = coalesce(?, remarks),
            blocked_reason = coalesce(?, blocked_reason),
            completed_by_id = CASE WHEN ? = 'COMPLETED' AND status != 'COMPLETED' THEN ? ELSE completed_by_id END,
            completed_at = CASE WHEN ? = 'COMPLETED' AND status != 'COMPLETED' THEN datetime('now') ELSE completed_at END,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(status, remarks, blocked_reason, status, req.user.id, status, itemId);

      // Recalculate progress cache
      const stats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN status != 'NOT APPLICABLE' THEN 1 END) as applicable_count,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count
        FROM ae_job_checklist_items 
        WHERE job_checklist_id = ?
      `).get(item.job_checklist_id);

      const progress = stats.applicable_count > 0 ? Math.round((stats.completed_count / stats.applicable_count) * 100) : 0;
      db.prepare(`UPDATE export_jobs SET ae_progress = ?, updated_at = datetime('now') WHERE id = ?`).run(progress, id);
      
      return progress;
    });

    const newProgress = updateTx();

    db.prepare(`
      INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description, old_value, new_value)
      VALUES (?, 'CHECKLIST_UPDATE', 'CHECKLIST_ITEM', ?, ?, json_object('status', ?), json_object('status', ?))
    `).run(req.user.id, itemId, `Updated checklist item ${item.snap_item_label}`, item.status, status || item.status);

    const updatedItem = db.prepare(`SELECT i.*, u.nama as completed_by_name FROM ae_job_checklist_items i LEFT JOIN users u ON i.completed_by_id = u.id WHERE i.id = ?`).get(itemId);

    ApiResponse.send(req, res, { item: updatedItem, progress: newProgress });
  } catch (error) {
    logger.error('Failed to update checklist item', { error: error.message, itemId: req.params.itemId });
    next(error);
  }
});
"""

if "router.post('/jobs/:id/checklist/generate'" not in content:
    content = content.replace("module.exports = router;", new_routes + "\nmodule.exports = router;")
    with open(file_path, "w") as f:
        f.write(content)
    print("Routes appended successfully.")
else:
    print("Routes already exist.")
