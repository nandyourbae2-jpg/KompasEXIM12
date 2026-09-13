PRAGMA foreign_keys = OFF;

CREATE TABLE ae_ao_handovers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    handover_type TEXT NOT NULL CHECK (handover_type IN ('DRAFT', 'FINAL')),
    event_type TEXT NOT NULL CHECK (event_type IN ('SHARED', 'RECEIVED', 'REVISION_REQUESTED', 'CLOSED')),
    remarks TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(job_id, sender_id, request_id)
);

CREATE TABLE ae_ao_handover_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handover_id INTEGER NOT NULL REFERENCES ae_ao_handovers(id) ON DELETE CASCADE,
    job_document_id INTEGER NOT NULL REFERENCES ae_job_documents(id) ON DELETE CASCADE,
    snap_document_name TEXT NOT NULL,
    snap_document_state TEXT NOT NULL,
    snap_version INTEGER NOT NULL,
    UNIQUE(handover_id, job_document_id)
);

CREATE INDEX idx_ae_ao_handover_job ON ae_ao_handovers(job_id);
CREATE INDEX idx_ae_ao_handover_docs ON ae_ao_handover_documents(handover_id);

PRAGMA foreign_keys = ON;
