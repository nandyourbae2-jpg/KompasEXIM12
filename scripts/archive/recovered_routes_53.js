app.post('/api/job-orders/:id/payments', authenticateToken, (req, res) => {
  try {
    const { jumlah_bayar, tanggal_bayar, metode } = req.body;
    const joId = req.params.id;
    const dicatat_oleh_id = req.user.id;
    
    // Check remaining balance
    const jo = db.prepare('SELECT total_invoice, total_paid FROM job_orders WHERE id = ?').get(joId);
    if (!jo) return res.status(404).json({ error: 'Job Order tidak ditemukan' });
    
    const remaining = jo.total_invoice - jo.total_paid;
    if (jumlah_bayar > remaining) {
      return res.status(400).json({ error: 'Jumlah bayar melebihi sisa tagihan' });
    }
    
    db.transaction(() => {
      db.prepare('INSERT INTO payment_logs (job_order_id, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id) VALUES (?, ?, ?, ?, ?)').run(joId, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id);
      db.prepare(`UPDATE job_orders SET total_paid = total_paid + ?, updated_at = datetime('now') WHERE id = ?`).run(jumlah_bayar, joId);
    })();
    res.status(201).json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});