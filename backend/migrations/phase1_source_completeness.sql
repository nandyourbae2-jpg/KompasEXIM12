-- Phase 1 Migration: Add completeness tracking fields to source_records
-- Applied: 2026-09-01

ALTER TABLE source_records ADD COLUMN completeness TEXT DEFAULT 'INCOMPLETE'
  CHECK (completeness IN ('COMPLETE', 'INCOMPLETE', 'PARTIAL', 'INVALID'));

ALTER TABLE source_records ADD COLUMN identity_strength TEXT DEFAULT 'STRONG'
  CHECK (identity_strength IN ('STRONG', 'FALLBACK', 'NONE'));

CREATE INDEX IF NOT EXISTS idx_source_records_completeness ON source_records(completeness);
