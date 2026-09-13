    let rows;
    if (level_otoritas === 'Manager') {
      rows = db.prepare('SELECT tasks.*, u.nama as assignee_nama FROM tasks LEFT JOIN users u ON tasks.assignee_id = u.id ORDER BY tasks.created_at DESC').all();
    } else if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      rows = db.prepare('SELECT tasks.*, u.nama as assignee_nama FROM tasks LEFT JOIN users u ON tasks.assignee_id = u.id WHERE tasks.departemen = ? ORDER BY tasks.created_at DESC').all(departemen);
    } else {
      rows = db.prepare('SELECT tasks.*, u.nama as assignee_nama FROM tasks LEFT JOIN users u ON tasks.assignee_id = u.id WHERE tasks.assignee_id = ? ORDER BY tasks.created_at DESC').all(req.user.id);
    }