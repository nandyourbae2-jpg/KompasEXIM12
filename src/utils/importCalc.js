export const n = (v) => Number(v) || 0;
export const fmtRupiah = (val) => val == null ? '0' : val.toLocaleString('id-ID');

export const emptyShipmentCosts = () => ({
  trucRepo: { noInvRepo: '-', dpp: '', pctPpn: '0', ppn: 0, noFp: '' },
  trucWh: { noInvTruk: '', biayaDasar: '', inapSasis: 0, other: 0, otherNotes: '', dpp: 0, pctPpn: 0, ppn: 0, noFp: '' },
  loloReimb: { noReimbLiftoff: '-', noInvLiftoff: '-', dppLiftoff: 0, ppnLiftoff: 0, noFpLiftoff: '', noReimbRepair: '-', noInvRepair: '-', dppRepair: '', ppnRepair: '', noFpRepair: '' },
  depo: { calcDay: 0, calcShift: 0, actDay: 0, actShift: 0, noInvDepo: '', storage: 0, monitoring: 0, recooling: 0, lolo: 0, dpp: 0, pctPpn: 0, ppn: 0, noFp: '' },
  othePerizinan: { category: '', invNo: '', amount: 0, vat: 0, fp: '', gpNo: '', vendorName: '' },
  lineFreight: { invNo: '', dpp: 0, currency: 'IDR', exchangeRate: 1, pctPpn: 0, ppn: 0, noFp: '', noGp: '', vendorName: '' },
  lineLocalIdn: { invNo: '', dpp: 0, currency: 'IDR', exchangeRate: 1, pctPpn: 0, ppn: 0, noFp: '', noGp: '', vendorName: '' },
  lineExtendDO: { invNo: '', dpp: 0, currency: 'IDR', exchangeRate: 1, pctPpn: 0, ppn: 0, noFp: '', noGp: '', vendorName: '' },
  othePib: { noAjuPib: '', beaMasuk: 0, ppn: 0, pph: 0, gpNo: '', vendorName: '' },
  otheCustomsBond: { noInvCb: '', dpp: 0, diskon: 0, gpNo: '', vendorName: '' },
  loloPort: { category: '', invNo: '', dpp: 0, ppn: 0, fp: '', gpNo: '', vendorName: '' },
  loloHicoBahandel: { category: '', invNo: '', dpp: 0, ppn: 0, fp: '', gpNo: '', vendorName: '' },
  loloGudangPort: { category: '', invNo: '', dpp: 0, ppn: 0, fp: '', gpNo: '', vendorName: '' },
  otheOtherCost: { category: '', invNo: '', dpp: 0, ppn: 0, fp: '', gpNo: '', vendorName: '' },
  claimSupplier: { detail: '', amount: 0, vendorName: '', status_klaim: 'Belum Diterima' },
  claimLinerFwd: { detail: '', amount: 0, vendorName: '', status_klaim: 'Belum Diterima' },
  claimTrucking: { detail: '', amount: 0, vendorName: '', status_klaim: 'Belum Diterima' },
  evaluasiTila: { standard: 0, actual: 0, extend: 0, result: '', difference: 0, reason: '' },
  gpReceipt: { gpReceiptNumber: '', latestRcvDate: null, procPurcSaveDate: null, lndCostPostDate: null, resultProcPurc: '', resultImpTeam: '', reason: '' },
  opCostEval: { noSkepSshpReimp: '', noHico: '', noTkbmBahandel: '', noSurveyor: '', noKawalan: '' },
});

export const mergeShipmentCosts = (loadedCosts = {}) => {
  const empty = emptyShipmentCosts();
  const result = { ...empty };
  for (const key in empty) {
    if (loadedCosts[key]) {
      result[key] = { ...empty[key], ...loadedCosts[key] };
    }
  }
  return result;
};

