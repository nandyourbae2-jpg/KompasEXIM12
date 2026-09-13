// --- 2. TASKS ---
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { level_otoritas, departemen, id: userId } = req.user;
    let tasks;
    
    if (level_otoritas === 'Manager') {
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    } else if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      tasks = db.prepare('SELECT * FROM tasks WHERE departemen = ? ORDER BY updated_at DESC').all(departemen);
    } else if (level_otoritas === 'Staff Dept') {
      tasks = db.prepare('SELECT * FROM tasks WHERE assignee_id = ? ORDER BY updated_at DESC').all(userId);
    } else {
      // Fallback
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    }

app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, import_project_id, tenggat } = req.body;
    
    const assigned_by_id = req.user.id;
    const creatorLevel = req.user.level_otoritas;

    if (!judul || !prioritas || !tenggat) {
      return res.status(400).json({ error: 'Judul, prioritas, dan tenggat wajib diisi' });
    }

    let finalAssigneeId;
    if (creatorLevel === 'Staff Dept') {
      finalAssigneeId = assigned_by_id; // WAJIB diri sendiri
    } else {
      finalAssigneeId = assignee_id || req.body.assigneeId; // Handle both camelCase and snake_case from body
      if (!finalAssigneeId) {
        return res.status(400).json({ error: 'assigneeId wajib diisi untuk Supervisor/Manager' });
      }
    }

    const finalAssignedById = assigned_by_id;
    const finalSumberTugas = (creatorLevel === 'Supervisor' || creatorLevel === 'Manager') && finalAssigneeId !== finalAssignedById ? 'Escalation' : (sumber_tugas || 'Manual');

app.patch('/api/tasks/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, status_dari } = req.body;
    const validStatuses = ['Backlog', 'Akan Dikerjakan', 'Sedang Dikerjakan', 'Selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }
    const diubah_oleh_id = req.user.id;
    db.transaction(() => {
      db.prepare(`UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
      db.prepare('INSERT INTO task_status_history (task_id, status_dari, status_ke, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(req.params.id, status_dari, status, diubah_oleh_id);
    })();
    res.json({ status });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const task = db.prepare('SELECT sumber_tugas, assigned_by_id FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    
    // Only the creator (assigned_by_id) can delete it if it's escalation
    if (task.sumber_tugas === 'Escalation' && task.assigned_by_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda tidak dapat menghapus Tugas Escalation yang bukan buatan Anda.' });
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

