/**
 * Mengurutkan & mengelompokkan job AE sesuai aturan:
 * Primary: closing_docs ASC | Secondary: closing_docs_time ASC | Tertiary: vessel
 * Job dengan closing_docs ATAU closing_docs_time NULL dipisah ke grup "incomplete"
 */
export function sortAndGroupAEJobs(jobs) {
  const complete = jobs.filter(j => j.closing_docs && j.closing_docs_time);
  const incomplete = jobs.filter(j => !j.closing_docs || !j.closing_docs_time);

  complete.sort((a, b) => {
    const dateDiff = new Date(a.closing_docs) - new Date(b.closing_docs);
    if (dateDiff !== 0) return dateDiff;

    const timeDiff = a.closing_docs_time.localeCompare(b.closing_docs_time);
    if (timeDiff !== 0) return timeDiff;

    const vesselDiff = normalizeVesselForSort(a.vessel).localeCompare(normalizeVesselForSort(b.vessel));
    if (vesselDiff !== 0) return vesselDiff;

    if (a.etd && b.etd) {
      const etdDiff = new Date(a.etd) - new Date(b.etd);
      if (etdDiff !== 0) return etdDiff;
    } else if (a.etd || b.etd) {
      return a.etd ? -1 : 1; 
    }

    if (a.eta && b.eta) {
      return new Date(a.eta) - new Date(b.eta);
    } else if (a.eta || b.eta) {
      return a.eta ? -1 : 1;
    }

    return 0;
  });

  // Incomplete tetap diurutkan (misal by invoice) supaya konsisten, TAPI
  // selalu di section terpisah, TIDAK dicampur ke daftar utama
  incomplete.sort((a, b) => (a.invoice_no || a.invoice || '').localeCompare(b.invoice_no || b.invoice || ''));

  return { complete, incomplete };
}

/**
 * Normalisasi HANYA untuk keperluan pencocokan/grouping vessel —
 * TIDAK PERNAH dipakai untuk menimpa nilai asli source record.
 * Toleran terhadap spasi di tengah teks (bukan cuma TRIM ujung).
 */
export function normalizeVesselForSort(vessel) {
  if (!vessel) return '';
  return vessel.toUpperCase().replace(/\s+/g, '');
}

/**
 * Tandai baris yang perlu indikator visual "gandengan" (vessel sama
 * dengan baris sebelumnya dalam list yang SUDAH terurut)
 */
export function markVesselGrouping(sortedJobs) {
  return sortedJobs.map((job, idx) => {
    const getCompositeKey = (j) => {
      const v = normalizeVesselForSort(j.vessel);
      if (!v) return null;
      return `${v}-${j.eta || ''}`;
    };
    
    const prevKey = idx > 0 ? getCompositeKey(sortedJobs[idx - 1]) : null;
    const currKey = getCompositeKey(job);
    return {
      ...job,
      isGroupedWithPrevious: currKey !== null && currKey === prevKey
    };
  });
}

/**
 * Segmentasi Mid Week / Endweek berdasarkan closing_docs
 */
export function getWeekSegment(closingDocsDate, midweekDays = [1, 2, 3, 4]) {
  if (!closingDocsDate) return 'incomplete';
  const day = new Date(closingDocsDate).getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
  return midweekDays.includes(day) ? 'midweek' : 'endweek';
}

/**
 * Urgency level — REUSE pola yang sudah ada (Overdue/Today/Tomorrow/Upcoming),
 * JANGAN hitung urgency untuk job yang closing_docs/closing_docs_time NULL
 */
export function getUrgencyLevel(job, now = new Date()) {
  if (!job.closing_docs || !job.closing_docs_time) return 'incomplete';

  const closingDateTime = new Date(`${job.closing_docs}T${job.closing_docs_time}`);
  const diffHours = (closingDateTime - now) / (1000 * 60 * 60);

  if (diffHours < 0) return 'overdue';
  if (diffHours <= 24) return 'today';
  if (diffHours <= 48) return 'tomorrow';
  return 'upcoming';
}
