    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);
    
    const newJo = db.prepare('SELECT * FROM job_orders WHERE id = ?').get(info.lastInsertRowid);
    newJo.remaining_balance = newJo.total_invoice - newJo.total_paid;
    if (newJo.total_paid >= newJo.total_invoice && newJo.total_invoice > 0) newJo.status_badge = 'Lunas';
    else if (newJo.total_paid > 0) newJo.status_badge = 'Bayar Sebagian';
    else newJo.status_badge = 'Belum Dibayar';

    res.status(201).json(newJo);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});