          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;

          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          console.log('[SYNC] Inserting new tagihan:', finalCode, cat.name, cat.total);
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked)
            VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?)
          `).run(
            finalCode, vendorId, cat.name, cat.total, shipmentUn, 'import_operational', cat.key, status
          );