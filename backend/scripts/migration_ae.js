const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../kompas-exim.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Starting AE Module Migration...');

const migrationSQL = `
-- 1. Tabel Header Administrasi Ekspor
CREATE TABLE IF NOT EXISTS ae_admin_records (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL UNIQUE,
    assigned_staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    admin_status TEXT NOT NULL DEFAULT 'Unassigned', 
    completeness_percentage REAL NOT NULL DEFAULT 0.00,
    is_backup_active INTEGER NOT NULL DEFAULT 0,
    backup_assigned_at TEXT,
    target_sla_deadline TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ae_admin_status ON ae_admin_records(admin_status);
CREATE INDEX IF NOT EXISTS idx_ae_admin_staff ON ae_admin_records(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_ae_admin_backup ON ae_admin_records(is_backup_active);

-- 2. Tabel Checklist Dokumen Ekspor
CREATE TABLE IF NOT EXISTS ae_document_checklists (
    id TEXT PRIMARY KEY,
    ae_admin_record_id TEXT NOT NULL REFERENCES ae_admin_records(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, 
    is_mandatory INTEGER NOT NULL DEFAULT 1,
    verification_status TEXT NOT NULL DEFAULT 'Missing', 
    verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TEXT,
    override_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    override_reason TEXT,
    expiry_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ae_shipment_doctype UNIQUE(ae_admin_record_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_ae_doc_checklist_status ON ae_document_checklists(verification_status);
CREATE INDEX IF NOT EXISTS idx_ae_doc_checklist_mandatory ON ae_document_checklists(is_mandatory);

-- 3. Tabel Riwayat Versi File Dokumen
CREATE TABLE IF NOT EXISTS ae_document_versions (
    id TEXT PRIMARY KEY,
    checklist_id TEXT NOT NULL REFERENCES ae_document_checklists(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER,
    file_hash TEXT, 
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ae_doc_version UNIQUE(checklist_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_ae_doc_versions_chk ON ae_document_versions(checklist_id);

-- 4. Tabel Register Discrepancy & Issue
CREATE TABLE IF NOT EXISTS ae_discrepancies (
    id TEXT PRIMARY KEY,
    ae_admin_record_id TEXT NOT NULL REFERENCES ae_admin_records(id) ON DELETE CASCADE,
    checklist_id TEXT REFERENCES ae_document_checklists(id) ON DELETE SET NULL,
    severity_level TEXT NOT NULL, 
    category TEXT NOT NULL, 
    system_value TEXT,
    physical_doc_value TEXT,
    discrepancy_details TEXT NOT NULL,
    resolution_status TEXT NOT NULL DEFAULT 'Open', 
    resolution_notes TEXT,
    sla_deadline TEXT NOT NULL,
    escalated_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ae_discrepancy_status ON ae_discrepancies(resolution_status);
CREATE INDEX IF NOT EXISTS idx_ae_discrepancy_severity ON ae_discrepancies(severity_level);
CREATE INDEX IF NOT EXISTS idx_ae_discrepancy_deadline ON ae_discrepancies(sla_deadline);

-- 5. Tabel Log Penagihan / Follow-Up Berkas
CREATE TABLE IF NOT EXISTS ae_followup_records (
    id TEXT PRIMARY KEY,
    ae_admin_record_id TEXT NOT NULL REFERENCES ae_admin_records(id) ON DELETE CASCADE,
    target_pic_name TEXT NOT NULL,
    target_institution TEXT,
    contact_channel TEXT NOT NULL, 
    followup_notes TEXT NOT NULL,
    next_followup_due TEXT,
    status TEXT NOT NULL DEFAULT 'Active', 
    logged_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ae_followup_due ON ae_followup_records(next_followup_due);
CREATE INDEX IF NOT EXISTS idx_ae_followup_status ON ae_followup_records(status);

-- 6. Tabel Executive Directives (Manager Scope)
CREATE TABLE IF NOT EXISTS ae_executive_directives (
    id TEXT PRIMARY KEY,
    ae_admin_record_id TEXT NOT NULL REFERENCES ae_admin_records(id) ON DELETE CASCADE,
    directive_text TEXT NOT NULL,
    priority_level TEXT NOT NULL DEFAULT 'High', 
    issued_by TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'Pending Execution', 
    executed_by TEXT REFERENCES users(id),
    executed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Audit Log Administrasi
CREATE TABLE IF NOT EXISTS ae_audit_logs (
    id TEXT PRIMARY KEY,
    ae_admin_record_id TEXT NOT NULL REFERENCES ae_admin_records(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL REFERENCES users(id),
    action_type TEXT NOT NULL, 
    action_payload TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ae_audit_record ON ae_audit_logs(ae_admin_record_id);
`;

try {
  db.exec(migrationSQL);
  console.log('AE Module Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
}

// Tambahkan dummy user Staff AE
try {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users 
    (id, nama, employee_id, departemen, level_otoritas, tipe_karyawan, status_aktif) 
    VALUES 
    (101, 'Staff AE', 'AE-001', 'Administrasi Export', 'Staff Dept', 'Karyawan Tetap', 1),
    (102, 'SPV AE', 'SPV-AE-001', 'Administrasi Export', 'Supervisor', 'Karyawan Tetap', 1)
  `);
  insertUser.run();
  console.log('Dummy AE users added.');
} catch (e) {
  console.error('Failed adding dummy users:', e);
}
