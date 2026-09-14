PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Backup ae_document_checklists
CREATE TABLE ae_document_checklists_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    status TEXT DEFAULT 'Required' CHECK (status IN ('Required', 'Received', 'Under Review', 'Verified', 'Missing', 'Rejected', 'Need Revision')),
    notes TEXT,
    verified_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TEXT,
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);
DROP TABLE ae_document_checklists;
ALTER TABLE ae_document_checklists_new RENAME TO ae_document_checklists;
CREATE INDEX idx_ae_document_shipment ON ae_document_checklists(shipment_id);
CREATE INDEX idx_ae_document_status ON ae_document_checklists(status);

-- Backup ae_followup_records
CREATE TABLE ae_followup_records_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER REFERENCES export_jobs(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    followup_type TEXT NOT NULL,
    external_party TEXT,
    contact_person TEXT,
    contact_channel TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Contacted', 'Waiting Response', 'Follow-Up Required', 'Resolved', 'Cancelled')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    due_date TEXT,
    last_contact_at TEXT,
    next_follow_up_at TEXT,
    resolution TEXT,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1,
    related_entity_type TEXT,
    related_entity_id INTEGER
);
DROP TABLE ae_followup_records;
ALTER TABLE ae_followup_records_new RENAME TO ae_followup_records;
CREATE INDEX idx_ae_followup_shipment ON ae_followup_records(shipment_id);
CREATE INDEX idx_ae_followup_status ON ae_followup_records(status);
CREATE INDEX idx_followups_entity ON ae_followup_records(related_entity_type, related_entity_id);

-- Backup ae_discrepancies
CREATE TABLE ae_discrepancies_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER REFERENCES export_jobs(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Waiting', 'Resolved', 'Cancelled')),
    resolution TEXT,
    resolved_at TEXT,
    reported_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1,
    related_entity_type TEXT,
    related_entity_id INTEGER
);
DROP TABLE ae_discrepancies;
ALTER TABLE ae_discrepancies_new RENAME TO ae_discrepancies;
CREATE INDEX idx_ae_discrepancies_shipment ON ae_discrepancies(shipment_id);
CREATE INDEX idx_ae_discrepancies_status ON ae_discrepancies(status);
CREATE INDEX idx_discrepancies_entity ON ae_discrepancies(related_entity_type, related_entity_id);

-- Drop old ae_export_shipments
DROP TABLE ae_export_shipments;

COMMIT;
PRAGMA foreign_keys = ON;
