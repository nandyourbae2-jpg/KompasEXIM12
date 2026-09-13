app.patch('/api/tasks/:id', (req, res) => {
  try {
    const { status, priority, assigneeId, dueDate, notes, statusHistory } = req.body;
    const id = req.params.id;
    
    const updates = [];
    const values = [];
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (assigneeId !== undefined) { updates.push('assigneeId = ?'); values.push(assigneeId); }
    if (dueDate !== undefined) { updates.push('dueDate = ?'); values.push(dueDate); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    
    db.transaction(() => {
      if (updates.length > 0) {
        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);
        db.prepare(`UPDATE Task SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }
      
      if (statusHistory && Array.isArray(statusHistory)) {
        const insertHistory = db.prepare('INSERT INTO TaskHistory (taskId, status, label, fromStatus, timestamp) VALUES (?, ?, ?, ?, ?)');
        statusHistory.forEach(h => {
          insertHistory.run(id, h.status, h.label, h.fromStatus || null, h.timestamp || new Date().toISOString());
        });
      }
    })();
    
    const task = db.prepare('SELECT * FROM Task WHERE id = ?').get(id);
    task.statusHistory = db.prepare('SELECT * FROM TaskHistory WHERE taskId = ? ORDER BY timestamp ASC').all(id);
    res.json(task);
  } catch (error) {