const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');

const catchErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
router.get('/import-projects', authenticateToken, authorizeDepartment('Import'), (req, res, next) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all());
  } catch (error) { next(error); }
});

router.get('/import-projects/:id', authenticateToken, authorizeDepartment('Import'), (req, res, next) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id));
  } catch (error) { next(error); }
});

router.post('/import-projects', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const {
      task_unique_number, supplier, trade, import_type, shipment_term,
      invoice_no, po_co_no, bl_no, etd, eta, hs_code,
      free_time_destination, document_requirements
    } = req.body;
    
    let finalTaskNumber = task_unique_number;
    if (!finalTaskNumber) {
      const lastProject = db.prepare('SELECT task_unique_number FROM import_projects ORDER BY id DESC LIMIT 1').get();
      let nextNum = 1;
      if (lastProject && lastProject.task_unique_number) {
        const match = lastProject.task_unique_number.match(/IMP-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      finalTaskNumber = `IMP-${String(nextNum).padStart(3, '0')}-${new Date().getFullYear()}`;
    }

    const projectId = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO import_projects (task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, po_co_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id, document_requirements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        finalTaskNumber, supplier, trade, import_type, shipment_term,
        invoice_no, po_co_no || null, bl_no, etd, eta, hs_code,
        free_time_destination, req.user.id,
        JSON.stringify(document_requirements || [])
      );
      const pid = info.lastInsertRowid;

      if (Array.isArray(document_requirements) && document_requirements.length) {
        const insertLink = db.prepare('INSERT INTO import_project_documents (import_project_id, dokumen_id) VALUES (?, ?)');
        const insertMonitoring = db.prepare('INSERT INTO dokumen_monitoring_baris (import_project_id, master_dokumen_id) VALUES (?, ?)');
        for (const docId of document_requirements) {
          insertLink.run(pid, docId);
          insertMonitoring.run(pid, docId);
        }
      }
      return pid;
    })();

    res.status(201).json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(projectId));
  } catch (error) { next(error); }
});

