DROP TABLE IF EXISTS ae_job_activity_results;
DROP TABLE IF EXISTS ae_job_document_activities;
DROP TABLE IF EXISTS ae_job_document_versions;
DROP TABLE IF EXISTS ae_job_documents;
DROP TABLE IF EXISTS ae_job_operational_data;

CREATE TABLE ae_job_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES export_jobs(id),
  stage_name TEXT NOT NULL,
  document_name TEXT NOT NULL,
  state TEXT DEFAULT 'MISSING' -- MISSING, RECEIVED, DRAFT, FINAL
);

CREATE TABLE ae_job_document_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_document_id INTEGER NOT NULL REFERENCES ae_job_documents(id),
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE ae_job_document_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_document_version_id INTEGER NOT NULL REFERENCES ae_job_document_versions(id),
  activity_name TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING' -- PENDING, COMPLETED, N/A
);

CREATE TABLE ae_job_activity_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_document_activity_id INTEGER NOT NULL REFERENCES ae_job_document_activities(id),
  action_result TEXT, -- PASS, FAIL, DONE
  disposition TEXT, -- NONE, REVISION_REQUIRED, WAITING, BLOCKED
  evidence_payload TEXT,
  catatan TEXT,
  executed_by INTEGER REFERENCES users(id),
  executed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE ae_job_operational_data (
  job_id INTEGER PRIMARY KEY REFERENCES export_jobs(id),
  peb_issuer TEXT,
  draft_final_recipient TEXT,
  bl_mbl TEXT,
  cc_non_cc TEXT,
  coo_form TEXT,
  qc_attend TEXT
);

