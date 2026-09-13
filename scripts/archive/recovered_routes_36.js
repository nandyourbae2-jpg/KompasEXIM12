  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.post('/api/job-orders/sync-import', (req, res) => {
  try {
    const { shipmentUn, activeCategories } = req.body;
    db.transaction(() => {
      // 1. Dapatkan daftar JO aktif sebelumnya untuk shipment ini
      const prevRows = db.prepare('SELECT * FROM job_orders WHERE shipment_un = ? AND sumber = ?').all(shipmentUn, 'import_operational');
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
          
          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, vendor_id = (SELECT id FROM vendors WHERE nama = ? LIMIT 1), 
                cost_type = ?, total_invoice = ?, status_linked = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            cat.inv, cat.vendor, cat.name, cat.total, status, existing.id
          );
        } else {
          // Insert
          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked)
            VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?)
          `).run(
            cat.inv, vendorId, cat.name, cat.total, shipmentUn, 'import_operational', cat.key, status
          );
        }
      }

      // 3. Tangani orphaned categories (terhapus di UI / no inv dikosongkan)
      for (const [key, row] of prevMap.entries()) {
        if (!activeKeys.has(key)) {
          if (row.total_paid === 0) {
            // Aman untuk dihapus
            db.prepare('DELETE FROM job_orders WHERE id = ?').run(row.id);
          } else {
            // Jangan dihapus karena sudah ada pembayaran, tandai saja sebagai terputus
            db.prepare(`UPDATE job_orders SET sumber = 'terputus', updated_at = datetime('now') WHERE id = ?`).run(row.id);
          }
        }
      }
    })();
    res.json({ success: true });
  } catch (error) { 
    console.error('Error syncing job orders:', error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/job-orders/:id/payments', (req, res) => {