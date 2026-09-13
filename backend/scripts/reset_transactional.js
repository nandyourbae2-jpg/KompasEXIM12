const path = require('path');
const dbPath = path.resolve(__dirname, '../kompas-exim.db');
const Database = require('better-sqlite3');

const db = new Database(dbPath, { verbose: console.log });

const transactionalTables = [
  'archive_snapshots',
  'documents',
  'Document',
  'tasks',
  'task_status_history',
  'Task',
  'TaskHistory',
  'payment_logs',
  'job_orders',
  'dokumen_monitoring_riwayat',
  'dokumen_monitoring_baris',
  'debit_notes',
  'debit_note_history',
  'debit_note_status_history',
  'realisasi_pib',
  'realisasi_mtb_periode',
  'realisasi_mtb_transaksi',
  'pib_request_history',
  'pib_requests',
  'financial_allocations',
  'financial_request_history',
  'financial_request_ledger',
  'financial_requests',
  'import_project_documents',
  'container_costs',
  'containers',
  'import_shipments',
  'import_projects'
];

try {
  console.log('Starting transactional data reset...');
  
  // Disable foreign keys temporarily to avoid constraint errors during wipe
  db.pragma('foreign_keys = OFF');

  // Delete data from tables
  for (const table of transactionalTables) {
    console.log(`Clearing table: ${table}`);
    try {
      db.prepare(`DELETE FROM "${table}"`).run();
      
      // Reset auto-increment sequence
      db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
    } catch (err) {
      console.warn(`Warning: Could not clear table ${table}. It might not exist. Error: ${err.message}`);
    }
  }

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');

  console.log('Successfully reset all transactional data!');
  process.exit(0);
} catch (error) {
  console.error('Fatal Error during reset:', error);
  process.exit(1);
}
