      rows = db.prepare(`
        SELECT id, nama, employee_id, departemen, tipe_karyawan, level_otoritas
        FROM users