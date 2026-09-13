const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./src/database/db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'kompas_exim_super_secret_key';

// Auto-migrate tables
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN import_category_key TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN import_shipment_id INTEGER").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN invoice_no TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN dpp REAL DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN persen_ppn REAL DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN ppn REAL DEFAULT 0").run();
} catch (e) {}

// Auto-migrate Debit Notes
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS debit_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dn_number TEXT UNIQUE NOT NULL,
      import_project_id INTEGER NOT NULL REFERENCES import_projects(id),
      claim_kategori TEXT NOT NULL,
      claim_jenis TEXT NOT NULL,
      claim_kepada TEXT NOT NULL,
      jumlah_klaim REAL NOT NULL,
      deskripsi TEXT,
      linked_job_order_id INTEGER REFERENCES job_orders(id),
      mata_uang TEXT DEFAULT 'IDR',
      departemen TEXT NOT NULL,
      dibuat_oleh_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Diterbitkan','Settled','Ditolak')),
      tanggal_dn TEXT,
      jumlah_recovery REAL DEFAULT 0,
      tanggal_recovery TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS debit_note_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debit_note_id INTEGER NOT NULL REFERENCES debit_notes(id) ON DELETE CASCADE,
      status_dari TEXT,
      status_ke TEXT NOT NULL,
      catatan TEXT,
      diubah_oleh_id INTEGER NOT NULL REFERENCES users(id),
      diubah_pada TEXT DEFAULT (datetime('now'))
    )
  `).run();
} catch (e) {
  console.error("Migration error:", e);
}

// Setup middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER UTILITIES
// ─────────────────────────────────────────
const catchErrors = (fn) => (req, res, next) => {
  try {
    const result = fn(req, res, next);
    if (result instanceof Promise) {
      result.catch(next);
    }
  } catch (err) {
    next(err);
  }
};

function validateRequired(body, fields) {
  return fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
}


// Setup uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir + '/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Error logging
app.post('/api/log-error', catchErrors((req, res) => {
  console.log('FRONTEND ERROR LOGGED:', req.body);
  fs.writeFileSync(path.join(__dirname, 'frontend-error.log'), JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Helper Functions
function statusBadgeJO(totalInvoice, totalPaid) {
  if (totalPaid >= totalInvoice && totalInvoice > 0) return 'Lunas';
  if (totalPaid > 0) return 'Bayar Sebagian';
  return 'Belum Dibayar';
}

function generateDNNumber() {
  const tahun = new Date().getFullYear();
  const last = db.prepare("SELECT dn_number FROM debit_notes ORDER BY id DESC LIMIT 1").get();
  let nextNum = 1;
  if (last && last.dn_number) {
    const match = last.dn_number.match(/DN-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  return `DN-${String(nextNum).padStart(4, '0')}-${tahun}`;
}

// Middleware Authentikasi
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Tidak ada token autentikasi',
        hint: 'Silakan login ulang'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'kompas_exim_secret_key', (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Sesi sudah habis',
            hint: 'Silakan login ulang',
            code: 'TOKEN_EXPIRED'
          });
        }
        return res.status(401).json({
          error: 'Token tidak valid',
          hint: 'Silakan login ulang',
          code: 'TOKEN_INVALID'
        });
      }
      req.user = user;
      next();
    });
  } catch (err) {
    next(err);
  }
}


app.post('/api/login', catchErrors((req, res) => {
  try {
    const { employee_id, password } = req.body;
    if (!employee_id || !password) return res.status(400).json({ error: 'Data tidak lengkap' });

    const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
    if (!user) return res.status(401).json({ error: 'Employee ID tidak ditemukan' });
    
    let isValid = false;
    try {
      isValid = bcrypt.compareSync(password, user.password_hash);
    } catch(e) {
      isValid = (user.password_hash === password);
    }
    
    if (!isValid && user.password_hash !== password) {
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }
    if (!user.status_aktif || user.status_aktif == 0) return res.status(403).json({ error: 'Akun ini sudah tidak aktif' });
    
    const { password_hash: _, ...userWithoutPassword } = user;
    userWithoutPassword.status_aktif = Boolean(userWithoutPassword.status_aktif);
    
    const token = jwt.sign(
      { id: user.id, employee_id: user.employee_id, level_otoritas: user.level_otoritas, departemen: user.departemen },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/all',authenticateToken catchErrors((req, res) => {
  try {
    const users = db.prepare('SELECT id, nama, employee_id, level_otoritas, departemen, tipe_karyawan, status_aktif FROM users ORDER BY nama ASC').all();
    res.json(users);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/users/assignable',authenticateToken catchErrors((req, res) => {
  try {
    const { level_otoritas, departemen } = req.user;
    let rows = [];
    if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      rows = db.prepare(`SELECT id, nama, employee_id, tipe_karyawan, departemen, level_otoritas FROM users WHERE level_otoritas = 'Staff Dept' AND departemen = ? AND status_aktif = 1 ORDER BY nama ASC`).all(departemen);
    } else if (level_otoritas === 'Manager') {
      rows = db.prepare(`SELECT id, nama, employee_id, departemen, tipe_karyawan, level_otoritas FROM users WHERE level_otoritas IN ('Supervisor', 'SPV Dept') AND status_aktif = 1 ORDER BY departemen ASC, nama ASC`).all();
    }
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/staff',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/staff',authenticateToken catchErrors((req, res) => {
  try {
    const { nama, email, role, departemen, tipe_karyawan, password } = req.body;
    const hashed = bcrypt.hashSync(password || 'password123', 10);
    const info = db.prepare(`INSERT INTO users (employee_id, nama, level_otoritas, departemen, tipe_karyawan, password_hash, status_aktif) VALUES (?, ?, ?, ?, ?, ?, 1)`)
      .run(email || req.body.employee_id, nama, role || 'Staff Dept', departemen || req.user.departemen, tipe_karyawan || 'Karyawan Tetap', hashed);
    const newUser = db.prepare('SELECT id, employee_id, nama, level_otoritas, departemen, tipe_karyawan, status_aktif FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/staff/:id',authenticateToken catchErrors((req, res) => {
  try {
    const { nama, tipe_karyawan } = req.body;
    db.prepare(`UPDATE users SET nama = ?, tipe_karyawan = ?, updated_at = datetime('now') WHERE id = ?`).run(nama, tipe_karyawan, req.params.id);
    const updatedUser = db.prepare('SELECT id, employee_id, nama, level_otoritas, departemen, tipe_karyawan, status_aktif FROM users WHERE id = ?').get(req.params.id);
    res.json(updatedUser);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/staff/:id/status',authenticateToken catchErrors((req, res) => {
  try {
    const { status_aktif } = req.body;
    db.prepare(`UPDATE users SET status_aktif = ?, updated_at = datetime('now') WHERE id = ?`).run(status_aktif ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 2. MASTER DATA & DEPARTEMEN
// ==========================================
app.get('/api/departemen', catchErrors((req, res) => {
  try {
    const depts = db.prepare('SELECT * FROM master_data_departemen ORDER BY id ASC').all();
    res.json(depts);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/departemen',authenticateToken catchErrors((req, res) => {
  try {
    const { nama_departemen } = req.body;
    db.prepare('INSERT INTO master_data_departemen (nama_departemen) VALUES (?)').run(nama_departemen);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/document-types', catchErrors((req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM master_data_dokumen ORDER BY kode_dokumen ASC').all();
    res.json({ documentTypes: docs });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/document-types',authenticateToken catchErrors((req, res) => {
  try {
    const { nama_dokumen, keterangan } = req.body;
    const lastDoc = db.prepare('SELECT kode_dokumen FROM master_data_dokumen ORDER BY id DESC LIMIT 1').get();
    let nextNum = 1;
    if (lastDoc && lastDoc.kode_dokumen) {
      const match = lastDoc.kode_dokumen.match(/DOC-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const kode_dokumen = `DOC-${String(nextNum).padStart(3, '0')}`;
    const info = db.prepare('INSERT INTO master_data_dokumen (kode_dokumen, nama_dokumen, keterangan) VALUES (?, ?, ?)').run(kode_dokumen, nama_dokumen, keterangan || null);
    const newDoc = db.prepare('SELECT * FROM master_data_dokumen WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newDoc);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/document-types/:id',authenticateToken catchErrors((req, res) => {
  try {
    const { nama_dokumen, keterangan } = req.body;
    db.prepare(`UPDATE master_data_dokumen SET nama_dokumen = ?, keterangan = ?, updated_at = datetime('now') WHERE id = ?`).run(nama_dokumen, keterangan || null, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/document-types/:id',authenticateToken catchErrors((req, res) => {
  try {
    const inUse = db.prepare('SELECT COUNT(*) as c FROM import_project_documents WHERE dokumen_id = ?').get(req.params.id);
    const inMonitoring = db.prepare('SELECT COUNT(*) as c FROM dokumen_monitoring_baris WHERE master_dokumen_id = ?').get(req.params.id);
    const totalUsage = (inUse?.c || 0) + (inMonitoring?.c || 0);
    if (totalUsage > 0) {
      return res.status(409).json({ error: `Dokumen ini sedang dipakai di ${totalUsage} tempat.` });
    }
    db.prepare('DELETE FROM master_data_dokumen WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/vendors', catchErrors((req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY created_at DESC').all();
    vendors.forEach(v => { v.layanan = JSON.parse(v.layanan || '[]'); });
    res.json(vendors);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/vendors',authenticateToken catchErrors((req, res) => {
  try {
    const { nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan } = req.body;
    const info = db.prepare(`INSERT INTO vendors (nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, JSON.stringify(layanan || []), catatan);
    const newVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
    if(newVendor) newVendor.layanan = JSON.parse(newVendor.layanan || '[]');
    res.json(newVendor);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/vendors/:id',authenticateToken catchErrors((req, res) => {
  try {
    const allowedKeys = ['nama', 'service_type', 'region', 'kontak_nama', 'kontak_email', 'kontak_telepon', 'alamat', 'catatan', 'status'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (req.body.layanan !== undefined) {
      updates.push('layanan = ?');
      values.push(JSON.stringify(req.body.layanan));
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);
      db.prepare(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if(updated) updated.layanan = JSON.parse(updated.layanan || '[]');
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/vendors/:id',authenticateToken catchErrors((req, res) => {
  try {
    db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 3. DOCUMENTS (FILE UPLOAD)
// ==========================================
app.get('/api/documents',authenticateToken catchErrors((req, res) => {
  try {
    const documents = db.prepare("SELECT * FROM documents WHERE status != 'Deleted' ORDER BY created_at DESC").all();
    documents.forEach(d => { d.tags = JSON.parse(d.tags || '[]'); });
    res.json(documents); 
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/documents',authenticateToken catchErrors((req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  try {
    const file = req.file;
    const { tipe, no_referensi, departemen, tags, vendor_id } = req.body;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    const info = db.prepare(`
      INSERT INTO documents (nama_file, file_path, tipe, no_referensi, departemen, ukuran_kb, tags, vendor_id, upload_oleh_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(file.originalname, '/uploads/' + file.filename, tipe, no_referensi, departemen, Math.round(file.size / 1024), tags || '[]', vendor_id, req.user.id);
    
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(info.lastInsertRowid);
    doc.tags = JSON.parse(doc.tags);
    res.status(201).json(doc);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/documents/:id',authenticateToken catchErrors((req, res) => {
  try {
    const { status } = req.body;
    db.prepare(`UPDATE documents SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/documents/:id',authenticateToken catchErrors((req, res) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 4. TASKS (PETA TUGAS)
// ==========================================
app.get('/api/tasks',authenticateToken catchErrors((req, res) => {
  try {
    const { level_otoritas, departemen } = req.user;
    let tasks;
    
    if (level_otoritas === 'Manager') {
      tasks = db.prepare('SELECT t.*, u.nama as assignee_nama, ip.task_unique_number as import_project_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN import_projects ip ON t.import_project_id = ip.id ORDER BY t.created_at DESC').all();
    } else if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      tasks = db.prepare('SELECT t.*, u.nama as assignee_nama, ip.task_unique_number as import_project_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN import_projects ip ON t.import_project_id = ip.id WHERE t.departemen = ? ORDER BY t.created_at DESC').all(departemen);
    } else {
      tasks = db.prepare('SELECT t.*, u.nama as assignee_nama, ip.task_unique_number as import_project_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN import_projects ip ON t.import_project_id = ip.id WHERE t.assignee_id = ? ORDER BY t.created_at DESC').all(req.user.id);
    }

    const historyStmt = db.prepare('SELECT * FROM task_status_history WHERE task_id = ? ORDER BY diubah_pada ASC');
    const usersMap = {};
    db.prepare('SELECT id, nama, level_otoritas, departemen FROM users').all().forEach(u => { usersMap[u.id] = u; });

    tasks.forEach(t => { 
      t.statusHistory = historyStmt.all(t.id); 
      t.assignee = usersMap[t.assignee_id] || null;
      t.assigned_by = usersMap[t.assigned_by_id] || null;
    });
    res.json(tasks);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/tasks',authenticateToken catchErrors((req, res) => {
  try {
    let { judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, assigneeId, import_project_id, tenggat } = req.body;
    
    const assigned_by_id = req.user.id;
    const creatorLevel = req.user.level_otoritas;
    if (!departemen) departemen = req.user.departemen;

    if (!judul || !prioritas || !tenggat) {
      return res.status(400).json({ error: 'Judul, prioritas, dan tenggat wajib diisi' });
    }

    let finalAssigneeId = assignee_id || assigneeId;
    if (creatorLevel === 'Staff Dept') {
      finalAssigneeId = assigned_by_id; 
    } else {
      if (!finalAssigneeId) return res.status(400).json({ error: 'assignee_id wajib diisi untuk Supervisor/Manager' });
    }

    const finalSumberTugas = (creatorLevel === 'Supervisor' || creatorLevel === 'Manager') && finalAssigneeId !== assigned_by_id ? 'Escalation' : (sumber_tugas || 'Manual');

    const lastTask = db.prepare("SELECT task_code FROM tasks ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastTask) {
      const match = lastTask.task_code.match(/TSK-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const taskCode = `TSK-${String(nextNum).padStart(4, '0')}`;

    let newId;
    db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO tasks (task_code, judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, assigned_by_id, import_project_id, tenggat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(taskCode, judul, deskripsi || null, departemen, prioritas, status || 'Backlog', finalSumberTugas, finalAssigneeId, assigned_by_id, import_project_id, tenggat);
      newId = info.lastInsertRowid;
      db.prepare('INSERT INTO task_status_history (task_id, status_ke, diubah_oleh_id) VALUES (?, ?, ?)').run(newId, status || 'Backlog', assigned_by_id);
    })();
    
    const newTask = db.prepare('SELECT t.*, ip.task_unique_number as import_project_name FROM tasks t LEFT JOIN import_projects ip ON t.import_project_id = ip.id WHERE t.id = ?').get(newId);
    if (newTask.assignee_id) {
      const assignee = db.prepare('SELECT nama FROM users WHERE id = ?').get(newTask.assignee_id);
      if (assignee) newTask.assignee_nama = assignee.nama;
    }
    res.status(201).json(newTask);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/tasks/:id/status',authenticateToken catchErrors((req, res) => {
  try {
    const { status, status_dari } = req.body;
    db.transaction(() => {
      db.prepare(`UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
      db.prepare('INSERT INTO task_status_history (task_id, status_dari, status_ke, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(req.params.id, status_dari || null, status, req.user.id);
    })();
    res.json({ success: true, status });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/tasks/:id/catatan',authenticateToken catchErrors((req, res) => {
  try {
    const { catatan_progress, progress } = req.body;
    db.prepare(`UPDATE tasks SET catatan_progress = ?, progress = ?, updated_at = datetime('now') WHERE id = ?`).run(catatan_progress, progress, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/tasks/:id',authenticateToken catchErrors((req, res) => {
  try {
    const task = db.prepare('SELECT sumber_tugas, assigned_by_id FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    
    if (task.sumber_tugas === 'Escalation' && task.assigned_by_id !== req.user.id) {
      return res.status(403).json({ error: 'Hanya pembuat tugas (Supervisor/Manager) yang dapat menghapus Tugas Escalation.' });
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 5. IMPORT PROJECTS
// ==========================================
app.get('/api/import-projects',authenticateToken catchErrors((req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/import-projects/:id',authenticateToken catchErrors((req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/import-projects',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/import-projects/:id',authenticateToken catchErrors((req, res) => {
  try {
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
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/import-projects/:id',authenticateToken catchErrors((req, res) => {
  try {
    db.prepare('DELETE FROM import_projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 6. DOKUMEN MONITORING
// ==========================================
app.get('/api/dokumen-monitoring/summary', catchErrors((req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all();
    const countStmt = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN draft_confirmed_date IS NOT NULL AND original_receive_date IS NOT NULL THEN 1 ELSE 0 END) as complete FROM dokumen_monitoring_baris WHERE import_project_id = ?`);
    const result = projects.map(p => {
      const counts = countStmt.get(p.id);
      return { ...p, doc_complete: counts?.complete || 0, doc_total: counts?.total || 0 };
    });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/dokumen-monitoring', catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/dokumen-monitoring/:id',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/dokumen-monitoring/:id/confirm',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/dokumen-monitoring/:id/riwayat',authenticateToken catchErrors((req, res) => {
  try {
    const riwayat = db.prepare(`
      SELECT r.*, u.nama as diubah_oleh_nama
      FROM dokumen_monitoring_riwayat r
      LEFT JOIN users u ON r.diubah_oleh_id = u.id
      WHERE r.baris_id = ?
      ORDER BY r.diubah_pada DESC
    `).all(req.params.id);
    res.json(riwayat);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 7. IMPORT OPERATIONAL (SHIPMENTS)
// ==========================================
app.get('/api/import-shipments',authenticateToken catchErrors((req, res) => {
  try {
    const shipments = db.prepare('SELECT s.*, ip.task_unique_number as import_project_name FROM import_shipments s LEFT JOIN import_projects ip ON s.import_project_id = ip.id ORDER BY s.created_at DESC').all();
    shipments.forEach(s => {
      s.costs = JSON.parse(s.costs || '{}');
      s.containers = db.prepare('SELECT * FROM containers WHERE shipment_id = ?').all(s.id);
    });
    res.json(shipments);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/import-shipments/:id',authenticateToken catchErrors((req, res) => {
  try {
    const shipment = db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Not found' });
    shipment.costs = JSON.parse(shipment.costs || '{}');
    shipment.containers = db.prepare('SELECT * FROM containers WHERE shipment_id = ?').all(shipment.id);
    res.json(shipment);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/import-shipments',authenticateToken catchErrors((req, res) => {
  try {
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
    
    res.status(201).json(db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/import-shipments/:id',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/import-shipments/:id/costs',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/import-shipments/:id',authenticateToken catchErrors((req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/import-shipments/:id/containers',authenticateToken catchErrors((req, res) => {
  try {
    const { no_kontainer } = req.body;
    const info = db.prepare('INSERT INTO containers (shipment_id, no_kontainer) VALUES (?, ?)').run(req.params.id, no_kontainer);
    res.status(201).json(db.prepare('SELECT * FROM containers WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/containers/:id',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/containers/:id',authenticateToken catchErrors((req, res) => {
  try {
    db.prepare('DELETE FROM containers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 8. JOB ORDERS & PAYMENTS
// ==========================================
app.get('/api/job-orders/available-months', catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/job-orders', catchErrors((req, res) => {
  try {
    const jos = db.prepare(`
      SELECT j.*, r.request_number as financial_request_number
      FROM job_orders j
      LEFT JOIN financial_requests r ON j.financial_request_id = r.id
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
    });
    res.json(jos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/job-orders',authenticateToken catchErrors((req, res) => {
  try {
    let { job_order_code, vendor_id, vendor_nama, cost_type, dpp, persen_ppn, tanggal_invoice, tanggal_jatuh_tempo, shipment_un } = req.body;
    
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
      if (!vendor) {
        const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(vendor_nama, 'Trucking');
        vendor_id = vendorInsert.lastInsertRowid;
      } else {
        vendor_id = vendor.id;
      }
    }

    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);
    
    const newJo = db.prepare('SELECT * FROM job_orders WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newJo);
  } catch (error) { res.status(500).json({ error: error.message }); }
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

app.post('/api/job-orders/sync-import',authenticateToken catchErrors((req, res) => {
  try {
    const { importShipmentId, shipmentUn, activeCategories } = req.body;
    db.transaction(() => {
      let queryStr = 'SELECT * FROM job_orders WHERE shipment_un = ? AND sumber = ?';
      let queryParams = [shipmentUn, 'import_operational'];
      if (importShipmentId) {
        queryStr += ' AND import_shipment_id = ?';
        queryParams.push(importShipmentId);
      }
      
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
          } else {
            const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(cat.vendor, 'Forwarder');
            vendorId = vendorInsert.lastInsertRowid;
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
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id, financial_request_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?)
          `).run(finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null, reqId);
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/job-orders/:id/payments',authenticateToken catchErrors((req, res) => {
  try {
    const { jumlah_bayar, tanggal_bayar, metode } = req.body;
    const joId = req.params.id;
    const jo = db.prepare('SELECT total_invoice, total_paid FROM job_orders WHERE id = ?').get(joId);
    if (!jo) return res.status(404).json({ error: 'Job Order tidak ditemukan' });
    
    if (jumlah_bayar > (jo.total_invoice - jo.total_paid)) {
      return res.status(400).json({ error: 'Jumlah bayar melebihi sisa tagihan' });
    }
    
    db.transaction(() => {
      db.prepare('INSERT INTO payment_logs (job_order_id, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id) VALUES (?, ?, ?, ?, ?)').run(joId, jumlah_bayar, tanggal_bayar, metode, req.user.id);
      db.prepare(`UPDATE job_orders SET total_paid = total_paid + ?, updated_at = datetime('now') WHERE id = ?`).run(jumlah_bayar, joId);
    })();
    res.status(201).json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/job-orders/:id',authenticateToken catchErrors((req, res) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM payment_logs WHERE job_order_id = ?').run(req.params.id);
      db.prepare('DELETE FROM job_orders WHERE id = ?').run(req.params.id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 9. DEBIT NOTES
// ==========================================
app.get('/api/debit-notes/available-months', catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/debit-notes/summary',authenticateToken catchErrors((req, res) => {
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

    let total_klaim = 0;
    let total_recovery = 0;
    let dn_aktif = 0;

    dns.forEach(dn => {
      // NOTE: For now, this simply sums all currencies blindly as the frontend doesn't support mixed KPI currencies
      total_klaim += (dn.jumlah_klaim || 0);
      if (dn.status === 'Settled') {
        total_recovery += (dn.jumlah_recovery || 0);
      }
      if (dn.status !== 'Draft' && dn.status !== 'Settled' && dn.status !== 'Ditolak') {
        dn_aktif++;
      }
    });

    res.json({
      total_klaim,
      total_recovery,
      outstanding: total_klaim - total_recovery,
      dn_aktif
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/debit-notes',authenticateToken catchErrors((req, res) => {
  try {
    const { level_otoritas, departemen, id: userId } = req.user;
    const { status, kategori, bulan, search } = req.query;

    let query = `
      SELECT dn.*, ip.task_unique_number, ip.supplier as project_supplier, u.nama as dibuat_oleh_nama
      FROM debit_notes dn
      LEFT JOIN import_projects ip ON dn.import_project_id = ip.id
      LEFT JOIN users u ON dn.dibuat_oleh_id = u.id
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
    res.json(db.prepare(query).all(...params));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/debit-notes',authenticateToken catchErrors((req, res) => {
  try {
    const { import_project_id, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, tanggal_dn } = req.body;
    const dn_number = generateDNNumber();
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/debit-notes/:id',authenticateToken catchErrors((req, res) => {
  try {
    const { claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, tanggal_dn } = req.body;
    const dn = db.prepare('SELECT status FROM debit_notes WHERE id = ?').get(req.params.id);
    if (!dn || (dn.status !== 'Draft' && dn.status !== 'Diterbitkan')) {
      return res.status(403).json({ error: 'Hanya DN dengan status Draft atau Diterbitkan yang dapat diedit.' });
    }

    db.prepare(`
      UPDATE debit_notes 
      SET claim_kategori=?, claim_jenis=?, claim_kepada=?, jumlah_klaim=?, deskripsi=?, linked_job_order_id=?, mata_uang=?, tanggal_dn=?, updated_at=datetime('now')
      WHERE id = ?
    `).run(claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id || null, mata_uang, tanggal_dn, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/debit-notes/:id/status',authenticateToken catchErrors((req, res) => {
  try {
    const { status_ke, catatan } = req.body;
    if (status_ke === 'Ditolak' && !catatan) {
      return res.status(400).json({ error: 'Catatan wajib diisi jika klaim Ditolak.' });
    }

    db.transaction(() => {
      const dn = db.prepare('SELECT status FROM debit_notes WHERE id = ?').get(req.params.id);
      db.prepare(`UPDATE debit_notes SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status_ke, req.params.id);
      db.prepare('INSERT INTO debit_note_status_history (debit_note_id, status_dari, status_ke, catatan, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)').run(req.params.id, dn ? dn.status : '', status_ke, catatan || null, req.user.id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/debit-notes/:id/recovery',authenticateToken catchErrors((req, res) => {
  try {
    const { jumlah_recovery, tanggal_recovery } = req.body;
    db.prepare(`UPDATE debit_notes SET jumlah_recovery = ?, tanggal_recovery = ?, updated_at = datetime('now') WHERE id = ?`).run(jumlah_recovery, tanggal_recovery, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/debit-notes/:id',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 10. REPORTS & DASHBOARDS
// ==========================================
app.get('/api/reports',authenticateToken catchErrors((req, res) => {
  try {
    const { departemen, tipe } = req.query;
    let query = 'SELECT r.*, u.nama as pembuat_nama FROM reports r LEFT JOIN users u ON r.dibuat_oleh_id = u.id WHERE 1=1';
    const params = [];
    if (departemen) { query += ' AND r.departemen = ?'; params.push(departemen); }
    if (tipe) { query += ' AND r.tipe = ?'; params.push(tipe); }
    query += ' ORDER BY r.created_at DESC';
    res.json(db.prepare(query).all(...params));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/reports',authenticateToken catchErrors((req, res) => {
  try {
    const { tipe, judul, isi, problem_report_id } = req.body;
    db.prepare('INSERT INTO reports (tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(tipe, judul, isi, req.user.departemen, req.user.id, problem_report_id || null);
    res.status(201).json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/reports/:id/tanggapan',authenticateToken catchErrors((req, res) => {
  try {
    db.prepare(`UPDATE reports SET tanggapan_manager = ?, ditanggapi_oleh_id = ?, tanggapan_pada = datetime('now') WHERE id = ?`)
      .run(req.body.tanggapan_manager, req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/reports/:id/tinjau',authenticateToken catchErrors((req, res) => {
  try {
    db.prepare(`UPDATE reports SET ditinjau_manager = 1, updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/plan-gdg',authenticateToken catchErrors((req, res) => {
  try {
    const shipments = db.prepare('SELECT s.*, ip.task_unique_number FROM import_shipments s LEFT JOIN import_projects ip ON s.import_project_id = ip.id').all();
    const result = shipments.map(s => {
      const containers = db.prepare('SELECT * FROM containers WHERE shipment_id = ?').all(s.id);
      const isReady = containers.length > 0 && containers.every(c => c.trucking_repo_vendor && c.trucking_wh_vendor);
      return {
        ...s,
        containers,
        status_readiness: isReady ? 'Siap' : 'Menunggu Vendor',
        free_time_terakhir: s.eta && s.free_time_destination ? 
          new Date(new Date(s.eta).getTime() + s.free_time_destination*24*60*60*1000).toISOString().slice(0,10) : null
      };
    });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/status-shipment',authenticateToken catchErrors((req, res) => {
  try {
    const shipments = db.prepare('SELECT s.*, ip.task_unique_number FROM import_shipments s LEFT JOIN import_projects ip ON s.import_project_id = ip.id').all();
    const result = shipments.map(s => {
      const containers = db.prepare('SELECT gate_out_wh FROM containers WHERE shipment_id = ?').all(s.id);
      const jobs = db.prepare('SELECT total_paid, total_invoice FROM job_orders WHERE shipment_un = ? AND sumber = ?').all(s.un, 'import_operational');
      
      let stage = 'Shipment Active';
      if (s.ata) {
        const semuaGateOut = containers.length > 0 && containers.every(c => c.gate_out_wh);
        stage = semuaGateOut ? 'Financial Settlement' : 'Delivery Active';
        if (stage === 'Financial Settlement') {
          const semuaLunas = jobs.length > 0 && jobs.every(j => j.total_paid >= j.total_invoice);
          if (semuaLunas) stage = 'Status Complete';
        }
      }
      return { ...s, stage };
    });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/control-tower/stats',authenticateToken catchErrors((req, res) => {
  try {
    const { departemen } = req.query;
    const tasks = db.prepare('SELECT status, prioritas FROM tasks WHERE departemen = ?').all(departemen || req.user.departemen);
    const jobs = db.prepare('SELECT total_invoice, total_paid FROM job_orders').all(); 
    
    res.json({
      tasks: {
        total: tasks.length,
        selesai: tasks.filter(t => t.status === 'Selesai').length,
        kritis: tasks.filter(t => t.prioritas === 'Kritis').length
      },
      finance: {
        total_invoice: jobs.reduce((s, j) => s + j.total_invoice, 0),
        total_paid: jobs.reduce((s, j) => s + j.total_paid, 0)
      }
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/archive/history',authenticateToken catchErrors((req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM archive_snapshots ORDER BY archived_at DESC').all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 12. REALISASI MTB
// ==========================================
app.get('/api/mtb-periode',authenticateToken catchErrors((req, res) => {
  try {
    const periodes = db.prepare('SELECT * FROM realisasi_mtb_periode ORDER BY id DESC').all();
    res.json(periodes);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/mtb-periode',authenticateToken catchErrors((req, res) => {
  try {
    const { nama_periode, tanggal_mulai, tanggal_selesai, saldo_awal } = req.body;
    const result = db.prepare(`
      INSERT INTO realisasi_mtb_periode (nama_periode, tanggal_mulai, tanggal_selesai, saldo_awal, saldo_akhir, prepared_by_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nama_periode, tanggal_mulai, tanggal_selesai, saldo_awal, saldo_awal, req.user.id);
    const newPeriode = db.prepare('SELECT * FROM realisasi_mtb_periode WHERE id = ?').get(result.lastInsertRowid);
    res.json(newPeriode);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/mtb-periode/:id',authenticateToken catchErrors((req, res) => {
  try {
    const id = req.params.id;
    const tx = db.prepare('SELECT COUNT(*) as count FROM realisasi_mtb_transaksi WHERE periode_id = ?').get(id);
    if (tx && tx.count > 0) {
      return res.status(400).json({ error: 'Tidak dapat menghapus periode yang sudah memiliki transaksi. Hapus transaksi terlebih dahulu.' });
    }
    db.prepare('DELETE FROM realisasi_mtb_periode WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/mtb-periode/:id/status',authenticateToken catchErrors((req, res) => {
  try {
    const { id } = req.params;
    const { status, tgl_dana_balik } = req.body;
    const userId = req.user.id;
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    let query = `UPDATE realisasi_mtb_periode SET status = ?, updated_at = ?`;
    const params = [status, time];
    
    if (status === 'Submitted') { query += `, prepared_by_id = ?, prepared_at = ?`; params.push(userId, time); }
    else if (status === 'Checked1') { query += `, checked1_by_id = ?, checked1_at = ?`; params.push(userId, time); }
    else if (status === 'Checked2') { query += `, checked2_by_id = ?, checked2_at = ?`; params.push(userId, time); }
    else if (status === 'Checked3') { query += `, checked3_by_id = ?, checked3_at = ?`; params.push(userId, time); }
    else if (status === 'Approved') { 
      query += `, approved_by_id = ?, approved_at = ?, tgl_dana_balik = ?`; 
      params.push(userId, time, tgl_dana_balik || null); 
    }
    
    query += ` WHERE id = ?`;
    params.push(id);
    
    db.prepare(query).run(...params);
    const updated = db.prepare('SELECT * FROM realisasi_mtb_periode WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/mtb-periode/:id/transaksi',authenticateToken catchErrors((req, res) => {
  try {
    const tx = db.prepare('SELECT * FROM realisasi_mtb_transaksi WHERE periode_id = ? ORDER BY no_urut ASC, id ASC').all(req.params.id);
    res.json(tx);
  } catch (error) { res.status(500).json({ error: error.message }); }
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
    
    db.prepare('UPDATE realisasi_mtb_periode SET saldo_akhir = ?, total_kredit = ?, total_debet = ? WHERE id = ?')
      .run(currentBalance, totalKredit, totalDebet, periode_id);
  })();
};

app.post('/api/mtb-transaksi',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/mtb-transaksi/:id',authenticateToken catchErrors((req, res) => {
  try {
    const tx = db.prepare('SELECT periode_id FROM realisasi_mtb_transaksi WHERE id = ?').get(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });
    
    db.prepare('DELETE FROM realisasi_mtb_transaksi WHERE id = ?').run(req.params.id);
    recalculateRunningBalance(tx.periode_id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 13. REALISASI PIB
// ==========================================
app.get('/api/pib',authenticateToken catchErrors((req, res) => {
  try {
    const pibList = db.prepare('SELECT * FROM realisasi_pib ORDER BY id DESC').all();
    res.json(pibList);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pib',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/pib/:id/status',authenticateToken catchErrors((req, res) => {
  try {
    const { status } = req.body;
    db.prepare(`UPDATE realisasi_pib SET status = ?, verified_by_id = ?, verified_at = datetime('now', 'localtime') WHERE id = ?`)
      .run(status, req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/pib/:id',authenticateToken catchErrors((req, res) => {
  try {
    db.prepare('DELETE FROM realisasi_pib WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/realisasi/summary',authenticateToken catchErrors((req, res) => {
  try {
    const mtbTxList = db.prepare('SELECT unique_number, amount_exclude_tax, vat, materai_adm, adm_bank, pot_pph23_diskon, debet FROM realisasi_mtb_transaksi WHERE unique_number IS NOT NULL').all();
    const pibList = db.prepare('SELECT unique_number, status, total_pib_realisasi FROM realisasi_pib WHERE unique_number IS NOT NULL').all();
    
    res.json({ mtbTxList, pibList });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// START
// ==========================================
// FINANCIAL REQUESTS
// ==========================================

app.get('/api/financial-requests',authenticateToken catchErrors((req, res) => {
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
    if (status) { query += ' AND r.status = ?'; params.push(status); }
    if (jenis) { query += ' AND r.jenis_pengajuan = ?'; params.push(jenis); }
    if (bulan) { query += ' AND strftime("%Y-%m", r.created_at) = ?'; params.push(bulan); }
    query += ' ORDER BY r.created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/financial-requests/summary',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/financial-requests/pending',authenticateToken catchErrors((req, res) => {
  try {
    const departemen = req.user.role; // Assuming role represents departemen or similar access level for SPV
    // Simple filter: return all submitted
    const query = `
      SELECT r.*,
             u1.nama as pic_nama,
             p.task_unique_number as import_project_number,
             v.nama as vendor_nama
      FROM financial_requests r
      LEFT JOIN users u1 ON r.pic_id = u1.id
      LEFT JOIN import_projects p ON r.import_project_id = p.id
      LEFT JOIN vendors v ON r.vendor_id = v.id
      WHERE r.status = 'Submitted'
      ORDER BY r.submitted_at DESC
    `;
    const rows = db.prepare(query).all();
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/financial-requests',authenticateToken catchErrors((req, res) => {
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
        pic_id, created_by_id
      ) VALUES (?, 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(reqNumber, import_project_id || null, shipment_id || null, aju_pib || null, jenis_pengajuan,
      vendor_id || null, vendor_nama_manual || null, estimasi_nominal || 0, mata_uang || 'IDR', keterangan || null,
      file_lampiran_path || null, req.user.id, req.user.id);
    
    const newReq = db.prepare('SELECT * FROM financial_requests WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newReq);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/financial-requests/:id',authenticateToken catchErrors((req, res) => {
  try {
    const { estimasi_nominal, keterangan, file_lampiran_path, vendor_id, vendor_nama_manual } = req.body;
    db.prepare(`
      UPDATE financial_requests 
      SET estimasi_nominal = COALESCE(?, estimasi_nominal),
          keterangan = COALESCE(?, keterangan),
          file_lampiran_path = COALESCE(?, file_lampiran_path),
          vendor_id = COALESCE(?, vendor_id),
          vendor_nama_manual = COALESCE(?, vendor_nama_manual),
          updated_at = datetime('now')
      WHERE id = ? AND status = 'Draft'
    `).run(estimasi_nominal, keterangan, file_lampiran_path, vendor_id, vendor_nama_manual, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/financial-requests/:id/submit',authenticateToken catchErrors((req, res) => {
  try {
    db.transaction(() => {
      db.prepare(`
        UPDATE financial_requests
        SET status = 'Submitted', submitted_at = datetime('now'), submitted_by_id = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('Draft', 'Rejected')
      `).run(req.user.id, req.params.id);
      db.prepare(`
        INSERT INTO financial_request_history (request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, (SELECT status FROM financial_requests WHERE id = ?), 'Submitted', ?)
      `).run(req.params.id, req.params.id, req.user.id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/financial-requests/:id/approve',authenticateToken catchErrors((req, res) => {
  try {
    db.transaction(() => {
      db.prepare(`
        UPDATE financial_requests
        SET status = 'Approved', approved_at = datetime('now'), approved_by_id = ?, updated_at = datetime('now')
        WHERE id = ? AND status = 'Submitted'
      `).run(req.user.id, req.params.id);
      db.prepare(`
        INSERT INTO financial_request_history (request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, 'Submitted', 'Approved', ?)
      `).run(req.params.id, req.user.id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/financial-requests/:id/reject',authenticateToken catchErrors((req, res) => {
  try {
    const { catatan } = req.body;
    if (!catatan) throw new Error("Catatan wajib diisi untuk penolakan");
    db.transaction(() => {
      db.prepare(`
        UPDATE financial_requests
        SET status = 'Rejected', rejected_at = datetime('now'), rejected_by_id = ?, catatan_approval = ?, updated_at = datetime('now')
        WHERE id = ? AND status = 'Submitted'
      `).run(req.user.id, catatan, req.params.id);
      db.prepare(`
        INSERT INTO financial_request_history (request_id, status_dari, status_ke, catatan, dilakukan_oleh_id)
        VALUES (?, 'Submitted', 'Rejected', ?, ?)
      `).run(req.params.id, catatan, req.user.id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/financial-requests/:id/cancel',authenticateToken catchErrors((req, res) => {
  try {
    db.transaction(() => {
      const current = db.prepare("SELECT status FROM financial_requests WHERE id = ?").get(req.params.id);
      db.prepare(`
        UPDATE financial_requests
        SET status = 'Cancelled', updated_at = datetime('now')
        WHERE id = ?
      `).run(req.params.id);
      db.prepare(`
        INSERT INTO financial_request_history (request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, ?, 'Cancelled', ?)
      `).run(req.params.id, current.status, req.user.id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/financial-requests/:id/history',authenticateToken catchErrors((req, res) => {
  try {
    const rows = db.prepare(`
      SELECT h.*, u.nama as dilakukan_oleh_nama
      FROM financial_request_history h
      LEFT JOIN users u ON h.dilakukan_oleh_id = u.id
      WHERE h.request_id = ?
      ORDER BY h.dilakukan_pada DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});


// START
// ==========================================
// PIB REQUESTS
// ==========================================

app.get('/api/pib-requests',authenticateToken catchErrors((req, res) => {
  try {
    const { status, import_project, bulan } = req.query;
    let query = `
      SELECT r.*,
             u1.nama as pic_nama,
             u2.nama as approved_by_nama,
             p.task_unique_number as import_project_number,
             s.no_shipment
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/pib-requests/summary',authenticateToken catchErrors((req, res) => {
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
      pendingTotalKasbon
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/pib-requests/pending',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/pib-requests/:id',authenticateToken catchErrors((req, res) => {
  try {
    const row = db.prepare(`
      SELECT r.*,
             p.task_unique_number as import_project_number,
             s.no_shipment
      FROM pib_requests r
      LEFT JOIN import_projects p ON r.import_project_id = p.id
      LEFT JOIN import_shipments s ON r.shipment_id = s.id
      WHERE r.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pib-requests',authenticateToken catchErrors((req, res) => {
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/pib-requests/:id',authenticateToken catchErrors((req, res) => {
  try {
    const { aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, kasbon_diminta, no_invoice_pib, bl_number } = req.body;
    const estTotal = (parseFloat(estimasi_bm) || 0) + (parseFloat(estimasi_ppn) || 0) + (parseFloat(estimasi_pph) || 0);
    
    db.prepare(`
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
          updated_at = datetime('now')
      WHERE id = ? AND status = 'Draft'
    `).run(aju_pib, tanggal_pengajuan, estimasi_bm, estimasi_ppn, estimasi_pph, estTotal, kasbon_diminta, no_invoice_pib, bl_number, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/pib-requests/:id/submit',authenticateToken catchErrors((req, res) => {
  try {
    db.transaction(() => {
      db.prepare(`
        UPDATE pib_requests
        SET status = 'Submitted', submitted_at = datetime('now'), submitted_by_id = ?, updated_at = datetime('now')
        WHERE id = ? AND status IN ('Draft', 'Rejected')
      `).run(req.user.id, req.params.id);
      db.prepare(`
        INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, dilakukan_oleh_id)
        VALUES (?, 'Draft', 'Submitted', ?)
      `).run(req.params.id, req.user.id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/pib-requests/:id/approve',authenticateToken catchErrors((req, res) => {
  try {
    if (req.user.level_otoritas !== 'Supervisor' && req.user.level_otoritas !== 'Manager') {
      return res.status(403).json({ error: 'Hanya SPV/Manager yang bisa approve' });
    }

    db.transaction(() => {
      const pibReq = db.prepare('SELECT * FROM pib_requests WHERE id = ?').get(req.params.id);
      if (!pibReq) throw new Error('PIB Request tidak ditemukan');
      if (pibReq.status !== 'Submitted') throw new Error('Hanya Request berstatus Submitted yang bisa diapprove');

      const now = new Date().toISOString();

      db.prepare(`
        UPDATE pib_requests SET
          status = 'Approved', approved_by_id = ?, approved_at = ?, updated_at = ?
        WHERE id = ?
      `).run(req.user.id, now, now, pibReq.id);

      db.prepare(`
        INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id, dilakukan_pada)
        VALUES (?, 'Submitted', 'Approved', ?, ?, ?)
      `).run(pibReq.id, req.body.catatan || null, req.user.id, now);

      if (pibReq.shipment_id) {
        const shipment = db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(pibReq.shipment_id);
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
            db.prepare('UPDATE import_shipments SET costs = ?, pib_request_id = ? WHERE id = ?').run(JSON.stringify(costs), pibReq.id, shipment.id);
          }
          db.prepare('UPDATE pib_requests SET othe_pib_synced = 1 WHERE id = ?').run(pibReq.id);
        }
      }

      const existingRealisasi = db.prepare('SELECT id FROM realisasi_pib WHERE pib_request_id = ?').get(pibReq.id);
      if (!existingRealisasi) {
        const lastRealisasi = db.prepare("SELECT no_kas FROM realisasi_pib ORDER BY id DESC LIMIT 1").get();
        const tahun = new Date().getFullYear().toString().slice(-2);
        let nextNum = 1;
        if (lastRealisasi?.no_kas) {
          const match = lastRealisasi.no_kas.match(/(\d+)/);
          if (match) nextNum = parseInt(match[1]) + 1;
        }
        const noKas = `${String(nextNum).padStart(3, '0')}-${tahun}PIB-IMP`;

        const realisasiId = db.prepare(`
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

        db.prepare('UPDATE pib_requests SET realisasi_pib_id = ? WHERE id = ?').run(realisasiId, pibReq.id);
      }
    })();
    res.json({ success: true, message: 'PIB Request diapprove. OTHE dan Realisasi PIB sudah dibuat otomatis.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/pib-requests/:id/reject',authenticateToken catchErrors((req, res) => {
  try {
    if (req.user.level_otoritas !== 'Supervisor' && req.user.level_otoritas !== 'Manager') {
      return res.status(403).json({ error: 'Hanya SPV/Manager yang bisa reject' });
    }
    db.transaction(() => {
      db.prepare(`
        UPDATE pib_requests SET
          status = 'Rejected', rejected_by_id = ?, rejected_at = datetime('now'), catatan_approval = ?, updated_at = datetime('now')
        WHERE id = ? AND status = 'Submitted'
      `).run(req.user.id, req.body.catatan, req.params.id);
      
      db.prepare(`
        INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id)
        VALUES (?, 'Submitted', 'Rejected', ?, ?)
      `).run(req.params.id, req.body.catatan, req.user.id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/pib-requests/:id/history',authenticateToken catchErrors((req, res) => {
  try {
    const rows = db.prepare(`
      SELECT h.*, u.nama as dilakukan_oleh_nama
      FROM pib_request_history h
      LEFT JOIN users u ON h.dilakukan_oleh_id = u.id
      WHERE h.pib_request_id = ?
      ORDER BY h.dilakukan_pada DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => {
  console.log(`✅ Kompas EXIM Backend (SQLite) berjalan di http://localhost:${PORT}`);
});

module.exports = app;