router.patch('/import-projects/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const updatedProject = db.transaction(() => {
      const allowedKeys = ['supplier', 'trade', 'import_type', 'shipment_term', 'invoice_no', 'po_co_no', 'bl_no', 'etd', 'eta', 'hs_code', 'free_time_destination'];
      const updates = [];
      const values = [];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      }
      if (req.body.document_requirements !== undefined) {
        updates.push('document_requirements = ?');
        values.push(JSON.stringify(req.body.document_requirements));
      }
      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        values.push(req.params.id);
        db.prepare(`UPDATE import_projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      if (req.body.document_requirements !== undefined) {
        const newDocIds = req.body.document_requirements;
        const existingRows = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE import_project_id = ?').all(req.params.id);
        const existingDocIds = existingRows.map(r => r.master_dokumen_id);

        const insertLink = db.prepare('INSERT OR IGNORE INTO import_project_documents (import_project_id, dokumen_id) VALUES (?, ?)');
        const insertMon = db.prepare('INSERT INTO dokumen_monitoring_baris (import_project_id, master_dokumen_id) VALUES (?, ?)');
        for (const docId of newDocIds) {
          if (!existingDocIds.includes(docId)) {
            insertLink.run(req.params.id, docId);
            insertMon.run(req.params.id, docId);
          }
        }

        for (const row of existingRows) {
          if (!newDocIds.includes(row.master_dokumen_id)) {
            const hasProgress = row.draft_received_date || row.draft_confirmed_date || row.scan_receive_date || row.original_receive_date || row.original_awb_no;
            if (!hasProgress) {
              db.prepare('DELETE FROM dokumen_monitoring_baris WHERE id = ?').run(row.id);
              db.prepare('DELETE FROM import_project_documents WHERE import_project_id = ? AND dokumen_id = ?').run(req.params.id, row.master_dokumen_id);
            }
          }
        }
      }
      return db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id);
    })();
    res.json(updatedProject);
  } catch (error) { next(error); }
});


router.delete('/import-projects/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    db.prepare('DELETE FROM import_projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ==========================================
// 6. DOKUMEN MONITORING
// ==========================================
router.get('/dokumen-monitoring/summary', authenticateToken, authorizeDepartment('Import'), (req, res, next) => {
  try {
    const projects = db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all();
    const countStmt = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN draft_confirmed_date IS NOT NULL AND original_receive_date IS NOT NULL THEN 1 ELSE 0 END) as complete FROM dokumen_monitoring_baris WHERE import_project_id = ?`);
    const result = projects.map(p => {
      const counts = countStmt.get(p.id);
      return { ...p, doc_complete: counts?.complete || 0, doc_total: counts?.total || 0 };
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/dokumen-monitoring', authenticateToken, authorizeDepartment('Import'), (req, res, next) => {
  try {
    const { import_project_id } = req.query;
    if (!import_project_id) return res.status(400).json({ error: 'import_project_id required' });
    const rows = db.prepare(`
      SELECT dmb.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      LEFT JOIN users u ON u.id = dmb.draft_confirmed_by_id
      WHERE dmb.import_project_id = ?
      ORDER BY md.kode_dokumen ASC
    `).all(import_project_id);
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/dokumen-monitoring/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const allowedFields = ['draft_received_date', 'scan_receive_date', 'scan_shared_departemen', 'original_receive_date', 'original_awb_no', 'original_shared_departemen'];
    const row = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Row not found' });
    
    db.transaction(() => {
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          const oldVal = row[field];
          const isJsonField = field === 'scan_shared_departemen' || field === 'original_shared_departemen';
          const isDateField = ['draft_received_date', 'scan_receive_date', 'original_receive_date'].includes(field);
          let newVal = isJsonField ? JSON.stringify(req.body[field]) : req.body[field];
          // Sanitize: convert empty string date to null
          if (isDateField && newVal === '') newVal = null;
          db.prepare(`UPDATE dokumen_monitoring_baris SET ${field} = ?, last_updated_by_id = ?, updated_at = datetime('now') WHERE id = ?`)
            .run(newVal, req.user.id, req.params.id);
          db.prepare('INSERT INTO dokumen_monitoring_riwayat (baris_id, field_diubah, nilai_lama, nilai_baru, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)')
            .run(req.params.id, field, oldVal || null, newVal || null, req.user.id);
        }
      }
    })();
    const updatedRow = db.prepare(`
      SELECT b.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris b
      JOIN master_data_dokumen md ON md.id = b.master_dokumen_id
      LEFT JOIN users u ON b.draft_confirmed_by_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);
    res.json(updatedRow);
  } catch (error) { next(error); }
});

router.post('/dokumen-monitoring/:id/confirm', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const result = db.prepare(`UPDATE dokumen_monitoring_baris SET draft_confirmed_date = datetime('now'), draft_confirmed_by_id = ?, last_updated_by_id = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(req.user.id, req.user.id, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: `Row not found for id: ${req.params.id}` });
    }
    
    const updatedRow = db.prepare(`
      SELECT b.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris b
      JOIN master_data_dokumen md ON md.id = b.master_dokumen_id
      LEFT JOIN users u ON b.draft_confirmed_by_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);
    res.json(updatedRow);
  } catch (error) { next(error); }
});

// A6: POST /dokumen-monitoring/:id/confirm-scan
router.post('/dokumen-monitoring/:id/confirm-scan', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const { scan_receive_date, scan_shared_departemen } = req.body || {};
    const result = db.prepare(`
      UPDATE dokumen_monitoring_baris 
      SET scan_receive_date = COALESCE(?, scan_receive_date),
          scan_confirmed_date = datetime('now'),
          scan_confirmed_by_id = ?,
          scan_shared_departemen = COALESCE(?, scan_shared_departemen),
          last_updated_by_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(scan_receive_date || null, req.user.id, scan_shared_departemen ? JSON.stringify(scan_shared_departemen) : null, req.user.id, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Baris tidak ditemukan' });
    const updatedRow = db.prepare(`
      SELECT b.*, md.kode_dokumen, md.nama_dokumen
      FROM dokumen_monitoring_baris b
      JOIN master_data_dokumen md ON md.id = b.master_dokumen_id
      WHERE b.id = ?
    `).get(req.params.id);
    res.json(updatedRow);
  } catch (error) { next(error); }
});

