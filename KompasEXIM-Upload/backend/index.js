const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3001;

// Fix for Vercel SQLite Read-Only Filesystem
if (process.env.VERCEL) {
  const dbSource = path.join(__dirname, 'prisma', 'dev.db');
  const dbDest = '/tmp/dev.db';
  try {
    if (fs.existsSync(dbSource) && !fs.existsSync(dbDest)) {
      fs.copyFileSync(dbSource, dbDest);
      console.log("Copied SQLite DB to /tmp for Vercel");
    }
  } catch (err) {
    console.error("Error copying DB:", err);
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.VERCEL ? 'file:/tmp/dev.db' : 'file:./dev.db'
    }
  }
});

// Setup middlewares
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

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
app.get('/api/document-types', async (req, res) => {
  try {
    const types = await prisma.documentType.findMany({
      orderBy: { created_at: 'asc' }
    });
    res.json({ documentTypes: types.map(t => t.name) });
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.post('/api/document-types', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    const docType = await prisma.documentType.create({
      data: { name: name.trim() }
    });
    res.json(docType);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Document type already exists' });
    }
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.delete('/api/document-types/:name', async (req, res) => {
  try {
    await prisma.documentType.delete({
      where: { name: req.params.name }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

// API: Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { is_deleted: false },
      orderBy: { created_at: 'desc' }
    });
    // Parse tags JSON string back to array if needed for frontend
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
}, async (req, res) => {
  try {
    const file = req.file;
    const { tipe, no_referensi, departemen, tags, vendor_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = await prisma.document.create({
      data: {
        nama_file: file.originalname,
        file_path: '/uploads/' + file.filename, // Store relative URL
        tipe: tipe || 'Unknown',
        no_referensi: no_referensi || null,
        departemen: departemen || 'Import',
        ukuran_kb: Math.round(file.size / 1024),
        tags: tags || '[]',
        vendor_id: vendor_id || null,
        // upload_oleh: hardcoded to 1 for now since we don't have proper JWT auth yet
        upload_oleh: 1 
      }
    });

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
app.patch('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_deleted } = req.body;
    
    await prisma.document.update({
      where: { id: Number(id) },
      data: { is_deleted }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// API: Login
app.post('/api/login', async (req, res) => {
  try {
    const { employee_id, password } = req.body;
    
    if (!employee_id || !password) {
      return res.status(400).json({ error: 'Employee ID dan Password wajib diisi' });
    }

    const user = await prisma.user.findUnique({
      where: { employee_id }
    });

    if (!user) {
      return res.status(401).json({ error: 'Employee ID tidak ditemukan' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    if (!user.status_aktif) {
      return res.status(403).json({ error: 'Akun ini sudah tidak aktif, hubungi Supervisor Anda' });
    }

    // Never return the password
    const { password: _, ...userWithoutPassword } = user;
    
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
// Using a generic app.use to avoid Express 5 path-to-regexp issues
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

// Start server if not running on Vercel
// --- TASKS API ---
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        statusHistory: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ tasks });
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { id, title, department, priority, status, assigneeId, dueDate, importProjectId, shipment_un, sumber_tugas, assigned_by_id, notes, statusHistory } = req.body;
    
    const task = await prisma.task.create({
      data: {
        id,
        title,
        department,
        priority,
        status,
        assigneeId,
        dueDate,
        importProjectId,
        shipment_un,
        sumber_tugas,
        assigned_by_id,
        notes,
        statusHistory: {
          create: statusHistory || []
        }
      },
      include: { statusHistory: true }
    });
    res.json(task);
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { notes } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { notes }
    });
    res.json(task);
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:id/move', async (req, res) => {
  try {
    const { status, label, fromStatus, timestamp } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            label,
            fromStatus,
            timestamp: new Date(timestamp)
          }
        }
      },
      include: { statusHistory: true }
    });
    res.json(task);
  } catch (error) {
    console.error("API Error:", error); res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    });
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
