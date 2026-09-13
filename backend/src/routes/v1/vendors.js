const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');
const { TransactionManager } = require('../../database/TransactionManager');
const { ConcurrencyConflictError, ValidationError } = require('../../utils/errors');

// --- Rating Calculation Service ---
function calculateOverallScore(scores) {
  return (
    scores.service_quality_score * 0.25 +
    scores.on_time_score * 0.25 +
    scores.cost_score * 0.20 +
    scores.responsiveness_score * 0.15 +
    scores.compliance_score * 0.15
  );
}

function getClassification(score) {
  if (score >= 4.50) return 'EXCELLENT';
  if (score >= 4.00) return 'VERY_GOOD';
  if (score >= 3.50) return 'GOOD';
  if (score >= 3.00) return 'FAIR';
  return 'POOR';
}

// GET all vendors
router.get('/vendors', authenticateToken, (req, res, next) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY created_at DESC').all();
    vendors.forEach(v => { 
      v.layanan = JSON.parse(v.layanan || '[]');
      v.classification = v.review_count > 0 ? getClassification(v.rating) : 'NOT_RATED';
    });
    res.json(vendors);
  } catch (error) { next(error); }
});

// A2: GET /vendors/monitoring — HARUS sebelum /vendors/:id agar tidak tersamar
router.get('/vendors/monitoring', authenticateToken, (req, res, next) => {
  try {
    const vendors = db.prepare(`
      SELECT v.id, v.nama, v.service_type, v.status, v.rating, v.review_count,
             COUNT(jo.id) as total_jobs,
             COALESCE(SUM(jo.total_invoice), 0) as total_invoice,
             COALESCE(SUM(jo.total_paid), 0) as total_paid
      FROM vendors v
      LEFT JOIN job_orders jo ON jo.vendor_id = v.id
      WHERE v.status = 'Aktif'
      GROUP BY v.id, v.nama, v.service_type, v.status, v.rating, v.review_count
      ORDER BY v.nama ASC
    `).all();
    vendors.forEach(v => { v.outstanding = v.total_invoice - v.total_paid; });
    res.json(vendors);
  } catch (error) { next(error); }
});

// GET single vendor
router.get('/vendors/:id', authenticateToken, (req, res, next) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    vendor.layanan = JSON.parse(vendor.layanan || '[]');
    vendor.classification = vendor.review_count > 0 ? getClassification(vendor.rating) : 'NOT_RATED';
    res.json(vendor);
  } catch (error) { next(error); }
});

// POST new vendor
router.post('/vendors', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), validatePayload(['nama']), async (req, res, next) => {
  try {
    const newVendor = await TransactionManager.execute(async (tx) => {
      const { nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan } = req.body;
      
      if (!service_type || !['Trucking', 'Forwarder', 'Both'].includes(service_type)) {
        throw new ValidationError('Valid service_type is required');
      }

      const info = tx.db.prepare(`
        INSERT INTO vendors 
        (nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan, version) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, JSON.stringify(layanan || []), catatan);
      
      const v = tx.db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
      v.layanan = JSON.parse(v.layanan || '[]');
      return v;
    });
    res.status(201).json(newVendor);
  } catch (error) { next(error); }
});

// PATCH vendor
router.patch('/vendors/:id', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), async (req, res, next) => {
  try {
    const { version } = req.body;
    if (version === undefined) {
      return res.status(400).json({ error: 'VERSION_REQUIRED' });
    }

    const updated = await TransactionManager.execute(async (tx) => {
      const current = tx.db.prepare('SELECT version FROM vendors WHERE id = ?').get(req.params.id);
      if (!current) throw new Error('Vendor not found');
      if (current.version !== version) {
        throw new ConcurrencyConflictError('Vendor has been updated by another user. Please refresh.');
      }

      const allowedKeys = ['nama', 'service_type', 'region', 'kontak_nama', 'kontak_email', 'kontak_telepon', 'alamat', 'catatan', 'status', 'review_status', 'review_note'];
      const updates = [];
      const values = [];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          if (key === 'service_type' && !['Trucking', 'Forwarder', 'Both'].includes(req.body[key])) {
             throw new ValidationError('Invalid service_type');
          }
          updates.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      }
      if (req.body.layanan !== undefined) {
        updates.push('layanan = ?');
        values.push(JSON.stringify(req.body.layanan));
      }
      
      if (updates.length > 0) {
        updates.push("version = version + 1");
        updates.push("updated_at = datetime('now')");
        values.push(req.params.id);
        values.push(version); // optimistic lock
        
        const result = tx.db.prepare(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ? AND version = ?`).run(...values);
        if (result.changes === 0) {
          throw new ConcurrencyConflictError('Vendor has been updated by another user. Please refresh.');
        }
      }
      
      const v = tx.db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
      if (v) v.layanan = JSON.parse(v.layanan || '[]');
      return v;
    });
    res.json(updated);
  } catch (error) { 
    if (error instanceof ConcurrencyConflictError) {
      return res.status(409).json({ error: 'CONCURRENCY_CONFLICT', message: error.message });
    }
    next(error); 
  }
});

