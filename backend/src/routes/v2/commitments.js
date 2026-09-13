const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');
const CommitmentEngine = require('../../domain/commitmentEngine');

// POST /api/v2/commitments/engine/evaluate
router.post('/engine/evaluate', authenticateToken, requireRole(['Manager', 'Supervisor']), authorizeDepartment(), validatePayload(['import_project_id', 'incoterm', 'transport_mode']), (req, res, next) => {
  try {
    const { import_project_id, incoterm, transport_mode } = req.body;

    const commitments = CommitmentEngine.evaluate(import_project_id, incoterm, transport_mode);
    res.status(201).json({ success: true, spawned: commitments });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v2/commitments/:id/verify
router.patch('/:id/verify', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), authorizeDepartment(), (req, res, next) => {
  try {
    const { vendor_id, actual_amount, proof_doc_id } = req.body;
    const ledgerId = req.params.id;

    // Optional: Validate if already allocated (skip for now to keep simple)
    
    const stmt = db.prepare(`
      UPDATE financial_request_ledger 
      SET 
        vendor_id = COALESCE(?, vendor_id),
        actual_amount = COALESCE(?, actual_amount),
        status = 'Terisi',
        updated_at = datetime('now')
      WHERE id = ?
    `);
    
    stmt.run(vendor_id || null, actual_amount || null, ledgerId);
    
    res.json({ success: true, message: 'Commitment verified' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
