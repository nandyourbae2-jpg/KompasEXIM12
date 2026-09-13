-- Phase 12: AO Work Management Architecture Migration
-- Normalizes AO statuses from manual text to strict system-driven workstreams and task states.

PRAGMA foreign_keys = OFF;

-- 1. AO Job Context (Extends export_jobs without mutating frozen AE structure)
CREATE TABLE IF NOT EXISTS ao_job_context (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER UNIQUE NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
    operational_alerts TEXT,
    ds_date TEXT,
    fishing_gear TEXT,
    jml_fv INTEGER,
    total_cont_fcl INTEGER,
    species TEXT,
    catching_method TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. AO Tasks
CREATE TABLE IF NOT EXISTS ao_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
    workstream TEXT NOT NULL CHECK (workstream IN ('DSCS', 'CC', 'COURIER', 'BANK', 'DOC', 'LOGISTICS', 'AO_CORE')),
    task_type TEXT NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES users(id),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'BLOCKED')),
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    due_date TEXT,
    remarks TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 3. AO Task Audits
CREATE TABLE IF NOT EXISTS ao_task_audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES ao_tasks(id) ON DELETE CASCADE,
    actor_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'ASSIGN', 'STATUS_CHANGE', 'UPDATE_DUE_DATE', 'UPDATE')),
    old_value TEXT, -- JSON snapshot
    new_value TEXT, -- JSON snapshot
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_ao_tasks_job ON ao_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_ao_tasks_assignee ON ao_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ao_task_audits_task ON ao_task_audits(task_id);
CREATE INDEX IF NOT EXISTS idx_ao_job_context_job ON ao_job_context(job_id);

PRAGMA foreign_keys = ON;
