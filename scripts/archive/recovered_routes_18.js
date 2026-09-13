app.patch('/api/staff/:id/status', (req, res) => {
  try {
    const { status_aktif } = req.body;
    db.prepare('UPDATE users SET status_aktif = ? WHERE id = ?').run(status_aktif ? 1 : 0, req.params.id);
    res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 9.5. ARCHIVE ---
app.get('/api/archive/history', (req, res) => {
  try {
    const archives = db.prepare('SELECT * FROM archive_snapshots ORDER BY created_at DESC').all();
    res.json({ archives: archives.map(a => ({ ...a, snapshot_data: JSON.parse(a.snapshot_data) })) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/archive/close-quarter', (req, res) => {
  try {
    const { periode, snapshot_data } = req.body;
    db.transaction(() => {
      db.prepare('INSERT INTO archive_snapshots (periode, snapshot_data) VALUES (?, ?)').run(periode, JSON.stringify(snapshot_data));
      db.prepare('DELETE FROM tasks WHERE status = "Selesai"').run();
      db.prepare('DELETE FROM job_orders WHERE status = "Lunas"').run();
    })();
    const snapshot = db.prepare('SELECT * FROM archive_snapshots WHERE periode = ?').get(periode);
    res.json({ snapshot: { ...snapshot, snapshot_data: JSON.parse(snapshot.snapshot_data) } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});