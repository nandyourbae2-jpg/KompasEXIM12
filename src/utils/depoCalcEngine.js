/**
 * depoCalcEngine.js
 * ─────────────────────────────────────────────────────────────────────
 * Pure calculation engine for the Depo Module.
 * Translates Enterprise Business Rules into deterministic JS functions.
 *
 * All functions are side-effect-free and fully testable.
 *
 * Rules:
 *   - Depo Arrival & Depo Depart are the primary calculation sources.
 *   - Calc Day = MAX(0, Total Days - Free Storage Days). Current policy = 5 Days.
 *   - Calc Shift = CEILING(Total Hours / 8).
 *   - Actual inputs override calculated days for charging, but both are audited.
 *   - Price Lookup uses Effective Date DESC <= Depo Arrival Date.
 * ─────────────────────────────────────────────────────────────────────
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a value to a Date. Accepts ISO string, Date object, or epoch ms.
 * Returns null if the input cannot be parsed into a valid Date.
 */
const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const MS_PER_HOUR = 1000 * 60 * 60;
const HOURS_PER_DAY = 24;
const HOURS_PER_SHIFT = 8;

// ─── Format Helpers ───────────────────────────────────────────────────────────

function formatDuration(totalHours) {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours} Hours ${minutes.toString().padStart(2, '0')} Minutes`;
}

// ─── Calculate Duration, Days, and Shifts ─────────────────────────────────────

/**
 * Calculate the number of chargeable days and shifts a container stays at the depo.
 *
 * @param {string|Date} depoArrival – Depo Arrival datetime
 * @param {string|Date} depoDepart  – Depo Depart datetime
 * @param {number}      freeTime    – Free Storage Days
 * @returns {object} Computed metrics or null if invalid
 */
export function calculateDuration(depoArrival, depoDepart, freeTime = 0) {
  const arrival = toDate(depoArrival);
  const depart = toDate(depoDepart);

  if (!arrival || !depart) {
    return {
      totalDuration: null,
      totalHours: null,
      totalDays: null,
      calcDay: null,
      calcShift: null,
      error: 'Depo Arrival atau Depo Depart belum diisi',
    };
  }

  const diffMs = depart.getTime() - arrival.getTime();
  if (diffMs < 0) {
    return {
      totalDuration: null,
      totalHours: null,
      totalDays: null,
      calcDay: null,
      calcShift: null,
      error: 'Depo Depart tidak boleh lebih awal dari Depo Arrival',
    };
  }

  const totalHours = diffMs / MS_PER_HOUR;

  // Calculate calendar days difference, ignoring time components
  const arrivalDateOnly = new Date(Date.UTC(arrival.getUTCFullYear(), arrival.getUTCMonth(), arrival.getUTCDate()));
  const departDateOnly = new Date(Date.UTC(depart.getUTCFullYear(), depart.getUTCMonth(), depart.getUTCDate()));
  const diffDays = Math.round((departDateOnly.getTime() - arrivalDateOnly.getTime()) / (1000 * 60 * 60 * 24));
  
  const totalDays = diffDays + 1;
  const ft = Math.max(0, parseInt(freeTime, 10) || 0);
  const calcDay = totalDays;
  const calcShift = Math.ceil(totalHours / HOURS_PER_SHIFT);

  return {
    totalDuration: formatDuration(totalHours),
    totalHours: Math.round(totalHours * 100) / 100,
    totalDays,
    calcDay,
    calcShift,
    error: null,
  };
}

// ─── Depo Price Lookup ────────────────────────────────────────────────────────

/**
 * Find the valid price version for a given depo route and transaction date.
 *
 * Business Rule:
 *   Sort by effectiveDate DESC.
 *   Select the newest record whose effectiveDate <= depoArrivalDate.
 *
 * @param {Array}       depoPrices  – Array of { id, updatedAt, param, storage, monitoring, recooling, lolo }
 * @param {string}      depoRoute   – The route to match against `param` (e.g. "40' PBN")
 * @param {string|Date} depoArrival – The reference date
 * @returns {{ price: object|null, effectiveDate: string|null, error: string|null }}
 */
export function lookupDepoPrice(depoPrices = [], depoRoute, depoArrival) {
  if (!depoRoute) {
    return { price: null, effectiveDate: null, error: 'Depo route belum dipilih' };
  }

  const txDate = toDate(depoArrival);
  if (!txDate) {
    return { price: null, effectiveDate: null, error: 'Silakan isi Depo Arrival terlebih dahulu untuk mencari harga yang berlaku' };
  }

  // Filter by matching route, then sort by effective date descending
  const candidates = depoPrices
    .filter(p => p.param === depoRoute)
    .map(p => ({ ...p, _date: toDate(p.updatedAt) }))
    .filter(p => p._date && p._date.getTime() <= txDate.getTime())
    .sort((a, b) => b._date.getTime() - a._date.getTime());

  if (candidates.length === 0) {
    const anyMatch = depoPrices.filter(p => p.param === depoRoute);
    if (anyMatch.length > 0) {
      return {
        price: null,
        effectiveDate: null,
        error: `Tidak ditemukan harga depo untuk rute "${depoRoute}" yang berlaku pada ${txDate.toISOString().split('T')[0]}. Semua harga berlaku di masa depan.`,
      };
    }
    return {
      price: null,
      effectiveDate: null,
      error: `Tidak ditemukan harga depo untuk rute "${depoRoute}". Tambahkan di Master Data.`,
    };
  }

  const selected = candidates[0];
  return {
    price: {
      id: selected.id,
      param: selected.param,
      storage: Number(selected.storage) || 0,
      monitoring: Number(selected.monitoring) || 0,
      recooling: Number(selected.recooling) || 0,
      lolo: Number(selected.lolo) || 0,
    },
    effectiveDate: selected.updatedAt,
    error: null,
  };
}

// ─── Charge Calculation ───────────────────────────────────────────────────────

/**
 * Calculate all depo charges based on actual days/shifts and the valid price record.
 *
 * Business Rules:
 *   Storage    = actDay × price.storage
 *   Monitoring = actDay × price.monitoring
 *   Recooling  = actDay × price.recooling
 *   LOLO       = price.lolo  (fixed per event)
 *
 * @param {number} actDay    – Actual days entered by operator
 * @param {number} actShift  – Actual shifts entered by operator
 * @param {object} priceRecord – From lookupDepoPrice().price
 * @returns {{ storage, monitoring, recooling, lolo, dpp, error }}
 */
export function calcDepoCharges(actDay, actShift, priceRecord) {
  if (!priceRecord) {
    return {
      storage: 0,
      monitoring: 0,
      recooling: 0,
      lolo: 0,
      dpp: 0,
      error: 'Harga depo tidak ditemukan. Perhitungan tidak dapat dilakukan.',
    };
  }

  const days = Math.max(0, parseInt(actDay, 10) || 0);
  const shifts = Math.max(0, parseInt(actShift, 10) || 0);

  const storage = days * priceRecord.storage;
  const monitoring = days * priceRecord.monitoring;
  const recooling = days * priceRecord.recooling;
  const lolo = priceRecord.lolo; // Fixed per event
  const dpp = storage + monitoring + recooling + lolo;

  return {
    storage,
    monitoring,
    recooling,
    lolo,
    dpp,
    error: null,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate manual actDay / actShift inputs.
 * Returns an array of error messages (empty = valid).
 */
export function validateManualInputs(actDay, actShift) {
  const errors = [];
  if (actDay !== '' && actDay !== null && actDay !== undefined) {
    const d = parseInt(actDay, 10);
    if (isNaN(d)) errors.push('Act Day harus berupa angka');
    else if (d < 0) errors.push('Act Day tidak boleh negatif');
  }
  if (actShift !== '' && actShift !== null && actShift !== undefined) {
    const s = parseInt(actShift, 10);
    if (isNaN(s)) errors.push('Act Shift harus berupa angka');
    else if (s < 0) errors.push('Act Shift tidak boleh negatif');
  }
  return errors;
}

// ─── Full Computation Pipeline ────────────────────────────────────────────────

/**
 * Run the complete Depo calculation pipeline for a single container.
 * Returns all computed values + full audit trail.
 *
 * @param {object} params
 * @param {string|Date} params.depoArrival   – Depo Arrival datetime
 * @param {string|Date} params.depoDepart    – Depo Depart datetime
 * @param {number}      params.actDay        – Actual days (manual input)
 * @param {number}      params.actShift      – Actual shifts (manual input)
 * @param {Array}       params.depoPrices    – Depo Price Master array
 * @param {string}      params.depoRoute     – Depo route (e.g. "40' PBN")
 * @returns {object} Complete computation result with audit trail
 */
export function computeDepoFull({
  depoArrival,
  depoDepart,
  freeTime = 0,
  actDay,
  actShift,
  depoPrices = [],
  depoRoute,
}) {
  const timestamp = new Date().toISOString();

  // 1. Auto-calculate Duration, Days, Calc Day, Calc Shift
  const durationMetrics = calculateDuration(depoArrival, depoDepart, freeTime);

  // 2. Validate manual inputs
  const validationErrors = [];
  if (durationMetrics.error) validationErrors.push(durationMetrics.error);
  validationErrors.push(...validateManualInputs(actDay, actShift));

  // 3. Lookup price based on Depo Arrival
  const priceLookup = lookupDepoPrice(depoPrices, depoRoute, depoArrival);

  // 4. Calculate charges
  const charges = calcDepoCharges(actDay, actShift, priceLookup.price);

  // 5. Assemble Audit Trail & Results
  return {
    // Basic Computed fields (for backward compatibility if needed)
    calcDay: durationMetrics.calcDay,
    calcShift: durationMetrics.calcShift,
    storage: charges.storage,
    monitoring: charges.monitoring,
    recooling: charges.recooling,
    lolo: charges.lolo,
    dpp: charges.dpp,

    // Errors
    validationErrors,
    priceError: priceLookup.error,
    chargeError: charges.error || null,

    // Comprehensive Audit Trail
    audit: {
      timestamp,
      depoArrival: depoArrival || null,
      depoDepart: depoDepart || null,
      totalDuration: durationMetrics.totalDuration,
      totalHours: durationMetrics.totalHours,
      totalDays: durationMetrics.totalDays,
      calcDay: durationMetrics.calcDay,
      calcShift: durationMetrics.calcShift,
      actDay: actDay,
      actShift: actShift,
      priceVersionUsed: priceLookup.price?.id || null,
      effectiveDate: priceLookup.effectiveDate || null,
      storageRate: priceLookup.price?.storage || 0,
      monitoringRate: priceLookup.price?.monitoring || 0,
      recoolingRate: priceLookup.price?.recooling || 0,
      loloRate: priceLookup.price?.lolo || 0,
      grandTotal: charges.dpp,
    },
  };
}
