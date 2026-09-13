/**
 * LogScheduleValidator.js
 *
 * Validates parsed Log Schedule rows:
 * - Mandatory field checks (only invoice_no is truly mandatory)
 * - Date/time format validation (optional fields warn but do NOT fail)
 * - Enum value validation (warns but does NOT fail)
 * - Business key resolution:
 *     - Strong key:   INV|NO_BC  (preferred — prevents duplicate merge risk)
 *     - Fallback key: INV        (if NO BC absent — partial record accepted)
 * - Completeness classification: COMPLETE / INCOMPLETE / PARTIAL / INVALID
 *
 * CRITICAL DESIGN RULES:
 *   - Missing closing_docs, etd, eta → NOT invalid. Accepted as INCOMPLETE.
 *   - Missing no_bc → fallback to invoice-only key. Accepted as PARTIAL.
 *   - Only truly un-usable records (e.g. no invoice) → INVALID.
 *   - "---" values are already normalized to '' by the parser.
 */

const { MANDATORY_FIELDS, DATE_FIELDS, TIME_FIELDS, COLUMN_MAP } = require('./LogScheduleMapping');

// ─── Fields that are operationally critical (affects urgency & AE work) ────
const CRITICAL_SCHEDULE_FIELDS = [
  'raw_closing_docs', 'raw_closing_docs_time',
  'raw_etd', 'raw_eta', 'raw_vessel',
];

class LogScheduleValidator {

  /**
   * Validate a single parsed row.
   *
   * @param {object} row - Parsed row object with raw_* fields and _excelRow
   * @returns {{
   *   valid: boolean,
   *   completeness: 'COMPLETE' | 'INCOMPLETE' | 'PARTIAL' | 'INVALID',
   *   errors: Array<{field: string, message: string, severity?: 'warning' | 'info'}>,
   *   businessKey: string | null,
   *   identityStrength: 'STRONG' | 'FALLBACK' | 'NONE'
   * }}
   */
  static validateRow(row) {
    const errors  = [];
    const excelRow = row._excelRow;

    // ── 1. Mandatory field checks (hard failures) ──────────────────────────
    for (const field of MANDATORY_FIELDS) {
      const value = row[field];
      if (!value || String(value).trim() === '') {
        errors.push({
          field,
          severity: 'error',
          message: `Row ${excelRow}: Field "${LogScheduleValidator._fieldToLabel(field)}" wajib diisi.`,
        });
      }
    }

    // Hard failure — cannot proceed without invoice
    const hardErrors = errors.filter(e => !e.severity || e.severity === 'error');
    if (hardErrors.length > 0) {
      return {
        valid: false,
        completeness: 'INVALID',
        errors,
        businessKey: null,
        identityStrength: 'NONE',
      };
    }

    // ── 2. Business key resolution ─────────────────────────────────────────
    const invoiceNo = String(row.raw_invoice_no || '').trim();
    const noBc      = String(row.raw_no_bc || '').trim();

    let businessKey     = null;
    let identityStrength;

    if (invoiceNo && noBc) {
      businessKey      = `${invoiceNo}|${noBc}`;
      identityStrength = 'STRONG';
    } else if (invoiceNo) {
      // Partial record — NO BC not yet available from source
      businessKey      = `INV:${invoiceNo}`;
      identityStrength = 'FALLBACK';
      errors.push({
        field: 'raw_no_bc',
        severity: 'info',
        message: `Row ${excelRow}: NO BC tidak tersedia. Business key menggunakan Invoice saja (${invoiceNo}). Record diterima sebagai PARTIAL.`,
      });
    } else {
      return {
        valid: false,
        completeness: 'INVALID',
        errors,
        businessKey: null,
        identityStrength: 'NONE',
      };
    }

    // ── 3. Date format validation (optional fields — warning only) ─────────
    for (const field of DATE_FIELDS) {
      const value = row[field];
      if (value && String(value).trim() !== '') {
        if (!LogScheduleValidator._isValidDate(value)) {
          errors.push({
            field,
            severity: 'warning',
            message: `Row ${excelRow}: Field "${LogScheduleValidator._fieldToLabel(field)}" format tanggal tidak dikenal: "${value}". Data tetap disimpan.`,
          });
        }
      }
    }

    // ── 4. Time format validation (optional fields — warning only) ─────────
    for (const field of TIME_FIELDS) {
      const value = row[field];
      if (value && String(value).trim() !== '') {
        if (!LogScheduleValidator._isValidTime(value)) {
          errors.push({
            field,
            severity: 'warning',
            message: `Row ${excelRow}: Field "${LogScheduleValidator._fieldToLabel(field)}" format waktu tidak dikenal: "${value}". Data tetap disimpan.`,
          });
        }
      }
    }

    // ── 5. Enum value validation (warning only — don't reject) ────────────
    const enumMappings = Object.values(COLUMN_MAP).filter(v => v.enumValues && v.field);
    for (const mapping of enumMappings) {
      const value = row[mapping.field];
      if (value && String(value).trim() !== '') {
        const normalized = String(value).trim().toUpperCase();
        if (!mapping.enumValues.includes(normalized)) {
          errors.push({
            field: mapping.field,
            severity: 'warning',
            message: `Row ${excelRow}: Field "${LogScheduleValidator._fieldToLabel(mapping.field)}" = "${value}" bukan nilai yang dikenal (${mapping.enumValues.join(', ')}). Data tetap disimpan.`,
          });
        }
      }
    }

    // ── 6. Completeness classification ────────────────────────────────────
    const missingCritical = CRITICAL_SCHEDULE_FIELDS.filter(f => {
      const v = row[f];
      return !v || String(v).trim() === '';
    });

    let completeness;
    if (identityStrength === 'FALLBACK') {
      completeness = 'PARTIAL';          // Missing NO BC — structurally partial
    } else if (missingCritical.length === 0) {
      completeness = 'COMPLETE';         // All critical schedule fields present
    } else if (missingCritical.length < CRITICAL_SCHEDULE_FIELDS.length) {
      completeness = 'INCOMPLETE';       // Some critical fields missing but not all
    } else {
      completeness = 'INCOMPLETE';       // All critical schedule fields absent (e.g. first import)
    }

    return {
      valid: true,
      completeness,
      errors,
      businessKey,
      identityStrength,
    };
  }

