      // 2. Upsert masing-masing active category
      for (const cat of activeCategories) {
        if (!cat.inv || String(cat.inv).trim() === '' || cat.total <= 0) continue;
        activeKeys.add(cat.key);
        
        const existing = prevMap.get(cat.key);
        let status = 'Belum Dibayar';
        
        if (existing) {
          // Update
          const remaining = cat.total - existing.total_paid;
          if (existing.total_paid >= cat.total && cat.total > 0) status = 'Lunas';
          else if (existing.total_paid > 0) status = 'Bayar Sebagian';
          
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ? AND id != ?').get(finalCode, existing.id);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          
          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, vendor_id = (SELECT id FROM vendors WHERE nama = ? LIMIT 1), 
                cost_type = ?, total_invoice = ?, status_linked = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            finalCode, cat.vendor, cat.name, cat.total, status, existing.id
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
            INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked)
            VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?)
          `).run(
            finalCode, vendorId, cat.name, cat.total, shipmentUn, 'import_operational', cat.key, status
          );
        }
      }