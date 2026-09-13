        // Resolve vendor ID or create new one
        let vendorId = null;
        if (cat.vendor && cat.vendor !== 'Unknown') {
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) {
            vendorId = vendorObj.id;
          } else {
            const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(cat.vendor, 'Forwarder');
            vendorId = vendorInsert.lastInsertRowid;
          }
        }