  /**
   * Validate and group all rows by business key.
   * Multiple rows with the same business key are grouped into one logical record.
   *
   * @param {object[]} rows
   * @returns {{ groups: Map<string, object>, invalidRows: object[], allErrors: object[] }}
   */
  static validateAndGroup(rows) {
    const groups     = new Map();  // businessKey → { mergedRow, sourceRowNumbers, businessKey, completeness, identityStrength }
    const invalidRows = [];
    const allErrors  = [];

    for (const row of rows) {
      const { valid, errors, businessKey, completeness, identityStrength } = LogScheduleValidator.validateRow(row);
      allErrors.push(...errors);

      if (!valid || !businessKey) {
        invalidRows.push({
          excelRow: row._excelRow,
          errors:   errors.filter(e => e.severity === 'error' || !e.severity),
          row,
        });
        continue;
      }

      if (groups.has(businessKey)) {
        const existing = groups.get(businessKey);
        existing.sourceRowNumbers.push(row._excelRow);
        // Merge: take latest non-empty value; completeness upgrades (INCOMPLETE → COMPLETE)
        LogScheduleValidator._mergeRow(existing.mergedRow, row);
        if (completeness === 'COMPLETE') existing.completeness = 'COMPLETE';
        else if (completeness === 'INCOMPLETE' && existing.completeness === 'PARTIAL') existing.completeness = 'INCOMPLETE';
      } else {
        groups.set(businessKey, {
          mergedRow: { ...row },
          sourceRowNumbers: [row._excelRow],
          businessKey,
          completeness,
          identityStrength,
        });
      }
    }

    return { groups, invalidRows, allErrors };
  }

  /**
   * Merge a new row's values into an existing merged row.
   * Strategy: use the latest non-empty value (source updates complete partial data).
   */
  static _mergeRow(target, source) {
    for (const [key, value] of Object.entries(source)) {
      if (key === '_excelRow') continue;
      if (key === '_childContainers') {
        if (!target._childContainers) target._childContainers = [];
        if (Array.isArray(value)) target._childContainers.push(...value);
        continue;
      }
      if (value && String(value).trim() !== '') {
        target[key] = value;
      }
    }
  }

  /**
   * Normalize source data for storage (add norm_* fields).
   * @param {object} row
   * @returns {object}
   */
  static normalizeRow(row) {
    const normalized = { ...row };

    // Destination: "VIGO, SPAIN" → norm_destination="VIGO", norm_destination_country="SPAIN"
    if (row.raw_destination) {
      const parts = String(row.raw_destination).split(',').map(s => s.trim());
      normalized.norm_destination         = parts[0] || row.raw_destination;
      normalized.norm_destination_country = parts.length > 1 ? parts[parts.length - 1] : null;
    }

    // Product type
    if (row.raw_type) {
      normalized.norm_product_type = String(row.raw_type).trim().toUpperCase();
    }

    // Respon
    if (row.raw_respon) {
      normalized.norm_respon = String(row.raw_respon).trim().toUpperCase();
    }

    return normalized;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  static _isValidDate(value) {
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return true;                   // YYYY-MM-DD ✓
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(str)) return true;  // DD/MM/YYYY variants ✓
    if (/^\d{1,2}\s+\w{3,}\s+\d{4}$/.test(str)) return true;            // 05 Sep 2026 ✓
    if (/^\d{1,2}-\w{3}-\d{2,4}$/.test(str)) return true;               // 05-Sep-26 ✓
    const d = new Date(str);
    return !isNaN(d.getTime());
  }

  static _isValidTime(value) {
    const str = String(value).trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) return true;    // HH:MM or HH:MM:SS ✓
    if (/^\d{1,2}\.\d{2}$/.test(str)) return true;             // HH.MM ✓
    return false;
  }

  static _fieldToLabel(fieldName) {
    return fieldName
      .replace(/^raw_/, '')
      .replace(/^norm_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}

module.exports = LogScheduleValidator;
