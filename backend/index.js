const express = require('express');
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
    if (!fs.existsSync(dbDest)) {
      fs.copyFileSync(dbSource, dbDest);
      try { fs.chmodSync(dbDest, 0o666); } catch (e) {} // Mencegah crash jika gagal ubah permission
      console.log("Copied SQLite DB to /tmp for Vercel");
    }
  } catch (err) {
    console.error("Error copying DB:", err);
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      // Kembali menggunakan format URL yang paling aman untuk Prisma di Vercel
      url: process.env.VERCEL ? 'file:/tmp/dev.db' : 'file:./dev.db'
    }
  }
});

// Setup middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// PERBAIKAN UTAMA: Gunakan memoryStorage agar aman dari isu Hak Akses Disk Vercel
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// API: Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { is_deleted: false },
      orderBy: { created_at: 'desc' }
    });
    const parsedDocs = documents.map(doc => ({
      ...doc,
      tags: doc.tags ? JSON.parse(doc.tags) : []
    }));
    res.json({ documents: parsedDocs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Upload document
app.post('/api/documents', (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: 'Gagal memproses file: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const file = req.file;
    const { tipe, no_referensi, departemen, tags, vendor_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Tidak ada file yang di-upload' });
    }

    // Karena menggunakan memoryStorage (virtual untuk simulasi), kita buat fake URL
    const fakeFilePath = '/uploads/sim-' + Date.now() + '-' + file.originalname.replace(/\s+/g, '_');

    const document = await prisma.document.create({
      data: {
        nama_file: file.originalname,
        file_path: fakeFilePath, 
        tipe: tipe || 'Unknown',
        no_referensi: no_referensi || null,
        departemen: departemen || 'Import',
        ukuran_kb: Math.round(file.size / 1024),
        tags: tags || '[]',
        vendor_id: vendor_id || null,
        upload_oleh: 1 
      }
    });

    const parsedDoc = {
      ...document,
      tags: JSON.parse(document.tags)
    };

    res.status(201).json({ document: parsedDoc });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: 'Database gagal menyimpan: ' + error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// API: Login
app.post('/api/login', async (req, res) => {
  try {
    const { employee_id, password } = req.body;
    const user = await prisma.user.findUnique({ where: { employee_id } });
    if (!user) return res.status(401).json({ error: 'Employee ID tidak ditemukan' });
    if (user.password !== password) return res.status(401).json({ error: 'Kredensial tidak valid' });
    if (!user.status_aktif) return res.status(403).json({ error: 'Akun ini sudah tidak aktif' });
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Reset Simulasi
app.get('/api/reset-simulation', async (req, res) => {
  try {
    await prisma.document.deleteMany({});
    res.send('<div style="font-family: sans-serif; text-align: center; margin-top: 50px;"><h2 style="color: green;">✅ Simulasi Berhasil Di-reset!</h2><a href="/">Kembali</a></div>');
  } catch (error) {
    res.status(500).send("Gagal mereset simulasi: " + error.message);
  }
});

// Serve Frontend Static Files
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

module.exports = app;

// Menghindari Vercel menelan Multipart stream (wajib untuk multer)
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
