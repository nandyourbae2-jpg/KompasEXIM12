const db = require('../database/db');

class TaskRepository {
  async findAll(whereCondition = {}, orderByCondition = {}) {
    let conditions = [];
    let params = [];
    
    if (whereCondition.department) {
      conditions.push('t.departemen = ?');
      params.push(whereCondition.department);
    }
    if (whereCondition.assigneeId) {
      conditions.push('t.assignee_id = ?');
      params.push(whereCondition.assigneeId);
    }
    if (whereCondition.sumber_tugas) {
      conditions.push('t.sumber_tugas = ?');
      params.push(whereCondition.sumber_tugas);
    }
    if (whereCondition.assigned_by_id) {
      conditions.push('t.assigned_by_id = ?');
      params.push(whereCondition.assigned_by_id);
    }

    let whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    const query = `
      SELECT t.*, 
             u.nama as assignee,
             u2.nama as assigned_by
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users u2 ON t.assigned_by_id = u2.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `;
    const rows = db.prepare(query).all(...params);

    if (rows.length === 0) return [];

    const taskIds = rows.map(r => r.id);
    const placeholders = taskIds.map(() => '?').join(',');
    const historyRows = db.prepare(`SELECT * FROM task_status_history WHERE task_id IN (${placeholders})`).all(...taskIds);
    
    // Group history rows by task_id to avoid O(N*M) loop
    const historyMap = {};
    for (const h of historyRows) {
      if (!historyMap[h.task_id]) historyMap[h.task_id] = [];
      historyMap[h.task_id].push({
         status_ke: h.status_ke,
         status_dari: h.status_dari,
         diubah_oleh_id: h.diubah_oleh_id,
         diubah_pada: h.diubah_pada
      });
    }
    
    return rows.map(r => ({
      id: r.id,
      task_code: r.task_code,
      judul: r.judul,
      deskripsi: r.deskripsi || r.catatan_progress || '',
      departemen: r.departemen,
      prioritas: r.prioritas,
      status: r.status,
      assignee_id: r.assignee_id,
      assignee: r.assignee ? { nama: r.assignee } : null,
      assigned_by_id: r.assigned_by_id,
      assigned_by: r.assigned_by ? { nama: r.assigned_by } : null,
      import_project_id: r.import_project_id,
      tenggat: r.tenggat,
      progress: r.progress,
      catatan_progress: r.catatan_progress || r.deskripsi || '',
      sumber_tugas: r.sumber_tugas,
      created_at: r.created_at,
      statusHistory: historyMap[r.id] || []
    }));
  }

  async findById(id) {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  }

  async create(data, statusHistoryData = []) {
    const notesContent = data.notes || data.deskripsi || data.catatan_progress || '';
    const query = `
      INSERT INTO tasks (
        task_code, judul, departemen, prioritas, status, assignee_id, tenggat, 
        import_project_id, sumber_tugas, assigned_by_id, deskripsi, catatan_progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const info = db.prepare(query).run(
      data.task_code, 
      data.title, 
      data.department, 
      data.priority, 
      data.status || 'Backlog', 
      data.assigneeId || null, 
      data.dueDate || null, 
      data.importProjectId || null, 
      data.sumber_tugas || 'Manual', 
      data.assigned_by_id || null, 
      notesContent,
      notesContent
    );
    
    const newId = info.lastInsertRowid;
    
    if (statusHistoryData && statusHistoryData.length > 0) {
       const h = statusHistoryData[0];
       db.prepare(`
         INSERT INTO task_status_history (task_id, status_ke, status_dari, diubah_oleh_id, diubah_pada)
         VALUES (?, ?, ?, ?, ?)
       `).run(newId, h.status, h.fromStatus || null, data.assigneeId || null, new Date().toISOString());
    }

    return { ...data, id: newId, deskripsi: notesContent, catatan_progress: notesContent, notes: notesContent };
  }

  async update(id, data) {
    if (data.notes !== undefined) {
      db.prepare(`UPDATE tasks SET catatan_progress = ?, deskripsi = ? WHERE id = ?`).run(data.notes, data.notes, id);
    }
    return { id };
  }

  async updateWithHistory(id, data, historyEntry) {
    if (data.status) {
      db.prepare(`UPDATE tasks SET status = ? WHERE id = ?`).run(data.status, id);
    }
    if (historyEntry) {
      db.prepare(`
        INSERT INTO task_status_history (task_id, status_ke, status_dari, diubah_oleh_id, diubah_pada)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, historyEntry.status, historyEntry.fromStatus || null, historyEntry.diubah_oleh_id || null, new Date(historyEntry.timestamp).toISOString());
    }
    return { id };
  }

  async delete(id) {
    db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
    return { id };
  }
}

module.exports = new TaskRepository();
