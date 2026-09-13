app.post('/api/job-orders', authenticateToken, (req, res) => {
  try {
    let { job_order_code, vendor_id, vendor_nama, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un } = req.body;
    
    if (!job_order_code) {
      const lastJo = db.prepare('SELECT job_order_code FROM job_orders ORDER BY id DESC LIMIT 1').get();
      let nextNum = 1;
      if (lastJo && lastJo.job_order_code) {
        const match = lastJo.job_order_code.match(/JO-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      job_order_code = `JO-${String(nextNum).padStart(4, '0')}`;
    }

    if (!vendor_id && vendor_nama) {
      let vendor = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(vendor_nama);
      if (!vendor) {
        const vendorInsert = db.prepare('INSERT INTO vendors (nama, kategori) VALUES (?, ?)').run(vendor_nama, 'Other');
        vendor_id = vendorInsert.lastInsertRowid;
      } else {
        vendor_id = vendor.id;
      }
    }

    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);
    res.status(201).json(db.prepare('SELECT * FROM job_orders WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});