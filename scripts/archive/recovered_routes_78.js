try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN invoice_no TEXT").run();
  console.log("Migration: Added invoice_no to job_orders");
} catch (error) {
  // Column already exists, ignore
}

// Migrate for DPP and Tax
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN dpp REAL DEFAULT 0").run();
  db.prepare("ALTER TABLE job_orders ADD COLUMN persen_ppn REAL DEFAULT 11").run();
  console.log("Migration: Added dpp and persen_ppn to job_orders");
  
  // Backfill existing data
  db.prepare(`
    UPDATE job_orders 
    SET dpp = ROUND(total_invoice / 1.11, 2), persen_ppn = 11 
    WHERE (dpp IS NULL OR dpp = 0) AND total_invoice > 0
  `).run();
  
  db.prepare(`
    UPDATE job_orders 
    SET total_invoice = dpp + (dpp * persen_ppn / 100)
  `).run();
  
  console.log("Migration: Backfilled dpp and updated total_invoice in job_orders");
} catch (error) {
  // Columns already exist, ignore
}

  try {
    let { job_order_code, vendor_id, vendor_nama, cost_type, dpp, persen_ppn, tanggal_invoice, tanggal_jatuh_tempo, shipment_un } = req.body;
    
    if (dpp === undefined) dpp = 0;
    if (persen_ppn === undefined) persen_ppn = 11;
    
    // Calculate total invoice on backend
    const tax = dpp * persen_ppn / 100;
    const total_invoice = dpp + tax;

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
        const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(vendor_nama, 'Trucking');
        vendor_id = vendorInsert.lastInsertRowid;
      } else {
        vendor_id = vendor.id;
      }
    }

    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, dpp, persen_ppn, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, dpp, persen_ppn, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);

      // 2. Upsert masing-masing active category
      for (const cat of activeCategories) {
        if (!cat.inv || String(cat.inv).trim() === '' || cat.total <= 0) continue;
        activeKeys.add(cat.key);
        
        const existing = prevMap.get(cat.key);
        let status = 'Belum Dibayar';
        
        // Ensure we handle dpp and persenPpn
        const dpp = cat.dpp || 0;
        const persenPpn = cat.persenPpn ?? 11; // default to 11 if undefined
        const tax = dpp * persenPpn / 100;
        const totalInvoice = dpp + tax;
        
        if (existing) {
          // Update
          const remaining = totalInvoice - existing.total_paid;
          if (existing.total_paid >= totalInvoice && totalInvoice > 0) status = 'Lunas';
          else if (existing.total_paid > 0) status = 'Bayar Sebagian';
          
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ? AND id != ?').get(finalCode, existing.id);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          
          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, invoice_no = ?, vendor_id = (SELECT id FROM vendors WHERE nama = ? LIMIT 1), 
                cost_type = ?, dpp = ?, persen_ppn = ?, total_invoice = ?, remaining_balance = ?, status_linked = ?, import_shipment_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            finalCode, cat.inv, cat.vendor, cat.name, dpp, persenPpn, totalInvoice, remaining, status, importShipmentId || null, existing.id
          );
        } else {
          // Insert
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;

          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          console.log('[SYNC] Inserting new tagihan:', finalCode, cat.name, totalInvoice);
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, dpp, persen_ppn, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(
            finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, totalInvoice, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null
          );
        }
      }

