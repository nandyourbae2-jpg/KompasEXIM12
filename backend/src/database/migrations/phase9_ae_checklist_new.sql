-- Template checklist per kombinasi Company + Product
CREATE TABLE IF NOT EXISTS checklist_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_template TEXT NOT NULL,        -- 'PBN (LOIN)', 'SAMICO', 'PSB', dst.
  company TEXT NOT NULL,              -- 'PBN', 'PSB', 'PSFI', 'SAMICO'
  product TEXT,                       -- 'LOIN', 'GENOA ONLY', 'FLAKES', 'WR', 'FM', 'POUCH', 'FO', 'FE', NULL
  versi TEXT DEFAULT 'v2026.1',       
  aktif BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checklist_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES checklist_templates(id),
  nama_group TEXT NOT NULL,           
  urutan INTEGER,
  kondisi_final_data TEXT             
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES checklist_groups(id),
  nama_item TEXT NOT NULL,            
  urutan INTEGER
);

CREATE TABLE IF NOT EXISTS checklist_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES checklist_groups(id),
  nama_aktivitas TEXT NOT NULL,       
  urutan INTEGER
);

-- Matrix applicability: item x aktivitas mana yang berlaku (bukan '---')
CREATE TABLE IF NOT EXISTS checklist_item_activity_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES checklist_items(id),
  activity_id INTEGER NOT NULL REFERENCES checklist_activities(id),
  berlaku BOOLEAN DEFAULT 1           
);

-- Actual tracking per job 
CREATE TABLE IF NOT EXISTS job_checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_job_id INTEGER NOT NULL REFERENCES export_jobs(id),  
  item_id INTEGER NOT NULL REFERENCES checklist_items(id),
  activity_id INTEGER NOT NULL REFERENCES checklist_activities(id),
  completed_at TEXT,                  
  completed_by_id INTEGER REFERENCES users(id),
  catatan TEXT,
  evidence_payload TEXT,
  peb_issuer TEXT,
  draft_final_recipient TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Supervisor Control Tower milestone
CREATE TABLE IF NOT EXISTS ae_supervisor_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_job_id INTEGER NOT NULL REFERENCES export_jobs(id),
  milestone_key TEXT NOT NULL,        
  completed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
