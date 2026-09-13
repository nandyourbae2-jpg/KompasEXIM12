-- Phase 2 Migration: Resilient Partial-Source Identity Handling
-- Applied: 2026-09-01
--
-- Adds:
--   source_identity_events  — audit trail for every identity upgrade or review decision
--   match_review_cases      — queue of ambiguous source records awaiting human review

-- ─── source_identity_events ───────────────────────────────────────────────
-- Records every identity change: FALLBACK→STRONG upgrade, MATCH_REVIEW_REQUIRED, RESOLVED.
CREATE TABLE IF NOT EXISTS source_identity_events (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What happened
    action              TEXT NOT NULL
        CHECK (action IN (
            'IDENTITY_UPGRADED',        -- FALLBACK → STRONG automatic upgrade
            'MATCH_REVIEW_REQUIRED',    -- ambiguous, queued for human review
            'MATCH_REVIEW_RESOLVED'     -- human resolved an ambiguous case
        )),

    -- Context of the change
    export_job_id       INTEGER REFERENCES export_jobs(id),
    source_record_id    INTEGER REFERENCES source_records(id),
    source_import_id    INTEGER REFERENCES source_imports(id),

    -- Identity change details
    old_business_key    TEXT,           -- e.g. "INV:10826"
    new_business_key    TEXT,           -- e.g. "10826|JKTG70953500"
    old_identity_strength TEXT,         -- FALLBACK / STRONG / NONE
    new_identity_strength TEXT,         -- FALLBACK / STRONG / NONE

    -- Human-readable reason
    reason              TEXT,

    -- Actor (NULL = system-automatic; set when a human resolves a review)
    actor_user_id       INTEGER REFERENCES users(id),

    -- Related match_review_case (if applicable)
    match_review_case_id INTEGER,       -- FK added after match_review_cases is created

    created_at          TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sie_export_job      ON source_identity_events(export_job_id);
CREATE INDEX IF NOT EXISTS idx_sie_source_record   ON source_identity_events(source_record_id);
CREATE INDEX IF NOT EXISTS idx_sie_import          ON source_identity_events(source_import_id);
CREATE INDEX IF NOT EXISTS idx_sie_action          ON source_identity_events(action);

-- ─── match_review_cases ───────────────────────────────────────────────────
-- Each row represents one ambiguous source record that needs human review.
CREATE TABLE IF NOT EXISTS match_review_cases (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,

    -- The ambiguous incoming source record
    source_record_id    INTEGER NOT NULL REFERENCES source_records(id),
    source_import_id    INTEGER NOT NULL REFERENCES source_imports(id),

    -- Invoice and BC from the incoming source
    incoming_invoice    TEXT,
    incoming_no_bc      TEXT,           -- NULL for FALLBACK records

    -- Why it's ambiguous
    ambiguity_reason    TEXT NOT NULL,  -- e.g. "Multiple jobs share invoice INV:10826"
    candidate_job_ids   TEXT,           -- JSON array of export_jobs.id candidates

    -- Review status
    status              TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
        CHECK (status IN (
            'PENDING_REVIEW',           -- awaiting human decision
            'RESOLVED_MERGED',          -- human chose to merge with a specific job
            'RESOLVED_NEW',             -- human chose to create a new job
            'RESOLVED_IGNORED'          -- human decided to ignore/discard
        )),

    -- Resolution (set when status changes from PENDING_REVIEW)
    resolved_by_user_id INTEGER REFERENCES users(id),
    resolved_job_id     INTEGER REFERENCES export_jobs(id),  -- which job was chosen (for MERGED)
    resolution_notes    TEXT,
    resolved_at         TEXT,

    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mrc_source_record   ON match_review_cases(source_record_id);
CREATE INDEX IF NOT EXISTS idx_mrc_status          ON match_review_cases(status);
CREATE INDEX IF NOT EXISTS idx_mrc_import          ON match_review_cases(source_import_id);
