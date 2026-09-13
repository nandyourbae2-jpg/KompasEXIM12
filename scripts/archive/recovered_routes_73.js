    if (!vendor_id && vendor_nama) {
      let vendor = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(vendor_nama);
      if (!vendor) {
        const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(vendor_nama, 'Trucking');
        vendor_id = vendorInsert.lastInsertRowid;
      } else {
        vendor_id = vendor.id;
      }
    }