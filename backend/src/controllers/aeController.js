const db = require('../database/db');

// --- Helper: Add Audit Log ---
function logAudit(userId, action, entityType, entityId, reference, oldValue, newValue, description) {
  try {
    db.prepare(`
      INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, reference, old_value, new_value, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, action, entityType, entityId, reference,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      description
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

// --- 1. Dashboard ---
exports.getDashboard = (req, res) => {
  try {
    const userId = req.user.id;

    // Active Tasks
    const activeTasks = db.prepare(`
      SELECT COUNT(*) as cnt FROM tasks 
      WHERE departemen = 'Administrasi Export' 
      AND status NOT IN ('Selesai', 'Cancelled')
    `).get().cnt;

    // Due Today Tasks (using simple string compare for date)
    const today = new Date().toISOString().split('T')[0];
    const dueToday = db.prepare(`
      SELECT COUNT(*) as cnt FROM tasks 
      WHERE departemen = 'Administrasi Export' 
      AND status NOT IN ('Selesai', 'Cancelled')
      AND date(tenggat) = ?
    `).get(today).cnt;

    // Overdue Tasks
    const overdue = db.prepare(`
      SELECT COUNT(*) as cnt FROM tasks 
      WHERE departemen = 'Administrasi Export' 
      AND status NOT IN ('Selesai', 'Cancelled')
      AND date(tenggat) < ?
    `).get(today).cnt;

    // Pending Documents
    const pendingDocs = db.prepare(`
      SELECT COUNT(*) as cnt FROM ae_document_checklists
      WHERE status IN ('Required', 'Received', 'Under Review')
    `).get().cnt;

    // Followups
    const openFollowUps = db.prepare(`
      SELECT COUNT(*) as cnt FROM ae_followup_records
      WHERE status NOT IN ('Resolved', 'Cancelled')
    `).get().cnt;

    // Issues
    const openIssues = db.prepare(`
      SELECT COUNT(*) as cnt FROM ae_discrepancies
      WHERE status NOT IN ('Resolved', 'Cancelled')
    `).get().cnt;

    // Shipment Summary
    const shipmentRows = db.prepare(`SELECT ae_status, COUNT(*) as cnt FROM export_jobs GROUP BY ae_status`).all();
    const shipments = { active: 0, attention: 0, blocked: 0 };
    shipmentRows.forEach(r => {
      if (r.ae_status === 'Pending') shipments.active += r.cnt;
      if (r.ae_status === 'In Progress') shipments.active += r.cnt;
      if (r.ae_status === 'Review') shipments.attention += r.cnt;
      if (r.ae_status === 'On Hold') shipments.blocked += r.cnt;
    });

    res.json({
      success: true,
      data: {
        summary: { active_tasks: activeTasks, due_today: dueToday, overdue, pending_documents: pendingDocs, followups: openFollowUps, open_issues: openIssues },
        shipments,
        today_actions: [] // We can expand this if needed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 2. Shipments ---
exports.getShipments = (req, res) => {
  try {
    const shipments = db.prepare(`
      SELECT s.*, u.nama as assignee_name 
      FROM export_jobs s
      LEFT JOIN users u ON s.ae_assignee_id = u.id
      ORDER BY s.created_at DESC
    `).all();
    res.json({ success: true, data: shipments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createShipment = (req, res) => {
  try {
    const { job_code, customer, destination, etd, eta, closing_docs, closing_docs_time, product_type, buyer, invoice_no } = req.body;
    const stmt = db.prepare(`
      INSERT INTO export_jobs (job_code, business_key, customer_code, destination, etd, eta, closing_docs, closing_docs_time, product_type, buyer, invoice_no, created_by_id, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
    `);
    const businessKey = `MANUAL-${job_code}`;
    const result = stmt.run(
      job_code,
      businessKey,
      customer || null,
      destination || null,
      etd || null,
      eta || null,
      closing_docs || null,
      closing_docs_time || null,
      product_type || 'LOIN',
      buyer || customer || null,
      invoice_no || null,
      req.user.id
    );
    
    logAudit(req.user.id, 'CREATED', 'SHIPMENT', result.lastInsertRowid, job_code, null, req.body, 'Shipment created');
    res.json({ success: true, message: 'Shipment created', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateShipment = (req, res) => {
  try {
    const { id } = req.params;
    const { ae_status, ae_remarks, version } = req.body;
    
    const existing = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
    if (existing.version !== version) return res.status(409).json({ success: false, error: 'Stale version. Please refresh.' });

    const result = db.prepare(`
      UPDATE export_jobs 
      SET ae_status = ?, ae_remarks = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND version = ?
    `).run(ae_status, ae_remarks, id, version);

    if (result.changes === 0) return res.status(409).json({ success: false, error: 'Conflict detected' });

    logAudit(req.user.id, 'UPDATED', 'SHIPMENT', id, existing.job_code, existing, { ae_status, ae_remarks }, 'Shipment updated');
    res.json({ success: true, message: 'Shipment updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 3. Documents ---
exports.getDocuments = (req, res) => {
  try {
    const documents = db.prepare(`
      SELECT d.*, s.job_code as shipment_code, u.nama as verified_by_name
      FROM ae_document_checklists d
      LEFT JOIN export_jobs s ON d.shipment_id = s.id
      LEFT JOIN users u ON d.verified_by_id = u.id
      ORDER BY d.created_at DESC
    `).all();
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateDocument = (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, version } = req.body;
    
    const existing = db.prepare('SELECT * FROM ae_document_checklists WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
    if (existing.version !== version) return res.status(409).json({ success: false, error: 'Stale version' });

    const result = db.prepare(`
      UPDATE ae_document_checklists 
      SET status = ?, notes = ?, verified_by_id = ?, verified_at = CURRENT_TIMESTAMP, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND version = ?
    `).run(status, notes, req.user.id, id, version);

    if (result.changes === 0) return res.status(409).json({ success: false, error: 'Conflict' });

    logAudit(req.user.id, 'VERIFIED', 'DOCUMENT', id, existing.document_type, {status: existing.status}, {status}, 'Document verified');
    res.json({ success: true, message: 'Document updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 4. Follow-Ups ---
exports.getFollowUps = (req, res) => {
  try {
    const followups = db.prepare(`
      SELECT f.*, s.job_code as shipment_code, u.nama as assigned_name
      FROM ae_followup_records f
      LEFT JOIN export_jobs s ON f.shipment_id = s.id
      LEFT JOIN users u ON f.assigned_to_id = u.id
      ORDER BY f.due_date ASC
    `).all();
    res.json({ success: true, data: followups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createFollowUp = (req, res) => {
  try {
    const { shipment_id, subject, followup_type, external_party, due_date } = req.body;
    const stmt = db.prepare(`
      INSERT INTO ae_followup_records (shipment_id, subject, followup_type, external_party, due_date, created_by_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(shipment_id || null, subject, followup_type, external_party, due_date, req.user.id);
    logAudit(req.user.id, 'CREATED', 'FOLLOWUP', result.lastInsertRowid, subject, null, req.body, 'FollowUp created');
    res.json({ success: true, message: 'FollowUp created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateFollowUp = (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, version } = req.body;
    
    const existing = db.prepare('SELECT * FROM ae_followup_records WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
    if (existing.version !== version) return res.status(409).json({ success: false, error: 'Stale version' });

    const result = db.prepare(`
      UPDATE ae_followup_records 
      SET status = ?, resolution = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND version = ?
    `).run(status, notes, id, version);

    if (result.changes === 0) return res.status(409).json({ success: false, error: 'Conflict' });
    logAudit(req.user.id, 'UPDATED', 'FOLLOWUP', id, existing.subject, {status: existing.status}, {status}, 'FollowUp updated');
    res.json({ success: true, message: 'FollowUp updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 5. Issues ---
exports.getIssues = (req, res) => {
  try {
    const issues = db.prepare(`
      SELECT i.*, s.job_code as shipment_code, u.nama as reported_name
      FROM ae_discrepancies i
      LEFT JOIN export_jobs s ON i.shipment_id = s.id
      LEFT JOIN users u ON i.reported_by_id = u.id
      ORDER BY i.created_at DESC
    `).all();
    res.json({ success: true, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createIssue = (req, res) => {
  try {
    const { shipment_id, title, category, priority, description } = req.body;
    const stmt = db.prepare(`
      INSERT INTO ae_discrepancies (shipment_id, title, category, priority, description, reported_by_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(shipment_id || null, title, category, priority, description, req.user.id);
    logAudit(req.user.id, 'CREATED', 'ISSUE', result.lastInsertRowid, title, null, req.body, 'Issue logged');
    res.json({ success: true, message: 'Issue created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateIssue = (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, version } = req.body;
    
    const existing = db.prepare('SELECT * FROM ae_discrepancies WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
    if (existing.version !== version) return res.status(409).json({ success: false, error: 'Stale version' });

    const result = db.prepare(`
      UPDATE ae_discrepancies 
      SET status = ?, resolution = ?, resolved_at = CURRENT_TIMESTAMP, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND version = ?
    `).run(status, resolution, id, version);

    if (result.changes === 0) return res.status(409).json({ success: false, error: 'Conflict' });
    logAudit(req.user.id, 'RESOLVED', 'ISSUE', id, existing.title, {status: existing.status}, {status}, 'Issue updated');
    res.json({ success: true, message: 'Issue updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 6. Activities ---
exports.getActivities = (req, res) => {
  try {
    const activities = db.prepare(`
      SELECT a.*, u.nama as user_name 
      FROM ae_audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC LIMIT 100
    `).all();
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
