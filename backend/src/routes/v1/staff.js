const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const bcrypt = require('bcrypt');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const { validatePayload } = require('../../middleware/validation');

router.get('/users/all', authenticateToken, (req, res, next) => {
  try {
    const users = db.prepare('SELECT id, nama, employee_id, level_otoritas, departemen, tipe_karyawan, status_aktif FROM users ORDER BY nama ASC').all();
    res.json(users);
  } catch (error) { next(error); }
});

router.get('/users/assignable', authenticateToken, (req, res, next) => {
  try {
    const { level_otoritas, departemen } = req.user;
    let rows = [];
    if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      rows = db.prepare(`SELECT id, nama, employee_id, tipe_karyawan, departemen, level_otoritas FROM users WHERE level_otoritas = 'Staff Dept' AND departemen = ? AND status_aktif = 1 ORDER BY nama ASC`).all(departemen);
    } else if (level_otoritas === 'Manager') {
      rows = db.prepare(`SELECT id, nama, employee_id, departemen, tipe_karyawan, level_otoritas FROM users WHERE level_otoritas IN ('Supervisor', 'SPV Dept') AND status_aktif = 1 ORDER BY departemen ASC, nama ASC`).all();
    } else if (level_otoritas === 'Staff Dept') {
      rows = db.prepare(`SELECT id, nama, employee_id, tipe_karyawan, departemen, level_otoritas FROM users WHERE departemen = ? AND status_aktif = 1 ORDER BY nama ASC`).all(departemen);
    }
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/staff', authenticateToken, (req, res, next) => {
  try {
    const { level_otoritas, departemen } = req.user;
    let query = 'SELECT id, employee_id, nama, departemen, level_otoritas, tipe_karyawan, status_aktif FROM users';
    const params = [];
    if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      query += ` WHERE departemen = ? AND level_otoritas = 'Staff Dept'`;
      params.push(departemen);
    } else if (level_otoritas === 'Staff Dept') {
      query += ` WHERE id = ?`;
      params.push(req.user.id);
    }
    const users = db.prepare(query).all(...params);
    res.json(users);
  } catch (error) { next(error); }
});

router.post('/staff', authenticateToken, requireRole(['Manager', 'Supervisor']), validatePayload(['nama', 'email', 'role']), (req, res, next) => {
  try {
    const { nama, email, role, department, tipe_karyawan, password } = req.body;
    const hashed = bcrypt.hashSync(password || 'password123', 10);
    const info = db.prepare(`INSERT INTO users (employee_id, nama, level_otoritas, departemen, tipe_karyawan, password_hash, status_aktif) VALUES (?, ?, ?, ?, ?, ?, 1)`)
      .run(email, nama, role, department || req.user.departemen, tipe_karyawan || 'Karyawan Tetap', hashed);
    const newUser = db.prepare('SELECT id, employee_id, nama, level_otoritas, departemen, tipe_karyawan, status_aktif FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) { next(error); }
});

router.patch('/staff/:id', authenticateToken, requireRole(['Manager', 'Supervisor']), (req, res, next) => {
  try {
    const { nama, tipe_karyawan } = req.body;
    db.prepare(`UPDATE users SET nama = ?, tipe_karyawan = ?, updated_at = datetime('now') WHERE id = ?`).run(nama, tipe_karyawan, req.params.id);
    const updatedUser = db.prepare('SELECT id, employee_id, nama, level_otoritas, departemen, tipe_karyawan, status_aktif FROM users WHERE id = ?').get(req.params.id);
    res.json(updatedUser);
  } catch (error) { next(error); }
});

router.patch('/staff/:id/status', authenticateToken, requireRole(['Manager', 'Supervisor']), (req, res, next) => {
  try {
    const { status_aktif } = req.body;
    db.prepare(`UPDATE users SET status_aktif = ?, updated_at = datetime('now') WHERE id = ?`).run(status_aktif ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/departemen', authenticateToken, (req, res, next) => {
  try {
    const depts = db.prepare('SELECT * FROM master_data_departemen ORDER BY id ASC').all();
    res.json(depts);
  } catch (error) { next(error); }
});

router.get('/me/notes', authenticateToken, (req, res, next) => {
  try {
    const note = db.prepare("SELECT * FROM user_notes WHERE user_id = ?").get(req.user.id);
    res.json({ notes: note?.isi_catatan || '' });
  } catch (error) { next(error); }
});

router.put('/me/notes', authenticateToken, validatePayload(['notes']), (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM user_notes WHERE user_id = ?').get(req.user.id);
    if (existing) {
      db.prepare("UPDATE user_notes SET isi_catatan = ?, updated_at = datetime('now') WHERE user_id = ?").run(req.body.notes, req.user.id);
    } else {
      db.prepare("INSERT INTO user_notes (user_id, isi_catatan, updated_at) VALUES (?, ?, datetime('now'))").run(req.user.id, req.body.notes);
    }
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/departemen', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), validatePayload(['nama_departemen']), (req, res, next) => {
  try {
    const { nama_departemen } = req.body;
    const trimmedName = (nama_departemen || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'Nama departemen wajib diisi' });
    }

    const existing = db.prepare('SELECT id FROM master_data_departemen WHERE LOWER(TRIM(nama_departemen)) = LOWER(?)').get(trimmedName);
    if (existing) {
      return res.status(400).json({ error: `Departemen "${trimmedName}" sudah terdaftar` });
    }

    const info = db.prepare('INSERT INTO master_data_departemen (nama_departemen) VALUES (?)').run(trimmedName);
    const created = db.prepare('SELECT * FROM master_data_departemen WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (error) { next(error); }
});

// A9: DELETE /departemen/:id
router.delete('/departemen/:id', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), (req, res, next) => {
  try {
    const dept = db.prepare('SELECT * FROM master_data_departemen WHERE id = ?').get(req.params.id);
    if (!dept) {
      return res.status(404).json({ error: 'Departemen tidak ditemukan' });
    }

    const CORE_DEPTS = ['import', 'export', 'account officer', 'administrasi export'];
    if (CORE_DEPTS.includes(dept.nama_departemen.trim().toLowerCase())) {
      return res.status(400).json({ error: `Departemen inti sistem (${dept.nama_departemen}) tidak dapat dihapus karena digunakan oleh sistem utama.` });
    }

    const result = db.prepare('DELETE FROM master_data_departemen WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Departemen tidak ditemukan' });
    res.json({ success: true, message: 'Departemen berhasil dihapus' });
  } catch (error) { next(error); }
});

module.exports = router;
