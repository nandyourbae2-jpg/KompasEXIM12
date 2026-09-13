class AeAdministrationService {
  constructor(db) {
    this.db = db;
  }

  getMyTasks(userId) {
    return this.db.prepare(`
      SELECT t.*, u.nama as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.departemen = 'Administrasi Export' AND t.assignee_id = ?
      ORDER BY t.tenggat ASC
    `).all(userId);
  }

  getQueuePool() {
    return this.db.prepare(`
      SELECT t.*
      FROM tasks t
      WHERE t.departemen = 'Administrasi Export' AND (t.assignee_id IS NULL OR t.assignee_id = '')
      ORDER BY t.tenggat ASC
    `).all();
  }

  claimTask(taskId, userId) {
    const result = this.db.prepare(`
      UPDATE tasks
      SET assignee_id = ?, status = 'In Progress'
      WHERE id = ? AND departemen = 'Administrasi Export'
    `).run(userId, taskId);
    return result.changes > 0;
  }
}

module.exports = AeAdministrationService;
