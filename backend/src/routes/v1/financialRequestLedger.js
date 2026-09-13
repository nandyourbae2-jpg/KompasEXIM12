const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');

// 1. GET /api/financial-request-ledger/by-project
router.get('/financial-request-ledger/by-project', authenticateToken, authorizeDepartment(), (req, res, next) => {
  try {
    const projects = db.prepare(`
      SELECT
        ip.id as import_project_id,
        ip.task_unique_number,
        ip.supplier,
        COUNT(frl.id) as jumlah_total,
        SUM(CASE WHEN frl.status != 'Pending' THEN 1 ELSE 0 END) as jumlah_terisi,
        SUM(frl.baseline_amount) as total_baseline,
        SUM(frl.actual_amount) as total_actual
      FROM import_projects ip
      LEFT JOIN financial_request_ledger frl ON frl.import_project_id = ip.id
      GROUP BY ip.id
      ORDER BY ip.created_at DESC
    `).all();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/financial-request-ledger (Detail per project)
router.get('/financial-request-ledger', authenticateToken, authorizeDepartment(), (req, res, next) => {
  try {
    const { import_project_id } = req.query;
    if (!import_project_id) {
      return res.status(400).json({ error: 'import_project_id is required' });
    }

    const rows = db.prepare(`
      SELECT 
        frl.*, 
        ip.task_unique_number 
      FROM financial_request_ledger frl
      JOIN import_projects ip ON ip.id = frl.import_project_id
      WHERE frl.import_project_id = ?
    `).all(import_project_id);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// 3. POST /api/financial-request-ledger/manual (Add manual cost)
router.post('/financial-request-ledger/manual', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), authorizeDepartment(), validatePayload(['import_project_id', 'keterangan']), (req, res, next) => {
  try {
    const { import_project_id, keterangan, vendor_nama, invoice_no, dpp, persen_ppn, cost_category } = req.body;

    if (!import_project_id || !keterangan?.trim()) {
      return res.status(400).json({ error: 'Import Project dan Keterangan wajib diisi' });
    }

    const lastReq = db.prepare(
      "SELECT request_number FROM financial_request_ledger ORDER BY id DESC LIMIT 1"
    ).get();
    
    let nextNum = 1;
    if (lastReq) {
      const match = lastReq.request_number.match(/REQ-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const tahun = new Date().getFullYear().toString().slice(-2);
    const reqNumber = `REQ-${String(nextNum).padStart(4, '0')}-${tahun}`;

    const dppVal = Number(dpp) || 0;
    const ppnVal = dppVal * (Number(persen_ppn) || 0) / 100;
    const status = (invoice_no && dppVal > 0) ? 'Terisi' : 'Pending';

    const result = db.prepare(`
      INSERT INTO financial_request_ledger (
        request_number, import_project_id, cost_category, source, status,
        vendor_nama_manual, invoice_no, dpp, persen_ppn, ppn, total_estimasi, actual_amount,
        keterangan, created_at, updated_at
      ) VALUES (?, ?, ?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      reqNumber, import_project_id, cost_category || 'Lain-lain', status,
      vendor_nama || null, invoice_no || null, dppVal, Number(persen_ppn) || 0, ppnVal,
      dppVal + ppnVal, dppVal + ppnVal, keterangan
    );

    const newRow = db.prepare('SELECT * FROM financial_request_ledger WHERE id = ?')
      .get(result.lastInsertRowid);

    // TODO: If we need to sync manual cost to job orders, add it here

    res.status(201).json(newRow);
  } catch (err) {
    next(err);
  }
});

// 4. PUT /api/financial-request-ledger/:id (Edit actual amount / status dll)
router.put('/financial-request-ledger/:id', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), authorizeDepartment(), (req, res, next) => {
  try {
    const id = req.params.id;
    const { vendor_nama, invoice_no, actual_amount } = req.body;
    
    // In a real app we'd also store DPP/PPN, but for simplicity we store actual_amount directly
    const actual = Number(actual_amount) || 0;
    const status = (invoice_no && actual > 0) ? 'Terisi' : 'Pending';

    const result = db.prepare(`
      UPDATE financial_request_ledger 
      SET vendor_nama_manual = ?, invoice_no = ?, actual_amount = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(vendor_nama || null, invoice_no || null, actual, status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Commitment line not found' });
    }

    const updated = db.prepare('SELECT * FROM financial_request_ledger WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// 5. POST /api/financial-request-ledger/push-to-payment (Mendorong ke PibRequests/Realisasi Kasbon)
router.post('/financial-request-ledger/push-to-payment', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), authorizeDepartment(), validatePayload(['ledger_ids']), (req, res, next) => {
  try {
    const { ledger_ids } = req.body;
    if (!Array.isArray(ledger_ids) || ledger_ids.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang dipilih' });
    }

    db.transaction(() => {
      ledger_ids.forEach(id => {
        const ledger = db.prepare("SELECT * FROM financial_request_ledger WHERE id = ? AND status != 'Diteruskan' AND status != 'Lunas'").get(id);
        if (!ledger) return; // Skip if not found or already invoiced
        
        // Skip if no invoice_no or actual_amount
        if (!ledger.invoice_no || ledger.actual_amount <= 0) return;

        // Get shipment UN and ID from import project
        const project = db.prepare('SELECT p.*, s.id as s_id, s.un FROM import_projects p LEFT JOIN import_shipments s ON s.import_project_id = p.id WHERE p.id = ?').get(ledger.import_project_id);
        const un = project ? project.un : null;
        const shipmentId = project ? project.s_id : null;
        
        // Auto-assign vendor_id based on vendor_nama_manual
        let finalVendorId = null;
        if (ledger.vendor_nama_manual) {
          const existingVendor = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(ledger.vendor_nama_manual);
          if (existingVendor) {
            finalVendorId = existingVendor.id;
          }
        }
        
        // Try to find existing job_order with same invoice_no
        const existingJo = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(ledger.invoice_no);
        let joId = null;
        
        if (existingJo) {
          joId = existingJo.id;
          // Could update total here if needed, but assuming unique invoice numbers for simplicity
        } else {
          // Create Job Order
          const invoiceNo = ledger.invoice_no || `INV-${ledger.id}`;
          const joResult = db.prepare(`
            INSERT INTO job_orders (
              job_order_code, invoice_no, vendor_id, vendor_name, cost_type, mata_uang, dpp, persen_ppn, ppn,
              total_invoice, total_paid, import_shipment_id, sumber, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'IDR', ?, ?, ?, ?, 0, ?, 'financial_request', datetime('now'), datetime('now'))
          `).run(
            invoiceNo, invoiceNo, finalVendorId, ledger.vendor_nama_manual || null, ledger.cost_category, ledger.dpp || 0, ledger.persen_ppn || 0, ledger.ppn || 0,
            ledger.actual_amount, shipmentId || null
          );
          joId = joResult.lastInsertRowid;
        }

        // Update ledger status and link job order
        db.prepare("UPDATE financial_request_ledger SET status = 'Diteruskan', job_order_id = ?, updated_at = datetime('now') WHERE id = ?")
          .run(joId, id);
      });
    })();

    res.json({ message: 'Berhasil diajukan ke Pembayaran' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
