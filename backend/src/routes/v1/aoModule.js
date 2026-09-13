const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { TransactionManager } = require('../../database/TransactionManager');
const { ConcurrencyConflictError, VersionRequiredError } = require('../../utils/errors');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// ─── Helpers ────────────────────────────────────────────────
function generateNumber(prefix, table, column) {
  const year = new Date().getFullYear().toString().slice(-2);
  const last = db.prepare(`SELECT ${column} FROM ${table} ORDER BY id DESC LIMIT 1`).get();
  let next = 1;
  if (last && last[column]) {
    const m = last[column].match(/(\d{4})/);
    if (m) next = parseInt(m[1]) + 1;
  }
  return `${prefix}-${String(next).padStart(4, '0')}-${year}`;
}

function checkAoAccess(req, res, next) {
  if (req.user && (req.user.departemen === 'Account Officer' || req.user.level_otoritas === 'Manager')) {
    return next();
  }
  res.status(403).json({ error: 'Akses hanya untuk departemen Account Officer' });
}

// Apply auth + AO check to ao-module routes
router.use('/ao-module', authenticateToken, checkAoAccess);

// ═══════════════════════════════════════════════════════════
// LC MANAGEMENT
// ═══════════════════════════════════════════════════════════

router.get('/ao-module/lc', (req, res, next) => {
  try {
    const { status, bank } = req.query;
    let sql = `
      SELECT lc.*, ip.task_unique_number, ip.supplier,
             u1.nama as dibuat_oleh_nama, u2.nama as disetujui_oleh_nama
      FROM lc_management lc
      LEFT JOIN import_projects ip ON lc.import_project_id = ip.id
      LEFT JOIN users u1 ON lc.dibuat_oleh_id = u1.id
      LEFT JOIN users u2 ON lc.disetujui_oleh_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    if (status && status !== 'Semua') { sql += ' AND lc.status = ?'; params.push(status); }
    if (bank) { sql += ' AND lc.bank_penerbit LIKE ?'; params.push(`%${bank}%`); }
    sql += ' ORDER BY lc.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/ao-module/lc', (req, res, next) => {
  try {
    const { import_project_id, bank_penerbit, nomor_lc_bank, jenis_lc, beneficiary, nilai_lc, mata_uang, tanggal_pengajuan, tanggal_terbit, tanggal_expired, latest_shipment_date, catatan } = req.body;
    const lc_number = generateNumber('LC', 'lc_management', 'lc_number');
    const id = db.prepare(`
      INSERT INTO lc_management (lc_number, import_project_id, bank_penerbit, nomor_lc_bank, jenis_lc, beneficiary, nilai_lc, mata_uang, tanggal_pengajuan, tanggal_terbit, tanggal_expired, latest_shipment_date, catatan, dibuat_oleh_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lc_number, import_project_id || null, bank_penerbit, nomor_lc_bank || null, jenis_lc || 'Sight LC', beneficiary, nilai_lc, mata_uang || 'USD', tanggal_pengajuan || null, tanggal_terbit || null, tanggal_expired || null, latest_shipment_date || null, catatan || null, req.user.id).lastInsertRowid;
    res.status(201).json({ success: true, id, lc_number });
  } catch (error) { next(error); }
});

router.get('/ao-module/lc/:id', (req, res, next) => {
  try {
    const lc = db.prepare(`
      SELECT lc.*, ip.task_unique_number, ip.supplier,
             u1.nama as dibuat_oleh_nama, u2.nama as disetujui_oleh_nama
      FROM lc_management lc
      LEFT JOIN import_projects ip ON lc.import_project_id = ip.id
      LEFT JOIN users u1 ON lc.dibuat_oleh_id = u1.id
      LEFT JOIN users u2 ON lc.disetujui_oleh_id = u2.id
      WHERE lc.id = ?
    `).get(req.params.id);
    if (!lc) return res.status(404).json({ error: 'LC tidak ditemukan' });
    const amendments = db.prepare(`
      SELECT a.*, u.nama as dilakukan_oleh_nama
      FROM lc_amendment_history a
      LEFT JOIN users u ON a.dilakukan_oleh_id = u.id
      WHERE a.lc_id = ? ORDER BY a.created_at DESC
    `).all(req.params.id);
    res.json({ ...lc, amendments });
  } catch (error) { next(error); }
});

