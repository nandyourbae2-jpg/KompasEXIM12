const db = require('./src/database/db');
const res = db.prepare("SELECT id, judul, tipe, tanggal, isi FROM reports WHERE departemen = 'Import' AND tanggapan_manager IS NULL").all();
console.log(JSON.stringify(res, null, 2));
