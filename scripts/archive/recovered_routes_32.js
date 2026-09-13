    const row = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Baris tidak ditemukan' });