export const calcTotals = (costs = {}, qtty = 0, containerCosts = []) => {
  const c = costs;
  const q = n(qtty);

  const filterCat = (prefix) => containerCosts.filter(x => x.cost_category && x.cost_category.startsWith(prefix));
  
  const trucRepo = filterCat('TRUC (Repo');
  const trucWh = filterCat('TRUC (Ware');
  const loloReimb = filterCat('LOLO (Reimb');
  const depoCosts = filterCat('DEPO');
  const lineFreight = filterCat('Line Freight');
  const lineLocal = filterCat('Line Local');
  const lineExtend = filterCat('Line Extend');
  const loloPort = filterCat('LOLO (Port)');
  const loloHico = filterCat('LOLO (Hico');
  const loloGudang = filterCat('LOLO (Gudang');
  const loloExtend = filterCat('LOLO (Extend');
  const otheOther = filterCat('OTHE (Other Cost)');

  const sumDpp = arr => arr.reduce((acc, curr) => acc + (Number(curr.dpp) || 0), 0);
  const sumPpn = arr => arr.reduce((acc, curr) => acc + (Number(curr.ppn) || 0), 0);
  const sumTot = arr => arr.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  // 1. TRUC
  const trucRepo_dpp = sumDpp(trucRepo);
  const trucRepo_ppn = sumPpn(trucRepo);
  const trucRepo_total = sumTot(trucRepo);
  
  const trucWh_dpp = sumDpp(trucWh);
  const trucWh_ppn = sumPpn(trucWh);
  const trucWh_total = sumTot(trucWh);
  
  const trucLanded = trucRepo_dpp + trucWh_dpp;
  const totalTruc = trucRepo_total + trucWh_total;

  // 3. LOLO (Reimb)
  const loloReimbLanded = sumDpp(loloReimb);
  const loloReimb_ppn = sumPpn(loloReimb);
  const totalReimb = sumTot(loloReimb);
  
  // Backward comp
  const loloReimb_subtotalLiftoff = totalReimb;
  const loloReimb_subtotalRepair = 0;

  // 4. DEPO
  const depo_dpp = sumDpp(depoCosts);
  const depo_ppn = sumPpn(depoCosts);
  const depo_total = sumTot(depoCosts);
  const depoLanded = depo_dpp;

  // 5. OTHE (Perizinan)
  const othePerizinan_total = n(c.othePerizinan?.amount) + n(c.othePerizinan?.vat);

  // 6,7,8 LINE
  const lineFreight_dppIdr = sumDpp(lineFreight);
  const lineLocalIdn_dppIdr = sumDpp(lineLocal);
  const lineExtendDO_dppIdr = sumDpp(lineExtend);
  const lineFreight_ppn = sumPpn(lineFreight);
  const lineLocalIdn_ppn = sumPpn(lineLocal);
  const lineExtendDO_ppn = sumPpn(lineExtend);
  const totalLine = lineFreight_dppIdr + lineLocalIdn_dppIdr + lineExtendDO_dppIdr;
  const totalLinePpn = sumTot(lineFreight) + sumTot(lineLocal) + sumTot(lineExtend);

  // 9, 10 OTHE (PIB + CB)
  const otheCustomsBond_dppNet = n(c.otheCustomsBond?.dpp) - n(c.otheCustomsBond?.diskon);
  const totalOthePibLanded = n(c.othePib?.beaMasuk) + otheCustomsBond_dppNet;
  const totalOthePib       = totalOthePibLanded + n(c.othePib?.ppn) + n(c.othePib?.pph);

  // 11, 12, 13 LOLO (Port & Gudang & Extend)
  const landedPortWh = sumDpp(loloPort) + sumDpp(loloHico) + sumDpp(loloGudang) + sumDpp(loloExtend);
  const totalPortWh = sumTot(loloPort) + sumTot(loloHico) + sumTot(loloGudang) + sumTot(loloExtend);

  // 14. OTHE (Other Cost)
  const landedOther = sumDpp(otheOther);
  const totalOther = sumTot(otheOther);

  // 15 CLAIM
  const totalClaim  = n(c.claimSupplier?.amount) + n(c.claimLinerFwd?.amount) + n(c.claimTrucking?.amount);
  const bebanPbn    = totalClaim;
  const bebanPbnKg  = q > 0 ? totalClaim / q : 0;

  // GRAND TOTAL
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
    totalTruc +
    totalReimb +
    depo_total +
    othePerizinan_total +
    totalLinePpn +
    totalOthePib +
    totalPortWh +
    totalOther;

  const landedPerKg = q > 0 ? grandTotal / q : 0;

  return {
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
    othePerizinan: { total: othePerizinan_total, ppn: n(c.othePerizinan?.vat) },
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
      ppn: n(c.othePib?.ppn), pph: n(c.othePib?.pph)
    },
    lolo: { landed: landedPortWh, total: totalPortWh },
    otheOtherCost: { landed: landedOther, total: totalOther, ppn: sumPpn(otheOther) },
    claim: { total: totalClaim, bebanPbn, bebanPbnKg },
    landedTotal,
    grandTotal,
    landedPerKg,
  };
};

export const getBucketLabel = (jamFloat) => {
  const h = Number(jamFloat) || 0;
  if (h < 24)  return '< 24H';
  if (h < 48)  return '24-48H';
  if (h < 72)  return '48-72H';
  return '72H+';
};

export const emptyContainer = () => ({
  cont: '',
  stack: null,
  gateOut: null,
  truckingRepoVendor: '',
  truRepoArrival: null,
  truRepoDeparture: null,
  truckingWhVendor: '',
  truWhArrival: null,
  truWhDeparture: null,
  lama_inap_sasis: null,
  waktu_antri: null,
  durasi_bongkar: null,
  fish_issue: false, queue_issue: false, space_issue: false, other_issue: false,
  issue_remarks: ''
});

export const fmtRupiahSigned = (val) => {
  if (val == null) return '0';
  const v = Number(val);
  return v > 0 ? `+${fmtRupiah(v)}` : v < 0 ? `-${fmtRupiah(Math.abs(v))}` : '0';
};
