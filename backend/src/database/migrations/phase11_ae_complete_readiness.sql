-- Phase 11: Complete AE Readiness Migration
-- Consolidates all AE operational tables and indexes to ensure single source of truth & complete reproducibility

-- 1. Normalized Document, Version, Activity & Result Tables
DROP TABLE IF EXISTS ae_job_activity_results;
DROP TABLE IF EXISTS ae_job_document_activities;
DROP TABLE IF EXISTS ae_job_document_versions;
DROP TABLE IF EXISTS ae_job_documents;

CREATE TABLE ae_job_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  document_name TEXT NOT NULL,
  state TEXT DEFAULT 'MISSING'
);

CREATE TABLE ae_job_document_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_document_id INTEGER NOT NULL REFERENCES ae_job_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_job_document_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_document_version_id INTEGER NOT NULL REFERENCES ae_job_document_versions(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS ae_job_activity_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_document_activity_id INTEGER NOT NULL REFERENCES ae_job_document_activities(id) ON DELETE CASCADE,
  action_result TEXT,
  disposition TEXT,
  evidence_payload TEXT,
  catatan TEXT,
  executed_by INTEGER REFERENCES users(id),
  executed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_job_operational_data (
  job_id INTEGER PRIMARY KEY REFERENCES export_jobs(id) ON DELETE CASCADE,
  peb_issuer TEXT,
  draft_final_recipient TEXT,
  bl_mbl TEXT,
  cc_non_cc TEXT,
  coo_form TEXT,
  qc_attend TEXT
);

-- 2. Operational Workboard Tables
CREATE TABLE IF NOT EXISTS ae_job_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES export_jobs(id) ON DELETE CASCADE,
  assigned_to_user_id INTEGER REFERENCES users(id),
  assigned_by_user_id INTEGER REFERENCES users(id),
  status TEXT,
  remark TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_job_remarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  remark TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_handovers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
  handover_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS ae_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  audit_log_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_containers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_job_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
  no_container TEXT NOT NULL,
  no_booking TEXT,
  source_row INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 3. Normalized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ae_job_assignments_job ON ae_job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_ae_job_remarks_job ON ae_job_remarks(job_id);
CREATE INDEX IF NOT EXISTS idx_ae_handovers_job ON ae_handovers(job_id);
CREATE INDEX IF NOT EXISTS idx_ae_job_blockers_job ON ae_job_blockers(job_id);
CREATE INDEX IF NOT EXISTS idx_ae_job_docs_job ON ae_job_documents(job_id);
CREATE INDEX IF NOT EXISTS idx_ae_job_doc_vers_doc ON ae_job_document_versions(job_document_id);
CREATE INDEX IF NOT EXISTS idx_ae_job_doc_acts_ver ON ae_job_document_activities(job_document_version_id);
CREATE INDEX IF NOT EXISTS idx_ae_job_act_res_act ON ae_job_activity_results(job_document_activity_id);
CREATE INDEX IF NOT EXISTS idx_job_containers_job ON job_containers(export_job_id);
