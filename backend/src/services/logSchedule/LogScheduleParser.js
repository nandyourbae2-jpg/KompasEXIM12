/**
 * LogScheduleParser.js
 *
 * Parses Log Schedule Excel files into structured row objects.
 * Uses header-matching (not position-based) to resolve columns.
 *
 * Key behaviors:
 * - Normalizes headers: trims, collapses whitespace/line-breaks, uppercases
 * - Converts Excel serial dates (integers) → "YYYY-MM-DD"
 * - Converts Excel serial times (0 < n < 1 floats) → "HH:MM"
 * - Treats "---" cell values as null (not applicable)
 * - Stores raw_column_p for any unrecognized/blank extra column
 */

const XLSX = require('xlsx');
const fs   = require('fs');
const { COLUMN_MAP, TIME_FIELDS, normalizeHeader } = require('./LogScheduleMapping');

// ─── Excel epoch constants ─────────────────────────────────────────────────
// Excel serial 1 = 1900-01-01, but Excel wrongly treats 1900 as a leap year,
// so we subtract 25569 to get days from Unix epoch (1970-01-01).
const EXCEL_EPOCH_OFFSET = 25569;
const MS_PER_DAY = 86400000;

// Values that mean "not applicable" in the source Excel
const NOT_APPLICABLE_VALUES = new Set(['---', '--', '-', 'N/A', 'NA', 'TBD', 'TBA']);

class LogScheduleParser {

  /**
   * Parse an Excel file at the given path.
   * @param {string} filePath - Absolute path to the .xlsx file
   * @returns {{ rows: object[], headers: string[], unmatchedHeaders: string[], totalRows: number, errors: string[] }}
   */
  static parse(filePath) {
    const errors = [];

    // 1. File existence check
    if (!fs.existsSync(filePath)) {
      return { rows: [], headers: [], unmatchedHeaders: [], totalRows: 0, errors: ['File tidak ditemukan.'] };
    }

    // 2. Read workbook — cellDates:false so all values stay raw (numbers for dates/times)
    let workbook;
    try {
      workbook = XLSX.readFile(filePath, { cellDates: false, raw: true });
    } catch (e) {
      return { rows: [], headers: [], unmatchedHeaders: [], totalRows: 0, errors: [`File bukan Excel yang valid: ${e.message}`] };
    }

    // 3. Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { rows: [], headers: [], unmatchedHeaders: [], totalRows: 0, errors: ['File Excel kosong (tidak ada sheet).'] };
    }

    const sheet = workbook.Sheets[sheetName];

