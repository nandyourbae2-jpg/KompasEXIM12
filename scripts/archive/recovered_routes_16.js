// --- 9. STAFF ---
app.get('/api/staff', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM users WHERE level_otoritas = "Staff Dept"').all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/staff', (req, res) => {
  try {
    const { nama, employee_id, departemen, tipe_karyawan, password } = req.body;
    const info = db.prepare(`
      INSERT INTO users (nama, employee_id, departemen, tipe_karyawan, level_otoritas, password_hash)
      VALUES (?, ?, ?, ?, 'Staff Dept', ?)
    `).run(nama, employee_id, departemen, tipe_karyawan, password || 'password123');
    res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/staff/:id', (req, res) => {
  try {
    const { nama, tipe_karyawan } = req.body;
    db.prepare('UPDATE users SET nama = ?, tipe_karyawan = ?, updated_at = datetime("now") WHERE id = ?').run(nama, tipe_karyawan, req.params.id);
    res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/staff/:id/status', (req, res) => {