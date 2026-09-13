const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../../database/db');
const { authenticateToken, requireRole, authorizeDepartment } = require('../../middleware/auth');
const ApiResponse = require('../../utils/ApiResponse');

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.VERCEL ? '/tmp/uploads/' : 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batasan 5MB
  }
});

router.get('/documents', authenticateToken, authorizeDepartment(), (req, res, next) => {
  try {
    const { departemen, level_otoritas } = req.user;
    let query = `
      SELECT d.*, u.nama as uploaded_by_nama 
      FROM documents d 
      LEFT JOIN users u ON d.upload_oleh_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    // Filter by department if not manager
    if (level_otoritas !== 'Manager') {
      query += ' AND d.departemen = ?';
      params.push(departemen);
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const documents = db.prepare(query).all(...params);
    
    const parsedDocs = documents.map(doc => ({
      ...doc,
      tags: doc.tags ? JSON.parse(doc.tags) : []
    }));
    
    ApiResponse.send(req, res, { documents: parsedDocs });
  } catch (error) { next(error); }
});

router.post('/documents', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), authorizeDepartment(), (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Ukuran file maksimal adalah 5MB' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Terjadi kesalahan saat mengunggah file' });
    }
    next();
  });
}, (req, res, next) => {
  try {
    const file = req.file;
    const { tipe, no_referensi, departemen, tags, vendor_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tagsArray = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const result = db.prepare(`
      INSERT INTO documents (
        nama_file, file_path, tipe, no_referensi, departemen, 
        ukuran_kb, tags, vendor_id, upload_oleh_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      file.originalname, 
      '/uploads/' + file.filename,
      tipe || 'Unknown',
      no_referensi || null,
      departemen || 'Import',
      Math.round(file.size / 1024),
      JSON.stringify(tagsArray),
      vendor_id || null,
      req.user.id
    );

    const newDoc = db.prepare(`
      SELECT d.*, u.nama as uploaded_by_nama 
      FROM documents d 
      LEFT JOIN users u ON d.upload_oleh_id = u.id 
      WHERE d.id = ?
    `).get(result.lastInsertRowid);

    const parsedDoc = {
      ...newDoc,
      tags: newDoc.tags ? JSON.parse(newDoc.tags) : []
    };

    res.status(201);
    ApiResponse.send(req, res, { document: parsedDoc });
  } catch (error) { next(error); }
});

// Use DELETE instead of PATCH for is_deleted, following REST conventions and native SQLite pattern
router.delete('/documents/:id', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), (req, res, next) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    ApiResponse.send(req, res, { success: true });
  } catch (error) { next(error); }
});

// Alias for patch backward compatibility if frontend is still sending PATCH for soft delete
router.patch('/documents/:id', authenticateToken, requireRole(['Manager', 'Supervisor', 'Staff Dept']), (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_deleted } = req.body;
    
    // SQLite doesn't have is_deleted in the new schema, but we'll simulate soft delete if they send it
    if (is_deleted === true) {
      db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    }
    
    res.status(204).send();
  } catch (error) { next(error); }
});

module.exports = router;
