const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../kompas-exim.db');
const db = new Database(dbPath);

console.log('--- STARTING CLEANING OPERATIONAL DATA ---');

const tablesToClear = [
  'payment_logs',
  'job_orders',
  'reports',
  'task_status_history',
  'tasks',
  'import_project_documents',
  'dokumen_monitoring_riwayat',
  'dokumen_monitoring_baris',
  'containers',
  'import_shipments',
  'import_projects',
  'debit_note_status_history',
  'debit_notes',
  'realisasi_mtb_transaksi',
  'realisasi_mtb_periode',
  'realisasi_pib',
  'financial_request_history',
  'financial_requests',
  'pib_request_history',
  'pib_requests'
];

try {
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('BEGIN TRANSACTION;');
  
  tablesToClear.forEach(table => {
    db.prepare(`DELETE FROM ${table}`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
    console.log(`Cleared table: ${table}`);
  });

  db.exec('COMMIT;');
  db.exec('PRAGMA foreign_keys = ON;');
  console.log('Successfully cleared all operational data.');
} catch (error) {
  db.exec('ROLLBACK;');
  db.exec('PRAGMA foreign_keys = ON;');
  console.error('Error clearing data:', error);
  process.exit(1);
}