// DELETE vendor
router.delete('/vendors/:id', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), async (req, res, next) => {
  try {
    await TransactionManager.execute(async (tx) => {
      tx.db.prepare('UPDATE job_orders SET vendor_id = NULL WHERE vendor_id = ?').run(req.params.id);
      tx.db.prepare('DELETE FROM vendor_rate_cards WHERE vendor_id = ?').run(req.params.id);
      tx.db.prepare('DELETE FROM vendor_fleets WHERE vendor_id = ?').run(req.params.id);
      tx.db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

// --- RATE CARDS API ---

router.get('/vendors/:id/rates', authenticateToken, (req, res, next) => {
  try {
    const rates = db.prepare('SELECT * FROM vendor_rate_cards WHERE vendor_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(rates);
  } catch (error) { next(error); }
});

router.post('/vendors/:id/rates', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), validatePayload(['route_origin', 'route_destination', 'vehicle_type', 'price']), async (req, res, next) => {
  try {
    const newRate = await TransactionManager.execute(async (tx) => {
      const { route_origin, route_destination, vehicle_type, price, effective_date } = req.body;
      const info = tx.db.prepare(`
        INSERT INTO vendor_rate_cards (vendor_id, route_origin, route_destination, vehicle_type, price, effective_date, version)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(req.params.id, route_origin, route_destination, vehicle_type, price, effective_date || null);
      
      return tx.db.prepare('SELECT * FROM vendor_rate_cards WHERE id = ?').get(info.lastInsertRowid);
    });
    res.status(201).json(newRate);
  } catch (error) { next(error); }
});

router.patch('/vendors/:vendorId/rates/:rateId', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), async (req, res, next) => {
  try {
    const { version } = req.body;
    if (version === undefined) return res.status(400).json({ error: 'VERSION_REQUIRED' });

    const updated = await TransactionManager.execute(async (tx) => {
      const current = tx.db.prepare('SELECT version FROM vendor_rate_cards WHERE id = ?').get(req.params.rateId);
      if (!current) throw new Error('Rate card not found');
      if (current.version !== version) throw new ConcurrencyConflictError('CONCURRENCY_CONFLICT');

      const allowedKeys = ['route_origin', 'route_destination', 'vehicle_type', 'price', 'effective_date', 'status'];
      const updates = [];
      const values = [];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      }
      
      if (updates.length > 0) {
        updates.push("version = version + 1");
        updates.push("updated_at = datetime('now')");
        values.push(req.params.rateId, version);
        
        const result = tx.db.prepare(`UPDATE vendor_rate_cards SET ${updates.join(', ')} WHERE id = ? AND version = ?`).run(...values);
        if (result.changes === 0) throw new ConcurrencyConflictError('CONCURRENCY_CONFLICT');
      }
      
      return tx.db.prepare('SELECT * FROM vendor_rate_cards WHERE id = ?').get(req.params.rateId);
    });
    res.json(updated);
  } catch (error) { 
    if (error instanceof ConcurrencyConflictError) return res.status(409).json({ error: 'CONCURRENCY_CONFLICT' });
    next(error); 
  }
});

// --- FLEETS API ---

router.get('/vendors/:id/fleets', authenticateToken, (req, res, next) => {
  try {
    const fleets = db.prepare('SELECT * FROM vendor_fleets WHERE vendor_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(fleets);
  } catch (error) { next(error); }
});

router.post('/vendors/:id/fleets', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), validatePayload(['license_plate', 'vehicle_type']), async (req, res, next) => {
  try {
    const newFleet = await TransactionManager.execute(async (tx) => {
      const { license_plate, vehicle_type, capacity, compliance_status } = req.body;
      const info = tx.db.prepare(`
        INSERT INTO vendor_fleets (vendor_id, license_plate, vehicle_type, capacity, compliance_status, version)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(req.params.id, license_plate, vehicle_type, capacity || null, compliance_status || 'Compliant');
      
      return tx.db.prepare('SELECT * FROM vendor_fleets WHERE id = ?').get(info.lastInsertRowid);
    });
    res.status(201).json(newFleet);
  } catch (error) { next(error); }
});

router.patch('/vendors/:vendorId/fleets/:fleetId', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), async (req, res, next) => {
  try {
    const { version } = req.body;
    if (version === undefined) return res.status(400).json({ error: 'VERSION_REQUIRED' });

    const updated = await TransactionManager.execute(async (tx) => {
      const current = tx.db.prepare('SELECT version FROM vendor_fleets WHERE id = ?').get(req.params.fleetId);
      if (!current) throw new Error('Fleet not found');
      if (current.version !== version) throw new ConcurrencyConflictError('CONCURRENCY_CONFLICT');

      const allowedKeys = ['license_plate', 'vehicle_type', 'capacity', 'compliance_status'];
      const updates = [];
      const values = [];
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      }
      
      if (updates.length > 0) {
        updates.push("version = version + 1");
        updates.push("updated_at = datetime('now')");
        values.push(req.params.fleetId, version);
        
        const result = tx.db.prepare(`UPDATE vendor_fleets SET ${updates.join(', ')} WHERE id = ? AND version = ?`).run(...values);
        if (result.changes === 0) throw new ConcurrencyConflictError('CONCURRENCY_CONFLICT');
      }
      
      return tx.db.prepare('SELECT * FROM vendor_fleets WHERE id = ?').get(req.params.fleetId);
    });
    res.json(updated);
  } catch (error) { 
    if (error instanceof ConcurrencyConflictError) return res.status(409).json({ error: 'CONCURRENCY_CONFLICT' });
    next(error); 
  }
});

// --- EVALUATIONS API ---

router.get('/vendors/:id/evaluations', authenticateToken, (req, res, next) => {
  try {
    const evaluations = db.prepare('SELECT * FROM vendor_evaluations WHERE vendor_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(evaluations);
  } catch (error) { next(error); }
});

router.post('/vendors/:id/evaluations', authenticateToken, requireRole(['Manager', 'Supervisor']), validatePayload(['evaluation_period', 'service_quality_score', 'on_time_score', 'cost_score', 'responsiveness_score', 'compliance_score']), async (req, res, next) => {
  try {
    const newEval = await TransactionManager.execute(async (tx) => {
      const { evaluation_period, service_quality_score, on_time_score, cost_score, responsiveness_score, compliance_score, notes } = req.body;
      
      const overall_score = calculateOverallScore({
        service_quality_score: Number(service_quality_score),
        on_time_score: Number(on_time_score),
        cost_score: Number(cost_score),
        responsiveness_score: Number(responsiveness_score),
        compliance_score: Number(compliance_score)
      });
      
      const classification = getClassification(overall_score);

      const info = tx.db.prepare(`
        INSERT INTO vendor_evaluations (vendor_id, evaluation_period, evaluator_id, service_quality_score, on_time_score, cost_score, responsiveness_score, compliance_score, overall_score, classification, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.params.id, evaluation_period, req.user?.id || null, service_quality_score, on_time_score, cost_score, responsiveness_score, compliance_score, overall_score, classification, notes || null);
      
      // Update vendor rating cache
      tx.db.prepare(`
        UPDATE vendors 
        SET rating = ?, review_count = review_count + 1, updated_at = datetime('now')
        WHERE id = ?
      `).run(overall_score, req.params.id);

      return tx.db.prepare('SELECT * FROM vendor_evaluations WHERE id = ?').get(info.lastInsertRowid);
    });
    res.status(201).json(newEval);
  } catch (error) { 
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'EVALUATION_EXISTS', message: 'Evaluation for this period already exists.' });
    }
    next(error); 
  }
});

router.get('/vendors/:id/performance', authenticateToken, (req, res, next) => {
  try {
    const vendor = db.prepare('SELECT id, nama, rating, review_count FROM vendors WHERE id = ?').get(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    
    const latestEvaluation = db.prepare('SELECT * FROM vendor_evaluations WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id);
    
    res.json({
      vendor_id: vendor.id,
      vendor_name: vendor.nama,
      cached_rating: vendor.rating,
      review_count: vendor.review_count,
      classification: vendor.review_count > 0 ? getClassification(vendor.rating) : 'NOT_RATED',
      latest_evaluation: latestEvaluation || null
    });
  } catch (error) { next(error); }
});

module.exports = router;
