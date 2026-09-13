const Database = require('better-sqlite3');
const path = require('path');

const crypto = require('crypto');

const db = new Database(path.join(__dirname, '../kompas-exim.db'));

console.log('Seeding AE dummy data...');

try {
  db.transaction(() => {
    // 1. Clear existing AE data
    db.prepare('DELETE FROM ae_audit_logs').run();
    db.prepare('DELETE FROM ae_executive_directives').run();
    db.prepare('DELETE FROM ae_followup_records').run();
    db.prepare('DELETE FROM ae_discrepancies').run();
    db.prepare('DELETE FROM ae_document_versions').run();
    db.prepare('DELETE FROM ae_document_checklists').run();
    db.prepare('DELETE FROM ae_admin_records').run();

    // 2. Buat Dummy Tasks untuk "My Tasks" (Assigned to AE-001 yang punya id 101)
    const myTasks = [
      { id: crypto.randomUUID(), shipment_id: 'EXP-2026-001', assigned_staff_id: 'AE-001', admin_status: 'In Review', completeness: 75.0, is_backup: 0, deadline: new Date().toISOString() },
      { id: crypto.randomUUID(), shipment_id: 'EXP-2026-002', assigned_staff_id: 'AE-001', admin_status: 'In Review', completeness: 100.0, is_backup: 0, deadline: new Date(Date.now() + 86400000).toISOString() }, // Tomorrow
      { id: crypto.randomUUID(), shipment_id: 'EXP-2026-003', assigned_staff_id: 'AE-001', admin_status: 'In Review', completeness: 25.0, is_backup: 0, deadline: new Date(Date.now() - 86400000).toISOString() } // Overdue
    ];

    const insertRecord = db.prepare(`
      INSERT INTO ae_admin_records (id, shipment_id, assigned_staff_id, admin_status, completeness_percentage, is_backup_active, target_sla_deadline)
      VALUES (@id, @shipment_id, (SELECT id FROM users WHERE employee_id = @assigned_staff_id), @admin_status, @completeness, @is_backup, @deadline)
    `);

    myTasks.forEach(task => insertRecord.run(task));

    // 3. Buat Dummy Tasks untuk "Queue Pool" (Unassigned)
    const queueTasks = [
      { id: crypto.randomUUID(), shipment_id: 'EXP-2026-004', assigned_staff_id: null, admin_status: 'Unassigned', completeness: 0.0, is_backup: 0, deadline: new Date(Date.now() + 172800000).toISOString() },
      { id: crypto.randomUUID(), shipment_id: 'EXP-2026-005', assigned_staff_id: null, admin_status: 'Unassigned', completeness: 0.0, is_backup: 0, deadline: new Date(Date.now() + 259200000).toISOString() }
    ];

    const insertQueue = db.prepare(`
      INSERT INTO ae_admin_records (id, shipment_id, assigned_staff_id, admin_status, completeness_percentage, is_backup_active, target_sla_deadline)
      VALUES (@id, @shipment_id, NULL, @admin_status, @completeness, @is_backup, @deadline)
    `);

    queueTasks.forEach(task => insertQueue.run(task));

    // 4. Generate Checklists
    const insertChecklist = db.prepare(`
      INSERT INTO ae_document_checklists (id, ae_admin_record_id, doc_type, is_mandatory, verification_status)
      VALUES (@id, @record_id, @doc_type, @is_mandatory, @status)
    `);

    const mandatoryDocs = ['Invoice', 'Packing List', 'Bill of Lading', 'PEB'];
    const optionalDocs = ['COO', 'Insurance', 'Phytosanitary'];

    // For each task in myTasks, let's create some checklists
    myTasks.forEach((task, index) => {
      // EXP-2026-001 (75%) -> 3/4 verified
      // EXP-2026-002 (100%) -> 4/4 verified
      // EXP-2026-003 (25%) -> 1/4 verified
      
      let verifiedCount = 0;
      if (index === 0) verifiedCount = 3;
      if (index === 1) verifiedCount = 4;
      if (index === 2) verifiedCount = 1;

      mandatoryDocs.forEach((doc, i) => {
        insertChecklist.run({
          id: crypto.randomUUID(),
          record_id: task.id,
          doc_type: doc,
          is_mandatory: 1,
          status: i < verifiedCount ? 'Verified' : 'Missing'
        });
      });

      optionalDocs.forEach((doc, i) => {
        insertChecklist.run({
          id: crypto.randomUUID(),
          record_id: task.id,
          doc_type: doc,
          is_mandatory: 0,
          status: 'Missing'
        });
      });
    });

  })();
  
  console.log('Dummy AE data seeded successfully!');
} catch (e) {
  console.error('Error seeding AE data:', e);
}
