const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');
const ApiResponse = require('../../utils/ApiResponse');

router.get('/document-types', authenticateToken, (req, res, next) => {
  try {
    const types = db.prepare('SELECT * FROM master_data_dokumen ORDER BY nama_dokumen ASC').all();
    ApiResponse.send(req, res, { documentTypes: types });
  } catch (error) { next(error); }
});

router.post('/document-types', authenticateToken, requireRole(['Manager', 'Supervisor']), (req, res, next) => {
  try {
    const { nama_dokumen, keterangan, is_active } = req.body;
    if (!nama_dokumen || !nama_dokumen.trim()) {
      return res.status(400).json({ error: 'Nama dokumen wajib diisi' });
    }
    
    const kode_dokumen = nama_dokumen.trim().toUpperCase().replace(/\s+/g, '_') + '_' + Date.now();
    const active = is_active !== undefined ? (is_active ? 1 : 0) : 1;
    
    const result = db.prepare(`
      INSERT INTO master_data_dokumen (kode_dokumen, nama_dokumen, keterangan, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(kode_dokumen, nama_dokumen.trim(), keterangan || null, active);
    
    const docType = db.prepare('SELECT * FROM master_data_dokumen WHERE id = ?').get(result.lastInsertRowid);
    ApiResponse.send(req, res, docType);
  } catch (error) { next(error); }
});

router.put('/document-types/:id', authenticateToken, requireRole(['Manager', 'Supervisor']), (req, res, next) => {
  try {
    const { nama_dokumen, keterangan, is_active } = req.body;
    if (!nama_dokumen || !nama_dokumen.trim()) {
      return res.status(400).json({ error: 'Nama dokumen wajib diisi' });
    }
    
    const active = is_active !== undefined ? (is_active ? 1 : 0) : 1;
    
    db.prepare('UPDATE master_data_dokumen SET nama_dokumen = ?, keterangan = ?, is_active = ?, updated_at = datetime("now") WHERE id = ?')
      .run(nama_dokumen.trim(), keterangan || null, active, req.params.id);
      
    const docType = db.prepare('SELECT * FROM master_data_dokumen WHERE id = ?').get(req.params.id);
    if (!docType) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan' });
    }
    ApiResponse.send(req, res, docType);
  } catch (error) { next(error); }
});

router.delete('/document-types/:id', authenticateToken, requireRole(['Manager', 'Supervisor']), (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM master_data_dokumen WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan' });
    }
    ApiResponse.send(req, res, { success: true });
  } catch (error) { next(error); }
});

// ── Master Kategori Biaya Manual ─────────────────────────────────────────────
router.get('/master-kategori-biaya-manual', authenticateToken, (req, res, next) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM master_kategori_biaya_manual WHERE is_active = 1 ORDER BY nama_kategori ASC'
    ).all();
    ApiResponse.send(req, res, rows);
  } catch (error) { next(error); }
});

router.post('/master-kategori-biaya-manual', authenticateToken, requireRole(['Manager', 'Supervisor']), (req, res, next) => {
  try {
    const { nama_kategori, keterangan } = req.body;
    if (!nama_kategori || !nama_kategori.trim()) {
      return res.status(400).json({ error: 'nama_kategori wajib diisi' });
    }
    const info = db.prepare(
      'INSERT OR IGNORE INTO master_kategori_biaya_manual (nama_kategori, keterangan) VALUES (?, ?)'
    ).run(nama_kategori.trim(), keterangan || null);
    const row = db.prepare('SELECT * FROM master_kategori_biaya_manual WHERE nama_kategori = ?').get(nama_kategori.trim());
    ApiResponse.send(req, res, row);
  } catch (error) { next(error); }
});

router.patch('/master-kategori-biaya-manual/:id', authenticateToken, requireRole(['Manager']), (req, res, next) => {
  try {
    const { is_active, keterangan } = req.body;
    db.prepare('UPDATE master_kategori_biaya_manual SET is_active = COALESCE(?, is_active), keterangan = COALESCE(?, keterangan) WHERE id = ?')
      .run(is_active !== undefined ? (is_active ? 1 : 0) : null, keterangan || null, req.params.id);
    ApiResponse.send(req, res, { success: true });
  } catch (error) { next(error); }
});

module.exports = router;

