// Migrate for DPP and Tax
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN dpp REAL DEFAULT 0").run();
  db.prepare("ALTER TABLE job_orders ADD COLUMN persen_ppn REAL DEFAULT 0").run();
  db.prepare("ALTER TABLE job_orders ADD COLUMN ppn REAL DEFAULT 0").run();
  console.log("Migration: Added dpp, persen_ppn, ppn to job_orders");
  
  // Backfill existing data
  db.prepare(`
    UPDATE job_orders 
    SET 
      dpp = ROUND(total_invoice / 1.11, 2), 
      persen_ppn = 11,
      ppn = total_invoice - ROUND(total_invoice / 1.11, 2)
    WHERE (dpp IS NULL OR dpp = 0) AND total_invoice > 0
  `).run();
  
  console.log("Migration: Backfilled dpp and ppn in job_orders");
} catch (error) {
  // Columns already exist, ignore
}

        // Forward exact values from Import Operational
        const dpp = cat.dpp || 0;
        const persenPpn = cat.persenPpn || 0;
        const ppn = cat.ppn || 0;
        const totalInvoice = cat.totalDenganPpn || 0;
        
        if (existing) {
          // Update - only update cost values, don't touch total_paid
          const remaining = totalInvoice - existing.total_paid;
          if (existing.total_paid >= totalInvoice && totalInvoice > 0) status = 'Lunas';
          else if (existing.total_paid > 0) status = 'Bayar Sebagian';
          
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ? AND id != ?').get(finalCode, existing.id);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          
          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, invoice_no = ?, vendor_id = (SELECT id FROM vendors WHERE nama = ? LIMIT 1), 
                cost_type = ?, dpp = ?, persen_ppn = ?, ppn = ?, total_invoice = ?, remaining_balance = ?, status_linked = ?, import_shipment_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            finalCode, cat.inv, cat.vendor, cat.name, dpp, persenPpn, ppn, totalInvoice, remaining, status, importShipmentId || null, existing.id
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
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(
            finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null
          );
        }
      }

