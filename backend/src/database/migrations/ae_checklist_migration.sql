-- 1. Templates & Versions
CREATE TABLE IF NOT EXISTS ae_checklist_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ae_checklist_template_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES ae_checklist_templates(id),
    version_name TEXT NOT NULL,
    is_published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Master Definition (Groups & Items)
CREATE TABLE IF NOT EXISTS ae_checklist_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id INTEGER NOT NULL REFERENCES ae_checklist_template_versions(id),
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ae_checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES ae_checklist_groups(id),
    label TEXT NOT NULL,
    code TEXT,
    sort_order INTEGER DEFAULT 0,
    is_required INTEGER DEFAULT 1,
    applicability_rules JSON, -- Strict schema: [{field, operator, value}]
    requires_document INTEGER DEFAULT 0
);

-- 3. Job Checklist Master Instance
CREATE TABLE IF NOT EXISTS ae_job_checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER UNIQUE NOT NULL REFERENCES export_jobs(id),
    template_version_id INTEGER REFERENCES ae_checklist_template_versions(id),
    status TEXT DEFAULT 'PENDING CONFIGURATION' 
        CHECK (status IN ('PENDING CONFIGURATION', 'GENERATED')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 4. Job Checklist Items (The Snapshot)
CREATE TABLE IF NOT EXISTS ae_job_checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_checklist_id INTEGER NOT NULL REFERENCES ae_job_checklists(id),
    checklist_item_id INTEGER NOT NULL REFERENCES ae_checklist_items(id),
    
    -- Snapshot fields to prevent historical mutation if template changes
    snap_group_name TEXT NOT NULL,
    snap_item_label TEXT NOT NULL,
    snap_is_required INTEGER NOT NULL,
    snap_applicability_rules JSON,

    status TEXT DEFAULT 'NOT STARTED' 
        CHECK (status IN ('NOT STARTED','IN PROGRESS','WAITING','COMPLETED','NOT APPLICABLE','BLOCKED')),
    
    completed_by_id INTEGER REFERENCES users(id),
    completed_at TEXT,
    remarks TEXT,
    blocked_reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(job_checklist_id, checklist_item_id) -- Ensures Idempotency
);

-- 5. Document Activities
CREATE TABLE IF NOT EXISTS ae_job_document_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES export_jobs(id),
    job_checklist_item_id INTEGER REFERENCES ae_job_checklist_items(id),
    document_type TEXT NOT NULL, -- e.g., 'INVOICE'
    activity TEXT NOT NULL, -- e.g., 'RECEIVED', 'FILED', 'CHECKED'
    status TEXT DEFAULT 'MISSING' 
        CHECK (status IN ('MISSING','RECEIVED','DRAFT','REVISED','FINAL','ORIGINAL','NOT APPLICABLE')),
    completed_by_id INTEGER REFERENCES users(id),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(job_id, document_type, activity)
);

CREATE INDEX IF NOT EXISTS idx_ae_job_chk_job ON ae_job_checklists(job_id);
CREATE INDEX IF NOT EXISTS idx_ae_job_chk_item_job_chk ON ae_job_checklist_items(job_checklist_id);
CREATE INDEX IF NOT EXISTS idx_ae_doc_act_job ON ae_job_document_activities(job_id);