// A7: POST /dokumen-monitoring/:id/confirm-original
router.post('/dokumen-monitoring/:id/confirm-original', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const { original_receive_date, original_awb_no, original_shared_departemen } = req.body || {};
    const result = db.prepare(`
      UPDATE dokumen_monitoring_baris
      SET original_receive_date = COALESCE(?, original_receive_date),
          original_awb_no = COALESCE(?, original_awb_no),
          original_confirmed_date = datetime('now'),
          original_confirmed_by_id = ?,
          original_shared_departemen = COALESCE(?, original_shared_departemen),
          last_updated_by_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      original_receive_date || null,
      original_awb_no || null,
      req.user.id,
      original_shared_departemen ? JSON.stringify(original_shared_departemen) : null,
      req.user.id,
      req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Baris tidak ditemukan' });
    const updatedRow = db.prepare(`
      SELECT b.*, md.kode_dokumen, md.nama_dokumen
      FROM dokumen_monitoring_baris b
      JOIN master_data_dokumen md ON md.id = b.master_dokumen_id
      WHERE b.id = ?
    `).get(req.params.id);
    res.json(updatedRow);
  } catch (error) { next(error); }
});

router.get('/dokumen-monitoring/:id/riwayat', authenticateToken, authorizeDepartment('Import'), (req, res, next) => {
  try {
    const riwayat = db.prepare(`
      SELECT r.*, u.nama as diubah_oleh_nama
      FROM dokumen_monitoring_riwayat r
      LEFT JOIN users u ON r.diubah_oleh_id = u.id
      WHERE r.baris_id = ?
      ORDER BY r.diubah_pada DESC
    `).all(req.params.id);
    res.json(riwayat);
  } catch (error) { next(error); }
});

// ==========================================
// 7. IMPORT OPERATIONAL (SHIPMENTS)
// ==========================================
router.get('/import-shipments', authenticateToken, authorizeDepartment('Import'), (req, res, next) => {
  try {
    const { page, limit: limitParam } = req.query;
    const isPaginated = page !== undefined;

    const limit = Math.min(Math.max(parseInt(limitParam) || 20, 1), 200);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const offset = (pageNum - 1) * limit;

    let whereClause = '';
    const params = [];

    if (req.query.import_project_id) {
      whereClause = ' WHERE s.import_project_id = ?';
      params.push(req.query.import_project_id);
    }

    if (req.query.ids) {
      const idsArr = [...new Set(req.query.ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)))].slice(0, 200);
      if (idsArr.length > 0) {
        const placeholders = idsArr.map(() => '?').join(',');
        whereClause = whereClause ? whereClause + ` AND s.id IN (${placeholders})` : ` WHERE s.id IN (${placeholders})`;
        params.push(...idsArr);
      } else {
        // If ids was provided but all were invalid, return empty early
        if (isPaginated) return res.json({ data: [], pagination: { page: pageNum, limit, total: 0, totalPages: 0 } });
        return res.json([]);
      }
    }

    const baseQuery = `SELECT s.*, ip.task_unique_number as import_project_name FROM import_shipments s LEFT JOIN import_projects ip ON s.import_project_id = ip.id${whereClause} ORDER BY s.created_at DESC`;

    // Batch-fetch containers for a set of shipments in a single query (eliminates N+1)
    const hydrateContainersBatch = (shipments) => {
      if (!shipments.length) return shipments;
      shipments.forEach(s => { s.costs = JSON.parse(s.costs || '{}'); s.containers = []; });
      const ids = shipments.map(s => s.id);
      const placeholders = ids.map(() => '?').join(',');
      const allContainers = db.prepare(`SELECT * FROM containers WHERE shipment_id IN (${placeholders})`).all(...ids);
      const byShipment = {};
      allContainers.forEach(c => {
        if (!byShipment[c.shipment_id]) byShipment[c.shipment_id] = [];
        byShipment[c.shipment_id].push(c);
      });
      shipments.forEach(s => { s.containers = byShipment[s.id] || []; });
      return shipments;
    };

    if (isPaginated) {
      let countQuery = 'SELECT COUNT(*) as c FROM import_shipments s';
      if (whereClause) countQuery += whereClause;
      const total = db.prepare(countQuery).get(...params).c;
      const shipments = db.prepare(baseQuery + ' LIMIT ? OFFSET ?').all(...params, limit, offset);
      hydrateContainersBatch(shipments);
      return res.json({
        data: shipments,
        pagination: {
          page: pageNum,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    // Backward-compatible: no page param → return plain array (existing consumer contract)
    const shipments = db.prepare(baseQuery).all(...params);
    hydrateContainersBatch(shipments);
    res.json(shipments);
  } catch (error) { next(error); }
});


router.get('/import-shipments/analytics', authenticateToken, authorizeDepartment('Import'), (req, res, next) => {
  console.log("Analytics endpoint hit!");
  try {
    const { hitungStage } = require('../../utils/statusShipmentCalc');
    const shipments = db.prepare('SELECT * FROM import_shipments').all();
    const allContainers = db.prepare('SELECT * FROM containers').all();
    const allJobOrders = db.prepare('SELECT * FROM job_orders').all();

    // Map containers to shipments
    const byShipment = {};
    allContainers.forEach(c => {
      if (!byShipment[c.shipment_id]) byShipment[c.shipment_id] = [];
      byShipment[c.shipment_id].push(c);
    });

    let totalDur = 0;
    let durCount = 0;
    let totalInap = 0;
    let inapCount = 0;
    
    const issueCounts = { fish: 0, queue: 0, space: 0, other: 0 };
    const chartData = [];
    const activeContainers = [];
    let clearanceTertundaCount = 0;

    const pipelineCounts = {
      'Shipment Active': 0,
      'Delivery Active': 0,
      'Financial Settlement': 0,
      'Status Complete': 0
    };
    
    const pipelineIds = {
      'Shipment Active': [],
      'Delivery Active': [],
      'Financial Settlement': [],
      'Status Complete': []
    };

    let activeShipmentCount = 0;
    
    shipments.forEach(s => {
      s.costs = s.costs ? s.costs : '{}';
      s.containers = byShipment[s.id] || [];
      const stage = hitungStage(s, allJobOrders);
      
      if (pipelineCounts[stage] !== undefined) {
        pipelineCounts[stage]++;
        pipelineIds[stage].push(s.id);
      }

      if (stage !== 'Status Complete') {
        activeShipmentCount++;
        let hasDelay = false;
        
        s.containers.forEach((c, idx) => {
          if (c.durasi_bongkar) {
            totalDur += Number(c.durasi_bongkar);
            durCount++;
          }
          const gateOutWh = c.gate_out_wh;
          const gateInWh = c.gate_in_wh;
          if (gateOutWh && gateInWh) {
             const h = (new Date(gateOutWh) - new Date(gateInWh)) / (1000 * 60 * 60);
             if (h > 0) {
               totalInap += h;
               inapCount++;
             }
          }
          
          if (c.fish_issue) issueCounts.fish++;
          if (c.queue_issue) issueCounts.queue++;
          if (c.space_issue) issueCounts.space++;
          if (c.other_issue) issueCounts.other++;

          if (c.fish_issue || c.queue_issue || c.space_issue || c.other_issue) {
            hasDelay = true;
          }

          const durasiBongkar = Number(c.durasi_bongkar) || 0;
          const lamaInapSasis = (gateOutWh && gateInWh) ? ((new Date(gateOutWh) - new Date(gateInWh)) / (1000 * 60 * 60)) : 0;

          chartData.push({
            name: `${s.un || s.id} - ${c.no_kontainer || ('C' + (idx+1))}`,
            durasiBongkar,
            lamaInapSasis
          });

          activeContainers.push({
            shipmentId: s.id,
            un: s.un,
            kat: s.kat,
            supplier: s.supplier,
            gudang: s.gudang,
            contName: c.no_kontainer || ('Cont ' + (idx+1)),
            durasiBongkar,
            lamaInapSasis,
            waktuAntri: (c.gate_in_wh && c.offloading_start) ? ((new Date(c.gate_in_wh) - new Date(c.offloading_start)) / (1000 * 60 * 60)) : 0,
            fishIssue: c.fish_issue === 1,
            queueIssue: c.queue_issue === 1,
            spaceIssue: c.space_issue === 1,
            otherIssue: c.other_issue === 1
          });
        });
        
        if (hasDelay) clearanceTertundaCount++;
      }
    });

    const dndResult = db.prepare(`SELECT SUM(total_invoice - total_paid) as dnd FROM job_orders WHERE cost_type = 'LINE (Extend DO / Demdet)'`).get();
    const dndCharges = dndResult.dnd || 0;

    let topIssue = 'Tidak ada';
    let topIssueCount = 0;
    Object.entries(issueCounts).forEach(([issue, count]) => {
      if (count > topIssueCount) {
        topIssue = issue.charAt(0).toUpperCase() + issue.slice(1) + ' Issue';
        topIssueCount = count;
      }
    });

    res.json({
      kpi: {
        avgDurasi: durCount > 0 ? Number((totalDur / durCount).toFixed(1)) : 0,
        avgInap: inapCount > 0 ? Number((totalInap / inapCount).toFixed(1)) : 0,
        activeShipmentCount,
        clearanceTertunda: clearanceTertundaCount,
        dndCharges,
        pipeline: pipelineCounts
      },
      issues: {
        topIssue,
        topIssueCount
      },
      chartData,
      activeContainers,
      pipelineIds
    });
  } catch (error) { next(error); }
});

router.get('/import-shipments/:id', authenticateToken, authorizeDepartment('Import'), (req, res, next) => {
  console.log("ID endpoint hit with id:", req.params.id);
  try {
    const shipment = db.prepare(`
      SELECT s.*, ip.task_unique_number as import_project_name
      FROM import_shipments s
      LEFT JOIN import_projects ip ON s.import_project_id = ip.id
      WHERE s.id = ?
    `).get(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Not found in :id route' });
    shipment.costs = JSON.parse(shipment.costs || '{}');
    shipment.containers = db.prepare('SELECT * FROM containers WHERE shipment_id = ?').all(shipment.id);
    res.json(shipment);
  } catch (error) { next(error); }
});

router.post('/import-shipments', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    let payloadHash = null;

    if (idempotencyKey) {
      const crypto = require('crypto');
      payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    }

    const result = db.transaction(() => {
      if (idempotencyKey) {
        const existing = db.prepare('SELECT * FROM idempotency_keys WHERE key = ?').get(idempotencyKey);
        if (existing) {
          if (existing.user_id !== req.user.id || existing.endpoint !== req.originalUrl) {
            const { ApiError } = require('../../utils/errors');
            throw new ApiError(409, 'CONFLICT', 'Idempotency key already in use by another context');
          }
          if (existing.request_payload_hash !== payloadHash) {
            const { ApiError } = require('../../utils/errors');
            throw new ApiError(409, 'CONFLICT', 'Idempotency key reused with different payload');
          }
          return { isIdempotent: true, status: existing.response_status, body: JSON.parse(existing.response_body) };
        }
      }

      const data = req.body;
      let finalCode = data.shipment_code;
      if (!finalCode) {
        const last = db.prepare('SELECT shipment_code FROM import_shipments ORDER BY id DESC LIMIT 1').get();
        let nextNum = 1;
        if (last && last.shipment_code) {
          const match = last.shipment_code.match(/SHP-(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }
        finalCode = `SHP-${String(nextNum).padStart(4, '0')}`;
      }

      const info = db.prepare(`
        INSERT INTO import_shipments (shipment_code, import_project_id, un, kat, supplier, invoice_no, bl_no, mode_transport, qtty, uom, depo_route, gudang, ata, etd, eta, hs_code, shipment_term, trade, free_time_destination, created_by_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(finalCode, data.import_project_id || null, data.un || null, data.kat || null, data.supplier || null, data.invoice_no || null, data.bl_no || null, data.mode_transport || null, data.qtty || 0, data.uom || 'CBM', data.depo_route || null, data.gudang || null, data.ata || null, data.etd || null, data.eta || null, data.hs_code || null, data.shipment_term || null, data.trade || null, data.free_time_destination || 0, req.user.id);
      
      const newShipment = db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(info.lastInsertRowid);

      if (idempotencyKey) {
        db.prepare('INSERT INTO idempotency_keys (key, user_id, endpoint, request_payload_hash, response_status, response_body) VALUES (?, ?, ?, ?, ?, ?)').run(
          idempotencyKey, req.user.id, req.originalUrl, payloadHash, 201, JSON.stringify(newShipment)
        );
      }

      return { isIdempotent: false, status: 201, body: newShipment };
    })();

    res.status(result.status).json(result.body);
  } catch (error) { next(error); }
});

