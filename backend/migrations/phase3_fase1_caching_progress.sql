-- FASE 1: Caching Progress Group di Workboard
ALTER TABLE export_jobs ADD COLUMN job_checklist_group_progress TEXT DEFAULT '{}';
