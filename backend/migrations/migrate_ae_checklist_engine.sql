-- BAGIAN 1: ALTER export_jobs
ALTER TABLE export_jobs ADD COLUMN ae_bl_mbl TEXT;
ALTER TABLE export_jobs ADD COLUMN ae_cc_non_cc TEXT;
ALTER TABLE export_jobs ADD COLUMN ae_coo_form TEXT;
ALTER TABLE export_jobs ADD COLUMN ae_peb_number TEXT;
ALTER TABLE export_jobs ADD COLUMN ae_npe_number TEXT;

-- BAGIAN 2: CHECKLIST TEMPLATE RULES
CREATE TABLE IF NOT EXISTS checklist_template_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES checklist_templates(id),
  field_kondisi TEXT NOT NULL,      -- 'company', 'product', 'qc_attend', dst.
  operator TEXT DEFAULT '=',        -- '=', 'IN', dst.
  nilai_kondisi TEXT NOT NULL,
  prioritas INTEGER DEFAULT 0
);

-- BAGIAN 3: STATE & EXECUTIONS (MODEL EKSEKUSI SEKUENSIAL)
CREATE TABLE IF NOT EXISTS job_checklist_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_job_id INTEGER NOT NULL REFERENCES export_jobs(id),
  item_id INTEGER NOT NULL REFERENCES checklist_items(id),
  current_activity_id INTEGER REFERENCES checklist_activities(id),
  document_state TEXT,       
  handover_status TEXT,      
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_checklist_state_id INTEGER NOT NULL REFERENCES job_checklist_state(id),
  activity_id INTEGER NOT NULL REFERENCES checklist_activities(id),
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  result TEXT,                
  disposition TEXT,           
  remark TEXT,
  evidence_path TEXT,
  actor_id INTEGER REFERENCES users(id),
  executed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS handover_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_job_id INTEGER NOT NULL REFERENCES export_jobs(id),
  handover_type TEXT,
  dokumen_package TEXT,       
  receiver_id INTEGER REFERENCES users(id),
  remark TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ae_assignment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_job_id INTEGER NOT NULL REFERENCES export_jobs(id),
  previous_owner_id INTEGER REFERENCES users(id),
  new_owner_id INTEGER REFERENCES users(id),
  actor_id INTEGER REFERENCES users(id),
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO checklist_template_rules (template_id, field_kondisi, operator, nilai_kondisi, prioritas)
VALUES (1, 'company', '=', 'PBN', 10);
