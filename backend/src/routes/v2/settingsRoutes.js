const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Gunakan otentikasi untuk semua route settings
router.use(authenticateToken);

/**
 * GET /api/v2/settings/:key
 * Mengambil setting berdasarkan kunci (key)
 */
router.get('/:key', (req, res, next) => {
  try {
    const { key } = req.params;
    const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
    
    if (!row) {
      return res.json({ success: true, data: null });
    }

    let parsedValue = row.value;
    try {
      parsedValue = JSON.parse(row.value);
    } catch (e) {
      // Jika bukan JSON valid, kembalikan sebagai string biasa
    }

    res.json({ success: true, data: parsedValue });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v2/settings/:key
 * Menyimpan atau memperbarui setting berdasarkan kunci
 * Hanya Manager atau Supervisor yang boleh merubah setting sistem AE
 */
router.put('/:key', requireRole(['Manager', 'Supervisor']), (req, res, next) => {
  try {
    const { key } = req.params;
    let { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'Value is required' });
    }

    // Jika value adalah object/array, stringify sebelum simpan ke SQLite
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    } else {
      value = String(value);
    }

    // Upsert (Insert or Replace)
    db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value, updated_by, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(key, value, req.user.id);

    res.json({ success: true, message: 'Setting saved successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
