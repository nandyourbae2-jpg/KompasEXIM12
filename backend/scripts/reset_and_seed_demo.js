const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../kompas-exim.db');
const db = new Database(dbPath);

console.log('--- STARTING DEMO RESET AND SEED ---');

// 1. DELETE ALL OPERATIONAL DATA
const tablesToClear = [
  'payment_logs',
  'job_orders',
  'reports',
  'task_status_history',
  'tasks',
  'import_project_documents',
  'dokumen_monitoring_riwayat',
  'dokumen_monitoring_baris',
  'import_projects'
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

// 2. SEED PRESENTATION DATA
console.log('Seeding presentation data...');

try {
  db.exec('BEGIN TRANSACTION;');

  // -- A. Import Project --
  const stmtProject = db.prepare(`
    INSERT INTO import_projects (
      task_unique_number, supplier, trade, import_type, shipment_term,
      etd, eta, hs_code, free_time_destination, created_by_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const projectId = stmtProject.run(
    'IMP-001-2026', 'PT Global Supplies', 'FOB', 'Raw Material', 'Sea Freight',
    '2026-08-01', '2026-08-15', '3901.20.00', 14, 2 // SPV Import created it
  ).lastInsertRowid;
  
  console.log(`Created Import Project: IMP-001-2026 (ID: ${projectId})`);

  // -- B. Tasks (Staff - SPV Flow) --
  // SPV (2) assigns tasks to Staff Keenand (7)
  const stmtTask = db.prepare(`
    INSERT INTO tasks (
      task_code, judul, deskripsi, departemen, prioritas, status,
      sumber_tugas, assignee_id, assigned_by_id, import_project_id, tenggat
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Task 1: Assigned to Keenand, currently in progress
  stmtTask.run(
    'TSK-0001', 'Review Draft BL & Invoice', 'Tolong review draft BL dari PT Global Supplies.',
    'Import', 'Tinggi', 'Dalam Proses', 'Escalation', 7, 2, projectId, '2026-07-25'
  );

  // Task 2: Assigned to Thomas, finished
  stmtTask.run(
    'TSK-0002', 'Koordinasi Vendor Trucking', 'Pastikan vendor trucking siap saat kapal sandar.',
    'Import', 'Sedang', 'Selesai', 'Escalation', 6, 2, projectId, '2026-07-20'
  );

  console.log('Created Tasks for Staff');

  // -- C. Reports (Staff -> SPV -> Manager Flow) --
  const stmtReport = db.prepare(`
    INSERT INTO reports (
      tipe, judul, isi, departemen, dibuat_oleh_id, tanggapan_manager, ditanggapi_oleh_id, ditinjau_manager
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Staff (Keenand) creates a Problem Report
  stmtReport.run(
    'Problem Report', 'Keterlambatan Draft BL', 'Draft BL belum diterima dari supplier sehingga proses PIB tertunda.',
    'Import', 7, null, null, 0
  );

  // 2. SPV (Bapak SPV Import) creates a Weekday Report that has been reviewed by Manager
  stmtReport.run(
    'Weekday Report', 'Laporan Mingguan Import (Juli W3)', 'Semua proses shipment berjalan lancar. Satu kendala pada draft BL sedang di-follow up.',
    'Import', 2, 'Laporan diterima, terus pantau status BL tersebut.', 1, 1
  );

  console.log('Created Reports for Staff, SPV, and Manager');

  // -- D. Job Orders (Financial) --
  // Job order requested by Staff, reviewed by SPV, paid by Manager (Demo)
  const stmtJobOrder = db.prepare(`
    INSERT INTO job_orders (
      job_order_code, vendor_id, cost_type, mata_uang, total_invoice, total_paid,
      tanggal_invoice, tanggal_jatuh_tempo, shipment_un, sumber, status_linked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmtJobOrder.run(
    'JO-0001', 1, 'LOLO (Reimb. Liftoff)', 'IDR', 1500000, 1500000,
    '2026-07-20', '2026-07-30', 'IMP-001-2026', 'manual', 'linked'
  );

  console.log('Created Job Orders');

  db.exec('COMMIT;');
  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
} catch (error) {
  db.exec('ROLLBACK;');
  console.error('Error seeding data:', error);
  process.exit(1);
}
