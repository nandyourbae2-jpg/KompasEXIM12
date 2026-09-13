app.post('/api/import-projects', (req, res) => {
  try {
    const { task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id } = req.body;
    const info = db.prepare(`
      INSERT INTO import_projects (task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id);
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/import-projects/:id', (req, res) => {
  try {
    const allowedKeys = ['supplier', 'trade', 'import_type', 'shipment_term', 'invoice_no', 'bl_no', 'etd', 'eta', 'hs_code', 'free_time_destination'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(req.params.id);
      db.prepare(`UPDATE import_projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/import-projects/:id', (req, res) => {