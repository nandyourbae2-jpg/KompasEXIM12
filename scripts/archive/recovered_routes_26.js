// --- 3.5. MASTER DATA DOKUMEN ---
app.get('/api/document-types', (req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM master_data_dokumen ORDER BY kode_dokumen ASC').all();
    res.json({ documentTypes: docs });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.post('/api/document-types', (req, res) => {
  try {
    const { nama_dokumen, keterangan } = req.body;
    if (!nama_dokumen) return res.status(400).json({ error: 'Nama dokumen wajib diisi' });
    
    // Auto generate kode_dokumen (DOC-001, DOC-002, dll)
    const lastDoc = db.prepare('SELECT kode_dokumen FROM master_data_dokumen ORDER BY id DESC LIMIT 1').get();
    let nextNum = 1;
    if (lastDoc && lastDoc.kode_dokumen) {
      const match = lastDoc.kode_dokumen.match(/DOC-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const kode_dokumen = `DOC-${String(nextNum).padStart(3, '0')}`;
    
    const info = db.prepare('INSERT INTO master_data_dokumen (kode_dokumen, nama_dokumen, keterangan) VALUES (?, ?, ?)').run(kode_dokumen, nama_dokumen, keterangan || null);
    const newDoc = db.prepare('SELECT * FROM master_data_dokumen WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newDoc);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.put('/api/document-types/:id', (req, res) => {
  try {
    const { nama_dokumen, keterangan } = req.body;
    if (!nama_dokumen) return res.status(400).json({ error: 'Nama dokumen wajib diisi' });
    db.prepare('UPDATE master_data_dokumen SET nama_dokumen = ?, keterangan = ?, updated_at = datetime("now") WHERE id = ?').run(nama_dokumen, keterangan || null, req.params.id);
    const updatedDoc = db.prepare('SELECT * FROM master_data_dokumen WHERE id = ?').get(req.params.id);
    res.json(updatedDoc);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.delete('/api/document-types/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM master_data_dokumen WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

