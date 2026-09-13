      if (!vendor) {
        const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(vendor_nama, 'Trucking');
        vendor_id = vendorInsert.lastInsertRowid;
      } else {