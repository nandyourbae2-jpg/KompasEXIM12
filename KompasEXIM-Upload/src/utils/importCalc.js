/**
 * importCalc.js
 *
 * Pure helper functions untuk modul Import Operational.
 * TIDAK ada side effects, TIDAK ada import Zustand.
 * Semua fungsi menerima data dan mengembalikan angka/objek baru.
 *
 * Konvensi kalkulasi:
 *  - PPN = DPP × %PPN / 100
 *  - DPP composite = sum(komponen biaya dasar)
 *  - Landed = sum(DPP tanpa pajak) per kelompok
 *  - Total = Landed + PPN per kelompok
 *  - Grand Total = sum(semua Total kelompok)
 *  - Landed per Kg = Grand Total / qtty
 */

// ─── Format Helper ────────────────────────────────────────────────────────────

/**
 * fmtRupiah: Format angka ke format Rupiah Indonesia tanpa simbol mata uang.
 * Contoh: 1250000 → "1.250.000"
 * Contoh: 0 → "0"
 * Contoh: null/undefined → "0"
 */
export const fmtRupiah = (val) => {
  const n = Number(val) || 0;
  return n.toLocaleString('id-ID');
};

/**
 * fmtRupiahSigned: Sama dengan fmtRupiah, tapi tambah prefix "Rp " dan tanda negatif jika < 0.
 */
export const fmtRupiahSigned = (val) => {
  const n = Number(val) || 0;
  return `Rp ${Math.abs(n).toLocaleString('id-ID')}${n < 0 ? ' (minus)' : ''}`;
};

/**
 * n: Konversi value ke angka. null/undefined/'' → 0.
 */
const n = (v) => Number(v) || 0;

// ─── Empty Constructors ───────────────────────────────────────────────────────

/**
 * emptyContainer: Buat objek tracking kontainer yang kosong.
 */
export const emptyContainer = () => ({
  cont: '',
  stack: null,
  gateOut: null,
  truRepoVendor: '',
  truRepoArrival: null,
  truRepoDepart: null,
  truWhVendor: '',
  truWhGateInWh: null,
  offlStart: null,
  offlEnd: null,
  gateOutWh: null,
  lamaInapSasis: null,
  waktuAntri: null,
  durasioBongkar: null,
  fishIssue: false,
  queueIssue: false,
  spaceIssue: false,
  otherIssue: false,
});

/**
 * emptyShipmentCosts: Buat objek costs 24 kategori yang semuanya 0 / string kosong.
 * Dipakai saat membuat shipment baru.
 */
export const emptyShipmentCosts = () => ({
  // #1 TRUC (Repo Depo)
  trucRepo: {
    noInvRepo: '', dpp: 0, pctPpn: 11, ppn: 0, noFp: '',
  },

  // #2 TRUC (Warehouse)
  trucWh: {
    noInvTruk: '', biayaDasar: 0, inapSasis: 0, other: 0, otherNotes: '',
    dpp: 0, pctPpn: 11, ppn: 0, noFp: '',
  },

  // #3 LOLO (Reimb)
  loloReimb: {
    noReimbLiftoff: '', noInvLiftoff: '', dppLiftoff: 0, ppnLiftoff: 0, noFpLiftoff: '',
    noReimbRepair: '', noInvRepair: '', dppRepair: 0, ppnRepair: 0, noFpRepair: '',
  },

  // #4 DEPO
  depo: {
    calcDay: 0, calcShift: 0, actDay: 0, actShift: 0,
    noInvDepo: '', storage: 0, monitoring: 0, recooling: 0, lolo: 0,
    dpp: 0, pctPpn: 11, ppn: 0, noFp: '',
  },

  // #5 OTHE (Perizinan)
  othePerizinan: {
    category: '', invNo: '', amount: 0, vat: 0, fp: '', gpNo: '', vendorName: '',
  },

  // #6 LINE (Freight & Local Charges Origin)
  lineFreight: {
    invNo: '', dpp: 0, pctPpn: 0, ppn: 0, noFp: '', noGp: '', vendorName: '',
  },

  // #7 LINE (Local Charges Indonesia)
  lineLocalIdn: {
    invNo: '', dpp: 0, pctPpn: 0, ppn: 0, noFp: '', noGp: '', vendorName: '',
  },

  // #8 LINE (Extend DO / Demdet)
  lineExtendDO: {
    invNo: '', dpp: 0, pctPpn: 0, ppn: 0, noFp: '', noGp: '', vendorName: '',
  },

  // #9 OTHE (PIB)
  othePib: {
    noAjuPib: '', beaMasuk: 0, ppn: 0, pph: 0, gpNo: '', vendorName: '',
  },

  // #10 OTHE (Customs Bond)
  otheCustomsBond: {
    noInvCb: '', dpp: 0, diskon: 0, gpNo: '', vendorName: '',
  },

  // #11 LOLO (Port)
  loloPort: {
    invNo: '', dpp: 0, ppn: 0, fp: '', gpNo: '', vendorName: '',
  },

  // #12 LOLO (Hico/Bahandel)
  loloHicoBahandel: {
    category: '', invNo: '', dpp: 0, ppn: 0, fp: '', gpNo: '', vendorName: '',
  },

  // #13 LOLO (Gudang Port)
  loloGudangPort: {
    invNo: '', dpp: 0, ppn: 0, fp: '', gpNo: '', vendorName: '',
  },

  // #14 OTHE (Other Cost)
  otheOtherCost: {
    remark: '', invoice: '', dpp: 0, ppn: 0, noFp: '', gpNo: '', vendorName: '',
  },

  // #15 CLAIM SUPPLIER
  claimSupplier: { detail: '', amount: 0, vendorName: '', status_klaim: 'Belum Diterima' },

  // #16 CLAIM LINER/FWD
  claimLinerFwd: { detail: '', amount: 0, vendorName: '', status_klaim: 'Belum Diterima' },

  // #17 CLAIM TRUCKING
  claimTrucking: { detail: '', amount: 0, vendorName: '', status_klaim: 'Belum Diterima' },

  // #18 EVALUASI TILA
  evaluasiTila: {
    standard: 0, actual: 0, extend: 0, result: '', difference: 0, reason: '',
  },

  // #19 GP RECEIPT
  gpReceipt: {
    gpReceiptNumber: '', latestRcvDate: null, procPurcSaveDate: null,
    lndCostPostDate: null, resultProcPurc: '', resultImpTeam: '', reason: '',
  },

  // #20 Operational Cost Evaluation
  opCostEval: {
    noSkepSshpReimp: '', noHico: '', noTkbmBahandel: '',
    noSurveyor: '', noKawalan: '',
  },
});

