class AeDocumentEngine {
  constructor(db) {
    this.db = db;
  }

  getDocumentsByTask(taskId) {
    return this.db.prepare(`
      SELECT c.*, u.nama as verified_by_name
      FROM ae_document_checklists c
      LEFT JOIN users u ON c.verified_by_id = u.id
      WHERE c.task_id = ?
    `).all(taskId);
  }

  verifyDocument(docId, status, notes, userId) {
    const result = this.db.prepare(`
      UPDATE ae_document_checklists
      SET verification_status = ?, notes = ?, verified_by_id = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, notes, userId, docId);
    
    if (result.changes > 0) {
      this.updateTaskProgress(docId);
    }
    return result.changes > 0;
  }

  updateTaskProgress(docId) {
    const doc = this.db.prepare(`SELECT task_id FROM ae_document_checklists WHERE id = ?`).get(docId);
    if (!doc) return;
    
    const allDocs = this.db.prepare(`SELECT verification_status FROM ae_document_checklists WHERE task_id = ?`).all(doc.task_id);
    if (allDocs.length === 0) return;
    
    const verified = allDocs.filter(d => d.verification_status === 'Verified').length;
    const progress = Math.round((verified / allDocs.length) * 100);
    
    this.db.prepare(`UPDATE tasks SET progress = ? WHERE id = ?`).run(progress, doc.task_id);
  }
}
module.exports = AeDocumentEngine;
