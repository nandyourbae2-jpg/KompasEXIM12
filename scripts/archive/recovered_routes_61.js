      rows = db.prepare(`
        SELECT id, nama, employee_id, tipe_karyawan, departemen, level_otoritas
        FROM users