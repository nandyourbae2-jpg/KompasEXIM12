const fs = require('fs');
const path = require('path');
const db = require('./db');

const args = process.argv.slice(2);
const reset = args.includes('--reset');
const seedOnly = args.includes('--seed-only');

if (reset) {
  console.log('Resetting SQLite Database...');

  // 1. Read schema.sql
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

  // 2. Drop existing tables
  const tablesToDrop = [
    'dokumen_monitoring_riwayat', 'dokumen_monitoring_baris', 'import_project_documents',
    'archive_snapshots', 'reports', 'containers', 'import_shipments', 
    'import_projects', 'payment_logs', 'job_orders', 'vendors', 
    'documents', 'task_status_history', 'tasks', 'master_data_dokumen', 'master_data_departemen', 'users'
  ];
  
  tablesToDrop.forEach(table => {
    try {
      db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
      console.log(`Dropped table ${table}`);
    } catch (err) {
      console.error(`Error dropping ${table}:`, err.message);
    }
  });

  // 3. Execute schema
  db.exec(schemaSql);
  console.log('Schema created successfully.');
}

if (reset || seedOnly) {
  console.log('Seeding data...');

  const bcrypt = require('bcrypt');
  const defaultPasswordHash = bcrypt.hashSync('123456', 10);

  db.transaction(() => {
    // SEED USERS
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, employee_id, nama, level_otoritas, departemen, tipe_karyawan, password_hash) 
      VALUES (@id, @employee_id, @nama, @level_otoritas, @departemen, @tipe_karyawan, @password_hash)
    `);
    const users = [
      { id: 1, employee_id: "MGR-001", nama: "Bapak Manager", level_otoritas: "Manager", departemen: null, tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 2, employee_id: "SPV-IMP-01", nama: "Bapak SPV Import", level_otoritas: "Supervisor", departemen: "Import", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 3, employee_id: "SPV-EXP-01", nama: "Ibu SPV Export", level_otoritas: "Supervisor", departemen: "Export", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 4, employee_id: "EXIM-IMP-02", nama: "Yoda", level_otoritas: "Staff Dept", departemen: "Import", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 5, employee_id: "EXIM-IMP-03", nama: "Katon", level_otoritas: "Staff Dept", departemen: "Import", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 6, employee_id: "EXIM-IMP-04", nama: "Thomas", level_otoritas: "Staff Dept", departemen: "Import", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 7, employee_id: "EXIM-IMP-05", nama: "Keenand", level_otoritas: "Staff Dept", departemen: "Import", tipe_karyawan: "Karyawan Magang", password_hash: defaultPasswordHash },
      { id: 8, employee_id: "EXIM-EXP-01", nama: "Andi", level_otoritas: "Staff Dept", departemen: "Export", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 101, employee_id: "AE-001", nama: "Monica", level_otoritas: "Staff Dept", departemen: "Administrasi Export", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 102, employee_id: "SPV-AE-001", nama: "Amal", level_otoritas: "Supervisor", departemen: "Administrasi Export", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 104, employee_id: "SPV-AO-01", nama: "Vicky", level_otoritas: "Supervisor", departemen: "Account Officer", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 105, employee_id: "EXIM-AO-01", nama: "Tren", level_otoritas: "Staff Dept", departemen: "Account Officer", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 106, employee_id: "EXIM-AO-02", nama: "Bella", level_otoritas: "Staff Dept", departemen: "Account Officer", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 107, employee_id: "AE-002", nama: "Wenny", level_otoritas: "Staff Dept", departemen: "Administrasi Export", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 108, employee_id: "AE-003", nama: "Ama", level_otoritas: "Staff Dept", departemen: "Administrasi Export", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash },
      { id: 115, employee_id: "DSCS-01", nama: "Erica", level_otoritas: "Staff Dept", departemen: "Account Officer", tipe_karyawan: "Karyawan Tetap", password_hash: defaultPasswordHash }
    ];
    users.forEach(u => insertUser.run(u));

    // SEED VENDORS
    const insertVendor = db.prepare(`
      INSERT OR REPLACE INTO vendors (id, nama, service_type, region, rating) 
      VALUES (@id, @nama, @service_type, @region, @rating)
    `);
    const vendors = [
      { id: 1, nama: "Adhirajasa Trucking Sejahtera", service_type: "Trucking", region: "Cikarang", rating: 4.0 },
      { id: 2, nama: "Mandiri Transport", service_type: "Trucking", region: "Jakarta", rating: 3.5 },
      { id: 3, nama: "ATS Express", service_type: "Trucking", region: "Karawang", rating: 4.5 },
      { id: 4, nama: "Samudera Logistik", service_type: "Forwarder", region: "Tanjung Priok", rating: 4.2 },
      { id: 5, nama: "Global Forwarding", service_type: "Forwarder", region: "Tanjung Priok", rating: 3.8 }
    ];
    vendors.forEach(v => insertVendor.run(v));

    // SEED IMPORT PROJECTS (Empty - User will create their own)
    // No dummy data

    // SEED IMPORT SHIPMENTS (Empty)
    // No dummy data

    // SEED CONTAINERS (Empty)
    // No dummy data

    // SEED JOB ORDERS
    const insertJobOrder = db.prepare(`
      INSERT OR REPLACE INTO job_orders (id, job_order_code, vendor_id, cost_type, total_invoice, total_paid) 
      VALUES (@id, @job_order_code, @vendor_id, @cost_type, @total_invoice, @total_paid)
    `);
    const jobOrders = [
      { id: 1, job_order_code: "JO-001", vendor_id: 1, cost_type: "Trucking Fee", total_invoice: 10000000, total_paid: 10000000 },
      { id: 2, job_order_code: "JO-002", vendor_id: 2, cost_type: "Trucking Fee", total_invoice: 15000000, total_paid: 5000000 },
      { id: 3, job_order_code: "JO-003", vendor_id: 4, cost_type: "Forwarder Fee", total_invoice: 20000000, total_paid: 0 },
      { id: 4, job_order_code: "JO-004", vendor_id: 5, cost_type: "Forwarder Fee", total_invoice: 5000000, total_paid: 0 }
    ];
    jobOrders.forEach(jo => insertJobOrder.run(jo));

    // SEED PAYMENT LOGS
    const insertPaymentLog = db.prepare(`
      INSERT OR IGNORE INTO payment_logs (job_order_id, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id) 
      VALUES (@job_order_id, @jumlah_bayar, @tanggal_bayar, @metode, @dicatat_oleh_id)
    `);
    insertPaymentLog.run({ job_order_id: 1, jumlah_bayar: 10000000, tanggal_bayar: "2026-07-20", metode: "Bank Transfer", dicatat_oleh_id: 1 });
    insertPaymentLog.run({ job_order_id: 2, jumlah_bayar: 5000000, tanggal_bayar: "2026-07-21", metode: "Bank Transfer", dicatat_oleh_id: 1 });

    // SEED TASKS (Empty - User will create their own)
    // No dummy data

    // SEED REPORTS
    const insertReport = db.prepare(`
      INSERT OR REPLACE INTO reports (id, tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id) 
      VALUES (@id, @tipe, @judul, @isi, @departemen, @dibuat_oleh_id, @problem_report_id)
    `);
    const reports = [
      { id: 1, tipe: "Weekday Report", judul: "Report Harian Import", isi: "Aman", departemen: "Import", dibuat_oleh_id: 2, problem_report_id: null },
      { id: 2, tipe: "Problem Report", judul: "Truk Terlambat", isi: "Truk ATS mogok", departemen: "Import", dibuat_oleh_id: 2, problem_report_id: null },
      { id: 3, tipe: "Progress Update", judul: "Update Truk ATS", isi: "Truk pengganti jalan", departemen: "Import", dibuat_oleh_id: 2, problem_report_id: 2 }
    ];
    reports.forEach(r => insertReport.run(r));

    // SEED MASTER DATA DOKUMEN (12 docs per PRD)
    const insertMasterDoc = db.prepare(`
      INSERT OR IGNORE INTO master_data_dokumen (kode_dokumen, nama_dokumen) VALUES (@kode_dokumen, @nama_dokumen)
    `);
    const masterDocs = [
      { kode_dokumen: 'DOC-001', nama_dokumen: 'Bill of Lading Original' },
      { kode_dokumen: 'DOC-002', nama_dokumen: 'Commercial Invoice' },
      { kode_dokumen: 'DOC-003', nama_dokumen: 'Packing List' },
      { kode_dokumen: 'DOC-004', nama_dokumen: 'Certificate of Origin (COO)' },
      { kode_dokumen: 'DOC-005', nama_dokumen: 'PIB (Pemberitahuan Impor Barang)' },
      { kode_dokumen: 'DOC-006', nama_dokumen: 'Health Certificate' },
      { kode_dokumen: 'DOC-007', nama_dokumen: 'Fumigation Certificate' },
      { kode_dokumen: 'DOC-008', nama_dokumen: 'Phytosanitary Certificate' },
      { kode_dokumen: 'DOC-009', nama_dokumen: 'MSDS (Material Safety Data Sheet)' },
      { kode_dokumen: 'DOC-010', nama_dokumen: 'Insurance Certificate' },
      { kode_dokumen: 'DOC-011', nama_dokumen: 'DO (Delivery Order)' },
      { kode_dokumen: 'DOC-012', nama_dokumen: 'Surat Jalan' },
    ];
    masterDocs.forEach(d => insertMasterDoc.run(d));

    // SEED MASTER DATA DEPARTEMEN
    const insertDept = db.prepare(`
      INSERT OR IGNORE INTO master_data_departemen (nama_departemen) VALUES (@nama_departemen)
    `);
    const depts = [
      { nama_departemen: 'Import' },
      { nama_departemen: 'Export' },
      { nama_departemen: 'Account Officer' },
      { nama_departemen: 'Administrasi Export' },
    ];
    depts.forEach(d => insertDept.run(d));

  })();
  console.log('Data seeded successfully.');
}
