const db = require('../database/db');

exports.getDashboard = (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get total assigned customers
    const customersCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ao_customer_assignments 
      WHERE user_id = ? AND status = 'Active'
    `).get(userId).count;

    // 2. Get active Piutang (UNPAID + PARTIALLY_PAID) for assigned customers
    const activePiutangRow = db.prepare(`
      SELECT COALESCE(SUM(i.amount), 0) as totalAmount, COUNT(i.id) as count
      FROM invoices i
      JOIN ao_customer_assignments aca ON i.customer_id = aca.customer_id
      WHERE aca.user_id = ? AND aca.status = 'Active'
      AND i.status IN ('UNPAID', 'PARTIALLY_PAID')
    `).get(userId);

    // 3. Get Overdue Piutang
    const overdueRow = db.prepare(`
      SELECT COALESCE(SUM(i.amount), 0) as totalAmount, COUNT(i.id) as count
      FROM invoices i
      JOIN ao_customer_assignments aca ON i.customer_id = aca.customer_id
      WHERE aca.user_id = ? AND aca.status = 'Active'
      AND i.status = 'OVERDUE'
    `).get(userId);

    // 4. Get Open Follow-Ups (Collections) waiting for response
    const openFollowUpsCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM ae_followup_records f
      WHERE f.assigned_to_id = ? AND f.status IN ('Open', 'Waiting Response')
      AND f.followup_type = 'COLLECTION'
    `).get(userId).count;

    // 5. Get Open Issues
    const openIssuesCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM ae_discrepancies d
      WHERE d.assigned_to_id = ? AND d.status IN ('Open', 'In Progress')
    `).get(userId).count;

    res.json({
      success: true,
      data: {
        total_customers: customersCount,
        active_piutang_amount: activePiutangRow.totalAmount,
        active_piutang_count: activePiutangRow.count,
        overdue_amount: overdueRow.totalAmount,
        overdue_count: overdueRow.count,
        open_followups: openFollowUpsCount,
        open_issues: openIssuesCount
      }
    });
  } catch (error) {
    console.error('AO Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getCustomers = (req, res) => {
  try {
    const userId = req.user.id;
    const customers = db.prepare(`
      SELECT c.*, aca.assigned_at
      FROM customers c
      JOIN ao_customer_assignments aca ON c.id = aca.customer_id
      WHERE aca.user_id = ? AND aca.status = 'Active'
    `).all(userId);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getInvoices = (req, res) => {
  try {
    const userId = req.user.id;
    const invoices = db.prepare(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      JOIN ao_customer_assignments aca ON i.customer_id = aca.customer_id
      WHERE aca.user_id = ? AND aca.status = 'Active'
      ORDER BY i.due_date ASC
    `).all(userId);
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getCollections = (req, res) => {
  try {
    const userId = req.user.id;
    // Follow-ups specifically for AO
    const collections = db.prepare(`
      SELECT f.*, u.nama as assigned_name, c.name as customer_name
      FROM ae_followup_records f
      LEFT JOIN users u ON f.assigned_to_id = u.id
      LEFT JOIN customers c ON f.related_entity_id = c.id AND f.related_entity_type = 'CUSTOMER'
      WHERE f.assigned_to_id = ? AND f.followup_type = 'COLLECTION'
    `).all(userId);
    res.json({ success: true, data: collections });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.createCollection = (req, res) => {
  try {
    const { subject, description, external_party, contact_person, contact_channel, priority, due_date, related_entity_type, related_entity_id } = req.body;
    
    const info = db.prepare(`
      INSERT INTO ae_followup_records 
      (subject, description, followup_type, external_party, contact_person, contact_channel, priority, due_date, created_by_id, assigned_to_id, related_entity_type, related_entity_id)
      VALUES (?, ?, 'COLLECTION', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(subject, description, external_party, contact_person, contact_channel, priority, due_date, req.user.id, req.user.id, related_entity_type, related_entity_id);
    
    // Audit Log
    db.prepare(`
      INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description)
      VALUES (?, 'CREATE', 'FOLLOW_UP', ?, 'Created AO collection follow-up')
    `).run(req.user.id, info.lastInsertRowid);

    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.updateCollection = (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, version } = req.body;

    const current = db.prepare('SELECT version FROM ae_followup_records WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ success: false, error: 'Record not found' });
    if (current.version !== version) return res.status(409).json({ success: false, error: 'Data has been modified by another user' });

    db.prepare(`
      UPDATE ae_followup_records
      SET status = ?, resolution = COALESCE(?, resolution), version = version + 1, updated_at = datetime('now')
      WHERE id = ? AND version = ?
    `).run(status, resolution, id, version);

    // Audit Log
    db.prepare(`
      INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description)
      VALUES (?, 'UPDATE', 'FOLLOW_UP', ?, ?)
    `).run(req.user.id, id, `Status changed to ${status}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getIssues = (req, res) => {
  try {
    const userId = req.user.id;
    const issues = db.prepare(`
      SELECT d.*, u.nama as reported_name
      FROM ae_discrepancies d
      LEFT JOIN users u ON d.reported_by_id = u.id
      WHERE d.assigned_to_id = ?
    `).all(userId);
    res.json({ success: true, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.createIssue = (req, res) => {
  try {
    const { title, category, priority, description, due_date, related_entity_type, related_entity_id } = req.body;
    
    const info = db.prepare(`
      INSERT INTO ae_discrepancies 
      (title, category, priority, description, due_date, reported_by_id, assigned_to_id, related_entity_type, related_entity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, category, priority, description, due_date, req.user.id, req.user.id, related_entity_type, related_entity_id);
    
    db.prepare(`
      INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description)
      VALUES (?, 'CREATE', 'ISSUE', ?, 'Created AO issue')
    `).run(req.user.id, info.lastInsertRowid);

    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.updateIssue = (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, version } = req.body;

    const current = db.prepare('SELECT version FROM ae_discrepancies WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ success: false, error: 'Record not found' });
    if (current.version !== version) return res.status(409).json({ success: false, error: 'Data has been modified by another user' });

    db.prepare(`
      UPDATE ae_discrepancies
      SET status = ?, resolution = COALESCE(?, resolution), version = version + 1, updated_at = datetime('now')
      WHERE id = ? AND version = ?
    `).run(status, resolution, id, version);

    db.prepare(`
      INSERT INTO ae_audit_logs (user_id, action, entity_type, entity_id, description)
      VALUES (?, 'UPDATE', 'ISSUE', ?, ?)
    `).run(req.user.id, id, `Status changed to ${status}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getActivities = (req, res) => {
  try {
    const userId = req.user.id;
    const logs = db.prepare(`
      SELECT l.*, u.nama as user_name
      FROM ae_audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all(userId);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
