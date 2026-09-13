/**
 * LogScheduleMapping.js
 *
 * Column mapping configuration for Log Schedule Excel → internal field names.
 * Maps Excel headers to raw source field names and defines validation rules.
 *
 * IMPORTANT: This uses header-matching (not position-based) to handle
 * column order changes in the source Excel.
 *
 * Header normalization applied before lookup:
 *   - Trim leading/trailing whitespace
 *   - Collapse all internal whitespace sequences (including \r\n, \n) to a single space
 *   - Uppercase
 * This allows "CLOSING\r\nDOC", "CLOSING \r\nCY", "Closing Docs", etc. to all resolve correctly.
 */

// ─── Excel Header → Internal Field Name Mapping ───────────────────────────
// Keys are NORMALIZED Excel headers (trimmed, whitespace-collapsed, uppercased).
// Values are the raw_* field names used in source_records.
const COLUMN_MAP = {
  // ── Row counter ─────────────────────────────────────────────────────────
  'NO':                    { field: null, ignore: true },

  // ── Customer / Product ──────────────────────────────────────────────────
  'CUSTOMER CODE':         { field: 'raw_customer_code',      mandatory: false },
  'CUST CODE':             { field: 'raw_customer_code',      mandatory: false },  // Alias (real file)
  'CUST':                  { field: 'raw_customer_code',      mandatory: false },  // Short alias

  'TYPE':                  { field: 'raw_type',               mandatory: false, enumValues: ['FG', 'WR', 'BP'] },

  // ── Invoice / Identity ──────────────────────────────────────────────────
  'INV':                   { field: 'raw_invoice_no',         mandatory: true,  isIdentity: true },
  'INVOICE':               { field: 'raw_invoice_no',         mandatory: true,  isIdentity: true },
  'INVOICE NO':            { field: 'raw_invoice_no',         mandatory: true,  isIdentity: true },

  'PI':                    { field: 'raw_pi',                 mandatory: false },

  // ── Buyer / Description / Destination ──────────────────────────────────
  'BUYER':                 { field: 'raw_buyer',              mandatory: false },

  'DESCRIPTION GOODS':     { field: 'raw_description_goods',  mandatory: false },
  'DESCRP':                { field: 'raw_description_goods',  mandatory: false },  // Real file alias
  'DESCRIPTION':           { field: 'raw_description_goods',  mandatory: false },
  'DESC':                  { field: 'raw_description_goods',  mandatory: false },

  'DESTINATION':           { field: 'raw_destination',        mandatory: false },
  'TUJUAN':                { field: 'raw_destination',        mandatory: false },  // Real file alias (Indonesian)
  'DEST':                  { field: 'raw_destination',        mandatory: false },

  // ── Forwarder / Liner ───────────────────────────────────────────────────
  'FWD/TRUCKING':          { field: 'raw_fwd_trucking',       mandatory: false },
  'FWD / TRUCKING':        { field: 'raw_fwd_trucking',       mandatory: false },
  'FWD':                   { field: 'raw_fwd_trucking',       mandatory: false },
  'FORWARDER':             { field: 'raw_fwd_trucking',       mandatory: false },

  'LINER':                 { field: 'raw_liner',              mandatory: false },

  // ── BC / Container / Warehouse ──────────────────────────────────────────
  'NO BC':                 { field: 'raw_no_bc',              mandatory: true,  isIdentity: true },
  'NO. BC':                { field: 'raw_no_bc',              mandatory: true,  isIdentity: true },
  'NO.BC':                 { field: 'raw_no_bc',              mandatory: true,  isIdentity: true },

  'CONTAINER/QTY':         { field: 'raw_container_qty',      mandatory: false },
  'CONTAINER / QTY':       { field: 'raw_container_qty',      mandatory: false },
  'CONT':                  { field: 'raw_container_qty',      mandatory: false },  // Real file alias
  'CONTAINER':             { field: 'raw_container_qty',      mandatory: false },
  'QTY':                   { field: 'raw_container_qty',      mandatory: false },

  'NO CONTAINER':          { field: 'raw_no_container',       mandatory: false },
  'NO CONT':               { field: 'raw_no_container',       mandatory: false },
  'NO BOOKING':            { field: 'raw_no_booking',         mandatory: false },
  'BOOKING NO':            { field: 'raw_no_booking',         mandatory: false },


  'WAREHOUSE':             { field: 'raw_warehouse',          mandatory: false },
  'WH':                    { field: 'raw_warehouse',          mandatory: false },  // Real file alias

  // ── Trucking / IN dates ─────────────────────────────────────────────────
  'REQ TRUCKING':          { field: 'raw_req_trucking',       mandatory: false, dateField: true },
  'REQUEST TRUCKING':      { field: 'raw_req_trucking',       mandatory: false, dateField: true },
  'REQUEST TRUCK':         { field: 'raw_req_trucking',       mandatory: false, dateField: true },

  'IN':                    { field: 'raw_in_date',            mandatory: false, dateField: true },
  'IN DATE':               { field: 'raw_in_date',            mandatory: false, dateField: true },

  'TIME':                  { field: 'raw_in_time',            mandatory: false, timeField: true },  // IN TIME col header
  'IN TIME':               { field: 'raw_in_time',            mandatory: false, timeField: true },

  // ── Loading ─────────────────────────────────────────────────────────────
  'DATA LOADING':          { field: 'raw_data_loading',       mandatory: false, dateField: true },

  // ── Closing dates ───────────────────────────────────────────────────────
  // NOTE: Real Excel uses "CLOSING\r\nBKI", which normalizes → "CLOSING BKI"
  'CLOSING BKI':           { field: 'raw_closing_bki',        mandatory: false, dateField: true },
  'CLOSING BKI DATE':      { field: 'raw_closing_bki',        mandatory: false, dateField: true },

  // Real Excel uses "CLOSING\r\nDOC" → "CLOSING DOC"
  'CLOSING DOC':           { field: 'raw_closing_docs',       mandatory: false, dateField: true },
  'CLOSING DOCS':          { field: 'raw_closing_docs',       mandatory: false, dateField: true },
  'CLOSING DOCUMENT':      { field: 'raw_closing_docs',       mandatory: false, dateField: true },
  'CLOSING DOCUMENTS':     { field: 'raw_closing_docs',       mandatory: false, dateField: true },

  // Time for closing docs (column header "TIME DOC" in real file)
  'TIME DOC':              { field: 'raw_closing_docs_time',  mandatory: false, timeField: true },
  'TIME DOCS':             { field: 'raw_closing_docs_time',  mandatory: false, timeField: true },
  'CLOSING DOC TIME':      { field: 'raw_closing_docs_time',  mandatory: false, timeField: true },
  'CLOSING DOCS TIME':     { field: 'raw_closing_docs_time',  mandatory: false, timeField: true },

  // Real Excel uses "CLOSING \r\nCY" → "CLOSING CY" (trailing space before \r\n is collapsed)
  'CLOSING CY':            { field: 'raw_closing_cy',         mandatory: false, dateField: true },
  'CLOSING CY DATE':       { field: 'raw_closing_cy',         mandatory: false, dateField: true },

  // Time for closing CY (column header "TIME CY" in real file)
  'TIME CY':               { field: 'raw_closing_cy_time',    mandatory: false, timeField: true },
  'CLOSING CY TIME':       { field: 'raw_closing_cy_time',    mandatory: false, timeField: true },

  // ── ETD / ETA / Vessel ──────────────────────────────────────────────────
  'INITIAL ETD':           { field: 'raw_initial_etd',        mandatory: false, dateField: true },
  'INITIAL ETD DATE':      { field: 'raw_initial_etd',        mandatory: false, dateField: true },

  'ETD':                   { field: 'raw_etd',                mandatory: false, dateField: true },
  'ETD DATE':              { field: 'raw_etd',                mandatory: false, dateField: true },

  'ETA':                   { field: 'raw_eta',                mandatory: false, dateField: true },
  'ETA DATE':              { field: 'raw_eta',                mandatory: false, dateField: true },

  'VESSEL':                { field: 'raw_vessel',             mandatory: false },
  'VESSEL NAME':           { field: 'raw_vessel',             mandatory: false },
  'KAPAL':                 { field: 'raw_vessel',             mandatory: false },

  // ── KITE / RESPON / Stacking ─────────────────────────────────────────────
  'FASILITAS KITE':        { field: 'raw_fasilitas_kite',     mandatory: false },
  'KITE':                  { field: 'raw_fasilitas_kite',     mandatory: false },
  'FASILITAS':             { field: 'raw_fasilitas_kite',     mandatory: false },

  'RESPON':                { field: 'raw_respon',             mandatory: false, enumValues: ['SAFE', 'PPB'] },
  'RESPONSE':              { field: 'raw_respon',             mandatory: false, enumValues: ['SAFE', 'PPB'] },

  'STACKING':              { field: 'raw_stacking_terminal',  mandatory: false },
  'STACKING TERMINAL':     { field: 'raw_stacking_terminal',  mandatory: false },
  'STACKING TERM':         { field: 'raw_stacking_terminal',  mandatory: false },
  'TERMINAL':              { field: 'raw_stacking_terminal',  mandatory: false },

  // ── Source PIC ──────────────────────────────────────────────────────────
  'PIC':                   { field: 'raw_source_pic',         mandatory: false },
  'SOURCE PIC':            { field: 'raw_source_pic',         mandatory: false },
};

