-- ============================================================
-- MIGRATION 001: Log Schedule Source Ingestion & Export Jobs
-- Scope: AE + AO departments only
-- DOES NOT modify any Import tables or existing AE tables
-- ============================================================

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────
-- 1. SOURCE IMPORTS — Upload/ingestion history
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_code TEXT UNIQUE NOT NULL,               -- e.g. IMP-2026-003
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_kb REAL,
    rows_read INTEGER DEFAULT 0,
    records_new INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_unchanged INTEGER DEFAULT 0,
    records_invalid INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Processing' CHECK (status IN ('Processing','Success','Warning','Failed')),
    error_summary TEXT,                             -- JSON array of validation errors
    uploaded_by_id INTEGER NOT NULL REFERENCES users(id),
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_source_imports_code ON source_imports(import_code);
CREATE INDEX IF NOT EXISTS idx_source_imports_status ON source_imports(status);

-- ─────────────────────────────────────────────────────────────
-- 2. EXPORT JOBS — Internal Job / Shipment identity
--    This is the SINGLE entity that AE and AO both reference.
--    Source-owned fields are updated by source sync.
--    AE/AO-owned fields are preserved during source updates.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS export_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_code TEXT UNIQUE NOT NULL,                   -- e.g. EXP-2026-000124 (immutable)
    business_key TEXT UNIQUE NOT NULL,               -- normalized "INV|NO_BC" (matching key)

    -- ── SOURCE-OWNED FIELDS (updated by source sync, read-only for AE/AO) ──
    customer_code TEXT,
    product_type TEXT,                               -- FG / WR / BP
    invoice_no TEXT,
    pi TEXT,
    buyer TEXT,
    description_goods TEXT,
    destination TEXT,
    destination_country TEXT,
    fwd_trucking TEXT,
    liner TEXT,
    no_bc TEXT,
    container_qty TEXT,
    warehouse TEXT,
    req_trucking TEXT,
    in_date TEXT,
    in_time TEXT,
    data_loading TEXT,
    closing_bki TEXT,
    closing_docs TEXT,
    closing_docs_time TEXT,
    closing_cy TEXT,
    closing_cy_time TEXT,
    initial_etd TEXT,
    etd TEXT,
    eta TEXT,
    vessel TEXT,
    fasilitas_kite TEXT,
    respon TEXT,                                     -- SAFE / PPB (inspection status)
    stacking_terminal TEXT,
    source_pic TEXT,

    -- ── AE-OWNED OPERATIONAL DATA (NEVER overwritten by source sync) ──
    ae_assignee_id INTEGER REFERENCES users(id),
    ae_status TEXT DEFAULT 'Pending' CHECK (ae_status IN (
        'Pending','Assigned','In Progress','Review','Completed','On Hold','Cancelled'
    )),
    ae_progress INTEGER DEFAULT 0,
    ae_checklist TEXT DEFAULT '{}',
    ae_remarks TEXT,
    ae_handover_status TEXT DEFAULT 'Not Started' CHECK (ae_handover_status IN (
        'Not Started','Draft Shared','Final Shared','Completed'
    )),
    ae_handover_at TEXT,

    -- ── AO-OWNED OPERATIONAL DATA (NEVER overwritten by source sync) ──
    ao_assignee_id INTEGER REFERENCES users(id),
    ao_status TEXT DEFAULT 'Pending' CHECK (ao_status IN (
        'Pending','Assigned','In Progress','Verification','Completed','On Hold','Cancelled'
    )),
    ao_progress INTEGER DEFAULT 0,
    ao_checklist TEXT DEFAULT '{}',
    ao_verification_status TEXT DEFAULT 'Not Verified',
    ao_remarks TEXT,
    ao_completion_status TEXT DEFAULT 'Incomplete',

    -- ── METADATA ──
    source TEXT DEFAULT 'log_schedule' CHECK (source IN ('log_schedule','manual')),
    first_import_id INTEGER REFERENCES source_imports(id),
    last_import_id INTEGER REFERENCES source_imports(id),
    created_by_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_code ON export_jobs(job_code);
CREATE INDEX IF NOT EXISTS idx_export_jobs_bkey ON export_jobs(business_key);
CREATE INDEX IF NOT EXISTS idx_export_jobs_ae_assignee ON export_jobs(ae_assignee_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_ao_assignee ON export_jobs(ao_assignee_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_ae_status ON export_jobs(ae_status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_ao_status ON export_jobs(ao_status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_closing_docs ON export_jobs(closing_docs);
CREATE INDEX IF NOT EXISTS idx_export_jobs_etd ON export_jobs(etd);

-- ─────────────────────────────────────────────────────────────
-- 3. SOURCE RECORDS — Raw + normalized source data per import
--    Every import creates new source_records for audit/snapshot.
--    Only the latest record per business_key is ACTIVE.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_import_id INTEGER NOT NULL REFERENCES source_imports(id),
    business_key TEXT NOT NULL,                      -- normalized "INV|NO_BC"
    export_job_id INTEGER REFERENCES export_jobs(id),

    -- RAW SOURCE FIELDS (exact values from Excel)
    raw_customer_code TEXT,
    raw_type TEXT,
    raw_invoice_no TEXT,
    raw_pi TEXT,
    raw_buyer TEXT,
    raw_description_goods TEXT,
    raw_destination TEXT,
    raw_fwd_trucking TEXT,
    raw_liner TEXT,
    raw_no_bc TEXT,
    raw_container_qty TEXT,
    raw_warehouse TEXT,
    raw_req_trucking TEXT,
    raw_in_date TEXT,
    raw_in_time TEXT,
    raw_data_loading TEXT,
    raw_closing_bki TEXT,
    raw_closing_docs TEXT,
    raw_closing_docs_time TEXT,
    raw_closing_cy TEXT,
    raw_closing_cy_time TEXT,
    raw_initial_etd TEXT,
    raw_etd TEXT,
    raw_eta TEXT,
    raw_vessel TEXT,
    raw_fasilitas_kite TEXT,
    raw_respon TEXT,
    raw_stacking_terminal TEXT,
    raw_source_pic TEXT,
    raw_column_p TEXT,                               -- unknown column, preserved as-is

    -- NORMALIZED FIELDS
    norm_destination TEXT,
    norm_destination_country TEXT,
    norm_product_type TEXT,
    norm_respon TEXT,

    -- RECORD METADATA
    source_row_numbers TEXT,                         -- JSON array of Excel row numbers
    is_valid INTEGER DEFAULT 1,
    validation_errors TEXT,                          -- JSON array of error messages
    sync_action TEXT CHECK (sync_action IN ('NEW','UPDATED','UNCHANGED','INVALID')),
    created_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_source_records_import ON source_records(source_import_id);
CREATE INDEX IF NOT EXISTS idx_source_records_bkey ON source_records(business_key);
CREATE INDEX IF NOT EXISTS idx_source_records_job ON source_records(export_job_id);
CREATE INDEX IF NOT EXISTS idx_source_records_action ON source_records(sync_action);

-- ─────────────────────────────────────────────────────────────
-- 4. SOURCE RECORD CHANGES — Field-level change audit trail
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_record_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_record_id INTEGER NOT NULL REFERENCES source_records(id),
    source_import_id INTEGER NOT NULL REFERENCES source_imports(id),
    export_job_id INTEGER REFERENCES export_jobs(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_src_changes_record ON source_record_changes(source_record_id);
CREATE INDEX IF NOT EXISTS idx_src_changes_import ON source_record_changes(source_import_id);
CREATE INDEX IF NOT EXISTS idx_src_changes_job ON source_record_changes(export_job_id);