// ─── Main Calculation Function ────────────────────────────────────────────────

/**
 * calcTotals: Hitung semua derived values dari raw costs + qtty.
 *
 * Input:
 *   costs  — objek dari emptyShipmentCosts() yang sudah diisi user
 *   qtty   — berat/jumlah shipment (untuk Landed per Kg)
 *
 * Output: objek berisi semua angka kalkulasi:
 *   - per kategori: dppComputed, ppnComputed, subtotal, landed, total
 *   - roll-up: trucLanded, totalTruc, loloReimbLanded, totalReimb, dll
 *   - grand total: landedTotal, grandTotal, landedPerKg
 *
 * Semua angka adalah Number (float), bukan string.
 * Gunakan fmtRupiah() untuk display.
 */
export const calcTotals = (costs = {}, qtty = 0) => {
  const c = costs;
  const q = n(qtty);

  // ── #1 TRUC (Repo Depo) ──────────────────────────────────────────────────
  const trucRepo_ppn   = n(c.trucRepo?.dpp) * n(c.trucRepo?.pctPpn) / 100;
  const trucRepo_total = n(c.trucRepo?.dpp) + trucRepo_ppn;

  // ── #2 TRUC (Warehouse) ──────────────────────────────────────────────────
  const trucWh_dpp   = n(c.trucWh?.biayaDasar) + n(c.trucWh?.inapSasis) + n(c.trucWh?.other);
  const trucWh_ppn   = trucWh_dpp * n(c.trucWh?.pctPpn) / 100;
  const trucWh_total = trucWh_dpp + trucWh_ppn;

  // Roll-up TRUC
  const trucLanded = n(c.trucRepo?.dpp) + trucWh_dpp;
  const totalTruc  = trucRepo_total + trucWh_total;

  // ── #3 LOLO (Reimb) ──────────────────────────────────────────────────────
  const loloReimb_subtotalLiftoff = n(c.loloReimb?.dppLiftoff) + n(c.loloReimb?.ppnLiftoff);
  const loloReimb_subtotalRepair  = n(c.loloReimb?.dppRepair)  + n(c.loloReimb?.ppnRepair);
  const loloReimbLanded = n(c.loloReimb?.dppLiftoff) + n(c.loloReimb?.dppRepair);
  const totalReimb      = loloReimb_subtotalLiftoff + loloReimb_subtotalRepair;

  // ── #4 DEPO ──────────────────────────────────────────────────────────────
  const depo_dpp   = n(c.depo?.storage) + n(c.depo?.monitoring) + n(c.depo?.recooling) + n(c.depo?.lolo);
  const depo_ppn   = depo_dpp * n(c.depo?.pctPpn) / 100;
  const depo_total = depo_dpp + depo_ppn;
  const depoLanded = depo_dpp;

  // ── #5 OTHE (Perizinan) ──────────────────────────────────────────────────
  const othePerizinan_total = n(c.othePerizinan?.amount) + n(c.othePerizinan?.vat);

  // ── #6 #7 #8 LINE ────────────────────────────────────────────────────────
  const lineFreight_ppn  = n(c.lineFreight?.dpp)  * n(c.lineFreight?.pctPpn)  / 100;
  const lineLocalIdn_ppn = n(c.lineLocalIdn?.dpp) * n(c.lineLocalIdn?.pctPpn) / 100;
  const lineExtendDO_ppn = n(c.lineExtendDO?.dpp) * n(c.lineExtendDO?.pctPpn) / 100;
  const totalLine    = n(c.lineFreight?.dpp) + n(c.lineLocalIdn?.dpp) + n(c.lineExtendDO?.dpp);
  const totalLinePpn = totalLine + lineFreight_ppn + lineLocalIdn_ppn + lineExtendDO_ppn;

  // ── #9 #10 OTHE (PIB + Customs Bond) ─────────────────────────────────────
  const otheCustomsBond_dppNet = n(c.otheCustomsBond?.dpp) - n(c.otheCustomsBond?.diskon);
  const totalOthePibLanded = n(c.othePib?.beaMasuk) + otheCustomsBond_dppNet;
  const totalOthePib       = totalOthePibLanded + n(c.othePib?.ppn) + n(c.othePib?.pph);

  // ── #11 #12 #13 LOLO (Port & Gudang) ─────────────────────────────────────
  const landedPortWh = n(c.loloPort?.dpp) + n(c.loloHicoBahandel?.dpp) + n(c.loloGudangPort?.dpp);
  const totalPortWh  = landedPortWh + n(c.loloPort?.ppn) + n(c.loloHicoBahandel?.ppn) + n(c.loloGudangPort?.ppn);

  // ── #14 OTHE (Other Cost) ─────────────────────────────────────────────────
  const landedOther = n(c.otheOtherCost?.dpp);
  const totalOther  = landedOther + n(c.otheOtherCost?.ppn);

  // ── #15 #16 #17 CLAIM ────────────────────────────────────────────────────
  const totalClaim  = n(c.claimSupplier?.amount) + n(c.claimLinerFwd?.amount) + n(c.claimTrucking?.amount);
  const bebanPbn    = totalClaim;
  const bebanPbnKg  = q > 0 ? totalClaim / q : 0;

  // ── GRAND TOTAL ───────────────────────────────────────────────────────────
  const landedTotal =
    trucLanded +
    loloReimbLanded +
    depoLanded +
    n(c.othePerizinan?.amount) +
    totalLine +
    totalOthePibLanded +
    landedPortWh +
    landedOther;

  const grandTotal =
    landedTotal +
    trucRepo_ppn + trucWh_ppn +
    n(c.loloReimb?.ppnLiftoff) + n(c.loloReimb?.ppnRepair) +
    depo_ppn +
    n(c.othePerizinan?.vat) +
    lineFreight_ppn + lineLocalIdn_ppn + lineExtendDO_ppn +
    n(c.othePib?.ppn) + n(c.othePib?.pph) +
    n(c.loloPort?.ppn) + n(c.loloHicoBahandel?.ppn) + n(c.loloGudangPort?.ppn) +
    n(c.otheOtherCost?.ppn);

  const landedPerKg = q > 0 ? grandTotal / q : 0;

  return {
    // Per kategori
    trucRepo: { ppn: trucRepo_ppn, total: trucRepo_total },
    trucWh:   { dpp: trucWh_dpp, ppn: trucWh_ppn, total: trucWh_total },
    truc:     { landed: trucLanded, total: totalTruc },

    loloReimb: {
      subtotalLiftoff: loloReimb_subtotalLiftoff,
      subtotalRepair:  loloReimb_subtotalRepair,
      landed: loloReimbLanded,
      total:  totalReimb,
    },

    depo: { dpp: depo_dpp, ppn: depo_ppn, landed: depoLanded, total: depo_total },

    othePerizinan: { total: othePerizinan_total },

    line: {
      freightPpn:  lineFreight_ppn,
      localIdnPpn: lineLocalIdn_ppn,
      extendDOPpn: lineExtendDO_ppn,
      total: totalLine,
      totalPpn: totalLinePpn,
    },

    othePib: {
      customsBondDppNet: otheCustomsBond_dppNet,
      landed: totalOthePibLanded,
      total:  totalOthePib,
    },

    lolo: { landed: landedPortWh, total: totalPortWh },

    otheOtherCost: { landed: landedOther, total: totalOther },

    claim: { total: totalClaim, bebanPbn, bebanPbnKg },

    // Grand totals
    landedTotal,
    grandTotal,
    landedPerKg,
  };
};

/**
 * getBucketLabel: Klasifikasikan durasi bongkar (jam) ke bucket analisis.
 */
export const getBucketLabel = (jamFloat) => {
  const h = Number(jamFloat) || 0;
  if (h < 24)  return '< 24H';
  if (h < 48)  return '24-48H';
  if (h < 72)  return '48-72H';
  return '72H+';
};
