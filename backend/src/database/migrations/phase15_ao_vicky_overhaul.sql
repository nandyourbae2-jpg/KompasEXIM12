-- Phase 15: AO Vicky Overhaul — Modernisasi Tahapan Dokumen, Terms, ATD, Completed Vault
-- =====================================================================================

-- 1. Tambah kolom ATD pada export_jobs (jika belum ada dari Import module)
ALTER TABLE export_jobs ADD COLUMN atd TEXT;

-- 2. Tambah kolom-kolom baru pada ao_job_context
-- Tanggal keberangkatan aktual (AO-level tracking)
ALTER TABLE ao_job_context ADD COLUMN atd TEXT;

-- Tanggal estimasi tiba terkini (diisi mandiri oleh Staf AO)
ALTER TABLE ao_job_context ADD COLUMN eta_update TEXT;

-- Setting Terms dari SO (di-set oleh Ka Vicky saat pairing)
ALTER TABLE ao_job_context ADD COLUMN terms_incoterm TEXT;
ALTER TABLE ao_job_context ADD COLUMN terms_payment TEXT;

-- Tahapan dokumen utama (5 tahap + COMPLETED)
-- Values: PREPARATION, DRAFT, FINAL_DRAFT, ORIGINAL, SUBMIT_BANK, COMPLETED
ALTER TABLE ao_job_context ADD COLUMN document_stage TEXT DEFAULT 'PREPARATION';

-- JSON checklist dokumen dinamis (AE, PPJK, Pabrik, Fishery, Others)
ALTER TABLE ao_job_context ADD COLUMN document_checklists TEXT DEFAULT '[]';

-- Timestamp penyelesaian shipment
ALTER TABLE ao_job_context ADD COLUMN completed_at TEXT;
ALTER TABLE ao_job_context ADD COLUMN completed_by_id INTEGER REFERENCES users(id);

-- 3. Indeks performa
CREATE INDEX IF NOT EXISTS idx_ao_job_context_stage ON ao_job_context(document_stage);
CREATE INDEX IF NOT EXISTS idx_export_jobs_atd ON export_jobs(atd);
