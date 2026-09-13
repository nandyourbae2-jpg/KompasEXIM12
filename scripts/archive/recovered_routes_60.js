      newId = db.prepare('SELECT last_insert_rowid()').pluck().get();
      db.prepare('INSERT INTO task_status_history (task_id, status_ke, diubah_oleh_id) VALUES (?, ?, ?)').run(newId, status || 'Backlog', finalAssignedById);
    })();
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId);
    
    // Test compatibility: append assignee_nama
    if (newTask.assignee_id) {
      const assignee = db.prepare('SELECT nama FROM users WHERE id = ?').get(newTask.assignee_id);
      if (assignee) newTask.assignee_nama = assignee.nama;
    }

    res.status(201).json(newTask);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});