app.patch('/api/vendors/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE vendors SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/vendors/:id', (req, res) => {
  try {
    const { nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan } = req.body;
    const allowedKeys = ['nama', 'service_type', 'region', 'kontak_nama', 'kontak_email', 'kontak_telepon', 'alamat', 'catatan'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (layanan !== undefined) {
      updates.push('layanan = ?');
      values.push(JSON.stringify(layanan));
    }
    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(req.params.id);
      db.prepare(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if(updated) updated.layanan = JSON.parse(updated.layanan || '[]');
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/vendors/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});