    db.transaction(() => {
      // 1. Dapatkan daftar JO aktif sebelumnya untuk shipment ini (filter by id AND un to be safe)
      let queryStr = 'SELECT * FROM job_orders WHERE shipment_un = ? AND sumber = ?';
      let queryParams = [shipmentUn, 'import_operational'];
      
      if (importShipmentId) {
        queryStr += ' AND import_shipment_id = ?';
        queryParams.push(importShipmentId);
      }
      
      const prevRows = db.prepare(queryStr).all(...queryParams);
      const prevMap = new Map();
      prevRows.forEach(row => prevMap.set(row.import_category_key, row));

      const activeKeys = new Set();

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

          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          db.prepare(`
            UPDATE job_orders
            SET job_order_code = ?, vendor_id = ?, cost_type = ?, total_invoice = ?, remaining_balance = ?, status_linked = ?, import_shipment_id = ?
            WHERE id = ?
          `).run(
            finalCode, vendorId, cat.name, cat.total, remaining, status, importShipmentId || null, existing.id
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
          
          console.log('[SYNC] Inserting new tagihan:', finalCode, cat.name, cat.total);
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(
            finalCode, vendorId, cat.name, cat.total, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null
          );
        }