router.patch('/ao-module/lc/:id', (req, res, next) => {
  try {
    const { status, nomor_lc_bank, tanggal_terbit, tanggal_expired, latest_shipment_date, utilisasi_saat_ini, catatan, disetujui_oleh_id } = req.body;
    db.prepare(`
      UPDATE lc_management SET
        status = COALESCE(?, status),
        nomor_lc_bank = COALESCE(?, nomor_lc_bank),
        tanggal_terbit = COALESCE(?, tanggal_terbit),
        tanggal_expired = COALESCE(?, tanggal_expired),
        latest_shipment_date = COALESCE(?, latest_shipment_date),
        utilisasi_saat_ini = COALESCE(?, utilisasi_saat_ini),
        catatan = COALESCE(?, catatan),
        disetujui_oleh_id = COALESCE(?, disetujui_oleh_id),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(status || null, nomor_lc_bank || null, tanggal_terbit || null, tanggal_expired || null, latest_shipment_date || null, utilisasi_saat_ini ?? null, catatan || null, disetujui_oleh_id || null, req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/ao-module/lc/:id/amend', (req, res, next) => {
  try {
    const { jenis_amandemen, detail } = req.body;
    db.prepare(`INSERT INTO lc_amendment_history (lc_id, jenis_amandemen, detail, dilakukan_oleh_id) VALUES (?, ?, ?, ?)`).run(req.params.id, jenis_amandemen, detail, req.user.id);
    db.prepare(`UPDATE lc_management SET status = 'Amended', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    res.status(201).json({ success: true });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════
// BANK GUARANTEE
// ═══════════════════════════════════════════════════════════

router.get('/ao-module/bg', (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT bg.*, ip.task_unique_number, ip.supplier, u.nama as dibuat_oleh_nama
      FROM bank_guarantee bg
      LEFT JOIN import_projects ip ON bg.import_project_id = ip.id
      LEFT JOIN users u ON bg.dibuat_oleh_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (status && status !== 'Semua') { sql += ' AND bg.status = ?'; params.push(status); }
    sql += ' ORDER BY bg.created_at DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (error) { next(error); }
});

router.post('/ao-module/bg', (req, res, next) => {
  try {
    const { import_project_id, bank_penerbit, tujuan_bg, penerima_bg, nilai_bg, mata_uang, tanggal_terbit, tanggal_expired, biaya_provisi, catatan } = req.body;
    const bg_number = generateNumber('BG', 'bank_guarantee', 'bg_number');
    const id = db.prepare(`
      INSERT INTO bank_guarantee (bg_number, import_project_id, bank_penerbit, tujuan_bg, penerima_bg, nilai_bg, mata_uang, tanggal_terbit, tanggal_expired, biaya_provisi, catatan, dibuat_oleh_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bg_number, import_project_id || null, bank_penerbit, tujuan_bg, penerima_bg, nilai_bg, mata_uang || 'IDR', tanggal_terbit || null, tanggal_expired || null, biaya_provisi || 0, catatan || null, req.user.id).lastInsertRowid;
    res.status(201).json({ success: true, id, bg_number });
  } catch (error) { next(error); }
});

router.get('/ao-module/bg/:id', (req, res, next) => {
  try {
    const bg = db.prepare(`
      SELECT bg.*, ip.task_unique_number, ip.supplier, u.nama as dibuat_oleh_nama
      FROM bank_guarantee bg
      LEFT JOIN import_projects ip ON bg.import_project_id = ip.id
      LEFT JOIN users u ON bg.dibuat_oleh_id = u.id
      WHERE bg.id = ?
    `).get(req.params.id);
    if (!bg) return res.status(404).json({ error: 'BG tidak ditemukan' });
    res.json(bg);
  } catch (error) { next(error); }
});

router.patch('/ao-module/bg/:id', (req, res, next) => {
  try {
    const { status, tanggal_terbit, tanggal_expired, biaya_provisi, catatan } = req.body;
    db.prepare(`
      UPDATE bank_guarantee SET
        status = COALESCE(?, status),
        tanggal_terbit = COALESCE(?, tanggal_terbit),
        tanggal_expired = COALESCE(?, tanggal_expired),
        biaya_provisi = COALESCE(?, biaya_provisi),
        catatan = COALESCE(?, catatan),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(status || null, tanggal_terbit || null, tanggal_expired || null, biaya_provisi ?? null, catatan || null, req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════
// FASILITAS KREDIT
// ═══════════════════════════════════════════════════════════

router.get('/ao-module/fasilitas', (req, res, next) => {
  try {
    const rows = db.prepare(`SELECT * FROM fasilitas_kredit ORDER BY created_at DESC`).all();
    // Compute utilisasi per fasilitas
    const result = rows.map(f => {
      const utilisasi = db.prepare(`SELECT COALESCE(SUM(jumlah_diminta), 0) as total FROM kasbon_request WHERE fasilitas_kredit_id = ? AND status IN ('Disetujui', 'Dicairkan')`).get(f.id);
      return { ...f, utilisasi: utilisasi.total, sisa: f.limit_fasilitas - utilisasi.total, persen_terpakai: f.limit_fasilitas > 0 ? ((utilisasi.total / f.limit_fasilitas) * 100).toFixed(1) : 0 };
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/ao-module/fasilitas', (req, res, next) => {
  try {
    const { nama_fasilitas, bank, jenis_fasilitas, limit_fasilitas, mata_uang, tanggal_mulai, tanggal_expired } = req.body;
    const id = db.prepare(`
      INSERT INTO fasilitas_kredit (nama_fasilitas, bank, jenis_fasilitas, limit_fasilitas, mata_uang, tanggal_mulai, tanggal_expired)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(nama_fasilitas, bank, jenis_fasilitas || null, limit_fasilitas, mata_uang || 'IDR', tanggal_mulai || null, tanggal_expired || null).lastInsertRowid;
    res.status(201).json({ success: true, id });
  } catch (error) { next(error); }
});

router.patch('/ao-module/fasilitas/:id', (req, res, next) => {
  try {
    const { nama_fasilitas, bank, jenis_fasilitas, limit_fasilitas, tanggal_mulai, tanggal_expired, status } = req.body;
    db.prepare(`
      UPDATE fasilitas_kredit SET
        nama_fasilitas = COALESCE(?, nama_fasilitas), bank = COALESCE(?, bank),
        jenis_fasilitas = COALESCE(?, jenis_fasilitas), limit_fasilitas = COALESCE(?, limit_fasilitas),
        tanggal_mulai = COALESCE(?, tanggal_mulai), tanggal_expired = COALESCE(?, tanggal_expired),
        status = COALESCE(?, status), updated_at = datetime('now')
      WHERE id = ?
    `).run(nama_fasilitas || null, bank || null, jenis_fasilitas || null, limit_fasilitas ?? null, tanggal_mulai || null, tanggal_expired || null, status || null, req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════
// KASBON REQUEST
// ═══════════════════════════════════════════════════════════

router.get('/ao-module/kasbon', (req, res, next) => {
  try {
    const { status, sumber } = req.query;
    let sql = `
      SELECT kr.*, ip.task_unique_number, ip.supplier,
             pr.request_number as pib_request_number,
             fk.nama_fasilitas, fk.bank as fasilitas_bank,
             u1.nama as diajukan_oleh_nama, u2.nama as disetujui_oleh_nama
      FROM kasbon_request kr
      LEFT JOIN import_projects ip ON kr.import_project_id = ip.id
      LEFT JOIN pib_requests pr ON kr.pib_request_id = pr.id
      LEFT JOIN fasilitas_kredit fk ON kr.fasilitas_kredit_id = fk.id
      LEFT JOIN users u1 ON kr.diajukan_oleh_id = u1.id
      LEFT JOIN users u2 ON kr.disetujui_oleh_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    if (status && status !== 'Semua') { sql += ' AND kr.status = ?'; params.push(status); }
    if (sumber && sumber !== 'Semua') { sql += ' AND kr.sumber = ?'; params.push(sumber); }
    sql += ' ORDER BY kr.created_at DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (error) { next(error); }
});

router.post('/ao-module/kasbon', (req, res, next) => {
  try {
    const { import_project_id, fasilitas_kredit_id, jumlah_diminta, keterangan } = req.body;
    const kasbon_number = generateNumber('KSB', 'kasbon_request', 'kasbon_number');
    const id = db.prepare(`
      INSERT INTO kasbon_request (kasbon_number, sumber, import_project_id, fasilitas_kredit_id, jumlah_diminta, keterangan, diajukan_oleh_id)
      VALUES (?, 'manual', ?, ?, ?, ?, ?)
    `).run(kasbon_number, import_project_id || null, fasilitas_kredit_id || null, jumlah_diminta, keterangan || null, req.user.id).lastInsertRowid;
    res.status(201).json({ success: true, id, kasbon_number });
  } catch (error) { next(error); }
});

router.patch('/ao-module/kasbon/:id/approve', (req, res, next) => {
  try {
    const { fasilitas_kredit_id, catatan_approval } = req.body;
    const kasbon = db.prepare('SELECT * FROM kasbon_request WHERE id = ?').get(req.params.id);
    if (!kasbon) return res.status(404).json({ error: 'Kasbon tidak ditemukan' });
    if (kasbon.status !== 'Diajukan') return res.status(400).json({ error: 'Hanya kasbon berstatus Diajukan yang bisa diapprove' });

    db.prepare(`
      UPDATE kasbon_request SET
        status = 'Dicairkan',
        fasilitas_kredit_id = COALESCE(?, fasilitas_kredit_id),
        disetujui_oleh_id = ?,
        tanggal_pencairan = date('now'),
        catatan_approval = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(fasilitas_kredit_id || null, req.user.id, catatan_approval || null, req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/ao-module/kasbon/:id/reject', (req, res, next) => {
  try {
    const { catatan_approval } = req.body;
    const kasbon = db.prepare('SELECT * FROM kasbon_request WHERE id = ?').get(req.params.id);
    if (!kasbon) return res.status(404).json({ error: 'Kasbon tidak ditemukan' });
    if (kasbon.status !== 'Diajukan') return res.status(400).json({ error: 'Hanya kasbon berstatus Diajukan yang bisa direject' });

    db.prepare(`UPDATE kasbon_request SET status = 'Ditolak', catatan_approval = ?, disetujui_oleh_id = ?, updated_at = datetime('now') WHERE id = ?`).run(catatan_approval || null, req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════
// FX BOOKING
// ═══════════════════════════════════════════════════════════

router.get('/ao-module/fx', (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT fx.*, jo.job_order_code, ip.task_unique_number, u.nama as dibuat_oleh_nama
      FROM fx_booking fx
      LEFT JOIN job_orders jo ON fx.job_order_id = jo.id
      LEFT JOIN import_projects ip ON fx.import_project_id = ip.id
      LEFT JOIN users u ON fx.dibuat_oleh_id = u.id
      ORDER BY fx.created_at DESC
    `).all();
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/ao-module/fx', (req, res, next) => {
  try {
    const { job_order_id, import_project_id, mata_uang_asal, mata_uang_tujuan, nominal_asal, kurs, bank_pelaksana } = req.body;
    const fx_number = generateNumber('FX', 'fx_booking', 'fx_number');
    const nominal_tujuan = nominal_asal / kurs;
    const id = db.prepare(`
      INSERT INTO fx_booking (fx_number, job_order_id, import_project_id, mata_uang_asal, mata_uang_tujuan, nominal_asal, kurs, nominal_tujuan, bank_pelaksana, dibuat_oleh_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fx_number, job_order_id || null, import_project_id || null, mata_uang_asal || 'IDR', mata_uang_tujuan || 'USD', nominal_asal, kurs, nominal_tujuan, bank_pelaksana || null, req.user.id).lastInsertRowid;
    res.status(201).json({ success: true, id, fx_number });
  } catch (error) { next(error); }
});

router.patch('/ao-module/fx/:id', (req, res, next) => {
  try {
    const { status } = req.body;
    db.prepare(`UPDATE fx_booking SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════
// T/T INSTRUCTION
// ═══════════════════════════════════════════════════════════

router.get('/ao-module/tt', (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT tt.*, jo.job_order_code, jo.cost_type, jo.total_invoice, jo.total_paid,
             fx.fx_number, fx.kurs,
             u.nama as dibuat_oleh_nama
      FROM tt_instruction tt
      LEFT JOIN job_orders jo ON tt.job_order_id = jo.id
      LEFT JOIN fx_booking fx ON tt.fx_booking_id = fx.id
      LEFT JOIN users u ON tt.dibuat_oleh_id = u.id
      ORDER BY tt.created_at DESC
    `).all();
    res.json(rows);
  } catch (error) { next(error); }
});

// Job orders with status 'Diteruskan' that need T/T execution
router.get('/ao-module/tt/pending-jo', (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT jo.id, jo.job_order_code, jo.cost_type, jo.total_invoice, jo.total_paid,
             jo.mata_uang, jo.invoice_no,
             v.nama as vendor_nama,
             frl.status as ledger_status
      FROM job_orders jo
      LEFT JOIN vendors v ON jo.vendor_id = v.id
      LEFT JOIN financial_request_ledger frl ON jo.id = frl.job_order_id
      WHERE frl.status = 'Diteruskan'
        AND jo.total_paid < jo.total_invoice
        AND NOT EXISTS (SELECT 1 FROM tt_instruction tt WHERE tt.job_order_id = jo.id AND tt.status IN ('Draft', 'Diproses'))
      ORDER BY jo.created_at DESC
    `).all();
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/ao-module/tt', (req, res, next) => {
  try {
    const { job_order_id, fx_booking_id, bank_pengirim, nomor_rekening_tujuan, nama_penerima, nominal, mata_uang } = req.body;
    const tt_number = generateNumber('TT', 'tt_instruction', 'tt_number');
    const id = db.prepare(`
      INSERT INTO tt_instruction (tt_number, job_order_id, fx_booking_id, bank_pengirim, nomor_rekening_tujuan, nama_penerima, nominal, mata_uang, dibuat_oleh_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tt_number, job_order_id, fx_booking_id || null, bank_pengirim, nomor_rekening_tujuan || null, nama_penerima || null, nominal, mata_uang || 'IDR', req.user.id).lastInsertRowid;
    res.status(201).json({ success: true, id, tt_number });
  } catch (error) { next(error); }
});

// Execute T/T — reuse payment logic from Financial Payment Tracker
router.patch('/ao-module/tt/:id/execute', async (req, res, next) => {
  try {
    const tt = db.prepare('SELECT * FROM tt_instruction WHERE id = ?').get(req.params.id);
    if (!tt) return res.status(404).json({ error: 'T/T Instruction tidak ditemukan' });
    if (tt.status === 'Terkirim') return res.status(400).json({ error: 'T/T sudah terkirim' });

    await TransactionManager.execute(async (tx) => {
      const jo = tx.db.prepare('SELECT total_invoice, total_paid, version FROM job_orders WHERE id = ?').get(tt.job_order_id);
      if (!jo) throw new Error('Job Order tidak ditemukan');

      const remaining = jo.total_invoice - jo.total_paid;
      const payAmount = Math.min(tt.nominal, remaining);

      if (payAmount > 0) {
        // Reuse existing payment logic: insert payment_log + update total_paid
        tx.db.prepare('INSERT INTO payment_logs (job_order_id, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id) VALUES (?, ?, date(?), ?, ?)').run(
          tt.job_order_id, payAmount, 'now', 'T/T Transfer', req.user.id
        );
        const info = tx.db.prepare('UPDATE job_orders SET total_paid = total_paid + ?, updated_at = datetime(\'now\'), version = version + 1 WHERE id = ? AND version = ?').run(payAmount, tt.job_order_id, jo.version);
        if (info.changes === 0) {
          throw new Error('Data Job Order telah diubah oleh pengguna lain (Concurrency Error). Silakan muat ulang.');
        }
      }

      tx.db.prepare(`UPDATE tt_instruction SET status = 'Terkirim', tanggal_eksekusi = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(tt.id);
    });

    res.json({ success: true, message: 'T/T dieksekusi dan pembayaran tercatat' });
  } catch (error) { next(error); }
});

router.patch('/ao-module/tt/:id/status', (req, res, next) => {
  try {
    const { status } = req.body;
    db.prepare(`UPDATE tt_instruction SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════════════════════
// DASHBOARDS & REPORTS
// ═══════════════════════════════════════════════════════════

router.get('/ao-module/dashboard', (req, res, next) => {
  try {
    const lcActive = db.prepare("SELECT COUNT(*) as c FROM lc_management WHERE status IN ('Issued','Amended','Utilized')").get().c;
    const bgActive = db.prepare("SELECT COUNT(*) as c FROM bank_guarantee WHERE status IN ('Aktif','Diperpanjang')").get().c;
    const kasbonPending = db.prepare("SELECT COUNT(*) as c FROM kasbon_request WHERE status = 'Diajukan'").get().c;
    const kasbonOutstanding = db.prepare("SELECT COALESCE(SUM(jumlah_diminta), 0) as t FROM kasbon_request WHERE status IN ('Disetujui','Dicairkan')").get().t;
    const fxThisMonth = db.prepare("SELECT COALESCE(SUM(nominal_asal), 0) as t FROM fx_booking WHERE status = 'Booked' AND strftime('%Y-%m', tanggal_booking) = strftime('%Y-%m', 'now')").get().t;
    const ttPending = db.prepare("SELECT COUNT(*) as c FROM tt_instruction WHERE status IN ('Draft','Diproses')").get().c;

    // Expiring LC/BG (< 30 days)
    const lcExpiring = db.prepare("SELECT COUNT(*) as c FROM lc_management WHERE status IN ('Issued','Amended','Utilized') AND tanggal_expired IS NOT NULL AND julianday(tanggal_expired) - julianday('now') < 30 AND julianday(tanggal_expired) - julianday('now') > 0").get().c;
    const bgExpiring = db.prepare("SELECT COUNT(*) as c FROM bank_guarantee WHERE status IN ('Aktif','Diperpanjang') AND tanggal_expired IS NOT NULL AND julianday(tanggal_expired) - julianday('now') < 30 AND julianday(tanggal_expired) - julianday('now') > 0").get().c;

    // Recent kasbon
    const recentKasbon = db.prepare(`
      SELECT kr.*, pr.request_number as pib_request_number, ip.task_unique_number
      FROM kasbon_request kr
      LEFT JOIN pib_requests pr ON kr.pib_request_id = pr.id
      LEFT JOIN import_projects ip ON kr.import_project_id = ip.id
      ORDER BY kr.created_at DESC LIMIT 5
    `).all();

    res.json({
      lcActive, bgActive, kasbonPending, kasbonOutstanding, fxThisMonth, ttPending,
      lcExpiring, bgExpiring, recentKasbon
    });
  } catch (error) { next(error); }
});

// SPV Facility Monitoring
router.get('/ao-module/facility-monitoring', (req, res, next) => {
  try {
    const fasilitas = db.prepare('SELECT * FROM fasilitas_kredit WHERE status = ?').all('Aktif');
    const result = fasilitas.map(f => {
      const utilisasi = db.prepare("SELECT COALESCE(SUM(jumlah_diminta), 0) as total FROM kasbon_request WHERE fasilitas_kredit_id = ? AND status IN ('Disetujui', 'Dicairkan')").get(f.id);
      return {
        ...f,
        utilisasi: utilisasi.total,
        sisa: f.limit_fasilitas - utilisasi.total,
        persen_terpakai: f.limit_fasilitas > 0 ? parseFloat(((utilisasi.total / f.limit_fasilitas) * 100).toFixed(1)) : 0
      };
    });

    const totalLimit = result.reduce((s, f) => s + f.limit_fasilitas, 0);
    const totalUtilisasi = result.reduce((s, f) => s + f.utilisasi, 0);
    const totalSisa = totalLimit - totalUtilisasi;

    const lcExpiring = db.prepare(`
      SELECT * FROM lc_management
      WHERE status IN ('Issued','Amended','Utilized')
        AND tanggal_expired IS NOT NULL
        AND julianday(tanggal_expired) - julianday('now') < 30
        AND julianday(tanggal_expired) > julianday('now')
      ORDER BY tanggal_expired ASC
    `).all();

    const bgExpiring = db.prepare(`
      SELECT * FROM bank_guarantee
      WHERE status IN ('Aktif','Diperpanjang')
        AND tanggal_expired IS NOT NULL
        AND julianday(tanggal_expired) - julianday('now') < 30
        AND julianday(tanggal_expired) > julianday('now')
      ORDER BY tanggal_expired ASC
    `).all();

    const pendingApprovals = db.prepare(`
      SELECT kr.*, pr.request_number as pib_request_number, ip.task_unique_number, u.nama as diajukan_oleh_nama
      FROM kasbon_request kr
      LEFT JOIN pib_requests pr ON kr.pib_request_id = pr.id
      LEFT JOIN import_projects ip ON kr.import_project_id = ip.id
      LEFT JOIN users u ON kr.diajukan_oleh_id = u.id
      WHERE kr.status = 'Diajukan'
      ORDER BY kr.created_at ASC
    `).all();

    res.json({ fasilitas: result, totalLimit, totalUtilisasi, totalSisa, lcExpiring, bgExpiring, pendingApprovals });
  } catch (error) { next(error); }
});

// Manager AO Report
router.get('/ao-module/manager-report', (req, res, next) => {
  try {
    const totalFasilitas = db.prepare("SELECT COUNT(*) as c FROM fasilitas_kredit WHERE status = 'Aktif'").get().c;
    const totalLimit = db.prepare("SELECT COALESCE(SUM(limit_fasilitas), 0) as t FROM fasilitas_kredit WHERE status = 'Aktif'").get().t;
    const totalUtilisasi = db.prepare("SELECT COALESCE(SUM(kr.jumlah_diminta), 0) as t FROM kasbon_request kr INNER JOIN fasilitas_kredit fk ON kr.fasilitas_kredit_id = fk.id WHERE kr.status IN ('Disetujui','Dicairkan') AND fk.status = 'Aktif'").get().t;

    const lcActive = db.prepare("SELECT COUNT(*) as c FROM lc_management WHERE status IN ('Issued','Amended','Utilized')").get().c;
    const bgActive = db.prepare("SELECT COUNT(*) as c FROM bank_guarantee WHERE status IN ('Aktif','Diperpanjang')").get().c;
    const kasbonOutstanding = db.prepare("SELECT COALESCE(SUM(jumlah_diminta), 0) as t FROM kasbon_request WHERE status IN ('Disetujui','Dicairkan')").get().t;
    const fxExposure = db.prepare("SELECT COALESCE(SUM(nominal_asal), 0) as t FROM fx_booking WHERE status = 'Booked' AND strftime('%Y-%m', tanggal_booking) = strftime('%Y-%m', 'now')").get().t;

    // Risk watchlist
    const fasilitasOverLimit = db.prepare('SELECT * FROM fasilitas_kredit WHERE status = ?').all('Aktif').filter(f => {
      const u = db.prepare("SELECT COALESCE(SUM(jumlah_diminta), 0) as t FROM kasbon_request WHERE fasilitas_kredit_id = ? AND status IN ('Disetujui','Dicairkan')").get(f.id).t;
      return f.limit_fasilitas > 0 && (u / f.limit_fasilitas) > 0.8;
    }).length;

    const lcExpiring = db.prepare("SELECT COUNT(*) as c FROM lc_management WHERE status IN ('Issued','Amended','Utilized') AND tanggal_expired IS NOT NULL AND julianday(tanggal_expired) - julianday('now') BETWEEN 0 AND 30").get().c;
    const bgExpiring = db.prepare("SELECT COUNT(*) as c FROM bank_guarantee WHERE status IN ('Aktif','Diperpanjang') AND tanggal_expired IS NOT NULL AND julianday(tanggal_expired) - julianday('now') BETWEEN 0 AND 30").get().c;
    const kasbonAging = db.prepare("SELECT COUNT(*) as c FROM kasbon_request WHERE status IN ('Disetujui','Dicairkan') AND julianday('now') - julianday(created_at) > 30").get().c;

    // AO staff
    const aoStaff = db.prepare("SELECT id, nama, employee_id, level_otoritas FROM users WHERE departemen = 'Account Officer' AND status_aktif = 1").all();

    res.json({
      kpi: { totalFasilitas, totalLimit, totalUtilisasi, utilisasiPersen: totalLimit > 0 ? parseFloat(((totalUtilisasi / totalLimit) * 100).toFixed(1)) : 0, lcActive, bgActive, kasbonOutstanding, fxExposure },
      risk: { fasilitasOverLimit, lcExpiring, bgExpiring, kasbonAging },
      aoStaff
    });
  } catch (error) { next(error); }
});

module.exports = router;
