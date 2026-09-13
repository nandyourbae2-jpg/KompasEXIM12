const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');

router.get('/import-shipments/:id/container-costs', authenticateToken, authorizeDepartment(), (req, res, next) => {
  try {
    const costs = db.prepare('SELECT * FROM container_costs WHERE shipment_id = ?').all(req.params.id);
    const enrichedCosts = costs.map(cost => {
      // Find associated ledger to determine if it can be deleted by staff
      const project = db.prepare('SELECT import_project_id FROM import_shipments WHERE id = ?').get(cost.shipment_id);
      let canDelete = true;
      if (project && project.import_project_id) {
        // Trucking Categories
        if (['TRUC (Warehouse)', 'TRUC (Repo Depo)'].includes(cost.cost_category)) {
          const ledger = db.prepare("SELECT status FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(project.import_project_id, cost.cost_category);
          if (ledger && ['Diteruskan', 'Lunas'].includes(ledger.status)) canDelete = false;
        } else if (cost.cost_category === 'LOLO') {
          const ledger = db.prepare("SELECT status FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = 'LOLO' AND source = 'standard'").get(project.import_project_id);
          if (ledger && ['Diteruskan', 'Lunas'].includes(ledger.status)) canDelete = false;
        } else if (cost.cost_category === 'THC') {
          const ledger = db.prepare("SELECT status FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = 'THC' AND source = 'standard'").get(project.import_project_id);
          if (ledger && ['Diteruskan', 'Lunas'].includes(ledger.status)) canDelete = false;
        } else if (cost.cost_category === 'Storage' || cost.cost_category === 'PNBP/Doc Fee' || cost.cost_category === 'Uper') {
          const ledger = db.prepare("SELECT status FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(project.import_project_id, cost.cost_category);
          if (ledger && ['Diteruskan', 'Lunas'].includes(ledger.status)) canDelete = false;
        }
      }
      return { ...cost, can_delete: canDelete };
    });
    res.json(enrichedCosts);
  } catch (err) { console.error('CONTAINER_COSTS ERROR:', err);  next(err);
  }
});

// Removed syncContainerCostToJobOrder to enforce routing through Financial Request

function syncToFinancialLedger(shipment_id) {
  const project = db.prepare('SELECT import_project_id FROM import_shipments WHERE id = ?').get(shipment_id);
  if (!project || !project.import_project_id) return;
  const projectId = project.import_project_id;

  // 1. Sync Trucking Categories Separately
  const truckingCategories = ['TRUC (Warehouse)', 'TRUC (Repo Depo)'];
  
  for (const category of truckingCategories) {
    const data = db.prepare(`
      SELECT SUM(total) as actual_amount, SUM(dpp) as total_dpp, SUM(ppn) as total_ppn, MAX(vendor_name) as vendor_name, MAX(inv_no) as inv_no
      FROM container_costs 
      WHERE shipment_id = ? AND cost_category = ?
    `).get(shipment_id, category);

    if (data && data.actual_amount > 0) {
      const existing = db.prepare("SELECT id FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(projectId, category);
      if (existing) {
        db.prepare(`
          UPDATE financial_request_ledger SET
            status = 'Terisi', invoice_no = ?, dpp = ?, ppn = ?, total_estimasi = ?, actual_amount = ?, vendor_nama_manual = ?, updated_at = datetime('now')
          WHERE id = ? AND status != 'Diteruskan' AND status != 'Lunas'
        `).run(
          data.inv_no || null, data.total_dpp || 0, data.total_ppn || 0,
          data.actual_amount || 0, data.actual_amount || 0, data.vendor_name || null, existing.id
        );
      } else {
        const reqNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        db.prepare(`
          INSERT INTO financial_request_ledger 
          (request_number, import_project_id, cost_category, source, status, baseline_amount, actual_amount, invoice_no, dpp, ppn, total_estimasi, vendor_nama_manual, currency)
          VALUES (?, ?, ?, 'standard', 'Terisi', ?, ?, ?, ?, ?, ?, ?, 'IDR')
        `).run(
          reqNumber, projectId, category, data.actual_amount || 0, data.actual_amount || 0, data.inv_no || null,
          data.total_dpp || 0, data.total_ppn || 0, data.actual_amount || 0, data.vendor_name || null
        );
      }
    }
  }

  // 2. Sync LOLO
  const loloData = db.prepare(`
    SELECT SUM(total) as actual_amount, SUM(dpp) as total_dpp, SUM(ppn) as total_ppn, MAX(vendor_name) as vendor_name, MAX(inv_no) as inv_no
    FROM container_costs 
    WHERE shipment_id = ? AND cost_category = 'LOLO (Reimb. Lift Off)'
  `).get(shipment_id);

  if (loloData && loloData.actual_amount > 0) {
    const existing = db.prepare("SELECT id FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(projectId, 'LOLO');
    if (existing) {
      db.prepare(`
        UPDATE financial_request_ledger SET
          status = 'Terisi', invoice_no = ?, dpp = ?, ppn = ?, total_estimasi = ?, actual_amount = ?, vendor_nama_manual = ?, updated_at = datetime('now')
        WHERE id = ? AND status != 'Diteruskan' AND status != 'Lunas'
      `).run(
        loloData.inv_no || null, loloData.total_dpp || 0, loloData.total_ppn || 0,
        loloData.actual_amount || 0, loloData.actual_amount || 0, loloData.vendor_name || null, existing.id
      );
    } else {
      const reqNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      db.prepare(`
        INSERT INTO financial_request_ledger 
        (request_number, import_project_id, cost_category, source, status, baseline_amount, actual_amount, invoice_no, dpp, ppn, total_estimasi, vendor_nama_manual, currency)
        VALUES (?, ?, 'LOLO', 'standard', 'Terisi', ?, ?, ?, ?, ?, ?, ?, 'IDR')
      `).run(
        reqNumber, projectId, loloData.actual_amount || 0, loloData.actual_amount || 0, loloData.inv_no || null,
        loloData.total_dpp || 0, loloData.total_ppn || 0, loloData.actual_amount || 0, loloData.vendor_name || null
      );
    }
  }

  // 3. Sync Depo
  const depoData = db.prepare(`
    SELECT SUM(total) as actual_amount, SUM(dpp) as total_dpp, SUM(ppn) as total_ppn, MAX(vendor_name) as vendor_name, MAX(inv_no) as inv_no
    FROM container_costs 
    WHERE shipment_id = ? AND cost_category = 'DEPO'
  `).get(shipment_id);

  if (depoData && depoData.actual_amount > 0) {
    const existing = db.prepare("SELECT id FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(projectId, 'Depo');
    if (existing) {
      db.prepare(`
        UPDATE financial_request_ledger SET
          status = 'Terisi', invoice_no = ?, dpp = ?, ppn = ?, total_estimasi = ?, actual_amount = ?, vendor_nama_manual = ?, updated_at = datetime('now')
        WHERE id = ? AND status != 'Diteruskan' AND status != 'Lunas'
      `).run(
        depoData.inv_no || null, depoData.total_dpp || 0, depoData.total_ppn || 0,
        depoData.actual_amount || 0, depoData.actual_amount || 0, depoData.vendor_name || null, existing.id
      );
    } else {
      const reqNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      db.prepare(`
        INSERT INTO financial_request_ledger 
        (request_number, import_project_id, cost_category, source, status, baseline_amount, actual_amount, invoice_no, dpp, ppn, total_estimasi, vendor_nama_manual, currency)
        VALUES (?, ?, 'Depo', 'standard', 'Terisi', ?, ?, ?, ?, ?, ?, ?, 'IDR')
      `).run(
        reqNumber, projectId, depoData.actual_amount || 0, depoData.actual_amount || 0, depoData.inv_no || null,
        depoData.total_dpp || 0, depoData.total_ppn || 0, depoData.actual_amount || 0, depoData.vendor_name || null
      );
    }
  }
  // 4. Sync Line, other LOLO, and Other Cost Categories
  const generalCategories = [
    'Line Freight', 'Line Local', 'Line Extend',
    'LOLO (Port)', 'LOLO (Hico/Bahandel)', 'LOLO (Gudang Port)',
    'OTHE (Other Cost)'
  ];

  for (const category of generalCategories) {
    const data = db.prepare(`
      SELECT SUM(total) as actual_amount, SUM(dpp) as total_dpp, SUM(ppn) as total_ppn, MAX(vendor_name) as vendor_name, MAX(inv_no) as inv_no
      FROM container_costs 
      WHERE shipment_id = ? AND cost_category = ?
    `).get(shipment_id, category);

    if (data && data.actual_amount > 0) {
      const existing = db.prepare("SELECT id FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(projectId, category);
      if (existing) {
        db.prepare(`
          UPDATE financial_request_ledger SET
            status = 'Terisi', invoice_no = ?, dpp = ?, ppn = ?, total_estimasi = ?, actual_amount = ?, vendor_nama_manual = ?, updated_at = datetime('now')
          WHERE id = ? AND status != 'Diteruskan' AND status != 'Lunas'
        `).run(
          data.inv_no || null, data.total_dpp || 0, data.total_ppn || 0,
          data.actual_amount || 0, data.actual_amount || 0, data.vendor_name || null, existing.id
        );
      } else {
        const reqNumber = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        db.prepare(`
          INSERT INTO financial_request_ledger 
          (request_number, import_project_id, cost_category, source, status, baseline_amount, actual_amount, invoice_no, dpp, ppn, total_estimasi, vendor_nama_manual, currency)
          VALUES (?, ?, ?, 'standard', 'Terisi', ?, ?, ?, ?, ?, ?, ?, 'IDR')
        `).run(
          reqNumber, projectId, category, data.actual_amount || 0, data.actual_amount || 0, data.inv_no || null,
          data.total_dpp || 0, data.total_ppn || 0, data.actual_amount || 0, data.vendor_name || null
        );
      }
    }
  }
}

router.post('/container-costs', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), authorizeDepartment(), validatePayload(['container_id', 'shipment_id', 'cost_category']), (req, res, next) => {
  try {
    const fs = require('fs');
    fs.appendFileSync('debug_log.txt', 'POST /container-costs called with: ' + JSON.stringify(req.body) + '\\n');
    const {
      container_id, shipment_id, cost_category,
      vendor_name, inv_no, dpp = 0, persen_ppn = 0,
      no_fp, gp_no,
      biaya_dasar, inap_sasis, other_cost, ket_other,
      calc_day, calc_shift, act_day, act_shift,
      storage, monitoring, recooling, lolo_depo,
      jenis_cost
    } = req.body;

    let finalJenisCost = jenis_cost;
    if (cost_category === 'OTHE (Other Cost)') {
      if (!finalJenisCost) finalJenisCost = 'OTHER';
      if (!['PERIZINAN', 'OTHER'].includes(finalJenisCost)) {
        return res.status(400).json({ error: 'Invalid Jenis Cost. Allowed values: PERIZINAN, OTHER.' });
      }
      if (!ket_other || ket_other.trim() === '') {
        return res.status(400).json({ error: 'Keterangan wajib diisi.' });
      }
    } else {
      finalJenisCost = finalJenisCost || 'OTHER';
    }

    let effectiveDpp = parseFloat(dpp) || 0;
    if (cost_category === 'TRUC (Warehouse)') {
      effectiveDpp = (parseFloat(biaya_dasar) || 0) + (parseFloat(inap_sasis) || 0) + (parseFloat(other_cost) || 0);
    } else if (cost_category === 'DEPO') {
      // Server-side validation for DEPO
      if (act_day !== undefined && act_day !== null && parseFloat(act_day) < 0) {
        return res.status(400).json({ error: 'Act Day tidak boleh negatif' });
      }
      if (act_shift !== undefined && act_shift !== null && parseFloat(act_shift) < 0) {
        return res.status(400).json({ error: 'Act Shift tidak boleh negatif' });
      }
      effectiveDpp = (parseFloat(storage) || 0) + (parseFloat(monitoring) || 0) + (parseFloat(recooling) || 0) + (parseFloat(lolo_depo) || 0);
    }

    const ppnRate = parseFloat(persen_ppn) || 0;
    const ppn = effectiveDpp * ppnRate / 100;
    const total = effectiveDpp + ppn;

    // UPSERT LOGIC: Check if it already exists for this container & category
    const existingCost = db.prepare('SELECT id FROM container_costs WHERE container_id = ? AND cost_category = ?').get(container_id, cost_category);

    let finalId;
    if (existingCost) {
      db.prepare(`
        UPDATE container_costs SET
          vendor_name = ?, inv_no = ?, dpp = ?, persen_ppn = ?, ppn = ?, no_fp = ?, gp_no = ?,
          biaya_dasar = ?, inap_sasis = ?, other_cost = ?, ket_other = ?,
          calc_day = ?, calc_shift = ?, act_day = ?, act_shift = ?,
          storage = ?, monitoring = ?, recooling = ?, lolo_depo = ?,
          jenis_cost = ?,
          total = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        vendor_name || null, inv_no || null,
        effectiveDpp, ppnRate, ppn, no_fp || null, gp_no || null,
        parseFloat(biaya_dasar) || 0, parseFloat(inap_sasis) || 0, parseFloat(other_cost) || 0, ket_other || null,
        parseFloat(calc_day) || 0, parseFloat(calc_shift) || 0, parseFloat(act_day) || 0, parseFloat(act_shift) || 0,
        parseFloat(storage) || 0, parseFloat(monitoring) || 0, parseFloat(recooling) || 0, parseFloat(lolo_depo) || 0,
        finalJenisCost,
        total, existingCost.id
      );
      finalId = existingCost.id;
    } else {
      const result = db.prepare(`
        INSERT INTO container_costs (
          container_id, shipment_id, cost_category,
          vendor_name, inv_no, dpp, persen_ppn, ppn, no_fp, gp_no,
          biaya_dasar, inap_sasis, other_cost, ket_other,
          calc_day, calc_shift, act_day, act_shift,
          storage, monitoring, recooling, lolo_depo,
          jenis_cost,
          total, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?,
          ?, datetime('now'), datetime('now')
        )
      `).run(
        container_id, shipment_id, cost_category,
        vendor_name || null, inv_no || null,
        effectiveDpp, ppnRate, ppn, no_fp || null, gp_no || null,
        parseFloat(biaya_dasar) || 0, parseFloat(inap_sasis) || 0, parseFloat(other_cost) || 0, ket_other || null,
        parseFloat(calc_day) || 0, parseFloat(calc_shift) || 0, parseFloat(act_day) || 0, parseFloat(act_shift) || 0,
        parseFloat(storage) || 0, parseFloat(monitoring) || 0, parseFloat(recooling) || 0, parseFloat(lolo_depo) || 0,
        finalJenisCost,
        total
      );
      finalId = result.lastInsertRowid;
    }

    const newCost = db.prepare('SELECT * FROM container_costs WHERE id = ?').get(finalId);

    syncToFinancialLedger(shipment_id);

    res.status(201).json(newCost);
  } catch (err) { console.error('CONTAINER_COSTS ERROR:', err);  next(err);
  }
});

router.patch('/container-costs/:id', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), authorizeDepartment(), (req, res, next) => {
  try {
    const fs = require('fs');
    fs.appendFileSync('debug_log.txt', 'PATCH /container-costs/' + req.params.id + ' called with: ' + JSON.stringify(req.body) + '\\n');
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM container_costs WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    const merged = { ...existing, ...req.body };

    if (merged.cost_category === 'OTHE (Other Cost)') {
      if (!merged.jenis_cost) merged.jenis_cost = 'OTHER';
      if (!['PERIZINAN', 'OTHER'].includes(merged.jenis_cost)) {
        return res.status(400).json({ error: 'Invalid Jenis Cost. Allowed values: PERIZINAN, OTHER.' });
      }
      if (!merged.ket_other || merged.ket_other.trim() === '') {
        return res.status(400).json({ error: 'Keterangan wajib diisi.' });
      }
    } else {
      merged.jenis_cost = merged.jenis_cost || 'OTHER';
    }

    let effectiveDpp = parseFloat(merged.dpp) || 0;
    if (merged.cost_category === 'TRUC (Warehouse)') {
      effectiveDpp = (parseFloat(merged.biaya_dasar) || 0) + (parseFloat(merged.inap_sasis) || 0) + (parseFloat(merged.other_cost) || 0);
    } else if (merged.cost_category === 'DEPO') {
      // Server-side validation for DEPO
      if (merged.act_day !== undefined && merged.act_day !== null && parseFloat(merged.act_day) < 0) {
        return res.status(400).json({ error: 'Act Day tidak boleh negatif' });
      }
      if (merged.act_shift !== undefined && merged.act_shift !== null && parseFloat(merged.act_shift) < 0) {
        return res.status(400).json({ error: 'Act Shift tidak boleh negatif' });
      }
      effectiveDpp = (parseFloat(merged.storage) || 0) + (parseFloat(merged.monitoring) || 0) + (parseFloat(merged.recooling) || 0) + (parseFloat(merged.lolo_depo) || 0);
    }

    const ppnRate = parseFloat(merged.persen_ppn) || 0;
    const ppn = effectiveDpp * ppnRate / 100;
    const total = effectiveDpp + ppn;

    db.prepare(`
      UPDATE container_costs SET
        vendor_name = ?, inv_no = ?, dpp = ?, persen_ppn = ?, ppn = ?, no_fp = ?, gp_no = ?,
        biaya_dasar = ?, inap_sasis = ?, other_cost = ?, ket_other = ?,
        calc_day = ?, calc_shift = ?, act_day = ?, act_shift = ?,
        storage = ?, monitoring = ?, recooling = ?, lolo_depo = ?,
        jenis_cost = ?,
        total = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      merged.vendor_name || null, merged.inv_no || null,
      effectiveDpp, ppnRate, ppn, merged.no_fp || null, merged.gp_no || null,
      parseFloat(merged.biaya_dasar) || 0, parseFloat(merged.inap_sasis) || 0, parseFloat(merged.other_cost) || 0, merged.ket_other || null,
      parseFloat(merged.calc_day) || 0, parseFloat(merged.calc_shift) || 0, parseFloat(merged.act_day) || 0, parseFloat(merged.act_shift) || 0,
      parseFloat(merged.storage) || 0, parseFloat(merged.monitoring) || 0, parseFloat(merged.recooling) || 0, parseFloat(merged.lolo_depo) || 0,
      merged.jenis_cost,
      total, id
    );

    const updated = db.prepare('SELECT * FROM container_costs WHERE id = ?').get(id);

    syncToFinancialLedger(updated.shipment_id);

    res.json(updated);
  } catch (err) { console.error('CONTAINER_COSTS ERROR:', err);  next(err);
  }
});

router.delete('/container-costs/:id', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), authorizeDepartment(), (req, res, next) => {
  try {
    const id = req.params.id;
    const { level_otoritas, id: userId } = req.user;
    const existing = db.prepare('SELECT * FROM container_costs WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    // Determine associated ledger status
    let sudahDiteruskan = false;
    let ledgerId = null;
    const project = db.prepare('SELECT import_project_id FROM import_shipments WHERE id = ?').get(existing.shipment_id);
    if (project && project.import_project_id) {
        let ledger = null;
        if (['TRUC (Warehouse)', 'TRUC (Repo Depo)'].includes(existing.cost_category)) {
          ledger = db.prepare("SELECT id, status FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(project.import_project_id, existing.cost_category);
        } else if (existing.cost_category === 'LOLO' || existing.cost_category === 'THC') {
          ledger = db.prepare("SELECT id, status FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(project.import_project_id, existing.cost_category);
        } else if (['Storage', 'PNBP/Doc Fee', 'Uper'].includes(existing.cost_category)) {
          ledger = db.prepare("SELECT id, status FROM financial_request_ledger WHERE import_project_id = ? AND cost_category = ? AND source = 'standard'").get(project.import_project_id, existing.cost_category);
        }
        
        if (ledger) {
            ledgerId = ledger.id;
            sudahDiteruskan = ['Diteruskan', 'Lunas'].includes(ledger.status);
        }
    }

    if (level_otoritas === 'Staff Dept') {
      if (sudahDiteruskan) {
        return res.status(403).json({
          error: 'Biaya ini sudah diteruskan ke Monitoring Pembayaran dan tidak bisa dihapus langsung. Hubungi Supervisor untuk membatalkan.'
        });
      }
    }

    // Process old logic to cleanup job orders if they were directly linked
    if (existing.job_order_id) {
        const jo = db.prepare('SELECT * FROM job_orders WHERE id = ?').get(existing.job_order_id);
        if (jo) {
            db.prepare('DELETE FROM container_costs WHERE id = ?').run(id);
            const allCosts = db.prepare(`
              SELECT SUM(total) as grand_total, SUM(dpp) as total_dpp, SUM(ppn) as total_ppn 
              FROM container_costs 
              WHERE inv_no = ? AND shipment_id = ?
            `).get(existing.inv_no, existing.shipment_id);
            
            if (!allCosts.grand_total) {
                db.prepare('DELETE FROM job_orders WHERE id = ?').run(jo.id);
            } else {
                db.prepare(`
                  UPDATE job_orders SET
                    total_invoice = ?, dpp = ?, ppn = ?, updated_at = datetime('now')
                  WHERE id = ?
                `).run(allCosts.grand_total, allCosts.total_dpp, allCosts.total_ppn, jo.id);
            }
        }
    } else {
        db.prepare('DELETE FROM container_costs WHERE id = ?').run(id);
    }

    // Force recalculate ledger so it drops to 0 if last cost is deleted
    syncToFinancialLedger(existing.shipment_id);
    
    // If deleted by Supervisor/Manager after it was forwarded, reset ledger to pending.
    if (sudahDiteruskan && level_otoritas !== 'Staff Dept' && ledgerId) {
        // Create table if not exists just to be safe
        db.prepare(`
            CREATE TABLE IF NOT EXISTS financial_request_ledger_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ledger_id INTEGER,
                aksi TEXT,
                dilakukan_oleh_id INTEGER,
                catatan TEXT,
                dilakukan_pada TEXT
            )
        `).run();
        
        db.prepare(`
            INSERT INTO financial_request_ledger_history
            (ledger_id, aksi, dilakukan_oleh_id, catatan, dilakukan_pada)
            VALUES (?, 'Dihapus Paksa', ?, ?, datetime('now'))
        `).run(ledgerId, userId, "Container cost dihapus meski sudah Diteruskan");

        db.prepare(`
            UPDATE financial_request_ledger SET status = 'Pending', job_order_id = NULL,
            updated_at = datetime('now')
            WHERE id = ?
        `).run(ledgerId);
    }

    res.json({ message: 'Deleted' });
  } catch (err) { console.error('CONTAINER_COSTS ERROR:', err);  next(err);
  }
});

module.exports = router;
