          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, invoice_no = ?, vendor_id = (SELECT id FROM vendors WHERE nama = ? LIMIT 1), 
                cost_type = ?, total_invoice = ?, remaining_balance = ?, status_linked = ?, import_shipment_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            finalCode, cat.inv, cat.vendor, cat.name, cat.total, remaining, status, importShipmentId || null, existing.id
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
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(
            finalCode, cat.inv, vendorId, cat.name, cat.total, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null
          );
        }