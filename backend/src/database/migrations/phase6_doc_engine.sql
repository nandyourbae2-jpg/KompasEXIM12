PRAGMA foreign_keys = OFF;

-- Drop old unused table
DROP TABLE IF EXISTS ae_job_document_activities;

-- 1. Document Level
CREATE TABLE ae_job_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES export_jobs(id),
    document_name TEXT NOT NULL,
    state TEXT DEFAULT 'MISSING' CHECK (state IN ('MISSING','RECEIVED','DRAFT','REVISED','FINAL','ORIGINAL')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(job_id, document_name)
);

-- 2. Activity Level
CREATE TABLE ae_job_document_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_document_id INTEGER NOT NULL REFERENCES ae_job_documents(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN PROGRESS','COMPLETED','NOT APPLICABLE','BLOCKED')),
    version INTEGER DEFAULT 1,
    completed_by_id INTEGER REFERENCES users(id),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(job_document_id, activity_name)
);

-- 3. Audit Level
CREATE TABLE ae_document_activity_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES export_jobs(id),
    job_document_id INTEGER NOT NULL REFERENCES ae_job_documents(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL REFERENCES ae_job_document_activities(id) ON DELETE CASCADE,
    actor_id INTEGER NOT NULL REFERENCES users(id),
    old_state TEXT,
    new_state TEXT,
    remarks TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_ae_doc_job ON ae_job_documents(job_id);
CREATE INDEX idx_ae_doc_act_doc ON ae_job_document_activities(job_document_id);
CREATE INDEX idx_ae_doc_audit_job ON ae_document_activity_audit(job_id);

PRAGMA foreign_keys = ON;
