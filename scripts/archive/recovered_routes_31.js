    db.prepare('DELETE FROM master_data_dokumen WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

// --- 3b. MASTER DATA DEPARTEMEN ---
app.get('/api/departemen', (req, res) => {
  try {
    const depts = db.prepare('SELECT * FROM master_data_departemen ORDER BY id ASC').all();
    res.json(depts);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.post('/api/departemen', (req, res) => {
  try {
    const { nama_departemen } = req.body;
    if (!nama_departemen) return res.status(400).json({ error: 'nama_departemen is required' });
    const info = db.prepare('INSERT INTO master_data_departemen (nama_departemen) VALUES (?)').run(nama_departemen);
    const newDept = db.prepare('SELECT * FROM master_data_departemen WHERE id = ?').get(info.lastInsertRowid);
    res.json(newDept);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.delete('/api/departemen/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM master_data_departemen WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
