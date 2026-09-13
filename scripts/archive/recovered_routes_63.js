    db.transaction(() => {
      db.prepare(`UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
      db.prepare('INSERT INTO task_status_history (task_id, status_dari, status_ke, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(req.params.id, status_dari || null, status, diubah_oleh_id);
    })();