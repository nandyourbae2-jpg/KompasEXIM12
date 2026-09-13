import os

content = """const express = require('express');
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
app.post('/api/log-error', (req, res) => {
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
    const match = last.dn_number.match(/DN-(\\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  return `DN-${String(nextNum).padStart(4, '0')}-${tahun}`;
}

// Middleware Authentikasi
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.level_otoritas)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    next();
  };
}

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================
app.post('/api/login', (req, res) => {
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

app.get('/api/users/all', authenticateToken, (req, res) => {
  try {
    const users = db.prepare('SELECT id, nama, employee_id, level_otoritas, departemen, tipe_karyawan, status_aktif FROM users ORDER BY nama ASC').all();
    res.json(users);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/users/assignable', authenticateToken, (req, res) => {
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

app.get('/api/staff', authenticateToken, (req, res) => {
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

app.post('/api/staff', authenticateToken, (req, res) => {
  try {
    const { nama, email, role, departemen, tipe_karyawan, password } = req.body; // frontend sends 'email' as employee_id
    const hashed = bcrypt.hashSync(password || 'password123', 10);
    db.prepare(`INSERT INTO users (employee_id, nama, level_otoritas, departemen, tipe_karyawan, password_hash, status_aktif) VALUES (?, ?, ?, ?, ?, ?, 1)`)
      .run(email, nama, role || 'Staff Dept', departemen || req.user.departemen, tipe_karyawan || 'Karyawan Tetap', hashed);
    res.status(201).json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/staff/:id', authenticateToken, (req, res) => {
  try {
    const { nama, tipe_karyawan } = req.body;
    db.prepare(`UPDATE users SET nama = ?, tipe_karyawan = ?, updated_at = datetime('now') WHERE id = ?`).run(nama, tipe_karyawan, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/staff/:id/status', authenticateToken, (req, res) => {
  try {
    const { status_aktif } = req.body;
    db.prepare(`UPDATE users SET status_aktif = ?, updated_at = datetime('now') WHERE id = ?`).run(status_aktif ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 2. MASTER DATA & DEPARTEMEN
// ==========================================
app.get('/api/departemen', (req, res) => {
  try {
    const depts = db.prepare('SELECT * FROM master_data_departemen ORDER BY id ASC').all();
    res.json(depts);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/departemen', authenticateToken, (req, res) => {
  try {
    const { nama_departemen } = req.body;
    db.prepare('INSERT INTO master_data_departemen (nama_departemen) VALUES (?)').run(nama_departemen);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/document-types', (req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM master_data_dokumen ORDER BY kode_dokumen ASC').all();
    res.json({ documentTypes: docs });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/document-types', authenticateToken, (req, res) => {
  try {
    const { nama_dokumen, keterangan } = req.body;
    const lastDoc = db.prepare('SELECT kode_dokumen FROM master_data_dokumen ORDER BY id DESC LIMIT 1').get();
    let nextNum = 1;
    if (lastDoc && lastDoc.kode_dokumen) {
      const match = lastDoc.kode_dokumen.match(/DOC-(\\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const kode_dokumen = `DOC-${String(nextNum).padStart(3, '0')}`;
    const info = db.prepare('INSERT INTO master_data_dokumen (kode_dokumen, nama_dokumen, keterangan) VALUES (?, ?, ?)').run(kode_dokumen, nama_dokumen, keterangan || null);
    const newDoc = db.prepare('SELECT * FROM master_data_dokumen WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newDoc);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/document-types/:id', authenticateToken, (req, res) => {
  try {
    const { nama_dokumen, keterangan } = req.body;
    db.prepare(`UPDATE master_data_dokumen SET nama_dokumen = ?, keterangan = ?, updated_at = datetime('now') WHERE id = ?`).run(nama_dokumen, keterangan || null, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/document-types/:id', authenticateToken, (req, res) => {
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

app.get('/api/vendors', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY created_at DESC').all();
    vendors.forEach(v => { v.layanan = JSON.parse(v.layanan || '[]'); });
    res.json(vendors);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/vendors', authenticateToken, (req, res) => {
  try {
    const { nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan } = req.body;
    const info = db.prepare(`INSERT INTO vendors (nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, JSON.stringify(layanan || []), catatan);
    const newVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
    if(newVendor) newVendor.layanan = JSON.parse(newVendor.layanan || '[]');
    res.json(newVendor);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/vendors/:id', authenticateToken, (req, res) => {
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

app.delete('/api/vendors/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 3. DOCUMENTS (FILE UPLOAD)
// ==========================================
app.get('/api/documents', authenticateToken, (req, res) => {
  try {
    const documents = db.prepare("SELECT * FROM documents WHERE status != 'Deleted' ORDER BY created_at DESC").all();
    documents.forEach(d => { d.tags = JSON.parse(d.tags || '[]'); });
    res.json(documents); // Return array directly
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/documents', authenticateToken, (req, res, next) => {
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

app.patch('/api/documents/:id', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare(`UPDATE documents SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/documents/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 4. TASKS (PETA TUGAS)
// ==========================================
app.get('/api/tasks', authenticateToken, (req, res) => {
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

app.post('/api/tasks', authenticateToken, (req, res) => {
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
      finalAssigneeId = assigned_by_id; // WAJIB diri sendiri
    } else {
      if (!finalAssigneeId) return res.status(400).json({ error: 'assignee_id wajib diisi untuk Supervisor/Manager' });
    }

    const finalSumberTugas = (creatorLevel === 'Supervisor' || creatorLevel === 'Manager') && finalAssigneeId !== assigned_by_id ? 'Escalation' : (sumber_tugas || 'Manual');

    const lastTask = db.prepare("SELECT task_code FROM tasks ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastTask) {
      const match = lastTask.task_code.match(/TSK-(\\d+)/);
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

app.patch('/api/tasks/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, status_dari } = req.body;
    db.transaction(() => {
      db.prepare(`UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
      db.prepare('INSERT INTO task_status_history (task_id, status_dari, status_ke, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(req.params.id, status_dari || null, status, req.user.id);
    })();
    res.json({ success: true, status });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/tasks/:id/catatan', authenticateToken, (req, res) => {
  try {
    const { catatan_progress, progress } = req.body;
    db.prepare(`UPDATE tasks SET catatan_progress = ?, progress = ?, updated_at = datetime('now') WHERE id = ?`).run(catatan_progress, progress, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
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
app.get('/api/import-projects', authenticateToken, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/import-projects/:id', authenticateToken, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/import-projects', authenticateToken, (req, res) => {
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
        const match = lastProject.task_unique_number.match(/IMP-(\\d+)/);
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

app.patch('/api/import-projects/:id', authenticateToken, (req, res) => {
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
    
    // Sync monitoring rows
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

app.delete('/api/import-projects/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM import_projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

content += """
// ==========================================
// 6. DOKUMEN MONITORING
// ==========================================
app.get('/api/dokumen-monitoring/summary', (req, res) => {
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

app.get('/api/dokumen-monitoring', (req, res) => {
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

app.patch('/api/dokumen-monitoring/baris/:id', authenticateToken, (req, res) => {
  try {
    const allowedFields = ['draft_received_date', 'scan_receive_date', 'scan_shared_departemen', 'original_receive_date', 'original_awb_no', 'original_shared_departemen'];
    const row = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Row not found' });
    
    db.transaction(() => {
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          const oldVal = row[field];
          const isJsonField = field === 'scan_shared_departemen' || field === 'original_shared_departemen';
          const newVal = isJsonField ? JSON.stringify(req.body[field]) : req.body[field];
          db.prepare(`UPDATE dokumen_monitoring_baris SET ${field} = ?, last_updated_by_id = ?, updated_at = datetime('now') WHERE id = ?`)
            .run(newVal, req.user.id, req.params.id);
          db.prepare('INSERT INTO dokumen_monitoring_riwayat (baris_id, field_diubah, nilai_lama, nilai_baru, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)')
            .run(req.params.id, field, oldVal || null, newVal || null, req.user.id);
        }
      }
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/dokumen-monitoring/baris/:id/confirm-draft', authenticateToken, (req, res) => {
  try {
    const row = db.prepare('SELECT draft_received_date FROM dokumen_monitoring_baris WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Row not found' });
    if (!row.draft_received_date) return res.status(400).json({ error: 'Draft belum diterima, tidak bisa dikonfirmasi' });
    
    db.prepare(`UPDATE dokumen_monitoring_baris SET draft_confirmed_date = datetime('now'), draft_confirmed_by_id = ?, last_updated_by_id = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(req.user.id, req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// 7. IMPORT OPERATIONAL (SHIPMENTS)
// ==========================================
app.get('/api/import-shipments', authenticateToken, (req, res) => {
  try {
    const { level_otoritas, departemen } = req.user;
    const shipments = db.prepare('SELECT s.*, ip.task_unique_number as import_project_name FROM import_shipments s LEFT JOIN import_projects ip ON s.import_project_id = ip.id ORDER BY s.created_at DESC').all();
    shipments.forEach(s => {
      s.costs = JSON.parse(s.costs || '{}');
      s.containers = db.prepare('SELECT * FROM containers WHERE shipment_id = ?').all(s.id);
    });
    res.json(shipments);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/import-shipments/:id', authenticateToken, (req, res) => {
  try {
    const shipment = db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Not found' });
    shipment.costs = JSON.parse(shipment.costs || '{}');
    shipment.containers = db.prepare('SELECT * FROM containers WHERE shipment_id = ?').all(shipment.id);
    res.json(shipment);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/import-shipments', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    let finalCode = data.shipment_code;
    if (!finalCode) {
      const last = db.prepare('SELECT shipment_code FROM import_shipments ORDER BY id DESC LIMIT 1').get();
      let nextNum = 1;
      if (last && last.shipment_code) {
        const match = last.shipment_code.match(/SHP-(\\d+)/);
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

app.patch('/api/import-shipments/:id', authenticateToken, (req, res) => {
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

app.patch('/api/import-shipments/:id/costs', authenticateToken, (req, res) => {
  try {
    db.prepare(`UPDATE import_shipments SET costs = ?, updated_at = datetime('now') WHERE id = ?`).run(JSON.stringify(req.body.costs || {}), req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/import-shipments/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// CONTAINERS
app.post('/api/import-shipments/:id/containers', authenticateToken, (req, res) => {
  try {
    const { no_kontainer } = req.body;
    const info = db.prepare('INSERT INTO containers (shipment_id, no_kontainer) VALUES (?, ?)').run(req.params.id, no_kontainer);
    res.status(201).json(db.prepare('SELECT * FROM containers WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/containers/:id', authenticateToken, (req, res) => {
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

app.delete('/api/containers/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM containers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

"""
content += """
// ==========================================
// 8. JOB ORDERS & PAYMENTS
// ==========================================
app.get('/api/job-orders/available-months', (req, res) => {
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

app.get('/api/job-orders', (req, res) => {
  try {
    const jos = db.prepare('SELECT * FROM job_orders ORDER BY created_at DESC').all();
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

app.post('/api/job-orders', authenticateToken, (req, res) => {
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
        const match = lastJo.job_order_code.match(/JO-(\\d+)/);
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

app.post('/api/job-orders/sync-import', authenticateToken, (req, res) => {
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
          
          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, invoice_no = ?, vendor_id = ?, cost_type = ?, dpp = ?, persen_ppn = ?, ppn = ?, total_invoice = ?, status_linked = ?, import_shipment_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, status, importShipmentId || null, existing.id);
        } else {
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null);
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

app.post('/api/job-orders/:id/payments', authenticateToken, (req, res) => {
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

app.delete('/api/job-orders/:id', authenticateToken, (req, res) => {
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
app.get('/api/debit-notes/available-months', (req, res) => {
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

app.get('/api/debit-notes', authenticateToken, (req, res) => {
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

app.post('/api/debit-notes', authenticateToken, (req, res) => {
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

app.patch('/api/debit-notes/:id', authenticateToken, (req, res) => {
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

app.patch('/api/debit-notes/:id/status', authenticateToken, (req, res) => {
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

app.patch('/api/debit-notes/:id/recovery', authenticateToken, (req, res) => {
  try {
    const { jumlah_recovery, tanggal_recovery } = req.body;
    db.prepare(`UPDATE debit_notes SET jumlah_recovery = ?, tanggal_recovery = ?, updated_at = datetime('now') WHERE id = ?`).run(jumlah_recovery, tanggal_recovery, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/debit-notes/:id', authenticateToken, (req, res) => {
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
app.get('/api/reports', authenticateToken, (req, res) => {
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

app.post('/api/reports', authenticateToken, (req, res) => {
  try {
    const { tipe, judul, isi, problem_report_id } = req.body;
    db.prepare('INSERT INTO reports (tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(tipe, judul, isi, req.user.departemen, req.user.id, problem_report_id || null);
    res.status(201).json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/reports/:id/tanggapan', authenticateToken, (req, res) => {
  try {
    db.prepare(`UPDATE reports SET tanggapan_manager = ?, ditanggapi_oleh_id = ?, tanggapan_pada = datetime('now') WHERE id = ?`)
      .run(req.body.tanggapan_manager, req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/reports/:id/tinjau', authenticateToken, (req, res) => {
  try {
    db.prepare(`UPDATE reports SET ditinjau_manager = 1, updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/plan-gdg', authenticateToken, (req, res) => {
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

app.get('/api/status-shipment', authenticateToken, (req, res) => {
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

app.get('/api/control-tower/stats', authenticateToken, (req, res) => {
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

app.get('/api/archive/history', authenticateToken, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM archive_snapshots ORDER BY archived_at DESC').all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// START
app.listen(PORT, () => {
  console.log(`✅ Kompas EXIM Backend (SQLite) berjalan di http://localhost:${PORT}`);
});

module.exports = app;
"""

with open("backend/index.js", "w") as f:
    f.write(content)

print("backend/index.js fully written!")
