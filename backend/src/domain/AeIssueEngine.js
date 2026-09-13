class AeIssueEngine {
  constructor(db) {
    this.db = db;
  }

  getDiscrepancies() {
    return this.db.prepare(`
      SELECT d.*, t.judul, t.reference_id, u.nama as detected_by_name
      FROM ae_discrepancies d
      JOIN tasks t ON d.task_id = t.id
      LEFT JOIN users u ON d.detected_by_id = u.id
      ORDER BY d.created_at DESC
    `).all();
  }

  resolveDiscrepancy(discrepancyId, userId) {
    return this.db.prepare(`
      UPDATE ae_discrepancies
      SET status = 'Resolved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(discrepancyId);
  }
}
module.exports = AeIssueEngine;
