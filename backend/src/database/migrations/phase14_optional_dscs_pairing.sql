-- Phase 14: Optional DSCS Pairing
-- Add dscs_assignee_id to export_jobs to support optional assignment of DSCS PIC (Erica) from Control Tower.

PRAGMA foreign_keys = OFF;

-- Tambahkan kolom dscs_assignee_id ke export_jobs
ALTER TABLE export_jobs ADD COLUMN dscs_assignee_id INTEGER REFERENCES users(id);

-- Index untuk mempercepat query pekerjaan DSCS
CREATE INDEX IF NOT EXISTS idx_export_jobs_dscs_assignee ON export_jobs(dscs_assignee_id);

PRAGMA foreign_keys = ON;