router.patch('/import-shipments/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const allowedKeys = ['import_project_id', 'un', 'kat', 'supplier', 'invoice_no', 'bl_no', 'mode_transport', 'qtty', 'uom', 'depo_route', 'gudang', 'ata', 'etd', 'eta', 'hs_code', 'shipment_term', 'trade', 'free_time_destination'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);
      db.prepare(`UPDATE import_shipments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch('/import-shipments/:id/costs', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const costsData = req.body.costs || {};
    db.transaction(() => {
      // 1. Update costs in import_shipments
      db.prepare(`UPDATE import_shipments SET costs = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(JSON.stringify(costsData), req.params.id);

      // 2. Logic khusus untuk sinkronisasi ke PIB Request dan Realisasi PIB
      if (costsData['OTHE (PIB)']) {
        const pibData = costsData['OTHE (PIB)'];
        const pibRequestId = pibData._dari_pib_request;

        // Pastikan terhubung dengan request dan user sudah mengisikan aktual BM
        if (pibRequestId && pibData.bm !== undefined) {
          const aktualBm  = parseFloat(pibData.bm)  || 0;
          const aktualPpn = parseFloat(pibData.ppn) || 0;
          const aktualPph = parseFloat(pibData.pph) || 0;
          const aktualTotal = aktualBm + aktualPpn + aktualPph;

          // Update PIB Request dengan angka aktual
          db.prepare(`
            UPDATE pib_requests SET
              aktual_bm = ?, aktual_ppn = ?, aktual_pph = ?,
              aktual_total = ?,
              lebih_kurang = kasbon_diminta - ?,
              status = CASE WHEN status = 'Approved' THEN 'Realized' ELSE status END,
              updated_at = datetime('now')
            WHERE id = ?
          `).run(aktualBm, aktualPpn, aktualPph, aktualTotal, aktualTotal, pibRequestId);

          // Sync ke Realisasi PIB (update angka aktual)
          const pibReq = db.prepare('SELECT * FROM pib_requests WHERE id = ?').get(pibRequestId);
          if (pibReq?.realisasi_pib_id) {
            db.prepare(`
              UPDATE realisasi_pib SET
                bm = ?, ppn = ?, pph = ?,
                total_pib_realisasi = ?,
                lebih_kurang = ?,
                status = CASE WHEN status IN ('Draft', 'Verified') THEN 'Verified' ELSE status END,
                updated_at = datetime('now')
              WHERE id = ?
            `).run(
              aktualBm, aktualPpn, aktualPph,
              aktualTotal,
              pibReq.kasbon_diminta - aktualTotal,
              pibReq.realisasi_pib_id
            );
          }
        }
      }
    })();
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/import-shipments/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/import-shipments/:id/containers', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const { no_kontainer } = req.body;
    const info = db.prepare('INSERT INTO containers (shipment_id, no_kontainer) VALUES (?, ?)').run(req.params.id, no_kontainer);
    res.status(201).json(db.prepare('SELECT * FROM containers WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { next(error); }
});

router.patch('/containers/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    const allowedKeys = ['no_kontainer', 'stack', 'gate_out', 'trucking_repo_vendor', 'tru_repo_arrival', 'tru_repo_depart', 'trucking_wh_vendor', 'gate_in_wh', 'offloading_start', 'offloading_end', 'gate_out_wh', 'fish_issue', 'queue_issue', 'space_issue', 'other_issue'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);
      db.prepare(`UPDATE containers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/containers/:id', authenticateToken, requireRole(['Supervisor', 'Staff Dept']), authorizeDepartment('Import'), (req, res, next) => {
  try {
    db.prepare('DELETE FROM containers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ==========================================
// 8. JOB ORDERS & PAYMENTS

module.exports = router;