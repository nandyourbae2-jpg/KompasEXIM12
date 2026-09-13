const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../kompas-exim.db');
const db = new Database(dbPath);

console.log('Menghapus data sementara Financial Request...');

db.transaction(() => {
  const dummyRequestNumbers = ['REQ-0001-26', 'REQ-0002-26', 'REQ-0003-26', 'REQ-0004-26', 'REQ-0005-26'];
  const placeholders = dummyRequestNumbers.map(() => '?').join(',');
  const dummyRequests = db.prepare(`SELECT id FROM financial_requests WHERE request_number IN (${placeholders})`).all(dummyRequestNumbers);
  
  const dummyIds = dummyRequests.map(r => r.id);
  
  if (dummyIds.length > 0) {
    const idPlaceholders = dummyIds.map(() => '?').join(',');
    db.prepare(`UPDATE job_orders SET financial_request_id = NULL WHERE financial_request_id IN (${idPlaceholders})`).run(dummyIds);
    db.prepare(`UPDATE debit_notes SET financial_request_id = NULL WHERE financial_request_id IN (${idPlaceholders})`).run(dummyIds);
    db.prepare(`DELETE FROM financial_request_history WHERE financial_request_id IN (${idPlaceholders})`).run(dummyIds);
    db.prepare(`DELETE FROM financial_requests WHERE id IN (${idPlaceholders})`).run(dummyIds);
    console.log(`Berhasil menghapus ${dummyIds.length} data dummy Financial Request.`);
  } else {
    console.log('Tidak ada data dummy yang ditemukan.');
  }
})();
