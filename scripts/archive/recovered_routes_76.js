    const newVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
    if(newVendor) newVendor.layanan = JSON.parse(newVendor.layanan || '[]');
    res.json(newVendor);