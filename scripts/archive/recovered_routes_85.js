        // Resolve vendor ID or create new one
        let vendorId = null;
        if (cat.vendor && cat.vendor !== 'Unknown') {
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) {
            vendorId = vendorObj.id;
          } else {
            const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(cat.vendor, 'General');
            vendorId = vendorInsert.lastInsertRowid;
          }
        }
        
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
            SET job_order_code = ?, invoice_no = ?, vendor_id = ?, 
                cost_type = ?, dpp = ?, persen_ppn = ?, ppn = ?, total_invoice = ?, status_linked = ?, import_shipment_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, status, importShipmentId || null, existing.id
          );
        } else {
          // Insert
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;