const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { TransactionManager } = require('../../database/TransactionManager');
const { ConcurrencyConflictError, VersionRequiredError } = require('../../utils/errors');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');

function statusBadgeJO(totalInvoice, totalPaid) {
  if (totalPaid >= totalInvoice && totalInvoice > 0) return 'Lunas';
  if (totalPaid > 0) return 'Bayar Sebagian';
  return 'Belum Dibayar';
}

router.get('/job-orders/available-months', (req, res, next) => {
  try {
    const months = db.prepare(`
      SELECT DISTINCT
        strftime('%Y-%m', COALESCE(tanggal_invoice, created_at)) as month_key,
        strftime('%m', COALESCE(tanggal_invoice, created_at)) as bulan,
        strftime('%Y', COALESCE(tanggal_invoice, created_at)) as tahun
      FROM job_orders
      WHERE COALESCE(tanggal_invoice, created_at) IS NOT NULL
      ORDER BY month_key DESC
    `).all();
    res.json(months);
  } catch (error) { next(error); }
});

// A3: GET /job-orders/available-for-mtb
// Job orders yang belum masuk ke periode MTB manapun (untuk dropdown Tab MTB)
router.get('/job-orders/available-for-mtb', authenticateToken, (req, res, next) => {
  try {
    const { periode_id } = req.query;
    // Ambil JO yang belum punya transaksi MTB sama sekali, atau yang belum masuk periode_id ini
    const rows = db.prepare(`
      SELECT jo.id, jo.job_order_code, jo.cost_type, jo.total_invoice, jo.total_paid,
             jo.tanggal_invoice, jo.invoice_no,
             v.nama as vendor_nama
      FROM job_orders jo
      LEFT JOIN vendors v ON v.id = jo.vendor_id
      WHERE jo.payment_status != 'PAID'
        AND jo.id NOT IN (
          SELECT DISTINCT job_order_id FROM realisasi_mtb_transaksi
          WHERE job_order_id IS NOT NULL AND periode_id = COALESCE(?, periode_id)
        )
      ORDER BY jo.tanggal_invoice DESC
      LIMIT 100
    `).all(periode_id || null);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/job-orders', (req, res, next) => {
  try {
    const jos = db.prepare(`
      SELECT j.*, r.request_number as financial_request_number, s.id as s_id, s.un as s_un, s.shipment_code as s_code
      FROM job_orders j
      LEFT JOIN financial_requests r ON j.financial_request_id = r.id
      LEFT JOIN import_shipments s ON j.import_shipment_id = s.id
      ORDER BY j.created_at DESC
    `).all();
    const allPayments = db.prepare('SELECT * FROM payment_logs').all();
    const paymentsByJo = {};
    for (const p of allPayments) {
      if (!paymentsByJo[p.job_order_id]) paymentsByJo[p.job_order_id] = [];
      paymentsByJo[p.job_order_id].push(p);
    }
    jos.forEach(jo => { 
      if (jo.vendor_id) jo.vendor = db.prepare('SELECT id, nama FROM vendors WHERE id = ?').get(jo.vendor_id);
      jo.remaining_balance = jo.total_invoice - jo.total_paid;
      jo.status_badge = statusBadgeJO(jo.total_invoice, jo.total_paid);
      jo.payment_logs = paymentsByJo[jo.id] || [];
      if (jo.import_shipment_id) {
        jo.shipment = { id: jo.s_id, un: jo.s_un, shipment_code: jo.s_code };
      } else {
        jo.shipment = null;
      }
      delete jo.s_id; delete jo.s_un; delete jo.s_code;
    });
    res.json(jos);
  } catch (error) { next(error); }
});

router.post('/job-orders',authenticateToken, (req, res, next) => {
  try {
    let { job_order_code, vendor_id, vendor_nama, cost_type, dpp, persen_ppn, tanggal_invoice, tanggal_jatuh_tempo, import_shipment_id } = req.body;
    
    if (dpp === undefined) dpp = 0;
    if (persen_ppn === undefined) persen_ppn = 0;
    
    const ppn = dpp * persen_ppn / 100;
    const total_invoice = dpp + ppn;

    if (!job_order_code) {
      const lastJo = db.prepare('SELECT job_order_code FROM job_orders ORDER BY id DESC LIMIT 1').get();
      let nextNum = 1;
      if (lastJo && lastJo.job_order_code) {
        const match = lastJo.job_order_code.match(/JO-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      job_order_code = `JO-${String(nextNum).padStart(4, '0')}`;
    }

    if (!vendor_id && vendor_nama) {
      let vendor = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(vendor_nama);
      if (vendor) {
        vendor_id = vendor.id;
      } else {
        vendor_id = null;
      }
    }

    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, vendor_name, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, import_shipment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, vendor_nama || null, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, import_shipment_id || null);
    
    const newJo = db.prepare('SELECT * FROM job_orders WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newJo);
  } catch (error) { next(error); }
});

function autoGenerateFinancialRequest(shipmentId, userId, kategoriNama, biayaData) {
  const { inv, dpp, persenPpn, vendor } = biayaData;

  if (!inv || !dpp || dpp <= 0) return null;

  const shipment = db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(shipmentId);
  if (!shipment) return null;

  const existingRequestIds = JSON.parse(shipment.generated_request_ids || '{}');
  if (existingRequestIds[kategoriNama]) {
    db.prepare(`
      UPDATE financial_requests
      SET estimasi_nominal = ?,
          sumber_kategori = ?,
          updated_at = datetime('now')
      WHERE id = ? AND status = 'Draft'
    `).run(dpp + (dpp * (persenPpn || 0) / 100), kategoriNama, existingRequestIds[kategoriNama]);
    return existingRequestIds[kategoriNama];
  }

  const lastReq = db.prepare("SELECT request_number FROM financial_requests ORDER BY id DESC LIMIT 1").get();
  let nextNum = 1;
  if (lastReq) {
    const match = lastReq.request_number.match(/REQ-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const tahun = new Date().getFullYear().toString().slice(-2);
  const reqNumber = `REQ-${String(nextNum).padStart(4, '0')}-${tahun}`;

  const jenisMap = {
    'TRUC': 'Trucking',
    'LOLO': 'Lift On Lift Off',
    'DEPO': 'Storage',
    'LINE': 'Freight/DO',
    'OTHE (Perizinan)': 'Perizinan',
    'OTHE (PIB)': 'Customs/Bea Masuk',
    'OTHE (Customs Bond)': 'Customs/Bea Masuk',
    'OTHE (Other Cost)': 'Lainnya',
    'CLAIM': 'Lainnya',
  };
  let jenisPengajuan = 'Lainnya';
  for (const k of Object.keys(jenisMap)) {
    if (kategoriNama.includes(k)) {
      jenisPengajuan = jenisMap[k];
      break;
    }
  }

  const result = db.prepare(`
    INSERT INTO financial_requests (
      request_number, sumber, sumber_kategori,
      import_project_id, shipment_id,
      jenis_pengajuan, estimasi_nominal, mata_uang,
      vendor_nama_manual, keterangan, pic_id,
      status, departemen, created_by_id,
      created_at, updated_at
    ) VALUES (
      ?, 'import_operational', ?,
      ?, ?,
      ?, ?, 'IDR',
      ?, ?, ?,
      'Draft', 'Import', ?,
      datetime('now'), datetime('now')
    )
  `).run(
    reqNumber, kategoriNama,
    shipment.import_project_id, shipmentId,
    jenisPengajuan, dpp + (dpp * (persenPpn || 0) / 100),
    vendor && vendor !== 'Unknown' ? vendor : null,
    `Auto-generated dari Import Operational - ${kategoriNama}`,
    userId, userId
  );

  const newRequestId = result.lastInsertRowid;
  existingRequestIds[kategoriNama] = newRequestId;
  db.prepare("UPDATE import_shipments SET generated_request_ids = ? WHERE id = ?").run(JSON.stringify(existingRequestIds), shipmentId);

  return newRequestId;
}

router.post('/job-orders/sync-import', authenticateToken, validatePayload(['importShipmentId', 'activeCategories']), (req, res, next) => {
  try {
    const { importShipmentId, shipmentUn, activeCategories } = req.body;
    db.transaction(() => {
      if (!importShipmentId) throw new Error("import_shipment_id is required");
      let queryStr = 'SELECT * FROM job_orders WHERE import_shipment_id = ? AND sumber = ?';
      let queryParams = [importShipmentId, 'import_operational'];
      const prevRows = db.prepare(queryStr).all(...queryParams);
      const prevMap = new Map();
      prevRows.forEach(row => prevMap.set(row.import_category_key, row));
      const activeKeys = new Set();

      for (const cat of activeCategories) {
        if (!cat.inv || String(cat.inv).trim() === '' || cat.dpp <= 0) continue;
        activeKeys.add(cat.key);
        
        const existing = prevMap.get(cat.key);
        let status = 'Belum Dibayar';
        
        const dpp = cat.dpp || 0;
        const persenPpn = cat.persenPpn || 0;
        const ppn = cat.ppn || 0;
        const totalInvoice = cat.totalDenganPpn || 0;
        
        let vendorId = null;
        if (cat.vendor && cat.vendor !== 'Unknown') {
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) {
            vendorId = vendorObj.id;
          }
        }
        
        if (existing) {
          if (existing.total_paid >= totalInvoice && totalInvoice > 0) status = 'Lunas';
          else if (existing.total_paid > 0) status = 'Bayar Sebagian';
          
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ? AND id != ?').get(finalCode, existing.id);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          
          let reqId = null;
          if (importShipmentId) {
             reqId = autoGenerateFinancialRequest(importShipmentId, req.user.id, cat.name, cat);
          }

          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, invoice_no = ?, vendor_id = ?, cost_type = ?, dpp = ?, persen_ppn = ?, ppn = ?, total_invoice = ?, status_linked = ?, import_shipment_id = ?, financial_request_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, status, importShipmentId || null, reqId, existing.id);
        } else {
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          
          let reqId = null;
          if (importShipmentId) {
             reqId = autoGenerateFinancialRequest(importShipmentId, req.user.id, cat.name, cat);
          }

          db.prepare(`
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_jatuh_tempo, sumber, import_category_key, status_linked, import_shipment_id, financial_request_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, 'import_operational', cat.key, status, importShipmentId || null, reqId);
        }
      }

      for (const [key, row] of prevMap.entries()) {
        if (!activeKeys.has(key)) {
          if (row.total_paid === 0) {
            db.prepare('DELETE FROM job_orders WHERE id = ?').run(row.id);
          } else {
            db.prepare(`UPDATE job_orders SET sumber = 'terputus', updated_at = datetime('now') WHERE id = ?`).run(row.id);
          }
        }
      }
    })();
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/job-orders/:id/payments',authenticateToken, async (req, res, next) => {
  try {
    const { jumlah_bayar, tanggal_bayar, metode, version } = req.body;
    const joId = req.params.id;
    if (version == null) throw new VersionRequiredError();
    
    await TransactionManager.execute(async (tx) => {
      const jo = tx.db.prepare('SELECT total_invoice, total_paid FROM job_orders WHERE id = ?').get(joId);
      if (!jo) throw new Error('Job Order tidak ditemukan');
      
      if (jumlah_bayar > (jo.total_invoice - jo.total_paid)) {
        throw new Error('Jumlah bayar melebihi sisa tagihan');
      }
      
      tx.db.prepare('INSERT INTO payment_logs (job_order_id, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id) VALUES (?, ?, ?, ?, ?)').run(joId, jumlah_bayar, tanggal_bayar, metode, req.user.id);
      const info = tx.db.prepare(`UPDATE job_orders SET total_paid = total_paid + ?, updated_at = datetime('now'), version = version + 1 WHERE id = ? AND version = ?`).run(jumlah_bayar, joId, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.status(201).json({ success: true });
  } catch (error) { 
    if (error.message === 'Job Order tidak ditemukan') return res.status(404).json({ error: error.message });
    if (error.message === 'Jumlah bayar melebihi sisa tagihan') return res.status(400).json({ error: error.message });
    next(error); 
  }
});

router.delete('/job-orders/:id',authenticateToken, (req, res, next) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM payment_logs WHERE job_order_id = ?').run(req.params.id);
      db.prepare('DELETE FROM job_orders WHERE id = ?').run(req.params.id);
    })();
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ==========================================
// 9. DEBIT NOTES
// ==========================================
router.get('/debit-notes/available-months', (req, res, next) => {
  try {
    const months = db.prepare(`
      SELECT DISTINCT
        strftime('%Y-%m', tanggal_dn) as month_key,
        strftime('%m', tanggal_dn) as bulan,
        strftime('%Y', tanggal_dn) as tahun
      FROM debit_notes
      WHERE tanggal_dn IS NOT NULL
      ORDER BY month_key DESC
    `).all();
    res.json(months);
  } catch (error) { next(error); }
});

router.get('/debit-notes/summary',authenticateToken, (req, res, next) => {
  try {
    const { level_otoritas, departemen, id: userId } = req.user;
    const { bulan } = req.query;

    let query = `SELECT * FROM debit_notes WHERE 1=1`;
    const params = [];

    if (level_otoritas === 'Staff Dept') {
      query += ` AND dibuat_oleh_id = ?`;
      params.push(userId);
    } else if (level_otoritas === 'Supervisor') {
      query += ` AND departemen = ?`;
      params.push(departemen);
    }

    if (bulan) { query += ` AND strftime('%Y-%m', tanggal_dn) = ?`; params.push(bulan); }

    const dns = db.prepare(query).all(...params);

    let currencies = {};
    let dn_aktif = 0;

    dns.forEach(dn => {
      const c = dn.mata_uang || 'IDR';
      if (!currencies[c]) {
        currencies[c] = { total_klaim: 0, total_recovery: 0, outstanding: 0 };
      }
      currencies[c].total_klaim += (dn.jumlah_klaim || 0);
      if (dn.status === 'Settled') {
        currencies[c].total_recovery += (dn.jumlah_recovery || 0);
      }
      if (dn.status !== 'Draft' && dn.status !== 'Settled' && dn.status !== 'Ditolak') {
        dn_aktif++;
      }
    });
    
    Object.keys(currencies).forEach(c => {
      currencies[c].outstanding = currencies[c].total_klaim - currencies[c].total_recovery;
    });

    res.json({
      currencies,
      dn_aktif
    });
  } catch (error) { next(error); }
});

router.get('/debit-notes',authenticateToken, (req, res, next) => {
  try {
    const { level_otoritas, departemen, id: userId } = req.user;
    const { status, kategori, bulan, search } = req.query;

    let query = `
      SELECT dn.*, ip.task_unique_number, ip.supplier as project_supplier, u.nama as dibuat_oleh_nama, s.id as s_id, s.un as s_un, s.shipment_code as s_code
      FROM debit_notes dn
      LEFT JOIN import_projects ip ON dn.import_project_id = ip.id
      LEFT JOIN users u ON dn.dibuat_oleh_id = u.id
      LEFT JOIN import_shipments s ON dn.shipment_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (level_otoritas === 'Staff Dept') {
      query += ` AND dn.dibuat_oleh_id = ?`;
      params.push(userId);
    } else if (level_otoritas === 'Supervisor') {
      query += ` AND dn.departemen = ?`;
      params.push(departemen);
    }

    if (status) { query += ` AND dn.status = ?`; params.push(status); }
    if (kategori) { query += ` AND dn.claim_kategori = ?`; params.push(kategori); }
    if (bulan) { query += ` AND strftime('%Y-%m', dn.tanggal_dn) = ?`; params.push(bulan); }
    if (search) {
      query += ` AND (dn.dn_number LIKE ? OR dn.claim_kepada LIKE ? OR dn.deskripsi LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY dn.created_at DESC`;
    const dns = db.prepare(query).all(...params);
    dns.forEach(dn => {
      if (dn.shipment_id) {
        dn.shipment = { id: dn.s_id, un: dn.s_un, shipment_code: dn.s_code };
      } else {
        dn.shipment = null;
      }
      delete dn.s_id; delete dn.s_un; delete dn.s_code;
    });
    res.json(dns);
  } catch (error) { next(error); }
});

router.get('/debit-notes/:id', authenticateToken, (req, res, next) => {
  try {
    const { level_otoritas, departemen, id: userId } = req.user;
    
    const query = `
      SELECT dn.*, ip.task_unique_number, ip.supplier as project_supplier, u.nama as dibuat_oleh_nama, s.id as s_id, s.un as s_un, s.shipment_code as s_code
      FROM debit_notes dn
      LEFT JOIN import_projects ip ON dn.import_project_id = ip.id
      LEFT JOIN users u ON dn.dibuat_oleh_id = u.id
      LEFT JOIN import_shipments s ON dn.shipment_id = s.id
      WHERE dn.id = ?
    `;
    const dn = db.prepare(query).get(req.params.id);
    
    if (!dn) {
      return res.status(404).json({ error: 'Debit Note tidak ditemukan' });
    }

    if (level_otoritas === 'Staff Dept' && dn.dibuat_oleh_id !== userId) {
      return res.status(403).json({ error: 'Akses ditolak: Hanya pembuat yang dapat mengakses Debit Note ini.' });
    } else if (level_otoritas === 'Supervisor' && dn.departemen !== departemen) {
      return res.status(403).json({ error: 'Akses ditolak: Debit Note berada di luar otoritas departemen Anda.' });
    }

    if (dn.shipment_id) {
      dn.shipment = { id: dn.s_id, un: dn.s_un, shipment_code: dn.s_code };
    } else {
      dn.shipment = null;
    }
    delete dn.s_id; delete dn.s_un; delete dn.s_code;

    dn.history = db.prepare(`
      SELECT h.*, u.nama as diubah_oleh_nama 
      FROM debit_note_status_history h
      LEFT JOIN users u ON h.diubah_oleh_id = u.id
      WHERE h.debit_note_id = ?
      ORDER BY h.diubah_pada DESC
    `).all(dn.id);

    res.json(dn);
  } catch (error) { next(error); }
});

router.post('/debit-notes',authenticateToken, (req, res, next) => {
  try {
    const { import_project_id, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, tanggal_dn } = req.body;
    const dn_number = 'DN-' + Date.now();
    const departemen = req.user.departemen;

    let newId;
    db.transaction(() => {
      db.prepare(`
        INSERT INTO debit_notes (dn_number, import_project_id, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, departemen, dibuat_oleh_id, tanggal_dn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(dn_number, import_project_id, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id || null, mata_uang || 'IDR', departemen, req.user.id, tanggal_dn || new Date().toISOString().split('T')[0]);
      
      newId = db.prepare('SELECT last_insert_rowid()').pluck().get();
      db.prepare('INSERT INTO debit_note_status_history (debit_note_id, status_ke, catatan, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(newId, 'Draft', 'Debit note dibuat', req.user.id);
    })();
    res.status(201).json({ success: true, id: newId });
  } catch (error) { next(error); }
});

router.patch('/debit-notes/:id',authenticateToken, async (req, res, next) => {
  try {
    const { claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, tanggal_dn, version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const dn = tx.db.prepare('SELECT status FROM debit_notes WHERE id = ?').get(req.params.id);
      if (!dn || (dn.status !== 'Draft' && dn.status !== 'Diterbitkan')) {
        throw new Error('Hanya DN dengan status Draft atau Diterbitkan yang dapat diedit.');
      }
      const info = tx.db.prepare(`
        UPDATE debit_notes 
        SET claim_kategori=?, claim_jenis=?, claim_kepada=?, jumlah_klaim=?, deskripsi=?, linked_job_order_id=?, mata_uang=?, tanggal_dn=?, updated_at=datetime('now'), version = version + 1
        WHERE id = ? AND version = ?
      `).run(claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id || null, mata_uang, tanggal_dn, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/debit-notes/:id/status',authenticateToken, async (req, res, next) => {
  try {
    const { status_ke, catatan, version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    if (status_ke === 'Ditolak' && !catatan) {
      return res.status(400).json({ error: 'Catatan wajib diisi jika klaim Ditolak.' });
    }
    await TransactionManager.execute(async (tx) => {
      const dn = tx.db.prepare('SELECT status FROM debit_notes WHERE id = ?').get(req.params.id);
      const info = tx.db.prepare(`UPDATE debit_notes SET status = ?, updated_at = datetime('now'), version = version + 1 WHERE id = ? AND version = ?`).run(status_ke, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare('INSERT INTO debit_note_status_history (debit_note_id, status_dari, status_ke, catatan, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)').run(req.params.id, dn ? dn.status : '', status_ke, catatan || null, req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/debit-notes/:id/recovery',authenticateToken, async (req, res, next) => {
  try {
    const { jumlah_recovery, tanggal_recovery, version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(`UPDATE debit_notes SET jumlah_recovery = ?, tanggal_recovery = ?, updated_at = datetime('now'), version = version + 1 WHERE id = ? AND version = ?`).run(jumlah_recovery, tanggal_recovery, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/debit-notes/:id',authenticateToken, (req, res, next) => {
  try {
    const dn = db.prepare('SELECT status, dibuat_oleh_id, departemen FROM debit_notes WHERE id = ?').get(req.params.id);
    if (!dn) return res.status(404).json({ error: 'DN tidak ditemukan' });
    if (dn.status !== 'Draft') return res.status(403).json({ error: 'Hanya DN Draft yang bisa dihapus' });
    
    if (req.user.level_otoritas === 'Staff Dept' && dn.dibuat_oleh_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat menghapus DN milik Anda sendiri.' });
    } else if (req.user.level_otoritas === 'Supervisor' && dn.departemen !== req.user.departemen) {
      return res.status(403).json({ error: 'Anda hanya dapat menghapus DN di departemen Anda.' });
    } else if (req.user.level_otoritas === 'Manager') {
      return res.status(403).json({ error: 'Manager tidak dapat menghapus DN.' });
    }

    db.prepare('DELETE FROM debit_notes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ==========================================
// 10. REPORTS & DASHBOARDS
// ==========================================
router.get('/mtb-periode',authenticateToken, (req, res, next) => {
  try {
    const periodes = db.prepare('SELECT * FROM realisasi_mtb_periode ORDER BY id DESC').all();
    res.json(periodes);
  } catch (error) { next(error); }
});

router.post('/mtb-periode', authenticateToken, validatePayload(['nama_periode', 'tanggal_mulai', 'tanggal_selesai']), (req, res, next) => {
  try {
    const { nama_periode, tanggal_mulai, tanggal_selesai, saldo_awal } = req.body;
    const result = db.prepare(`
      INSERT INTO realisasi_mtb_periode (nama_periode, tanggal_mulai, tanggal_selesai, saldo_awal, saldo_akhir, prepared_by_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nama_periode, tanggal_mulai, tanggal_selesai, saldo_awal, saldo_awal, req.user.id);
    const newPeriode = db.prepare('SELECT * FROM realisasi_mtb_periode WHERE id = ?').get(result.lastInsertRowid);
    res.json(newPeriode);
  } catch (error) { next(error); }
});

router.delete('/mtb-periode/:id',authenticateToken, (req, res, next) => {
  try {
    const id = req.params.id;
    const tx = db.prepare('SELECT COUNT(*) as count FROM realisasi_mtb_transaksi WHERE periode_id = ?').get(id);
    if (tx && tx.count > 0) {
      return res.status(400).json({ error: 'Tidak dapat menghapus periode yang sudah memiliki transaksi. Hapus transaksi terlebih dahulu.' });
    }
    db.prepare('DELETE FROM realisasi_mtb_periode WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/mtb-periode/:id/status',authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tgl_dana_balik, version } = req.body;
    if (version == null) throw new VersionRequiredError();
    const userId = req.user.id;
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    await TransactionManager.execute(async (tx) => {
      let query = `UPDATE realisasi_mtb_periode SET status = ?, updated_at = ?, version = version + 1`;
      const params = [status, time];
      
      if (status === 'Submitted') { query += `, prepared_by_id = ?, prepared_at = ?`; params.push(userId, time); }
      else if (status === 'Checked1') { query += `, checked1_by_id = ?, checked1_at = ?`; params.push(userId, time); }
      else if (status === 'Checked2') { query += `, checked2_by_id = ?, checked2_at = ?`; params.push(userId, time); }
      else if (status === 'Checked3') { query += `, checked3_by_id = ?, checked3_at = ?`; params.push(userId, time); }
      else if (status === 'Approved') { 
        query += `, approved_by_id = ?, approved_at = ?, tgl_dana_balik = ?`; 
        params.push(userId, time, tgl_dana_balik || null); 
      }
      
      query += ` WHERE id = ? AND version = ?`;
      params.push(id, version);
      
      const info = tx.db.prepare(query).run(...params);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    
    const updated = db.prepare('SELECT * FROM realisasi_mtb_periode WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) { next(error); }
});

router.get('/mtb-periode/:id/transaksi',authenticateToken, (req, res, next) => {
  try {
    const tx = db.prepare('SELECT * FROM realisasi_mtb_transaksi WHERE periode_id = ? ORDER BY no_urut ASC, id ASC').all(req.params.id);
    res.json(tx);
  } catch (error) { next(error); }
});

// Helper to recalculate running balances for a periode
const recalculateRunningBalance = (periode_id) => {
  const periode = db.prepare('SELECT saldo_awal FROM realisasi_mtb_periode WHERE id = ?').get(periode_id);
  if (!periode) return;
  
  const txList = db.prepare('SELECT id, kredit, debet FROM realisasi_mtb_transaksi WHERE periode_id = ? ORDER BY no_urut ASC, id ASC').all(periode_id);
  
  let currentBalance = periode.saldo_awal || 0;
  let totalKredit = 0;
  let totalDebet = 0;
  
  const updateStmt = db.prepare('UPDATE realisasi_mtb_transaksi SET saldo_running = ?, no_urut = ? WHERE id = ?');
  
  db.transaction(() => {
    txList.forEach((tx, idx) => {
      const kredit = tx.kredit || 0;
      const debet = tx.debet || 0;
      currentBalance = currentBalance - kredit + debet;
      totalKredit += kredit;
      totalDebet += debet;
      updateStmt.run(currentBalance, idx + 1, tx.id);
    });
    
    db.prepare('UPDATE realisasi_mtb_periode SET saldo_akhir = ?, total_kredit = ?, total_debet = ?, version = version + 1 WHERE id = ?')
      .run(currentBalance, totalKredit, totalDebet, periode_id);
  })();
};

router.post('/mtb-transaksi', authenticateToken, validatePayload(['periode_id', 'category']), (req, res, next) => {
  try {
    const { periode_id, tgl_payment, unique_number, category, shipment, party, invoice_shipment, bl_number, no_kwitansi, amount_exclude_tax, vat, pot_pph23_diskon, materai_adm, adm_bank, debet, expense_gp } = req.body;
    
    const dp = amount_exclude_tax || 0;
    const v = vat || 0;
    const m = materai_adm || 0;
    const a = adm_bank || 0;
    const p = pot_pph23_diskon || 0;
    const d = debet || 0;
    const kredit = d > 0 ? 0 : (dp + v + m + a - p); // If it's a debet, kredit is 0
    
    // Attempt to link to import_project
    let ip_id = null;
    if (unique_number) {
      const ip = db.prepare('SELECT id FROM import_projects WHERE task_unique_number = ?').get(unique_number);
      if (ip) ip_id = ip.id;
    }

    db.prepare(`
      INSERT INTO realisasi_mtb_transaksi (
        periode_id, tgl_payment, unique_number, category, shipment, party, invoice_shipment, bl_number, no_kwitansi,
        amount_exclude_tax, vat, pot_pph23_diskon, materai_adm, adm_bank, kredit, debet, expense_gp, import_project_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(periode_id, tgl_payment, unique_number || null, category, shipment || null, party || null, invoice_shipment || null, bl_number || null, no_kwitansi || null, dp, v, p, m, a, kredit, d, expense_gp || null, ip_id);
    
    recalculateRunningBalance(periode_id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/mtb-transaksi/:id',authenticateToken, (req, res, next) => {
  try {
    const tx = db.prepare('SELECT periode_id FROM realisasi_mtb_transaksi WHERE id = ?').get(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    
    db.prepare('DELETE FROM realisasi_mtb_transaksi WHERE id = ?').run(req.params.id);
    recalculateRunningBalance(tx.periode_id);
    res.json({ success: true });
  } catch (error) { next(error); }
});
// A10: PUT /mtb-transaksi/:id — Edit transaksi MTB yang sudah ada
router.put('/mtb-transaksi/:id', authenticateToken, (req, res, next) => {
  try {
    const { tgl_payment, unique_number, category, shipment, party, invoice_shipment, bl_number, no_kwitansi, amount_exclude_tax, vat, pot_pph23_diskon, materai_adm, adm_bank, debet, expense_gp } = req.body;
    const tx = db.prepare('SELECT id, periode_id FROM realisasi_mtb_transaksi WHERE id = ?').get(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    const dp = amount_exclude_tax || 0;
    const v = vat || 0;
    const m = materai_adm || 0;
    const a = adm_bank || 0;
    const p = pot_pph23_diskon || 0;
    const d = debet || 0;
    const kredit = d > 0 ? 0 : (dp + v + m + a - p);
    let ip_id = null;
    if (unique_number) {
      const ip = db.prepare('SELECT id FROM import_projects WHERE task_unique_number = ?').get(unique_number);
      if (ip) ip_id = ip.id;
    }
    db.prepare(`
      UPDATE realisasi_mtb_transaksi SET
        tgl_payment = ?, unique_number = ?, category = ?, shipment = ?, party = ?,
        invoice_shipment = ?, bl_number = ?, no_kwitansi = ?,
        amount_exclude_tax = ?, vat = ?, pot_pph23_diskon = ?, materai_adm = ?, adm_bank = ?,
        kredit = ?, debet = ?, expense_gp = ?, import_project_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(tgl_payment, unique_number || null, category, shipment || null, party || null, invoice_shipment || null, bl_number || null, no_kwitansi || null, dp, v, p, m, a, kredit, d, expense_gp || null, ip_id, req.params.id);
    recalculateRunningBalance(tx.periode_id);
    res.json({ success: true });
  } catch (error) { next(error); }
});


// ==========================================
router.get('/pib',authenticateToken, (req, res, next) => {
  try {
    const pibList = db.prepare('SELECT * FROM realisasi_pib ORDER BY id DESC').all();
    res.json(pibList);
  } catch (error) { next(error); }
});

router.post('/pib',authenticateToken, (req, res, next) => {
  try {
    const { no_kas, tgl_payment, unique_number, shipment, party, invoice, bl, aju_pib, amount_kasbon, bm, ppn, pph, expense_gp, periode } = req.body;
    
    const valKasbon = amount_kasbon || 0;
    const valBm = bm || 0;
    const valPpn = ppn || 0;
    const valPph = pph || 0;
    const totalPib = valBm + valPpn + valPph;
    const lebihKurang = valKasbon - totalPib;
    
    let ip_id = null;
    if (unique_number) {
      const ip = db.prepare('SELECT id FROM import_projects WHERE task_unique_number = ?').get(unique_number);
      if (ip) ip_id = ip.id;
    }

    const result = db.prepare(`
      INSERT INTO realisasi_pib (
        no_kas, tgl_payment, unique_number, shipment, party, invoice, bl, aju_pib,
        amount_kasbon, bm, ppn, pph, total_pib_realisasi, lebih_kurang, expense_gp, periode, import_project_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(no_kas, tgl_payment, unique_number || null, shipment || null, party || null, invoice || null, bl || null, aju_pib || null,
      valKasbon, valBm, valPpn, valPph, totalPib, lebihKurang, expense_gp || null, periode || null, ip_id);
      
    const newPib = db.prepare('SELECT * FROM realisasi_pib WHERE id = ?').get(result.lastInsertRowid);
    res.json(newPib);
  } catch (error) { next(error); }
});

router.patch('/pib/:id/status',authenticateToken, async (req, res, next) => {
  try {
    const { status, version } = req.body;
    if (version == null) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(`UPDATE realisasi_pib SET status = ?, verified_by_id = ?, verified_at = datetime('now', 'localtime'), version = version + 1 WHERE id = ? AND version = ?`)
        .run(status, req.user.id, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/pib/:id',authenticateToken, (req, res, next) => {
  try {
    db.prepare('DELETE FROM realisasi_pib WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/realisasi/summary',authenticateToken, (req, res, next) => {
  try {
    const mtbTxList = db.prepare('SELECT unique_number, amount_exclude_tax, vat, materai_adm, adm_bank, pot_pph23_diskon, debet FROM realisasi_mtb_transaksi WHERE unique_number IS NOT NULL').all();
    const pibList = db.prepare('SELECT unique_number, status, total_pib_realisasi FROM realisasi_pib WHERE unique_number IS NOT NULL').all();
    
    res.json({ mtbTxList, pibList });
  } catch (error) { next(error); }
});

// START
// ==========================================
// FINANCIAL REQUESTS
// ==========================================

router.get('/financial-requests',authenticateToken, (req, res, next) => {
  try {
    const { status, jenis, bulan } = req.query;
    let query = `
      SELECT r.*,
             u1.nama as pic_nama,
             u2.nama as approved_by_nama,
             p.task_unique_number as import_project_number,
             v.nama as vendor_nama
      FROM financial_requests r
      LEFT JOIN users u1 ON r.pic_id = u1.id
      LEFT JOIN users u2 ON r.approved_by_id = u2.id
      LEFT JOIN import_projects p ON r.import_project_id = p.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    // Authorization Scope Filter
    if (req.user.level_otoritas !== 'Manager' && !['Finance', 'Account Officer'].includes(req.user.departemen)) {
      query += ' AND r.departemen = ?';
      params.push(req.user.departemen);
    }

    if (status) { query += ' AND r.status = ?'; params.push(status); }
    if (jenis) { query += ' AND r.jenis_pengajuan = ?'; params.push(jenis); }
    if (bulan) { query += ' AND strftime("%Y-%m", r.created_at) = ?'; params.push(bulan); }
    query += ' ORDER BY r.created_at DESC';
    const rows = db.prepare(query).all(...params);

    // Data Minimization
    const isFinanceOrManager = ['Finance', 'Account Officer'].includes(req.user.departemen) || req.user.level_otoritas === 'Manager';
    rows.forEach(row => {
      if (!isFinanceOrManager) {
        delete row.catatan_approval; // Internal finance/manager notes
      }
    });

    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/financial-requests/summary',authenticateToken, (req, res, next) => {
  try {
    const nowMonth = new Date().toISOString().slice(0, 7);
    const pendingCount = db.prepare("SELECT COUNT(*) as c FROM financial_requests WHERE status = 'Submitted'").get().c;
    const pendingTotal = db.prepare("SELECT SUM(estimasi_nominal) as t FROM financial_requests WHERE status = 'Submitted'").get().t || 0;
    const approvedThisMonth = db.prepare("SELECT COUNT(*) as c FROM financial_requests WHERE status = 'Approved' AND strftime('%Y-%m', approved_at) = ?").get(nowMonth).c;
    const totalRequests = db.prepare("SELECT COUNT(*) as c FROM financial_requests").get().c;
    const rejectedRequests = db.prepare("SELECT COUNT(*) as c FROM financial_requests WHERE status = 'Rejected'").get().c;
    const rejectionRate = totalRequests === 0 ? 0 : Math.round((rejectedRequests / totalRequests) * 100);
    
    res.json({
      pendingCount,
      pendingTotal,
      approvedThisMonth,
      rejectionRate
    });
  } catch (error) { next(error); }
});

router.get('/financial-requests/pending',authenticateToken, (req, res, next) => {
  try {
    const departemen = req.user.role; // Assuming role represents departemen or similar access level for SPV
    let query = `
      SELECT r.*,
             u1.nama as pic_nama,
             p.task_unique_number as import_project_number,
             v.nama as vendor_nama
      FROM financial_requests r
      LEFT JOIN users u1 ON r.pic_id = u1.id
      LEFT JOIN import_projects p ON r.import_project_id = p.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.status = 'Submitted'
    `;
    const params = [];

    // Authorization Scope Filter
    if (req.user.level_otoritas !== 'Manager' && !['Finance', 'Account Officer'].includes(req.user.departemen)) {
      query += ' AND r.departemen = ?';
      params.push(req.user.departemen);
    }

    query += ' ORDER BY r.submitted_at DESC';
    const rows = db.prepare(query).all(...params);

    // Data Minimization
    const isFinanceOrManager = ['Finance', 'Account Officer'].includes(req.user.departemen) || req.user.level_otoritas === 'Manager';
    rows.forEach(row => {
      if (!isFinanceOrManager) {
        delete row.catatan_approval;
      }
    });

    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/financial-requests',authenticateToken, (req, res, next) => {
  try {
    const { import_project_id, shipment_id, aju_pib, jenis_pengajuan, vendor_id, vendor_nama_manual, estimasi_nominal, mata_uang, keterangan, file_lampiran_path } = req.body;
    
    const lastReq = db.prepare("SELECT request_number FROM financial_requests ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastReq) {
      const match = lastReq.request_number.match(/REQ-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const tahun = new Date().getFullYear().toString().slice(-2);
    const reqNumber = `REQ-${String(nextNum).padStart(4, '0')}-${tahun}`;

    const info = db.prepare(`
      INSERT INTO financial_requests (
        request_number, sumber, import_project_id, shipment_id, aju_pib, jenis_pengajuan,
        vendor_id, vendor_nama_manual, estimasi_nominal, mata_uang, keterangan, file_lampiran_path,
        pic_id, departemen, created_by_id
      ) VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(reqNumber, import_project_id || null, shipment_id || null, aju_pib || null, jenis_pengajuan,
      vendor_id || null, vendor_nama_manual || null, estimasi_nominal || 0, mata_uang || 'IDR', keterangan || null,
      file_lampiran_path || null, req.user.id, req.user.departemen || 'Import', req.user.id);
    
    const newReq = db.prepare('SELECT * FROM financial_requests WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newReq);
  } catch (error) { next(error); }
});

router.patch('/financial-requests/:id',authenticateToken, async (req, res, next) => {
  try {
    const { estimasi_nominal, keterangan, file_lampiran_path, vendor_id, vendor_nama_manual, version } = req.body;
    if (version == null) throw new VersionRequiredError();

    // Verify ownership
    const reqData = db.prepare('SELECT departemen FROM financial_requests WHERE id = ?').get(req.params.id);
    if (!reqData) return res.status(404).json({ error: 'Request tidak ditemukan' });
    if (req.user.level_otoritas !== 'Manager' && !['Finance', 'Account Officer'].includes(req.user.departemen) && reqData.departemen !== req.user.departemen) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(`
        UPDATE financial_requests 
        SET estimasi_nominal = COALESCE(?, estimasi_nominal),
            keterangan = COALESCE(?, keterangan),
            file_lampiran_path = COALESCE(?, file_lampiran_path),
            vendor_id = COALESCE(?, vendor_id),
            vendor_nama_manual = COALESCE(?, vendor_nama_manual),
            updated_at = datetime('now'),
            version = version + 1
        WHERE id = ? AND version = ? AND status = 'Draft'
      `).run(estimasi_nominal, keterangan, file_lampiran_path, vendor_id, vendor_nama_manual, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/financial-requests/:id/submit',authenticateToken, async (req, res, next) => {
  try {
    const { version } = req.body;
    if (version == null) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const current = tx.db.prepare('SELECT status FROM financial_requests WHERE id = ?').get(req.params.id);
      const info = tx.db.prepare(`
        UPDATE financial_requests
        SET status = 'Submitted', submitted_at = datetime('now'), submitted_by_id = ?, updated_at = datetime('now'), version = version + 1
        WHERE id = ? AND version = ? AND status IN ('Draft', 'Rejected')
      `).run(req.user.id, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare(`
        INSERT INTO financial_request_history (request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, ?, 'Submitted', ?)
      `).run(req.params.id, current?.status || 'Draft', req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/financial-requests/:id/approve',authenticateToken, async (req, res, next) => {
  try {
    // Only Manager or Finance can approve
    if (req.user.level_otoritas !== 'Manager' && !['Finance', 'Account Officer'].includes(req.user.departemen)) {
      return res.status(403).json({ error: 'Hanya Manager atau Finance yang dapat melakukan approval.' });
    }

    const { version } = req.body;
    if (version == null) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(`
        UPDATE financial_requests
        SET status = 'Approved', approved_at = datetime('now'), approved_by_id = ?, updated_at = datetime('now'), version = version + 1
        WHERE id = ? AND version = ? AND status = 'Submitted'
      `).run(req.user.id, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare(`
        INSERT INTO financial_request_history (request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, 'Submitted', 'Approved', ?)
      `).run(req.params.id, req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/financial-requests/:id/reject',authenticateToken, async (req, res, next) => {
  try {
    // Only Manager or Finance can reject
    if (req.user.level_otoritas !== 'Manager' && !['Finance', 'Account Officer'].includes(req.user.departemen)) {
      return res.status(403).json({ error: 'Hanya Manager atau Finance yang dapat menolak pengajuan.' });
    }

    const { catatan, version } = req.body;
    if (!catatan) throw new Error("Catatan wajib diisi untuk penolakan");
    if (version == null) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(`
        UPDATE financial_requests
        SET status = 'Rejected', rejected_at = datetime('now'), rejected_by_id = ?, catatan_approval = ?, updated_at = datetime('now'), version = version + 1
        WHERE id = ? AND version = ? AND status = 'Submitted'
      `).run(req.user.id, catatan, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare(`
        INSERT INTO financial_request_history (request_id, status_dari, status_ke, catatan, dilakukan_oleh_id)
        VALUES (?, 'Submitted', 'Rejected', ?, ?)
      `).run(req.params.id, catatan, req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/financial-requests/:id/cancel',authenticateToken, (req, res, next) => {
  try {
    let current;
    db.transaction(() => {
      current = db.prepare("SELECT status FROM financial_requests WHERE id = ?").get(req.params.id);
      if (!current) return;
      db.prepare(`
        UPDATE financial_requests
        SET status = 'Cancelled', updated_at = datetime('now')
        WHERE id = ?
      `).run(req.params.id);
      db.prepare(`
        INSERT INTO financial_request_history (request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, ?, 'Cancelled', ?)
      `).run(req.params.id, current.status, 'Cancelled', req.user.id);
    })();
    if (!current) return res.status(404).json({ error: 'Request tidak ditemukan' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/financial-requests/:id/history',authenticateToken, (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT h.*, u.nama as dilakukan_oleh_nama
      FROM financial_request_history h
      LEFT JOIN users u ON h.dilakukan_oleh_id = u.id
      WHERE h.request_id = ?
      ORDER BY h.dilakukan_pada DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (error) { next(error); }
});


// START
// ==========================================
// PIB REQUESTS
// ==========================================

router.get('/pib-requests',authenticateToken, (req, res, next) => {
  try {
    const { status, import_project, bulan } = req.query;
    let query = `
      SELECT r.*,
             u1.nama as pic_nama,
             u2.nama as approved_by_nama,
             p.task_unique_number as import_project_number,
             s.shipment_code as no_shipment
      FROM pib_requests r
      LEFT JOIN users u1 ON r.created_by_id = u1.id
      LEFT JOIN users u2 ON r.approved_by_id = u2.id
      LEFT JOIN import_projects p ON r.import_project_id = p.id
      LEFT JOIN import_shipments s ON r.shipment_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ' AND r.status = ?'; params.push(status); }
    if (import_project) { query += ' AND r.import_project_id = ?'; params.push(import_project); }
    if (bulan) { query += ' AND strftime("%Y-%m", r.created_at) = ?'; params.push(bulan); }
    query += ' ORDER BY r.created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/pib-requests/summary',authenticateToken, (req, res, next) => {
  try {
    const nowMonth = new Date().toISOString().slice(0, 7);
    const draftCount = db.prepare("SELECT COUNT(*) as c FROM pib_requests WHERE status = 'Draft'").get().c;
    const pendingCount = db.prepare("SELECT COUNT(*) as c FROM pib_requests WHERE status = 'Submitted'").get().c;
    const approvedThisMonth = db.prepare("SELECT COUNT(*) as c FROM pib_requests WHERE status = 'Approved' AND strftime('%Y-%m', approved_at) = ?").get(nowMonth).c;
    const pendingTotalKasbon = db.prepare("SELECT SUM(kasbon_diminta) as t FROM pib_requests WHERE status IN ('Submitted','Approved','Realized')").get().t || 0;
    
    res.json({
      draftCount,
      pendingCount,
      approvedThisMonth,
      currencies: {
        'IDR': {
          pendingTotalKasbon
        }
      }
    });
  } catch (error) { next(error); }
});

router.get('/pib-requests/pending',authenticateToken, (req, res, next) => {
  try {
    const query = `
      SELECT r.*,
             u1.nama as pic_nama,
             p.task_unique_number as import_project_number
      FROM pib_requests r
      LEFT JOIN users u1 ON r.created_by_id = u1.id
      LEFT JOIN import_projects p ON r.import_project_id = p.id
      WHERE r.status = 'Submitted'
      ORDER BY r.submitted_at ASC
    `;
    const rows = db.prepare(query).all();
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/pib-requests/:id',authenticateToken, (req, res, next) => {
  try {
    const row = db.prepare(`
      SELECT r.*,
             p.task_unique_number as import_project_number,
             s.shipment_code as no_shipment
      FROM pib_requests r
      LEFT JOIN import_projects p ON r.import_project_id = p.id
      LEFT JOIN import_shipments s ON r.shipment_id = s.id
      WHERE r.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (error) { next(error); }
});

router.post('/pib-requests', authenticateToken, validatePayload(['import_project_id', 'aju_pib']), (req, res, next) => {
  try {
    const { import_project_id, shipment_id, aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, kasbon_diminta, no_invoice_pib, bl_number, keterangan } = req.body;
    
    const lastReq = db.prepare("SELECT request_number FROM pib_requests ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastReq) {
      const match = lastReq.request_number.match(/PIB-REQ-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const tahun = new Date().getFullYear().toString().slice(-2);
    const reqNumber = `PIB-REQ-${String(nextNum).padStart(4, '0')}-${tahun}`;

    const estTotal = (parseFloat(estimasi_bm) || 0) + (parseFloat(estimasi_ppn) || 0) + (parseFloat(estimasi_pph) || 0);

    const info = db.prepare(`
      INSERT INTO pib_requests (
        request_number, import_project_id, shipment_id, aju_pib, tanggal_pengajuan,
        estimasi_bm, estimasi_ppn, estimasi_pph, estimasi_total, kasbon_diminta,
        no_invoice_pib, bl_number,
        created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reqNumber, import_project_id, shipment_id || null, aju_pib, tanggal_pengajuan || new Date().toISOString().slice(0, 10),
      estimasi_bm || 0, estimasi_ppn || 0, estimasi_pph || 0, estTotal, kasbon_diminta || 0,
      no_invoice_pib || null, bl_number || null,
      req.user.id
    );
    
    db.prepare(`INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id) VALUES (?, NULL, 'Draft', ?, ?)`).run(info.lastInsertRowid, keterangan || 'Created', req.user.id);
    
    const newReq = db.prepare('SELECT * FROM pib_requests WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newReq);
  } catch (error) { next(error); }
});

router.patch('/pib-requests/:id',authenticateToken, async (req, res, next) => {
  try {
    const { aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, kasbon_diminta, no_invoice_pib, bl_number, version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    const estTotal = (parseFloat(estimasi_bm) || 0) + (parseFloat(estimasi_ppn) || 0) + (parseFloat(estimasi_pph) || 0);
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(`
        UPDATE pib_requests 
        SET aju_pib = COALESCE(?, aju_pib),
            tanggal_pengajuan = COALESCE(?, tanggal_pengajuan),
            estimasi_bm = COALESCE(?, estimasi_bm),
            estimasi_ppn = COALESCE(?, estimasi_ppn),
            estimasi_pph = COALESCE(?, estimasi_pph),
            estimasi_total = COALESCE(?, estimasi_total),
            kasbon_diminta = COALESCE(?, kasbon_diminta),
            no_invoice_pib = COALESCE(?, no_invoice_pib),
            bl_number = COALESCE(?, bl_number),
            updated_at = datetime('now'),
            version = version + 1
        WHERE id = ? AND status = 'Draft' AND version = ?
      `).run(aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, estTotal, kasbon_diminta, no_invoice_pib, bl_number, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/pib-requests/:id/submit',authenticateToken, async (req, res, next) => {
  try {
    const { version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(`
        UPDATE pib_requests
        SET status = 'Submitted', submitted_at = datetime('now'), submitted_by_id = ?, updated_at = datetime('now'), version = version + 1
        WHERE id = ? AND status IN ('Draft', 'Rejected') AND version = ?
      `).run(req.user.id, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare(`
        INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, 'Draft', 'Submitted', ?)
      `).run(req.params.id, req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/pib-requests/:id/approve',authenticateToken, async (req, res, next) => {
  try {
    if (req.user.level_otoritas !== 'Supervisor' && req.user.level_otoritas !== 'Manager') {
      return res.status(403).json({ error: 'Hanya SPV/Manager yang bisa approve' });
    }

    const { version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    await TransactionManager.execute(async (tx) => {
      const pibReq = tx.db.prepare('SELECT * FROM pib_requests WHERE id = ?').get(req.params.id);
      if (!pibReq) throw new Error('PIB Request tidak ditemukan');
      if (pibReq.status !== 'Submitted') throw new Error('Hanya Request berstatus Submitted yang bisa diapprove');

      const now = new Date().toISOString();

      const info = tx.db.prepare(`
        UPDATE pib_requests SET
          status = \'Approved\', approved_by_id = ?, approved_at = ?, updated_at = ?, version = version + 1
        WHERE id = ? AND version = ?
      `).run(req.user.id, now, now, pibReq.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();

      tx.db.prepare(`
        INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id, dilakukan_pada)
        VALUES (?, 'Submitted', 'Approved', ?, ?, ?)
      `).run(pibReq.id, req.body.catatan || null, req.user.id, now);

      if (pibReq.shipment_id) {
        const shipment = tx.db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(pibReq.shipment_id);
        if (shipment) {
          const costs = JSON.parse(shipment.costs || '{}');
          if (!costs['OTHE (PIB)']) {
            costs['OTHE (PIB)'] = {
              no_aju_pib: pibReq.aju_pib,
              bm: pibReq.estimasi_bm || 0,
              ppn: pibReq.estimasi_ppn || 0,
              pph: pibReq.estimasi_pph || 0,
              total_pib: pibReq.estimasi_total || 0,
              _dari_pib_request: pibReq.id,
              _kasbon: pibReq.kasbon_diminta
            };
            tx.db.prepare('UPDATE import_shipments SET costs = ?, pib_request_id = ? WHERE id = ?').run(JSON.stringify(costs), pibReq.id, shipment.id);
          }
          tx.db.prepare('UPDATE pib_requests SET othe_pib_synced = 1 WHERE id = ?').run(pibReq.id);
        }
      }

      const existingRealisasi = tx.db.prepare('SELECT id FROM realisasi_pib WHERE pib_request_id = ?').get(pibReq.id);
      if (!existingRealisasi) {
        const lastRealisasi = tx.db.prepare("SELECT no_kas FROM realisasi_pib ORDER BY id DESC LIMIT 1").get();
        const tahun = new Date().getFullYear().toString().slice(-2);
        let nextNum = 1;
        if (lastRealisasi?.no_kas) {
          const match = lastRealisasi.no_kas.match(/(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }
        const noKas = `${String(nextNum).padStart(3, '0')}-${tahun}PIB-IMP`;

        const realisasiId = tx.db.prepare(`
          INSERT INTO realisasi_pib (
            no_kas, tgl_payment, unique_number,
            bl, aju_pib, amount_kasbon,
            bm, ppn, pph, total_pib_realisasi, lebih_kurang,
            pib_request_id, import_project_id, status,
            departemen, created_at, updated_at
          ) VALUES (
            ?, ?, ?,
            ?, ?, ?,
            0, 0, 0, 0, ?,
            ?, ?, 'Draft',
            'Import', datetime('now'), datetime('now')
          )
        `).run(
          noKas, now.slice(0, 10), pibReq.aju_pib,
          pibReq.bl_number || null, pibReq.aju_pib, pibReq.kasbon_diminta,
          pibReq.kasbon_diminta,
          pibReq.id, pibReq.import_project_id
        ).lastInsertRowid;

        tx.db.prepare('UPDATE pib_requests SET realisasi_pib_id = ? WHERE id = ?').run(realisasiId, pibReq.id);
      }

      // ✨ TRIGGER: Auto-create kasbon_request for AO module
      if (pibReq.kasbon_diminta > 0) {
        const existingKasbon = tx.db.prepare('SELECT id FROM kasbon_request WHERE pib_request_id = ?').get(pibReq.id);
        if (!existingKasbon) {
          const lastKasbon = tx.db.prepare("SELECT kasbon_number FROM kasbon_request ORDER BY id DESC LIMIT 1").get();
          const tahunKsb = new Date().getFullYear().toString().slice(-2);
          let nextKsbNum = 1;
          if (lastKasbon?.kasbon_number) {
            const m = lastKasbon.kasbon_number.match(/(\d{4})/);
            if (m) nextKsbNum = parseInt(m[1]) + 1;
          }
          const kasbonNumber = `KSB-${String(nextKsbNum).padStart(4, '0')}-${tahunKsb}`;
          tx.db.prepare(`
            INSERT INTO kasbon_request (kasbon_number, sumber, pib_request_id, import_project_id, jumlah_diminta, keterangan, status, diajukan_oleh_id, created_at, updated_at)
            VALUES (?, 'pib_request', ?, ?, ?, ?, 'Diajukan', ?, datetime('now'), datetime('now'))
          `).run(kasbonNumber, pibReq.id, pibReq.import_project_id, pibReq.kasbon_diminta, `Kasbon untuk PIB ${pibReq.request_number}`, pibReq.submitted_by_id || req.user.id);
        }
      }
    });
    res.json({ success: true, message: 'PIB Request diapprove. OTHE dan Realisasi PIB sudah dibuat otomatis.' });
  } catch (error) { next(error); }
});

router.patch('/pib-requests/:id/reject',authenticateToken, async (req, res, next) => {
  try {
    const { version } = req.body;
    if (version === undefined) throw new VersionRequiredError();
    if (req.user.level_otoritas !== 'Supervisor' && req.user.level_otoritas !== 'Manager') {
      return res.status(403).json({ error: 'Hanya SPV/Manager yang bisa reject' });
    }
    await TransactionManager.execute(async (tx) => {
      const info = tx.db.prepare(`
        UPDATE pib_requests SET
          status = 'Rejected', rejected_by_id = ?, rejected_at = datetime('now'), catatan_approval = ?, updated_at = datetime('now'), version = version + 1
        WHERE id = ? AND status = 'Submitted' AND version = ?
      `).run(req.user.id, req.body.catatan, req.params.id, version);
      if (info.changes === 0) throw new ConcurrencyConflictError();
      tx.db.prepare(`
        INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id)
        VALUES (?, 'Submitted', 'Rejected', ?, ?)
      `).run(req.params.id, req.body.catatan, req.user.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/pib-requests/:id/history',authenticateToken, (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT h.*, u.nama as dilakukan_oleh_nama
      FROM pib_request_history h
      LEFT JOIN users u ON h.dilakukan_oleh_id = u.id
      WHERE h.pib_request_id = ?
      ORDER BY h.dilakukan_pada DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (error) { next(error); }
});

// A5: PATCH /pib-requests/:id/realize
// Realisasi PIB setelah disetujui — update aktual bea masuk, ppn, pph
router.patch('/pib-requests/:id/realize', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), (req, res, next) => {
  try {
    const { aktual_bm, aktual_ppn, aktual_pph, no_invoice_pib, bl_number } = req.body;
    const pib = db.prepare('SELECT id, status, import_project_id FROM pib_requests WHERE id = ?').get(req.params.id);
    if (!pib) return res.status(404).json({ error: 'PIB Request tidak ditemukan' });
    if (pib.status !== 'Approved') return res.status(400).json({ error: 'Hanya PIB berstatus Approved yang dapat direalisasi' });
    const aktualTotal = (aktual_bm || 0) + (aktual_ppn || 0) + (aktual_pph || 0);
    const kasbon = db.prepare('SELECT kasbon_diminta FROM pib_requests WHERE id = ?').get(req.params.id);
    const lebihKurang = (kasbon?.kasbon_diminta || 0) - aktualTotal;
    db.prepare(`
      UPDATE pib_requests SET
        aktual_bm = ?, aktual_ppn = ?, aktual_pph = ?, aktual_total = ?,
        lebih_kurang = ?, no_invoice_pib = ?, bl_number = ?,
        status = 'Realized', updated_at = datetime('now')
      WHERE id = ?
    `).run(aktual_bm || 0, aktual_ppn || 0, aktual_pph || 0, aktualTotal, lebihKurang, no_invoice_pib || null, bl_number || null, req.params.id);
    db.prepare(`INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id) VALUES (?, 'Approved', 'Realized', 'Realisasi PIB', ?)`).run(req.params.id, req.user.id);
    res.json({ success: true, aktual_total: aktualTotal, lebih_kurang: lebihKurang });
  } catch (error) { next(error); }
});

// A4: PATCH /pib-requests/:id/settle
// Selesaikan / tutup PIB setelah semua proses selesai
router.patch('/pib-requests/:id/settle', authenticateToken, requireRole(['Manager', 'Supervisor']), (req, res, next) => {
  try {
    const pib = db.prepare('SELECT id, status FROM pib_requests WHERE id = ?').get(req.params.id);
    if (!pib) return res.status(404).json({ error: 'PIB Request tidak ditemukan' });
    if (!['Realized', 'Approved'].includes(pib.status)) return res.status(400).json({ error: 'PIB harus berstatus Realized atau Approved untuk diselesaikan' });
    db.prepare(`UPDATE pib_requests SET status = 'Settled', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    db.prepare(`INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id) VALUES (?, ?, 'Settled', 'PIB diselesaikan', ?)`).run(req.params.id, pib.status, req.user.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;