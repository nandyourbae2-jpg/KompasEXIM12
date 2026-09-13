/**
 * SourceSyncEngine.js
 *
 * Core engine for Log Schedule source synchronization.
 *
 * Responsibilities:
 * 1. Compare incoming source data with existing records
 * 2. Classify records as NEW / UPDATED / UNCHANGED / INVALID
 * 3. Upsert valid records (source-owned fields only)
 * 4. Preserve AE/AO operational data during updates
 * 5. Log field-level changes
 * 6. Create import history
 * 7. Generate export_jobs for new records
 *
 * Phase 2 additions:
 * 8. FALLBACK → STRONG identity upgrade (no duplicate job creation)
 * 9. Ambiguous FALLBACK detection → MATCH_REVIEW_REQUIRED
 * 10. source_identity_events audit for all identity changes
 */

const db = require('../../database/db');
const { SOURCE_OWNED_EXPORT_JOB_FIELDS } = require('./LogScheduleMapping');

// ─── Business key prefix for FALLBACK identity ────────────────────────────
const FALLBACK_PREFIX = 'INV:';

class SourceSyncEngine {

  /**
   * Execute a full source sync from validated+grouped records.
   *
   * @param {object} params
   * @param {number} params.importId         - source_imports.id
   * @param {Map<string, object>} params.groups  - businessKey → { mergedRow, sourceRowNumbers, businessKey, completeness, identityStrength }
   * @param {object[]} params.invalidRows    - rows that failed validation
   * @param {number} params.userId           - uploading user's id
   * @returns {{ summary: object, details: object[] }}
   */
  static execute({ importId, groups, invalidRows, userId }) {
    const summary = {
      new: 0,
      updated: 0,
      unchanged: 0,
      incomplete: 0,
      invalid: invalidRows.length,
      identity_upgraded: 0,
      match_review_required: 0,
    };
    const details = [];

    // Run entire sync in a transaction for atomicity
    const syncTransaction = db.transaction(() => {

      for (const [businessKey, group] of groups) {
        const { mergedRow, sourceRowNumbers } = group;
        const { completeness = 'INCOMPLETE', identityStrength = 'STRONG' } = group;

        // 1. Create source_record snapshot FIRST (needed for audit refs)
        const sourceRecordId = SourceSyncEngine._insertSourceRecord(
          importId, businessKey, mergedRow, sourceRowNumbers
        );

        // 2. Route through identity resolution
        const resolution = SourceSyncEngine._resolveIdentity(
          businessKey, mergedRow, identityStrength, importId, sourceRecordId, userId
        );

        // 3. Handle MATCH_REVIEW_REQUIRED
        if (resolution.action === 'MATCH_REVIEW_REQUIRED') {
          db.prepare('UPDATE source_records SET sync_action = ?, completeness = ?, identity_strength = ? WHERE id = ?')
            .run('INVALID', completeness, identityStrength, sourceRecordId);

          summary.match_review_required++;
          if (completeness !== 'COMPLETE') summary.incomplete++;
          details.push({
            businessKey,
            action: 'MATCH_REVIEW_REQUIRED',
            reason: resolution.reason,
            candidates: resolution.candidates,
            matchReviewCaseId: resolution.matchReviewCaseId,
            completeness,
            sourceRows: sourceRowNumbers,
          });
          continue;
        }

        // 4. Identity was resolved — get the canonical job
        const { resolvedJobId, resolvedBusinessKey, wasUpgraded, isNew } = resolution;

        if (isNew) {
          // ── NEW RECORD ────────────────────────────────────────────────
          const jobCode = SourceSyncEngine._generateJobCode();
          const jobId   = SourceSyncEngine._createExportJob(
            jobCode, resolvedBusinessKey, mergedRow, importId, userId
          );

          db.prepare('UPDATE source_records SET export_job_id = ?, sync_action = ?, completeness = ?, identity_strength = ? WHERE id = ?')
            .run(jobId, 'NEW', completeness, identityStrength, sourceRecordId);
            
          if (mergedRow._childContainers && mergedRow._childContainers.length > 0) {
            SourceSyncEngine._upsertJobContainers(jobId, mergedRow._childContainers);
          }

          if (completeness !== 'COMPLETE') summary.incomplete++;
          summary.new++;
          details.push({
            businessKey,
            action: 'NEW',
            jobCode,
            jobId,
            completeness,
            identityStrength,
            sourceRows: sourceRowNumbers,
          });

        } else {
          // ── EXISTING JOB FOUND ────────────────────────────────────────
          const existingJob = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(resolvedJobId);

          // If identity was upgraded (FALLBACK → STRONG), rewrite business_key on the job
          if (wasUpgraded) {
            SourceSyncEngine._upgradeJobBusinessKey(
              existingJob, resolvedBusinessKey, mergedRow,
              importId, sourceRecordId, identityStrength
            );
            summary.identity_upgraded++;
          }

          // Detect source-field changes
          const refreshedJob = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(resolvedJobId);
          const changes = SourceSyncEngine._detectChanges(refreshedJob, mergedRow);

          if (changes.length > 0) {
            // ── UPDATED ──────────────────────────────────────────────
            SourceSyncEngine._updateExportJobSourceFields(resolvedJobId, mergedRow, importId);

            for (const change of changes) {
              db.prepare(`
                INSERT INTO source_record_changes
                  (source_record_id, source_import_id, export_job_id, field_name, old_value, new_value)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(sourceRecordId, importId, resolvedJobId, change.field, change.oldValue, change.newValue);
            }

            db.prepare('UPDATE source_records SET export_job_id = ?, sync_action = ?, completeness = ?, identity_strength = ? WHERE id = ?')
              .run(resolvedJobId, 'UPDATED', completeness, identityStrength, sourceRecordId);
              
            if (mergedRow._childContainers && mergedRow._childContainers.length > 0) {
              SourceSyncEngine._upsertJobContainers(resolvedJobId, mergedRow._childContainers);
            }

            if (completeness !== 'COMPLETE') summary.incomplete++;
            summary.updated++;
            details.push({
              businessKey,
              resolvedBusinessKey,
              action: 'UPDATED',
              wasUpgraded,
              jobCode: refreshedJob.job_code,
              jobId: resolvedJobId,
              changes,
              completeness,
              identityStrength,
              sourceRows: sourceRowNumbers,
            });

          } else {
            // ── UNCHANGED ────────────────────────────────────────────
            db.prepare('UPDATE source_records SET export_job_id = ?, sync_action = ?, completeness = ?, identity_strength = ? WHERE id = ?')
              .run(resolvedJobId, 'UNCHANGED', completeness, identityStrength, sourceRecordId);

            db.prepare('UPDATE export_jobs SET last_import_id = ? WHERE id = ?')
              .run(importId, resolvedJobId);
              
            if (mergedRow._childContainers && mergedRow._childContainers.length > 0) {
              SourceSyncEngine._upsertJobContainers(resolvedJobId, mergedRow._childContainers);
            }

            if (completeness !== 'COMPLETE') summary.incomplete++;
            summary.unchanged++;
            details.push({
              businessKey,
              resolvedBusinessKey,
              action: 'UNCHANGED',
              wasUpgraded,
              jobCode: refreshedJob.job_code,
              jobId: resolvedJobId,
              completeness,
              identityStrength,
              sourceRows: sourceRowNumbers,
            });
          }
        }
      }

      // Mark invalid source records
      for (const inv of invalidRows) {
        SourceSyncEngine._insertInvalidSourceRecord(importId, inv);
      }

      // Update import summary
      const totalInvalid = summary.invalid + summary.match_review_required;
      const status = totalInvalid > 0 ? 'Warning' : 'Success';
      db.prepare(`
        UPDATE source_imports SET
          records_new = ?, records_updated = ?, records_unchanged = ?, records_invalid = ?,
          status = ?, error_summary = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(
        summary.new, summary.updated, summary.unchanged, totalInvalid,
        status,
        JSON.stringify({
          incomplete: summary.incomplete,
          identity_upgraded: summary.identity_upgraded,
          match_review_required: summary.match_review_required,
        }),
        importId
      );
    });

    // Execute transaction
    try {
      syncTransaction();
    } catch (error) {
      db.prepare("UPDATE source_imports SET status = 'Failed', error_summary = ?, completed_at = datetime('now') WHERE id = ?")
        .run(JSON.stringify([error.message]), importId);
      throw error;
    }

    return { summary, details };
  }

  // ─── Phase 2: Identity Resolution ─────────────────────────────────────────

  /**
   * Resolve the identity of an incoming source group against existing export_jobs.
   *
   * Logic:
   *  A) businessKey is STRONG (INV|BC):
   *     1. Look up by STRONG key → if found: existing job, UNCHANGED/UPDATED
   *     2. Look up by FALLBACK key (INV:xxx) → if found: UPGRADE opportunity
   *     3. Nothing found → NEW
   *
   *  B) businessKey is FALLBACK (INV:xxx):
   *     1. Look up by exact FALLBACK key → if found: existing job, UNCHANGED/UPDATED
   *     2. Search for STRONG jobs with same invoice → ambiguity check:
   *        - Zero STRONG matches → NEW fallback job
   *        - One STRONG match  → treat as existing (no duplicate; BC not yet known)
   *        - Many STRONG matches → MATCH_REVIEW_REQUIRED
   *
   * Returns:
   *   { action: 'MATCH_REVIEW_REQUIRED', reason, candidates, matchReviewCaseId }
   *   OR
   *   { action: 'RESOLVED', isNew, resolvedJobId, resolvedBusinessKey, wasUpgraded }
   *
   * @param {string} businessKey
   * @param {object} mergedRow
   * @param {string} identityStrength  - 'STRONG' | 'FALLBACK'
   * @param {number} importId
   * @param {number} sourceRecordId
   * @param {number} userId
   */
  static _resolveIdentity(businessKey, mergedRow, identityStrength, importId, sourceRecordId, userId) {
    if (identityStrength === 'STRONG') {
      return SourceSyncEngine._resolveStrongIdentity(businessKey, mergedRow, importId, sourceRecordId, userId);
    } else {
      return SourceSyncEngine._resolveFallbackIdentity(businessKey, mergedRow, importId, sourceRecordId, userId);
    }
  }

  /**
   * Resolve a STRONG (INV|BC) incoming key.
   */
  static _resolveStrongIdentity(businessKey, mergedRow, importId, sourceRecordId, userId) {
    // 1. Direct match by STRONG key
    const directMatch = db.prepare('SELECT id, business_key FROM export_jobs WHERE business_key = ?').get(businessKey);
    if (directMatch) {
      return { action: 'RESOLVED', isNew: false, resolvedJobId: directMatch.id, resolvedBusinessKey: businessKey, wasUpgraded: false };
    }

    // 2. Check if there's a FALLBACK job for the same invoice
    const invoiceNo = String(mergedRow.raw_invoice_no || '').trim();
    if (invoiceNo) {
      const fallbackKey = `${FALLBACK_PREFIX}${invoiceNo}`;
      const fallbackJob = db.prepare('SELECT id, business_key FROM export_jobs WHERE business_key = ?').get(fallbackKey);
      if (fallbackJob) {
        // Upgrade FALLBACK → STRONG
        return {
          action: 'RESOLVED',
          isNew: false,
          resolvedJobId: fallbackJob.id,
          resolvedBusinessKey: businessKey,   // The NEW strong key
          wasUpgraded: true,
          oldBusinessKey: fallbackKey,
        };
      }
    }

    // 3. Genuinely new
    return { action: 'RESOLVED', isNew: true, resolvedBusinessKey: businessKey, wasUpgraded: false };
  }

  /**
   * Resolve a FALLBACK (INV:xxx) incoming key.
   */
  static _resolveFallbackIdentity(businessKey, mergedRow, importId, sourceRecordId, userId) {
    const invoiceNo = String(mergedRow.raw_invoice_no || '').trim();

    // 1. Direct FALLBACK key match (same invoice, still no BC)
    const directFallback = db.prepare('SELECT id, business_key FROM export_jobs WHERE business_key = ?').get(businessKey);
    if (directFallback) {
      return { action: 'RESOLVED', isNew: false, resolvedJobId: directFallback.id, resolvedBusinessKey: businessKey, wasUpgraded: false };
    }

    // 2. Search STRONG keys with same invoice (invoice_no column)
    const strongMatches = db.prepare(
      "SELECT id, business_key, no_bc FROM export_jobs WHERE invoice_no = ? AND business_key NOT LIKE 'INV:%'"
    ).all(invoiceNo);

    if (strongMatches.length === 0) {
      // No prior job at all → create new FALLBACK job
      return { action: 'RESOLVED', isNew: true, resolvedBusinessKey: businessKey, wasUpgraded: false };
    }

    if (strongMatches.length === 1) {
      // Exactly one STRONG job shares this invoice.
      // This is unusual (FALLBACK arriving after STRONG already established).
      // Safe to treat as the same logical shipment — no BC coming in, but match is unambiguous.
      return {
        action: 'RESOLVED',
        isNew: false,
        resolvedJobId: strongMatches[0].id,
        resolvedBusinessKey: strongMatches[0].business_key,
        wasUpgraded: false,
      };
    }

    // Multiple STRONG jobs share this invoice → ambiguous
    const candidates = strongMatches.map(j => ({ jobId: j.id, businessKey: j.business_key, noBc: j.no_bc }));
    const matchReviewCaseId = SourceSyncEngine._createMatchReviewCase({
      sourceRecordId,
      importId,
      incomingInvoice: invoiceNo,
      incomingNoBc: null,
      ambiguityReason: `Multiple existing jobs share invoice "${invoiceNo}": ${candidates.map(c => c.businessKey).join(', ')}`,
      candidateJobIds: candidates.map(c => c.jobId),
    });

    // Log identity event
    SourceSyncEngine._logIdentityEvent({
      action: 'MATCH_REVIEW_REQUIRED',
      exportJobId: null,
      sourceRecordId,
      sourceImportId: importId,
      oldBusinessKey: businessKey,
      newBusinessKey: null,
      oldIdentityStrength: 'FALLBACK',
      newIdentityStrength: null,
      reason: `Ambiguous: ${candidates.length} STRONG jobs share invoice "${invoiceNo}"`,
      actorUserId: null,
      matchReviewCaseId,
    });

    return {
      action: 'MATCH_REVIEW_REQUIRED',
      reason: `Multiple existing jobs share invoice "${invoiceNo}"`,
      candidates,
      matchReviewCaseId,
    };
  }

  /**
   * Upgrade a FALLBACK job's business_key to a STRONG key.
   * Updates business_key, updates source_records references, logs identity event.
   * AE/AO operational state (ae_status, ae_assignee_id, etc.) is UNTOUCHED.
   *
   * @param {object} existingJob      - full export_jobs row
   * @param {string} newBusinessKey   - the STRONG key (INV|BC)
   * @param {object} mergedRow        - incoming source data
   * @param {number} importId
   * @param {number} sourceRecordId
   * @param {string} newIdentityStrength
   */
  static _upgradeJobBusinessKey(existingJob, newBusinessKey, mergedRow, importId, sourceRecordId, newIdentityStrength) {
    const oldBusinessKey = existingJob.business_key;

    // Update the business_key on export_jobs (only key field — NOT AE/AO state)
    db.prepare(`
      UPDATE export_jobs SET
        business_key = ?,
        no_bc = ?,
        last_import_id = ?,
        updated_at = datetime('now'),
        version = version + 1
      WHERE id = ?
    `).run(newBusinessKey, mergedRow.raw_no_bc || null, importId, existingJob.id);

    // Update all existing source_records that used the old business_key to point to new one
    // (business_key column on source_records is for audit reference only — no FK constraint)
    // We do NOT rewrite historical business_key values; we leave them as historical truth.
    // The export_job now has the upgraded key.

    // Log identity upgrade event
    SourceSyncEngine._logIdentityEvent({
      action: 'IDENTITY_UPGRADED',
      exportJobId: existingJob.id,
      sourceRecordId,
      sourceImportId: importId,
      oldBusinessKey,
      newBusinessKey,
      oldIdentityStrength: 'FALLBACK',
      newIdentityStrength: 'STRONG',
      reason: `BC "${mergedRow.raw_no_bc}" received; business key upgraded from FALLBACK to STRONG`,
      actorUserId: null,
      matchReviewCaseId: null,
    });
  }

  // ─── Match Review Case Management ─────────────────────────────────────────

  /**
   * Create a match_review_cases record for ambiguous identity.
   * Returns the new case ID.
   */
  static _createMatchReviewCase({ sourceRecordId, importId, incomingInvoice, incomingNoBc, ambiguityReason, candidateJobIds }) {
    const result = db.prepare(`
      INSERT INTO match_review_cases
        (source_record_id, source_import_id, incoming_invoice, incoming_no_bc, ambiguity_reason, candidate_job_ids)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      sourceRecordId, importId, incomingInvoice, incomingNoBc || null,
      ambiguityReason,
      JSON.stringify(candidateJobIds)
    );
    return result.lastInsertRowid;
  }

  /**
   * Log an identity event to source_identity_events.
   */
  static _logIdentityEvent({ action, exportJobId, sourceRecordId, sourceImportId, oldBusinessKey, newBusinessKey, oldIdentityStrength, newIdentityStrength, reason, actorUserId, matchReviewCaseId }) {
    db.prepare(`
      INSERT INTO source_identity_events
        (action, export_job_id, source_record_id, source_import_id,
         old_business_key, new_business_key,
         old_identity_strength, new_identity_strength,
         reason, actor_user_id, match_review_case_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      action, exportJobId || null, sourceRecordId, sourceImportId,
      oldBusinessKey, newBusinessKey,
      oldIdentityStrength, newIdentityStrength,
      reason, actorUserId || null, matchReviewCaseId || null
    );
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  /**
   * Insert a source_record snapshot for audit.
   */
  static _insertSourceRecord(importId, businessKey, row, sourceRowNumbers) {
    const stmt = db.prepare(`
      INSERT INTO source_records (
        source_import_id, business_key,
        raw_customer_code, raw_type, raw_invoice_no, raw_pi, raw_buyer,
        raw_description_goods, raw_destination, raw_fwd_trucking, raw_liner,
        raw_no_bc, raw_container_qty, raw_warehouse, raw_req_trucking,
        raw_in_date, raw_in_time, raw_data_loading, raw_closing_bki,
        raw_closing_docs, raw_closing_docs_time, raw_closing_cy, raw_closing_cy_time,
        raw_initial_etd, raw_etd, raw_eta, raw_vessel, raw_fasilitas_kite,
        raw_respon, raw_stacking_terminal, raw_source_pic, raw_column_p,
        norm_destination, norm_destination_country, norm_product_type, norm_respon,
        source_row_numbers, is_valid
      ) VALUES (
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, 1
      )
    `);

    const result = stmt.run(
      importId, businessKey,
      row.raw_customer_code || null, row.raw_type || null, row.raw_invoice_no || null,
      row.raw_pi || null, row.raw_buyer || null,
      row.raw_description_goods || null, row.raw_destination || null,
      row.raw_fwd_trucking || null, row.raw_liner || null,
      row.raw_no_bc || null, row.raw_container_qty || null,
      row.raw_warehouse || null, row.raw_req_trucking || null,
      row.raw_in_date || null, row.raw_in_time || null,
      row.raw_data_loading || null, row.raw_closing_bki || null,
      row.raw_closing_docs || null, row.raw_closing_docs_time || null,
      row.raw_closing_cy || null, row.raw_closing_cy_time || null,
      row.raw_initial_etd || null, row.raw_etd || null, row.raw_eta || null,
      row.raw_vessel || null, row.raw_fasilitas_kite || null,
      row.raw_respon || null, row.raw_stacking_terminal || null,
      row.raw_source_pic || null, row.raw_column_p || null,
      row.norm_destination || null, row.norm_destination_country || null,
      row.norm_product_type || null, row.norm_respon || null,
      JSON.stringify(sourceRowNumbers)
    );

    return result.lastInsertRowid;
  }

  /**
   * Insert an invalid source_record for audit.
   */
  static _insertInvalidSourceRecord(importId, invalidRow) {
    const { row, errors } = invalidRow;
    const invoiceNo  = row.raw_invoice_no || '';
    const noBc       = row.raw_no_bc || '';
    const businessKey = invoiceNo && noBc ? `${invoiceNo}|${noBc}` : `INVALID_ROW_${row._excelRow}`;

    const stmt = db.prepare(`
      INSERT INTO source_records (
        source_import_id, business_key,
        raw_customer_code, raw_type, raw_invoice_no, raw_pi, raw_buyer,
        raw_description_goods, raw_destination, raw_fwd_trucking, raw_liner,
        raw_no_bc, raw_container_qty, raw_warehouse,
        source_row_numbers, is_valid, validation_errors, sync_action
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'INVALID')
    `);

    stmt.run(
      importId, businessKey,
      row.raw_customer_code || null, row.raw_type || null, row.raw_invoice_no || null,
      row.raw_pi || null, row.raw_buyer || null,
      row.raw_description_goods || null, row.raw_destination || null,
      row.raw_fwd_trucking || null, row.raw_liner || null,
      row.raw_no_bc || null, row.raw_container_qty || null,
      row.raw_warehouse || null,
      JSON.stringify([invalidRow.excelRow]),
      JSON.stringify(errors.map(e => e.message))
    );
  }

  /**
   * Create a new export_job from source data.
   * AE/AO operational fields start at defaults.
   */
  static _createExportJob(jobCode, businessKey, row, importId, userId) {
    const stmt = db.prepare(`
      INSERT INTO export_jobs (
        job_code, business_key,
        customer_code, product_type, invoice_no, pi, buyer,
        description_goods, destination, destination_country,
        fwd_trucking, liner, no_bc, container_qty, warehouse,
        req_trucking, in_date, in_time, data_loading,
        closing_bki, closing_docs, closing_docs_time,
        closing_cy, closing_cy_time,
        initial_etd, etd, eta, vessel, fasilitas_kite,
        respon, stacking_terminal, source_pic,
        source, first_import_id, last_import_id, created_by_id
      ) VALUES (
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        'log_schedule', ?, ?, ?
      )
    `);

    const result = stmt.run(
      jobCode, businessKey,
      row.raw_customer_code || null,
      row.norm_product_type || row.raw_type || null,
      row.raw_invoice_no || null, row.raw_pi || null, row.raw_buyer || null,
      row.raw_description_goods || null,
      row.norm_destination || row.raw_destination || null,
      row.norm_destination_country || null,
      row.raw_fwd_trucking || null, row.raw_liner || null,
      row.raw_no_bc || null, row.raw_container_qty || null,
      row.raw_warehouse || null,
      row.raw_req_trucking || null, row.raw_in_date || null,
      row.raw_in_time || null, row.raw_data_loading || null,
      row.raw_closing_bki || null, row.raw_closing_docs || null,
      row.raw_closing_docs_time || null,
      row.raw_closing_cy || null, row.raw_closing_cy_time || null,
      row.raw_initial_etd || null, row.raw_etd || null, row.raw_eta || null,
      row.raw_vessel || null, row.raw_fasilitas_kite || null,
      row.norm_respon || row.raw_respon || null,
      row.raw_stacking_terminal || null, row.raw_source_pic || null,
      importId, importId, userId
    );

    return result.lastInsertRowid;
  }

  /**
   * Detect which source-owned fields changed between existing job and incoming data.
   * Returns array of { field, oldValue, newValue }.
   */
  static _detectChanges(existingJob, incomingRow) {
    const changes = [];

    for (const [rawField, jobField] of Object.entries(SOURCE_OWNED_EXPORT_JOB_FIELDS)) {
      const oldValue = existingJob[jobField];
      let newValue   = incomingRow[rawField];

      // Use normalized value if available
      if (rawField === 'raw_destination' && incomingRow.norm_destination) newValue = incomingRow.norm_destination;
      if (rawField === 'raw_type'        && incomingRow.norm_product_type) newValue = incomingRow.norm_product_type;
      if (rawField === 'raw_respon'      && incomingRow.norm_respon)       newValue = incomingRow.norm_respon;

      const oldNorm = (oldValue === null || oldValue === undefined) ? '' : String(oldValue).trim();
      const newNorm = (newValue === null || newValue === undefined) ? '' : String(newValue).trim();

      if (oldNorm !== newNorm) {
        changes.push({ field: jobField, oldValue: oldNorm || null, newValue: newNorm || null });
      }
    }

    // Also check destination_country
    const oldCountry = existingJob.destination_country || '';
    const newCountry = (incomingRow.norm_destination_country || '').trim();
    if (oldCountry !== newCountry) {
      changes.push({ field: 'destination_country', oldValue: oldCountry || null, newValue: newCountry || null });
    }

    return changes;
  }

  /**
   * Update ONLY source-owned fields on an existing export_job.
   * AE/AO operational data (assignee, progress, status, checklist) is UNTOUCHED.
   */
  static _updateExportJobSourceFields(jobId, row, importId) {
    db.prepare(`
      UPDATE export_jobs SET
        customer_code = ?, product_type = ?, invoice_no = ?, pi = ?, buyer = ?,
        description_goods = ?, destination = ?, destination_country = ?,
        fwd_trucking = ?, liner = ?, no_bc = ?, container_qty = ?, warehouse = ?,
        req_trucking = ?, in_date = ?, in_time = ?, data_loading = ?,
        closing_bki = ?, closing_docs = ?, closing_docs_time = ?,
        closing_cy = ?, closing_cy_time = ?,
        initial_etd = ?, etd = ?, eta = ?, vessel = ?, fasilitas_kite = ?,
        respon = ?, stacking_terminal = ?, source_pic = ?,
        last_import_id = ?,
        updated_at = datetime('now'),
        version = version + 1
      WHERE id = ?
    `).run(
      row.raw_customer_code || null,
      row.norm_product_type || row.raw_type || null,
      row.raw_invoice_no || null, row.raw_pi || null, row.raw_buyer || null,
      row.raw_description_goods || null,
      row.norm_destination || row.raw_destination || null,
      row.norm_destination_country || null,
      row.raw_fwd_trucking || null, row.raw_liner || null,
      row.raw_no_bc || null, row.raw_container_qty || null,
      row.raw_warehouse || null,
      row.raw_req_trucking || null, row.raw_in_date || null,
      row.raw_in_time || null, row.raw_data_loading || null,
      row.raw_closing_bki || null, row.raw_closing_docs || null,
      row.raw_closing_docs_time || null,
      row.raw_closing_cy || null, row.raw_closing_cy_time || null,
      row.raw_initial_etd || null, row.raw_etd || null, row.raw_eta || null,
      row.raw_vessel || null, row.raw_fasilitas_kite || null,
      row.norm_respon || row.raw_respon || null,
      row.raw_stacking_terminal || null, row.raw_source_pic || null,
      importId,
      jobId
    );
  }

  /**
   * Generate a unique export job code: EXP-YYYY-NNNNNN
   */
  static _generateJobCode() {
    const year   = new Date().getFullYear();
    const prefix = `EXP-${year}-`;

    const records = db.prepare(
      "SELECT job_code FROM export_jobs WHERE job_code LIKE ?"
    ).all(`${prefix}%`);

    let maxNum = 0;
    for (const record of records) {
      const numStr = record.job_code.replace(prefix, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(6, '0')}`;
  }

  /**
   * Reconstruct a parsed row object from a source_record database row.
   * Useful when we need to run _updateExportJobSourceFields using stored source_record data.
   */
  static _reconstructRowFromSourceRecord(record) {
    return {
      raw_customer_code: record.raw_customer_code,
      raw_type: record.raw_type,
      raw_invoice_no: record.raw_invoice_no,
      raw_pi: record.raw_pi,
      raw_buyer: record.raw_buyer,
      raw_description_goods: record.raw_description_goods,
      raw_destination: record.raw_destination,
      raw_fwd_trucking: record.raw_fwd_trucking,
      raw_liner: record.raw_liner,
      raw_no_bc: record.raw_no_bc,
      raw_container_qty: record.raw_container_qty,
      raw_warehouse: record.raw_warehouse,
      raw_req_trucking: record.raw_req_trucking,
      raw_in_date: record.raw_in_date,
      raw_in_time: record.raw_in_time,
      raw_data_loading: record.raw_data_loading,
      raw_closing_bki: record.raw_closing_bki,
      raw_closing_docs: record.raw_closing_docs,
      raw_closing_docs_time: record.raw_closing_docs_time,
      raw_closing_cy: record.raw_closing_cy,
      raw_closing_cy_time: record.raw_closing_cy_time,
      raw_initial_etd: record.raw_initial_etd,
      raw_etd: record.raw_etd,
      raw_eta: record.raw_eta,
      raw_vessel: record.raw_vessel,
      raw_fasilitas_kite: record.raw_fasilitas_kite,
      raw_respon: record.raw_respon,
      raw_stacking_terminal: record.raw_stacking_terminal,
      raw_source_pic: record.raw_source_pic,
      raw_column_p: record.raw_column_p,
      norm_destination: record.norm_destination,
      norm_destination_country: record.norm_destination_country,
      norm_product_type: record.norm_product_type,
      norm_respon: record.norm_respon
    };
  }

  /**
   * Upsert container rows to job_containers table.
   * We use INSERT OR IGNORE, assuming we want to accumulate all containers over time without deleting them,
   * or we can just clear and insert, but since source row number changes, we insert ignore based on container number.
   */
  static _upsertJobContainers(jobId, containers) {
    for (const cont of containers) {
      if (!cont.no_container && !cont.no_booking) continue;
      
      const exists = db.prepare('SELECT id FROM job_containers WHERE export_job_id = ? AND no_container = ?')
        .get(jobId, cont.no_container);
        
      if (!exists) {
        db.prepare('INSERT INTO job_containers (export_job_id, no_container, no_booking, source_row) VALUES (?, ?, ?, ?)')
          .run(jobId, cont.no_container, cont.no_booking, cont.source_row);
      }
    }
  }
}

module.exports = SourceSyncEngine;
