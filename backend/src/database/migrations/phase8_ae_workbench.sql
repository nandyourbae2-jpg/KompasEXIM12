PRAGMA foreign_keys = OFF;

-- 1. Modify export_jobs (Add new AE-owned fields)
ALTER TABLE export_jobs ADD COLUMN bl_mbl TEXT;
ALTER TABLE export_jobs ADD COLUMN cc_non_cc TEXT CHECK (cc_non_cc IN ('CC', 'NON CC'));
ALTER TABLE export_jobs ADD COLUMN coo_form TEXT;
ALTER TABLE export_jobs ADD COLUMN qc_attend INTEGER DEFAULT 0; -- BOOLEAN (0=NO, 1=YES)

-- 2. Create ae_job_document_versions (V1/V2/V3 tracking)
CREATE TABLE IF NOT EXISTS ae_job_document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    logical_document_id INTEGER NOT NULL REFERENCES ae_job_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    reason TEXT,
    requested_by INTEGER REFERENCES users(id),
    fixed_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(logical_document_id, version_number)
);
CREATE INDEX idx_ae_doc_vers_doc ON ae_job_document_versions(logical_document_id);

-- 3. Create ae_job_blockers
CREATE TABLE IF NOT EXISTS ae_job_blockers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
    reason TEXT NOT NULL,
    remark TEXT,
    opened_by INTEGER REFERENCES users(id),
    resolved_by INTEGER REFERENCES users(id),
    opened_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
);
CREATE INDEX idx_ae_job_blockers_job ON ae_job_blockers(job_id);

-- 4. Extend ae_job_document_activities to support Evidence/Remarks properly if not already
ALTER TABLE ae_job_document_activities ADD COLUMN evidence_payload TEXT;
ALTER TABLE ae_job_document_activities ADD COLUMN latest_remark TEXT;

PRAGMA foreign_keys = ON;
