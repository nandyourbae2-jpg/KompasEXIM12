    if (!judul || !prioritas || !tenggat) {
      return res.status(400).json({ error: 'Judul, prioritas, dan tenggat wajib diisi' });
    }
    
    if (!assigned_by_id) {
      return res.status(400).json({ error: 'assigned_by_id wajib diisi' });
    }
    
    const creator = db.prepare('SELECT level_otoritas FROM users WHERE id = ?').get(assigned_by_id);
    if (!creator) {
      return res.status(400).json({ error: 'User tidak valid' });
    }

    let finalAssigneeId;
    if (creator.level_otoritas === 'Staff Dept') {
      finalAssigneeId = assigned_by_id; // WAJIB diri sendiri
    } else {
      finalAssigneeId = assignee_id;
      if (!finalAssigneeId) {
        return res.status(400).json({ error: 'assigneeId wajib diisi untuk Supervisor/Manager' });
      }
    }

    const finalAssignedById = assigned_by_id;
    const finalSumberTugas = sumber_tugas || 'Manual';