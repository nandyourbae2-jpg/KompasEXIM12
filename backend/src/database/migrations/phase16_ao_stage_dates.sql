-- Phase 16: AO Stages Date Tracking
-- Adds detailed dates for each of the 5 document stages

ALTER TABLE ao_job_context ADD COLUMN telex_date TEXT;
ALTER TABLE ao_job_context ADD COLUMN courier_date TEXT;
ALTER TABLE ao_job_context ADD COLUMN submit_bank_date TEXT;
