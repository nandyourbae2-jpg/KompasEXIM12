-- Phase 13: AO Staff Workboard & DSCS Workspace Architecture Migration
-- Extends ao_job_context with full Excel Daily operational fields
-- Source of Truth: KOMPAS EXIM Excel workbooks (UPDATE CHECKLIST DAILY & CHECKLIST DSCS)

PRAGMA foreign_keys = OFF;

-- =============================================================================
-- BAGIAN A: Tambahkan field operasional Excel Daily ke ao_job_context
-- =============================================================================

ALTER TABLE ao_job_context ADD COLUMN operational_status TEXT;
ALTER TABLE ao_job_context ADD COLUMN current_action TEXT;
ALTER TABLE ao_job_context ADD COLUMN pending_docs TEXT;
ALTER TABLE ao_job_context ADD COLUMN remarks TEXT;
ALTER TABLE ao_job_context ADD COLUMN email_draft_date TEXT;
ALTER TABLE ao_job_context ADD COLUMN email_ori_date TEXT;
ALTER TABLE ao_job_context ADD COLUMN cc_due_date TEXT;
ALTER TABLE ao_job_context ADD COLUMN cc_done_date TEXT;
ALTER TABLE ao_job_context ADD COLUMN dscs_due_date TEXT;
ALTER TABLE ao_job_context ADD COLUMN dscs_done_date TEXT;
ALTER TABLE ao_job_context ADD COLUMN dscs_status TEXT DEFAULT 'PREPARATION';
ALTER TABLE ao_job_context ADD COLUMN courier_status TEXT;
ALTER TABLE ao_job_context ADD COLUMN bank_submission_status TEXT;

-- =============================================================================
-- BAGIAN C: Tambah DSCS scope marker ke user Erica
-- =============================================================================
UPDATE users SET personal_notes = 'scope:DSCS' WHERE employee_id = 'DSCS-01';

-- =============================================================================
-- BAGIAN D: Index untuk performa query Staff AO & DSCS
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_ao_tasks_workstream ON ao_tasks(workstream);
CREATE INDEX IF NOT EXISTS idx_handover_events_receiver ON handover_events(receiver_id);
CREATE INDEX IF NOT EXISTS idx_handover_events_status ON handover_events(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_ao_assignee ON export_jobs(ao_assignee_id);

PRAGMA foreign_keys = ON;
