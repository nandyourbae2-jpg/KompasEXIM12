// --- 1.5 USERS ---
app.get('/api/users/assignable', (req, res) => {
  try {
    const { level_otoritas, departemen } = req.query;
    let rows;
    if (level_otoritas === 'Supervisor') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, tipe_karyawan, departemen
        FROM users
        WHERE level_otoritas = 'Staff Dept'
          AND departemen = ?
          AND status_aktif = 1
        ORDER BY nama ASC
      `).all(departemen);
    } else if (level_otoritas === 'Manager') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, departemen, tipe_karyawan
        FROM users
        WHERE level_otoritas = 'Supervisor'
          AND status_aktif = 1
        ORDER BY departemen ASC, nama ASC
      `).all();
    } else {
      rows = [];
    }
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 2. TASKS ---
app.get('/api/tasks', (req, res) => {
  try {
    const { level_otoritas, departemen, userId } = req.query;
    let tasks;
    
    if (level_otoritas === 'Manager') {
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    } else if (level_otoritas === 'Supervisor') {
      tasks = db.prepare('SELECT * FROM tasks WHERE departemen = ? ORDER BY updated_at DESC').all(departemen);
    } else if (level_otoritas === 'Staff Dept' && userId) {
      tasks = db.prepare('SELECT * FROM tasks WHERE assignee_id = ? ORDER BY updated_at DESC').all(userId);
    } else {
      // Fallback
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    }

    const historyStmt = db.prepare('SELECT * FROM task_status_history WHERE task_id = ? ORDER BY diubah_pada ASC');
    const usersMap = {};
    db.prepare('SELECT id, nama, level_otoritas, departemen FROM users').all().forEach(u => { usersMap[u.id] = u; });

    tasks.forEach(t => { 
      t.statusHistory = historyStmt.all(t.id); 
      t.assignee = usersMap[t.assignee_id] || null;
      t.assigned_by = usersMap[t.assigned_by_id] || null;
    });
    res.json(tasks);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, assigned_by_id, import_project_id, tenggat } = req.body;
    
    if (!judul || !prioritas || !tenggat) {
      return res.status(400).json({ error: 'Judul, prioritas, dan tenggat wajib diisi' });
    }

    const finalAssigneeId = assignee_id || assigned_by_id;
    const finalAssignedById = assigned_by_id;
    const finalSumberTugas = sumber_tugas || 'Manual';

    const lastTask = db.prepare("SELECT task_code FROM tasks ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastTask) {
      const match = lastTask.task_code.match(/TSK-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const taskCode = `TSK-${String(nextNum).padStart(4, '0')}`;

    let newId;
    db.transaction(() => {
      db.prepare(`
        INSERT INTO tasks (task_code, judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, assigned_by_id, import_project_id, tenggat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(taskCode, judul, deskripsi || null, departemen, prioritas, status || 'Backlog', finalSumberTugas, finalAssigneeId, finalAssignedById, import_project_id, tenggat);
      newId = db.prepare('SELECT last_insert_rowid()').pluck().get();
      db.prepare('INSERT INTO task_status_history (task_id, status_ke, diubah_oleh_id) VALUES (?, ?, ?)').run(newId, status || 'Backlog', finalAssignedById);
    })();
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId);
    res.json(newTask);
  } catch (error) { res.status(500).json({ error: error.message }); }
});