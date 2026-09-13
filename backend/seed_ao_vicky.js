const db = require('./src/database/db');
const bcrypt = require('bcrypt');

const hash = bcrypt.hashSync('password123', 10);

db.transaction(() => {
    const upsertUser = db.prepare(`
      INSERT INTO users (employee_id, nama, level_otoritas, departemen, tipe_karyawan, password_hash) 
      VALUES (@employee_id, @nama, @level_otoritas, @departemen, 'Karyawan Tetap', @password_hash)
      ON CONFLICT(employee_id) DO UPDATE SET 
        nama = excluded.nama,
        level_otoritas = excluded.level_otoritas,
        departemen = excluded.departemen,
        password_hash = excluded.password_hash
    `);

    // SPV
    upsertUser.run({ employee_id: 'SPV-AO-01', nama: 'Vicky', level_otoritas: 'Supervisor', departemen: 'Account Officer', password_hash: hash });
    
    // Staff (Update existing IDs to prevent orphans, and add new ones if missing)
    upsertUser.run({ employee_id: 'EXIM-AO-01', nama: 'Tren', level_otoritas: 'Staff Dept', departemen: 'Account Officer', password_hash: hash });
    upsertUser.run({ employee_id: 'EXIM-AO-02', nama: 'Bella', level_otoritas: 'Staff Dept', departemen: 'Account Officer', password_hash: hash });
    upsertUser.run({ employee_id: 'EXIM-AO-03', nama: 'Fenny', level_otoritas: 'Staff Dept', departemen: 'Account Officer', password_hash: hash });
    upsertUser.run({ employee_id: 'EXIM-AO-04', nama: 'Vera', level_otoritas: 'Staff Dept', departemen: 'Account Officer', password_hash: hash });
    
    // Catch legacy ones
    upsertUser.run({ employee_id: 'AO-001', nama: 'Tren', level_otoritas: 'Staff Dept', departemen: 'Account Officer', password_hash: hash });

    // DSCS
    upsertUser.run({ employee_id: 'DSCS-01', nama: 'Erica', level_otoritas: 'Staff Dept', departemen: 'Account Officer', password_hash: hash });
})();
console.log('Successfully upserted blueprint names (Vicky, Tren, Bella, Fenny, Vera, Erica)');
