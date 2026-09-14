const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./src/database/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Setup middlewares
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());

// Setup uploads directory
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files from uploads
app.use('/uploads', express.static(uploadsDir));

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

// --- DOCUMENT TYPES API ---
app.get('/api/document-types', (req, res) => {
  try {
    const types = db.prepare('SELECT name FROM DocumentType ORDER BY created_at ASC').all();
    res.json({ documentTypes: types.map(t => t.name) });
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.post('/api/document-types', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const existing = db.prepare('SELECT * FROM DocumentType WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json({ error: 'Document type already exists' });
    }
    
    const info = db.prepare('INSERT INTO DocumentType (name) VALUES (?)').run(name.trim());
    const docType = db.prepare('SELECT * FROM DocumentType WHERE id = ?').get(info.lastInsertRowid);
    res.json(docType);
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.delete('/api/document-types/:name', (req, res) => {
  try {
    db.prepare('DELETE FROM DocumentType WHERE name = ?').run(req.params.name);
    res.json({ success: true });
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

// API: Get all documents
app.get('/api/documents', (req, res) => {
  try {
    const documents = db.prepare('SELECT * FROM Document WHERE is_deleted = 0 ORDER BY created_at DESC').all();
    const parsedDocs = documents.map(doc => ({
      ...doc,
      tags: doc.tags ? JSON.parse(doc.tags) : []
    }));
    res.json({ documents: parsedDocs });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// API: Upload document
app.post('/api/documents', (req, res, next) => {
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
}, (req, res) => {
  try {
    const file = req.file;
    const { tipe, no_referensi, departemen, tags, vendor_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const info = db.prepare(`
      INSERT INTO Document (nama_file, file_path, tipe, no_referensi, departemen, ukuran_kb, tags, vendor_id, upload_oleh)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      file.originalname,
      '/uploads/' + file.filename,
      tipe || 'Unknown',
      no_referensi || null,
      departemen || 'Import',
      Math.round(file.size / 1024),
      tags || '[]',
      vendor_id || null,
      1
    );

    const document = db.prepare('SELECT * FROM Document WHERE id = ?').get(info.lastInsertRowid);
    
    const parsedDoc = {
      ...document,
      tags: JSON.parse(document.tags)
    };

    res.status(201).json({ document: parsedDoc });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// API: Soft Delete document
app.patch('/api/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { is_deleted } = req.body;
    
    db.prepare('UPDATE Document SET is_deleted = ? WHERE id = ?').run(is_deleted ? 1 : 0, Number(id));
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// API: Login
app.post('/api/login', (req, res) => {
  try {
    const { employee_id, password } = req.body;
    
    if (!employee_id || !password) {
      return res.status(400).json({ error: 'Employee ID dan Password wajib diisi' });
    }

    const user = db.prepare('SELECT * FROM User WHERE employee_id = ?').get(employee_id);

    if (!user) {
      return res.status(401).json({ error: 'Employee ID tidak ditemukan' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    if (!user.status_aktif) {
      return res.status(403).json({ error: 'Akun ini sudah tidak aktif, hubungi Supervisor Anda' });
    }

    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.status_aktif = Boolean(userWithoutPassword.status_aktif);
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Serve Frontend Static Files
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route to serve React app for non-API routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

// --- TASKS API ---
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM Task ORDER BY created_at DESC').all();
    const historyStmt = db.prepare('SELECT * FROM TaskHistory WHERE taskId = ? ORDER BY timestamp ASC');
    
    tasks.forEach(t => {
      t.statusHistory = historyStmt.all(t.id);
    });
    
    res.json({ tasks });
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, department, priority, status, assigneeId, dueDate, importProjectId, shipment_un, sumber_tugas, assigned_by_id, notes, statusHistory } = req.body;
    
    // Generate Task ID
    const allTasks = db.prepare('SELECT id FROM Task').all();
    const nums = allTasks.map(t => {
      const match = t.id.match(/TSK-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const highest = nums.length > 0 ? Math.max(...nums) : 85;
    const realId = `TSK-${String(highest + 1).padStart(4, '0')}`;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO Task (id, title, department, priority, status, assigneeId, dueDate, importProjectId, shipment_un, sumber_tugas, assigned_by_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(realId, title, department, priority, status, assigneeId || null, dueDate || null, importProjectId || null, shipment_un || null, sumber_tugas, assigned_by_id || null, notes || null);
      
      if (statusHistory && Array.isArray(statusHistory)) {
        const insertHistory = db.prepare('INSERT INTO TaskHistory (taskId, status, label, fromStatus, timestamp) VALUES (?, ?, ?, ?, ?)');
        statusHistory.forEach(h => {
          insertHistory.run(realId, h.status, h.label, h.fromStatus || null, h.timestamp || new Date().toISOString());
        });
      }
    })();
    
    const task = db.prepare('SELECT * FROM Task WHERE id = ?').get(realId);
    task.statusHistory = db.prepare('SELECT * FROM TaskHistory WHERE taskId = ? ORDER BY timestamp ASC').all(realId);
    
    res.json(task);
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.patch('/api/tasks/:id', (req, res) => {
  try {
    const { notes } = req.body;
    const id = req.params.id;
    
    const updates = [];
    const values = [];
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      db.prepare(`UPDATE Task SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    
    const task = db.prepare('SELECT * FROM Task WHERE id = ?').get(id);
    task.statusHistory = db.prepare('SELECT * FROM TaskHistory WHERE taskId = ? ORDER BY timestamp ASC').all(id);
    res.json(task);
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:id/move', (req, res) => {
  try {
    const { status, label, fromStatus, timestamp } = req.body;
    const id = req.params.id;
    
    db.transaction(() => {
      db.prepare('UPDATE Task SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), id);
      db.prepare('INSERT INTO TaskHistory (taskId, status, label, fromStatus, timestamp) VALUES (?, ?, ?, ?, ?)').run(
        id, status, label, fromStatus || null, timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
      );
    })();
    
    const task = db.prepare('SELECT * FROM Task WHERE id = ?').get(id);
    task.statusHistory = db.prepare('SELECT * FROM TaskHistory WHERE taskId = ? ORDER BY timestamp ASC').all(id);
    
    res.json(task);
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM Task WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;