// ─── Identity Fields (used to build business key) ──────────────────────────
const IDENTITY_FIELDS = ['raw_invoice_no', 'raw_no_bc'];

// ─── Mandatory Fields ──────────────────────────────────────────────────────
// Only INV is strictly mandatory. NO BC is identity but allowed to be absent
// in the first import of a partial record (will yield invoice-only business key).
const MANDATORY_FIELDS = ['raw_invoice_no'];

// ─── Date/Time Fields ──────────────────────────────────────────────────────
const DATE_FIELDS = Object.values(COLUMN_MAP)
  .filter(v => v.dateField)
  .map(v => v.field)
  .filter((v, i, a) => v && a.indexOf(v) === i);  // unique, non-null

const TIME_FIELDS = Object.values(COLUMN_MAP)
  .filter(v => v.timeField)
  .map(v => v.field)
  .filter((v, i, a) => v && a.indexOf(v) === i);  // unique, non-null

// ─── Source-Owned Fields (fields that get synced to export_jobs) ────────────
const SOURCE_OWNED_EXPORT_JOB_FIELDS = {
  raw_customer_code:      'customer_code',
  raw_type:               'product_type',
  raw_invoice_no:         'invoice_no',
  raw_pi:                 'pi',
  raw_buyer:              'buyer',
  raw_description_goods:  'description_goods',
  raw_destination:        'destination',
  raw_fwd_trucking:       'fwd_trucking',
  raw_liner:              'liner',
  raw_no_bc:              'no_bc',
  raw_container_qty:      'container_qty',
  raw_warehouse:          'warehouse',
  raw_req_trucking:       'req_trucking',
  raw_in_date:            'in_date',
  raw_in_time:            'in_time',
  raw_data_loading:       'data_loading',
  raw_closing_bki:        'closing_bki',
  raw_closing_docs:       'closing_docs',
  raw_closing_docs_time:  'closing_docs_time',
  raw_closing_cy:         'closing_cy',
  raw_closing_cy_time:    'closing_cy_time',
  raw_initial_etd:        'initial_etd',
  raw_etd:                'etd',
  raw_eta:                'eta',
  raw_vessel:             'vessel',
  raw_fasilitas_kite:     'fasilitas_kite',
  raw_respon:             'respon',
  raw_stacking_terminal:  'stacking_terminal',
  raw_source_pic:         'source_pic',
};

// Normalized fields that also go to export_jobs
const NORMALIZED_EXPORT_JOB_FIELDS = {
  norm_destination:         'destination',       // overwrites raw if normalized
  norm_destination_country: 'destination_country',
  norm_product_type:        'product_type',
  norm_respon:              'respon',
};

// ─── Header Normalization Function ─────────────────────────────────────────
/**
 * Normalize an Excel header string for COLUMN_MAP lookup.
 * Handles: line breaks (\r\n, \n, \r), tabs, multiple spaces, leading/trailing whitespace, casing.
 * @param {string} rawHeader
 * @returns {string} Normalized uppercase header string
 */
function normalizeHeader(rawHeader) {
  return String(rawHeader || '')
    .replace(/[\r\n\t]+/g, ' ')   // replace any line break or tab with space
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .trim()
    .toUpperCase();
}

module.exports = {
  COLUMN_MAP,
  IDENTITY_FIELDS,
  MANDATORY_FIELDS,
  DATE_FIELDS,
  TIME_FIELDS,
  SOURCE_OWNED_EXPORT_JOB_FIELDS,
  NORMALIZED_EXPORT_JOB_FIELDS,
  normalizeHeader,
};
