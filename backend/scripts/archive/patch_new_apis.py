import sys

with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()

new_apis = """
/**
 * GET /api/v2/ae/my-documents
 */
router.get('/my-documents', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const docs = db.prepare(`
      SELECT 
        d.*, 
        j.invoice_no, 
        j.buyer, 
        j.destination,
        a.status as activity_status,
        a.activity_name
      FROM ae_job_documents d
      JOIN export_jobs j ON d.job_id = j.id
      LEFT JOIN ae_job_document_activities a ON d.id = a.job_document_id AND a.status IN ('PENDING', 'IN PROGRESS', 'NOT STARTED')
      WHERE j.ae_assignee_id = ?
      ORDER BY d.id DESC
    `).all(req.user.id);
    ApiResponse.send(req, res, docs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/ae/my-handovers
 */
router.get('/my-handovers', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const handovers = db.prepare(`
      SELECT 
        h.*, 
        j.invoice_no, 
        j.buyer, 
        j.destination,
        u.nama as sender_name
      FROM ae_ao_handovers h
      JOIN export_jobs j ON h.job_id = j.id
      LEFT JOIN users u ON h.sender_id = u.id
      WHERE j.ae_assignee_id = ?
      ORDER BY h.created_at DESC
    `).all(req.user.id);
    ApiResponse.send(req, res, handovers);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/ae/my-history
 */
router.get('/my-history', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const logs = db.prepare(`
      SELECT 
        l.*, 
        u.nama as user_name
      FROM ae_audit_logs l
      JOIN users u ON l.user_id = u.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC LIMIT 100
    `).all(req.user.id);
    ApiResponse.send(req, res, logs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v2/ae/my-notifications
 */
router.get('/my-notifications', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    // Generate basic notification ledger from audit logs mapped to user's jobs
    const notifications = db.prepare(`
      SELECT 
        l.id as audit_id,
        l.action,
        l.description,
        l.created_at,
        j.invoice_no,
        IFNULL(n.is_read, 0) as is_read,
        n.id as notif_id
      FROM ae_audit_logs l
      JOIN export_jobs j ON (l.entity_type = 'EXPORT_JOB' AND l.entity_id = j.id) OR (l.entity_type = 'ACTIVITY' AND l.entity_id IN (SELECT id FROM ae_job_document_activities WHERE job_document_id IN (SELECT id FROM ae_job_documents WHERE job_id = j.id)))
      LEFT JOIN ae_notifications n ON l.id = n.audit_log_id AND n.user_id = ?
      WHERE j.ae_assignee_id = ? AND l.user_id != ?
      ORDER BY l.created_at DESC LIMIT 50
    `).all(req.user.id, req.user.id, req.user.id);
    ApiResponse.send(req, res, notifications);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v2/ae/my-notifications/:id/read
 */
router.post('/my-notifications/:id/read', requireRole(['Staff Dept']), (req, res, next) => {
  try {
    const auditId = req.params.id;
    db.prepare(`INSERT INTO ae_notifications (user_id, audit_log_id, is_read) VALUES (?, ?, 1) ON CONFLICT DO NOTHING`).run(req.user.id, auditId);
    ApiResponse.send(req, res, { success: true });
  } catch (error) {
    next(error);
  }
});
"""

# Insert right before GET /api/v2/ae/jobs/:id/history
marker = "router.get('/jobs/:id/history'"
if marker in content:
    idx = content.find(marker)
    # find previous JSDoc
    comment_idx = content.rfind("/**", 0, idx)
    
    content = content[:comment_idx] + new_apis + content[comment_idx:]
    with open('src/routes/v2/aeRoutes.js', 'w') as f:
        f.write(content)
    print("Patched new APIs")
else:
    print("Marker not found")
