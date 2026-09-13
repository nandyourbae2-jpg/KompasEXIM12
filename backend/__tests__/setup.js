jest.mock('../src/database/db', () => require('./mockDb'));

const testDb = require('./mockDb');

beforeAll(() => {
  const bcrypt = require('bcrypt');
  const hash = bcrypt.hashSync('123456', 10);

  testDb.prepare(`
    INSERT OR IGNORE INTO users (id, employee_id, nama, level_otoritas, departemen, tipe_karyawan, status_aktif, password_hash)
    VALUES
      (1, 'MGR-001', 'Bapak Manager', 'Manager', NULL, 'Karyawan Tetap', 1, ?),
      (2, 'SPV-IMP-01', 'Bapak SPV Import', 'Supervisor', 'Import', 'Karyawan Tetap', 1, ?),
      (4, 'EXIM-IMP-02', 'Yoda', 'Staff Dept', 'Import', 'Karyawan Tetap', 1, ?),
      (5, 'EXIM-IMP-03', 'Katon', 'Staff Dept', 'Import', 'Karyawan Tetap', 1, ?),
      (6, 'EXIM-IMP-04', 'Thomas', 'Staff Dept', 'Import', 'Karyawan Tetap', 1, ?),
      (7, 'EXIM-IMP-05', 'Keenand', 'Staff Dept', 'Import', 'Karyawan Magang', 1, ?),
      (99, 'INACTIVE-01', 'Inactive User', 'Staff Dept', 'Import', 'Karyawan Tetap', 0, ?),
      (101, 'AE-001', 'Monica', 'Staff Dept', 'Administrasi Export', 'Karyawan Tetap', 1, ?),
      (102, 'SPV-AE-001', 'Amal', 'Supervisor', 'Administrasi Export', 'Karyawan Tetap', 1, ?),
      (107, 'AE-002', 'Wenny', 'Staff Dept', 'Administrasi Export', 'Karyawan Tetap', 1, ?)
  `).run(hash, hash, hash, hash, hash, hash, hash, hash, hash, hash);

  const tCount = testDb.prepare('SELECT count(*) as c FROM checklist_templates').get().c;
  if (tCount === 0) {
    const t = testDb.prepare("INSERT INTO checklist_templates (nama_template, company, product) VALUES ('PBN LOIN', 'PBN', 'LOIN')").run();
    const g = testDb.prepare("INSERT INTO checklist_groups (template_id, nama_group, urutan) VALUES (?, 'DOCUMENT PREPARATION', 1)").run(t.lastInsertRowid);
    const i = testDb.prepare("INSERT INTO checklist_items (group_id, nama_item, urutan) VALUES (?, 'Invoice', 1)").run(g.lastInsertRowid);
    const a = testDb.prepare("INSERT INTO checklist_activities (group_id, nama_aktivitas, urutan) VALUES (?, 'RECEIVE', 1)").run(g.lastInsertRowid);
    const a2 = testDb.prepare("INSERT INTO checklist_activities (group_id, nama_aktivitas, urutan) VALUES (?, 'CHECK', 2)").run(g.lastInsertRowid);
    testDb.prepare("INSERT INTO checklist_item_activity_rules (item_id, activity_id, berlaku) VALUES (?, ?, 1)").run(i.lastInsertRowid, a.lastInsertRowid);
    testDb.prepare("INSERT INTO checklist_item_activity_rules (item_id, activity_id, berlaku) VALUES (?, ?, 1)").run(i.lastInsertRowid, a2.lastInsertRowid);
  }
  console.log("TEST DB SEEDED:", testDb.prepare("SELECT count(*) FROM users").get());
});

// Bersihkan data non-user setelah setiap test (bukan setiap describe)
afterEach(() => {
  testDb.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM task_status_history;
    DELETE FROM tasks;
    DELETE FROM payment_logs;
    DELETE FROM job_orders;
    DELETE FROM vendor_rate_cards;
    DELETE FROM vendor_fleets;
    DELETE FROM vendors;
    DELETE FROM dokumen_monitoring_riwayat;
    DELETE FROM dokumen_monitoring_baris;
    DELETE FROM import_project_documents;
    DELETE FROM containers;
    DELETE FROM import_shipments;
    DELETE FROM documents;
    DELETE FROM import_projects;
    DELETE FROM master_data_dokumen;
    DELETE FROM reports;
    PRAGMA foreign_keys = ON;
  `);
});

afterAll(() => {
  testDb.close();
});

module.exports = { testDb };
