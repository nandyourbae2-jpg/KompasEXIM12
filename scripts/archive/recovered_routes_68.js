app.get('/api/import-projects/:id', authenticateToken, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id));
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/import-projects/:id/documents', authenticateToken, (req, res) => {
  try {
    const documents = db.prepare(`
      SELECT 
        dmb.*, 
        md.kode_dokumen, md.nama_dokumen
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      WHERE dmb.import_project_id = ?
    `).all(req.params.id);
    res.json(documents);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.delete('/api/import-projects/:id', authenticateToken, (req, res) => {