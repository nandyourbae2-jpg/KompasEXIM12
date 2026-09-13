class AeFollowUpEngine {
  constructor(db) {
    this.db = db;
  }
  
  getFollowUps() {
    return this.db.prepare(`
      SELECT f.*, t.judul, t.reference_id, u.nama as created_by_name
      FROM ae_followup_records f
      JOIN tasks t ON f.task_id = t.id
      LEFT JOIN users u ON f.created_by_id = u.id
      ORDER BY f.created_at DESC
    `).all();
  }

  updateFollowUpStatus(followUpId, status, notes, userId) {
    return this.db.prepare(`
      UPDATE ae_followup_records
      SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, notes, followUpId);
  }
}
module.exports = AeFollowUpEngine;