    // 4. Convert to JSON (header row = first row)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rawData.length < 2) {
      return { rows: [], headers: [], unmatchedHeaders: [], totalRows: 0, errors: ['File Excel tidak memiliki data (hanya header atau kosong).'] };
    }

    // 5. Extract + normalize headers
    const rawHeaders       = rawData[0].map(h => String(h || ''));
    const normalizedHeaders = rawHeaders.map(h => normalizeHeader(h));

    // Build set of time field names for fast lookup
    const timeFieldSet = new Set(TIME_FIELDS);

    // 6. Build header → column index mapping
    const headerMapping   = {};   // { internalFieldName: columnIndex }
    const matchedHeaders  = [];
    const unmatchedHeaders = [];
    let unknownColCount   = 0;

    normalizedHeaders.forEach((nh, idx) => {
      if (!nh) {
        // Blank header — try to capture as raw_column_p (first occurrence)
        if (!headerMapping['raw_column_p']) {
          headerMapping['raw_column_p'] = idx;
        }
        return;
      }

      const mapping = COLUMN_MAP[nh];
      if (mapping) {
        if (mapping.ignore) return;
        if (!headerMapping[mapping.field]) {
          headerMapping[mapping.field] = idx;
          matchedHeaders.push(rawHeaders[idx]);
        }
        // Alias duplicate: skip — already mapped
      } else {
        unknownColCount++;
        unmatchedHeaders.push({ header: rawHeaders[idx], index: idx, normalizedHeader: nh, internalField: `raw_column_unknown_${unknownColCount}` });
      }
    });

    // 7. Parse data rows
    const dataRows  = rawData.slice(1);
    const parsedRows = [];
    let lastParentRecord = null;
    let containerIndex = 1;

    dataRows.forEach((row, rowIdx) => {
      // Skip completely empty rows
      const hasData = row.some(cell => cell !== '' && cell !== null && cell !== undefined);
      if (!hasData) return;

      const record = { _excelRow: rowIdx + 2 }; // 1-indexed, +1 for header row

      for (const [fieldName, colIdx] of Object.entries(headerMapping)) {
        const rawCell = row[colIdx];
        record[fieldName] = LogScheduleParser._processCell(rawCell, fieldName, timeFieldSet);
      }

      // Store unmatched column values (for audit purposes)
      for (const uh of unmatchedHeaders) {
        const rawCell = row[uh.index];
        record[uh.internalField] = LogScheduleParser._processCell(rawCell, uh.internalField, timeFieldSet);
      }

      // Forward Fill & Container Child logic
      if (record.raw_invoice_no) {
        // This is a Parent row
        lastParentRecord = record;
        lastParentRecord._childContainers = [];
        containerIndex = 1;
        
        // Add the primary container if present
        const noCont = record.raw_no_container || record.raw_container_qty || '';
        const noBook = record.raw_no_booking || '';
        if (noCont || noBook) {
          lastParentRecord._childContainers.push({
            no_container: noCont,
            no_booking: noBook,
            source_row: record._excelRow
          });
        }
        parsedRows.push(record);
      } else if (lastParentRecord) {
        // This is a child row belonging to the last parent
        // Check if there is container info in this child row
        let noCont = record.raw_no_container || record.raw_container_qty || '';
        let noBook = record.raw_no_booking || '';
        
        // If they just put the container number in the description
        if (!noCont && record.raw_description_goods) {
           noCont = record.raw_description_goods;
        }

        containerIndex++;
        if (!noCont && !noBook) {
           // Fallback auto-generated container name
           noCont = `${lastParentRecord.raw_invoice_no}-BOX-${containerIndex}`;
        }
        
        lastParentRecord._childContainers.push({
          no_container: noCont,
          no_booking: noBook,
          source_row: record._excelRow
        });
        
        // We do NOT push this record to parsedRows, because it's just a child container
        // belonging to the parent record.
      }
    });

    return {
      rows: parsedRows,
      headers: matchedHeaders,
      unmatchedHeaders: unmatchedHeaders.map(u => u.header),
      totalRows: parsedRows.length,
      errors,
    };
  }

  // ─── Cell processing ───────────────────────────────────────────────────

  /**
   * Process a raw cell value:
   *  - null / undefined → ''
   *  - NOT_APPLICABLE_VALUES (e.g. "---") → '' (not null, stored as empty)
   *  - numeric + date field → YYYY-MM-DD string
   *  - numeric + time field → HH:MM string
   *  - numeric + other → raw numeric string
   *  - anything else → trimmed string
   *
   * @param {*}      rawCell    Raw value from sheet_to_json
   * @param {string} fieldName  Internal field name (e.g. 'raw_closing_docs_time')
   * @param {Set}    timeFieldSet  Set of time field names
   * @returns {string}
   */
  static _processCell(rawCell, fieldName, timeFieldSet) {
    if (rawCell === null || rawCell === undefined) return '';

    const strVal = String(rawCell).trim();

    // Treat "not applicable" markers as missing/empty
    if (NOT_APPLICABLE_VALUES.has(strVal.toUpperCase())) return '';

    if (typeof rawCell === 'number') {
      if (timeFieldSet.has(fieldName)) {
        // Time fields: serial fraction 0..1 → HH:MM
        if (rawCell >= 0 && rawCell < 1) {
          return LogScheduleParser._excelSerialToTimeString(rawCell);
        }
        // Fall through: if it's an integer, it might be a date entered in a time column by mistake
        return strVal;
      }

      if (LogScheduleParser._isDateField(fieldName)) {
        // Date fields: integer serial → YYYY-MM-DD
        if (rawCell >= 1) {
          return LogScheduleParser._excelSerialToDateString(rawCell);
        }
        // sub-1 number in a date field — could be a time (leave as-is for validator to flag)
        return strVal;
      }

      // Non-date/time numeric — return as string (e.g. invoice numbers that Excel parsed as numbers)
      return strVal;
    }

    return strVal;
  }

  // ─── Date/Time helpers ─────────────────────────────────────────────────

  static _isDateField(fieldName) {
    const dateFields = new Set([
      'raw_req_trucking', 'raw_in_date', 'raw_data_loading',
      'raw_closing_bki', 'raw_closing_docs', 'raw_closing_cy',
      'raw_initial_etd', 'raw_etd', 'raw_eta',
    ]);
    return dateFields.has(fieldName);
  }

  /**
   * Convert Excel serial date integer to "YYYY-MM-DD".
   * Excel epoch: serial 1 = 1900-01-01 (with the famous 1900-leap-year bug).
   * Unix epoch offset: 25569 days between 1900-01-01 and 1970-01-01.
   * @param {number} serial
   * @returns {string}
   */
  static _excelSerialToDateString(serial) {
    try {
      const utcMs  = (serial - EXCEL_EPOCH_OFFSET) * MS_PER_DAY;
      const date   = new Date(utcMs);
      if (isNaN(date.getTime())) return String(serial);
      // Use UTC components to avoid timezone shifting
      const yyyy = date.getUTCFullYear();
      const mm   = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd   = String(date.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return String(serial);
    }
  }

  /**
   * Convert Excel serial time fraction (0 ≤ n < 1) to "HH:MM".
   * The fraction represents a proportion of 24 hours.
   * e.g. 0.625 = 15:00, 0.4166... = 10:00
   * @param {number} serial
   * @returns {string}
   */
  static _excelSerialToTimeString(serial) {
    try {
      const totalMinutes = Math.round(serial * 24 * 60);
      const hh = Math.floor(totalMinutes / 60) % 24;
      const mm = totalMinutes % 60;
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    } catch {
      return String(serial);
    }
  }

  // ─── Column validation ────────────────────────────────────────────────

  /**
   * Validate that the file has the minimum required columns.
   * @param {string[]} matchedHeaders - Raw header names that were matched
   * @returns {{ valid: boolean, missingColumns: string[] }}
   */
  static validateColumns(matchedHeaders) {
    // Must have at minimum an invoice column.
    // NO BC is important for identity but we allow it to be absent (partial record).
    const normalizedMatched = matchedHeaders.map(h => normalizeHeader(h));
    const hasInvoice = normalizedMatched.some(h => ['INV', 'INVOICE', 'INVOICE NO'].includes(h));

    const missing = [];
    if (!hasInvoice) missing.push('INV / INVOICE');

    return {
      valid: missing.length === 0,
      missingColumns: missing,
    };
  }
}

module.exports = LogScheduleParser;
