const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = process.env.NODE_ENV === 'test' ? require('./__tests__/mockDb') : require('./src/database/db');

// Auto-migrate to add import_category_key if not exists
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN import_category_key TEXT").run();
  console.log("Migration: Added import_category_key to job_orders");
} catch (error) {
  // Column already exists, ignore
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir + '/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 1. AUTHENTICATION ---
app.post('/api/log-error', (req, res) => {
  console.log('FRONTEND ERROR LOGGED:', req.body);
  fs.writeFileSync(path.join(__dirname, 'frontend-error.log'), JSON.stringify(req.body, null, 2));
  res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const JWT_SECRET = process.env.JWT_SECRET || 'kompas_exim_super_secret_key';

app.post('/api/login', (req, res) => {
  const { employee_id, password } = req.body;
  if (!employee_id || !password) return res.status(400).json({ error: 'Employee ID dan Password wajib diisi' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
  if (!user) return res.status(401).json({ error: 'Employee ID tidak ditemukan' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  
  // Backwards compatibility if password_hash is not hashed yet, or compare bcrypt
  let isValid = false;
  try {
    isValid = bcrypt.compareSync(password, user.password_hash);
  } catch(e) {
    isValid = (user.password_hash === password);
  }
  if (!isValid && user.password_hash !== password) return res.status(401).json({ error: 'Kredensial tidak valid' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    console.log("LOGIN ATTEMPT", employee_id, "STATUS:", user.status_aktif);
    if (!user.status_aktif || user.status_aktif == 0) return res.status(403).json({ error: 'Akun ini sudah tidak aktif, hubungi Supervisor Anda' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  const { password_hash: _, ...userWithoutPassword } = user;
  userWithoutPassword.status_aktif = Boolean(userWithoutPassword.status_aktif);
  
  const token = jwt.sign(
    { id: user.id, employee_id: user.employee_id, level_otoritas: user.level_otoritas, departemen: user.departemen },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.status(200).json({ user: userWithoutPassword, token });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// Middleware Authentikasi
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    req.user = user;
    next();
  });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
}

// --- 1.5 USERS ---
app.get('/api/users/assignable', (req, res) => {
  try {
    const { level_otoritas, departemen } = req.query;
    let rows;
    if (level_otoritas === 'Supervisor') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, tipe_karyawan, departemen, level_otoritas
        FROM users
        WHERE level_otoritas = 'Staff Dept'
          AND departemen = ?
          AND status_aktif = 1
        ORDER BY nama ASC
      `).all(departemen);
    } else if (level_otoritas === 'Manager') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, departemen, tipe_karyawan, level_otoritas
        FROM users
        WHERE level_otoritas = 'Supervisor'
          AND status_aktif = 1
        ORDER BY departemen ASC, nama ASC
      `).all();
    } else {
      rows = [];
    }
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 2. TASKS ---
app.get('/api/tasks', (req, res) => {
  try {
    const { level_otoritas, departemen, userId } = req.query;
    let tasks;
    
    if (level_otoritas === 'Manager') {
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    } else if (level_otoritas === 'Supervisor') {
      tasks = db.prepare('SELECT * FROM tasks WHERE departemen = ? ORDER BY updated_at DESC').all(departemen);
    } else if (level_otoritas === 'Staff Dept' && userId) {
      tasks = db.prepare('SELECT * FROM tasks WHERE assignee_id = ? ORDER BY updated_at DESC').all(userId);
    } else {
      // Fallback
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    }

    const historyStmt = db.prepare('SELECT * FROM task_status_history WHERE task_id = ? ORDER BY diubah_pada ASC');
    const usersMap = {};
    db.prepare('SELECT id, nama, level_otoritas, departemen FROM users').all().forEach(u => { usersMap[u.id] = u; });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

    tasks.forEach(t => { 
      t.statusHistory = historyStmt.all(t.id); 
      t.assignee = usersMap[t.assignee_id] || null;
      t.assigned_by = usersMap[t.assigned_by_id] || null;
    });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    res.json(tasks);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    let { judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, import_project_id, tenggat } = req.body;
    
    const assigned_by_id = req.user.id;
    const creatorLevel = req.user.level_otoritas;
    if (!departemen) departemen = req.user.departemen;

    if (!judul || !prioritas || !tenggat) {
      return res.status(400).json({ error: 'Judul, prioritas, dan tenggat wajib diisi' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    }

    let finalAssigneeId;
    if (creatorLevel === 'Staff Dept') {
      finalAssigneeId = assigned_by_id; // WAJIB diri sendiri
    } else {
      finalAssigneeId = assignee_id || req.body.assigneeId; // Handle both camelCase and snake_case from body
      if (!finalAssigneeId) {
        return res.status(400).json({ error: 'assigneeId wajib diisi untuk Supervisor/Manager' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
      }
    }

    const finalAssignedById = assigned_by_id;
    const finalSumberTugas = (creatorLevel === 'Supervisor' || creatorLevel === 'Manager') && finalAssigneeId !== finalAssignedById ? 'Escalation' : (sumber_tugas || 'Manual');

    const lastTask = db.prepare("SELECT task_code FROM tasks ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastTask) {
      const match = lastTask.task_code.match(/TSK-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const taskCode = `TSK-${String(nextNum).padStart(4, '0')}`;

    let newId;
    db.transaction(() => {
      db.prepare(`
        INSERT INTO tasks (task_code, judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, assigned_by_id, import_project_id, tenggat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(taskCode, judul, deskripsi || null, departemen, prioritas, status || 'Backlog', finalSumberTugas, finalAssigneeId, finalAssignedById, import_project_id, tenggat);
      newId = db.prepare('SELECT last_insert_rowid()').pluck().get();
      db.prepare('INSERT INTO task_status_history (task_id, status_ke, diubah_oleh_id) VALUES (?, ?, ?)').run(newId, status || 'Backlog', finalAssignedById);
    })();
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId);
    res.json(newTask);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/tasks/:id/status', (req, res) => {
  try {
    const { status, diubah_oleh_id, status_dari } = req.body;
    db.transaction(() => {
      db.prepare('UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?').run(status, req.params.id);
      db.prepare('INSERT INTO task_status_history (task_id, status_dari, status_ke, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(req.params.id, status_dari, status, diubah_oleh_id);
    })();
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/tasks/:id/catatan', (req, res) => {
  try {
    const { catatan_progress, progress } = req.body;
    db.prepare('UPDATE tasks SET catatan_progress = ?, progress = ?, updated_at = datetime('now') WHERE id = ?').run(catatan_progress, progress, req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT sumber_tugas FROM tasks WHERE id = ?').get(req.params.id);
    if (task && task.sumber_tugas === 'Escalation') {
      return res.status(403).json({ error: 'Tugas Escalation tidak bisa dihapus.' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    }
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 3. DOCUMENTS ---
app.get('/api/documents', (req, res) => {
  try {
    const documents = db.prepare("SELECT * FROM documents WHERE status != 'Deleted' ORDER BY created_at DESC").all();
    documents.forEach(d => { d.tags = JSON.parse(d.tags || '[]'); });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    res.json(documents);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/documents', (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    next();
  });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
}, (req, res) => {
  try {
    const file = req.file;
    const { tipe, no_referensi, departemen, tags, vendor_id, upload_oleh_id } = req.body;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    const info = db.prepare(`
      INSERT INTO documents (nama_file, file_path, tipe, no_referensi, departemen, ukuran_kb, tags, vendor_id, upload_oleh_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(file.originalname, '/uploads/' + file.filename, tipe, no_referensi, departemen, Math.round(file.size / 1024), tags || '[]', vendor_id, upload_oleh_id);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(info.lastInsertRowid);
    doc.tags = JSON.parse(doc.tags);
    res.status(201).json(doc);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/documents/:id', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE documents SET status = ?, updated_at = datetime('now') WHERE id = ?').run(status, req.params.id);
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.delete('/api/documents/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 3.5. MASTER DATA DOKUMEN ---
app.get('/api/document-types', (req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM master_data_dokumen ORDER BY kode_dokumen ASC').all();
    res.json({ documentTypes: docs });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/document-types', (req, res) => {
  try {
    const { nama_dokumen, keterangan } = req.body;
    if (!nama_dokumen) return res.status(400).json({ error: 'Nama dokumen wajib diisi' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    
    // Auto generate kode_dokumen (DOC-001, DOC-002, dll)
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
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.put('/api/document-types/:id', (req, res) => {
  try {
    const { nama_dokumen, keterangan } = req.body;
    if (!nama_dokumen) return res.status(400).json({ error: 'Nama dokumen wajib diisi' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    db.prepare('UPDATE master_data_dokumen SET nama_dokumen = ?, keterangan = ?, updated_at = datetime('now') WHERE id = ?').run(nama_dokumen, keterangan || null, req.params.id);
    const updatedDoc = db.prepare('SELECT * FROM master_data_dokumen WHERE id = ?').get(req.params.id);
    res.json(updatedDoc);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.delete('/api/document-types/:id', (req, res) => {
  try {
    // Block delete if document is in use
    const inUse = db.prepare(
      'SELECT COUNT(*) as c FROM import_project_documents WHERE dokumen_id = ?'
    ).get(req.params.id);
    const inMonitoring = db.prepare(
      'SELECT COUNT(*) as c FROM dokumen_monitoring_baris WHERE master_dokumen_id = ?'
    ).get(req.params.id);
    const totalUsage = (inUse?.c || 0) + (inMonitoring?.c || 0);
    if (totalUsage > 0) {
      return res.status(409).json({ 
        error: `Dokumen ini sedang dipakai di ${totalUsage} Import Project dan tidak bisa dihapus.` 
      });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    }
    db.prepare('DELETE FROM master_data_dokumen WHERE id = ?').run(req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 3b. MASTER DATA DEPARTEMEN ---
app.get('/api/departemen', (req, res) => {
  try {
    const depts = db.prepare('SELECT * FROM master_data_departemen ORDER BY id ASC').all();
    res.json(depts);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/departemen', (req, res) => {
  try {
    const { nama_departemen } = req.body;
    if (!nama_departemen) return res.status(400).json({ error: 'nama_departemen is required' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    const info = db.prepare('INSERT INTO master_data_departemen (nama_departemen) VALUES (?)').run(nama_departemen);
    const newDept = db.prepare('SELECT * FROM master_data_departemen WHERE id = ?').get(info.lastInsertRowid);
    res.json(newDept);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.delete('/api/departemen/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM master_data_departemen WHERE id = ?').run(req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 4. VENDORS ---
app.get('/api/vendors', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY created_at DESC').all();
    vendors.forEach(v => { v.layanan = JSON.parse(v.layanan || '[]'); });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    res.json(vendors);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/vendors', (req, res) => {
  try {
    const { nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan } = req.body;
    const info = db.prepare(`
      INSERT INTO vendors (nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, JSON.stringify(layanan || []), catatan);
    const newVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
    if(newVendor) newVendor.layanan = JSON.parse(newVendor.layanan || '[]');
    res.json(newVendor);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/vendors/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE vendors SET status = ?, updated_at = datetime('now') WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/vendors/:id', (req, res) => {
  try {
    const { nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan } = req.body;
    const allowedKeys = ['nama', 'service_type', 'region', 'kontak_nama', 'kontak_email', 'kontak_telepon', 'alamat', 'catatan'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (layanan !== undefined) {
      updates.push('layanan = ?');
      values.push(JSON.stringify(layanan));
    }
    if (updates.length > 0) {
      updates.push('updated_at = datetime('now')');
      values.push(req.params.id);
      db.prepare(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if(updated) updated.layanan = JSON.parse(updated.layanan || '[]');
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.delete('/api/vendors/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 5. JOB ORDERS & PAYMENTS ---
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
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/job-orders', (req, res) => {
  try {
    const jos = db.prepare('SELECT * FROM job_orders ORDER BY created_at DESC').all();
    const allPayments = db.prepare('SELECT * FROM payment_logs').all();
    
    // Group payments by job_order_id
    const paymentsByJo = {};
    for (const p of allPayments) {
      if (!paymentsByJo[p.job_order_id]) paymentsByJo[p.job_order_id] = [];
      paymentsByJo[p.job_order_id].push(p);
    }

    jos.forEach(jo => { 
      jo.remaining_balance = jo.total_invoice - jo.total_paid; 
      jo.payment_logs = paymentsByJo[jo.id] || [];
    });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    res.json(jos);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/job-orders', (req, res) => {
  try {
    const { job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un } = req.body;
    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);
    res.json(db.prepare('SELECT * FROM job_orders WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/job-orders/:id/payments', (req, res) => {
  try {
    const { jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id } = req.body;
    const joId = req.params.id;
    db.transaction(() => {
      db.prepare('INSERT INTO payment_logs (job_order_id, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id) VALUES (?, ?, ?, ?, ?)').run(joId, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id);
      db.prepare('UPDATE job_orders SET total_paid = total_paid + ?, updated_at = datetime('now') WHERE id = ?').run(jumlah_bayar, joId);
    })();
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/job-orders/:id/payments', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM payment_logs WHERE job_order_id = ? ORDER BY created_at DESC').all(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 6. IMPORT PROJECTS ---
app.get('/api/import-projects', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all());
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/import-projects', (req, res) => {
  try {
    const { task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id } = req.body;
    const info = db.prepare(`
      INSERT INTO import_projects (task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id);
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/import-projects/:id', authenticateToken, (req, res) => {
  try {
    const allowedKeys = ['supplier', 'trade', 'import_type', 'shipment_term', 'invoice_no', 'bl_no', 'etd', 'eta', 'hs_code', 'free_time_destination'];
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
      db.prepare(`UPDATE import_projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.delete('/api/import-projects/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
// --- 6.5. DOKUMEN MONITORING ---
app.get('/api/dokumen-monitoring/summary', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all();
    const countStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN draft_confirmed_date IS NOT NULL AND original_receive_date IS NOT NULL THEN 1 ELSE 0 END) as complete
      FROM dokumen_monitoring_baris WHERE import_project_id = ?
    `);
    const result = projects.map(p => {
      const counts = countStmt.get(p.id);
      return { ...p, doc_complete: counts?.complete || 0, doc_total: counts?.total || 0 };
    });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    res.json(result);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/dokumen-monitoring', (req, res) => {
  try {
    const { import_project_id } = req.query;
    if (!import_project_id) return res.status(400).json({ error: 'import_project_id required' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    const rows = db.prepare(`
      SELECT dmb.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      LEFT JOIN users u ON u.id = dmb.draft_confirmed_by_id
      WHERE dmb.import_project_id = ?
      ORDER BY md.kode_dokumen ASC
    `).all(import_project_id);
    res.json(rows);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/dokumen-monitoring/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Row not found' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    
    const allowedFields = [
      'draft_received_date',
      // Section 2: Scan Original
      'scan_receive_date', 'scan_shared_departemen',
      // Section 3: Original Physical
      'original_receive_date', 'original_awb_no', 'original_shared_departemen'
    ];
    const { diubah_oleh_id } = req.body;
    
    db.transaction(() => {
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          const oldVal = row[field];
          const isJsonField = field === 'scan_shared_departemen' || field === 'original_shared_departemen';
          const newVal = isJsonField ? JSON.stringify(req.body[field]) : req.body[field];
          db.prepare(`UPDATE dokumen_monitoring_baris SET ${field} = ?, last_updated_by_id = ?, updated_at = datetime('now') WHERE id = ?`)
            .run(newVal, diubah_oleh_id || null, req.params.id);
          // Audit trail
          db.prepare('INSERT INTO dokumen_monitoring_riwayat (baris_id, field_diubah, nilai_lama, nilai_baru, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)')
            .run(req.params.id, field, oldVal || null, newVal || null, diubah_oleh_id || null);
        }
      }
    })();
    
    const updated = db.prepare(`
      SELECT dmb.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      LEFT JOIN users u ON u.id = dmb.draft_confirmed_by_id
      WHERE dmb.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/dokumen-monitoring/:id/confirm', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Row not found' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    if (!row.draft_received_date) return res.status(400).json({ error: 'Draft Received Date harus diisi terlebih dahulu' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    if (row.draft_confirmed_date) return res.status(400).json({ error: 'Sudah dikonfirmasi sebelumnya' });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    
    const { user_id } = req.body;
    const now = new Date().toISOString().split('T')[0];
    
    db.transaction(() => {
      db.prepare('UPDATE dokumen_monitoring_baris SET draft_confirmed_date = ?, draft_confirmed_by_id = ?, last_updated_by_id = ?, updated_at = datetime('now') WHERE id = ?')
        .run(now, user_id, user_id, req.params.id);
      db.prepare('INSERT INTO dokumen_monitoring_riwayat (baris_id, field_diubah, nilai_lama, nilai_baru, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)')
        .run(req.params.id, 'draft_confirmed_date', null, now, user_id);
    })();
    
    const updated = db.prepare(`
      SELECT dmb.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      LEFT JOIN users u ON u.id = dmb.draft_confirmed_by_id
      WHERE dmb.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/dokumen-monitoring/:id/riwayat', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT dmr.*, u.nama as diubah_oleh_nama
      FROM dokumen_monitoring_riwayat dmr
      LEFT JOIN users u ON u.id = dmr.diubah_oleh_id
      WHERE dmr.baris_id = ?
      ORDER BY dmr.diubah_pada DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 7. IMPORT SHIPMENTS & CONTAINERS ---
app.get('/api/import-shipments', (req, res) => {
  try {
    const shipments = db.prepare('SELECT * FROM import_shipments ORDER BY created_at DESC').all();
    const contStmt = db.prepare('SELECT * FROM containers WHERE shipment_id = ?');
    shipments.forEach(s => {
      s.costs = JSON.parse(s.costs || '{}');
      s.containers = contStmt.all(s.id);
    });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    res.json(shipments);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/import-shipments', (req, res) => {
  try {
    const { shipment_code, import_project_id, supplier, created_by_id } = req.body;
    const info = db.prepare(`
      INSERT INTO import_shipments (shipment_code, import_project_id, supplier, created_by_id)
      VALUES (?, ?, ?, ?)
    `).run(shipment_code, import_project_id, supplier, created_by_id);
    res.json(db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/import-shipments/:id', (req, res) => {
  try {
    const allowedKeys = ['un', 'kat', 'supplier', 'invoice_no', 'bl_no', 'mode_transport', 'qtty', 'uom', 'depo_route', 'gudang', 'ata', 'etd', 'eta', 'hs_code', 'shipment_term', 'trade', 'free_time_destination'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (updates.length > 0) {
      updates.push('updated_at = datetime('now')');
      values.push(req.params.id);
      db.prepare(`UPDATE import_shipments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/import-shipments/:id/costs', (req, res) => {
  try {
    db.prepare('UPDATE import_shipments SET costs = ?, updated_at = datetime('now') WHERE id = ?').run(JSON.stringify(req.body.costs), req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/import-shipments/:id/containers', (req, res) => {
  try {
    const { no_kontainer } = req.body;
    const info = db.prepare('INSERT INTO containers (shipment_id, no_kontainer) VALUES (?, ?)').run(req.params.id, no_kontainer);
    res.json(db.prepare('SELECT * FROM containers WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/containers/:id', (req, res) => {
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
      updates.push('updated_at = datetime('now')');
      values.push(req.params.id);
      db.prepare(`UPDATE containers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 8. REPORTS ---
app.get('/api/reports', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM reports ORDER BY tanggal DESC').all());
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/reports', (req, res) => {
  try {
    const { tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id } = req.body;
    const info = db.prepare(`
      INSERT INTO reports (tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id || null);
    res.json(db.prepare('SELECT * FROM reports WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/reports/:id/tanggapan', (req, res) => {
  try {
    const { tanggapan_manager, ditanggapi_oleh_id } = req.body;
    db.prepare('UPDATE reports SET tanggapan_manager = ?, ditanggapi_oleh_id = ?, tanggapan_pada = datetime('now') WHERE id = ?').run(tanggapan_manager, ditanggapi_oleh_id, req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/reports/:id/tinjau', (req, res) => {
  try {
    db.prepare('UPDATE reports SET ditinjau_manager = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 9. STAFF ---
app.get('/api/staff', (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM users WHERE level_otoritas = 'Staff Dept'").all());
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/staff', (req, res) => {
  try {
    const { nama, employee_id, departemen, tipe_karyawan, password } = req.body;
    const info = db.prepare(`
      INSERT INTO users (nama, employee_id, departemen, tipe_karyawan, level_otoritas, password_hash)
      VALUES (?, ?, ?, ?, 'Staff Dept', ?)
    `).run(nama, employee_id, departemen, tipe_karyawan, password || 'password123');
    res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/staff/:id', (req, res) => {
  try {
    const { nama, tipe_karyawan } = req.body;
    db.prepare('UPDATE users SET nama = ?, tipe_karyawan = ?, updated_at = datetime('now') WHERE id = ?').run(nama, tipe_karyawan, req.params.id);
    res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.patch('/api/staff/:id/status', (req, res) => {
  try {
    const { status_aktif } = req.body;
    db.prepare('UPDATE users SET status_aktif = ? WHERE id = ?').run(status_aktif ? 1 : 0, req.params.id);
    res.json({ success: true });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

// --- 10. COMPUTED ENDPOINTS ---
app.get('/api/plan-gdg', (req, res) => {
  try {
    // Return read-only data derived from import_shipments
    const shipments = db.prepare('SELECT * FROM import_shipments ORDER BY created_at DESC').all();
    const contStmt = db.prepare('SELECT * FROM containers WHERE shipment_id = ?');
    
    const plans = shipments.map(s => {
      const containers = contStmt.all(s.id);
      let readiness = 'Siap';
      if (containers.length === 0 || containers.some(c => !c.trucking_repo_vendor || !c.trucking_wh_vendor)) {
        readiness = 'Menunggu Vendor';
      }
      return {
        shipment_code: s.shipment_code,
        eta: s.eta,
        bl_swb: s.bl_no,
        free_time: s.free_time_destination,
        readiness
      };
    });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    res.json(plans);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/status-shipment', (req, res) => {
  try {
    const shipments = db.prepare('SELECT * FROM import_shipments ORDER BY created_at DESC').all();
    const contStmt = db.prepare('SELECT * FROM containers WHERE shipment_id = ?');
    const joStmt = db.prepare('SELECT total_invoice, total_paid FROM job_orders WHERE shipment_un = ?');
    
    const statusData = shipments.map(s => {
      const containers = contStmt.all(s.id);
      let stage = 'Shipment Active';
      
      if (s.ata) {
        stage = 'Delivery Active';
        
        const allGateOutWh = containers.length > 0 && containers.every(c => c.gate_out_wh);
        if (allGateOutWh) {
          stage = 'Financial Settlement';
          
          if (s.un) {
            const jos = joStmt.all(s.un);
            const allPaid = jos.length > 0 && jos.every(jo => jo.total_invoice - jo.total_paid <= 0);
            if (allPaid) {
              stage = 'Status Complete';
            }
          }
        }
      }
      return { ...s, stage, containers };
    });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
    res.json(statusData);
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/dashboard/manager/summary', (req, res) => {
  try {
    const totalShipmentAktif = db.prepare('SELECT count(*) as c FROM import_shipments').get().c;
    const utang = db.prepare('SELECT sum(total_invoice - total_paid) as u FROM job_orders').get().u || 0;
    const openReports = db.prepare('SELECT count(*) as c FROM reports WHERE tipe="Problem Report" AND id NOT IN (SELECT problem_report_id FROM reports WHERE problem_report_id IS NOT NULL)').get().c;
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 5').all();
    
    res.json({ totalShipmentAktif, outstandingUtang: utang, openProblemReports: openReports, latestTasks: tasks });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});
  } catch (error) { res.status(500).json({ error: error.message });

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
}); }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

app.delete('/api/import-shipments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_shipments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ error: error.message }); 
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Backend server is running on http://localhost:${PORT}`));
}
module.exports = app;