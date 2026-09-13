PRAGMA foreign_keys = ON;

CREATE TABLE ae_export_shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_code TEXT UNIQUE NOT NULL,
    customer TEXT,
    exporter TEXT,
    consignee TEXT,
    destination TEXT,
    etd TEXT,
    eta TEXT,
    container_info TEXT,
    bl_no TEXT,
    invoice_no TEXT,
    packing_list_no TEXT,
    administrative_status TEXT DEFAULT 'READY' CHECK (administrative_status IN ('READY', 'ATTENTION', 'BLOCKED')),
    notes TEXT,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);

CREATE TABLE ae_document_checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL REFERENCES ae_export_shipments(id) ON DELETE CASCADE,
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

CREATE TABLE ae_followup_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER REFERENCES ae_export_shipments(id) ON DELETE CASCADE,
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
    version INTEGER DEFAULT 1
);

CREATE TABLE ae_discrepancies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER REFERENCES ae_export_shipments(id) ON DELETE CASCADE,
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
    version INTEGER DEFAULT 1
);

CREATE TABLE ae_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    reference TEXT,
    old_value JSON,
    new_value JSON,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX idx_ae_export_shipments_code ON ae_export_shipments(shipment_code);
CREATE INDEX idx_ae_export_shipments_assigned ON ae_export_shipments(assigned_to_id);

CREATE INDEX idx_ae_document_shipment ON ae_document_checklists(shipment_id);
CREATE INDEX idx_ae_document_status ON ae_document_checklists(status);

CREATE INDEX idx_ae_followup_shipment ON ae_followup_records(shipment_id);
CREATE INDEX idx_ae_followup_status ON ae_followup_records(status);

CREATE INDEX idx_ae_discrepancies_shipment ON ae_discrepancies(shipment_id);
CREATE INDEX idx_ae_discrepancies_status ON ae_discrepancies(status);
