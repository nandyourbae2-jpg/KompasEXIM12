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
      try { fs.chmodSync(dbDest, 0o666); } catch (e) {}
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

// Trik spesial: Memaksa pembuatan tabel Document beserta kolom penyimpanan file
prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama_file" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "no_referensi" TEXT,
    "departemen" TEXT,
    "versi" INTEGER NOT NULL DEFAULT 1,
    "ukuran_kb" INTEGER,
    "tags" TEXT,
    "vendor_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "is_deleted" BOOLEAN NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upload_oleh" INTEGER
  )
`).then(async () => {
  // Telah diperbaiki: Menggunakan tanda kutip biasa agar tidak Crash di Vercel!
  try { await prisma.$executeRawUnsafe('ALTER TABLE "Document" ADD COLUMN "file_data" TEXT'); } catch(e) {}
  try { await prisma.$executeRawUnsafe('ALTER TABLE "Document" ADD COLUMN "mime_type" TEXT'); } catch(e) {}
}).catch(e => console.error("Gagal create tabel:", e));

// Memaksa update nama Manager ke Jori secara otomatis di Vercel
prisma.user.update({
  where: { employee_id: 'EXIM-MGR-01' },
  data: { name: 'Jori' }
}).then(() => {})
  .catch((e) => {});

// Setup middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir); } catch(e) {}
}
app.use('/uploads', express.static(uploadsDir));

// Gunakan memoryStorage agar data langsung masuk ke RAM, bukan ke folder Vercel
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Batasan 5MB
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

// API: Download/Preview File
app.get('/api/files/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await prisma.$queryRaw`SELECT "nama_file", "file_data", "mime_type" FROM "Document" WHERE "id" = ${id}`;
    
    if (!result || result.length === 0 || !result[0].file_data) {
      return res.status(404).send('File tidak ditemukan di database.');
    }

    const doc = result[0];
    const buffer = Buffer.from(doc.file_data, 'base64');
    const safeName = doc.nama_file.replace(/[^\x20-\x7E]/g, '');

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Gagal memuat file: ' + error.message);
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

    // 1. Simpan baris dokumen ke Prisma untuk mendapatkan ID
    const document = await prisma.document.create({
      data: {
        nama_file: file.originalname,
        file_path: '', // Akan diisi di step 2
        tipe: tipe || 'Unknown',
        no_referensi: no_referensi || null,
        departemen: departemen || 'Import',
        ukuran_kb: Math.round(file.size / 1024),
        tags: tags || '[]',
        vendor_id: vendor_id || null,
        upload_oleh: 1 
      }
    });

    // 2. Buat URL akses file ke sistem Download API yang baru kita buat
    const fileUrl = `/api/files/${document.id}`;
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: { file_path: fileUrl }
    });

    // 3. Simpan isi fisik file (di-encode Base64) KE DALAM DATABASE (Sangat Aman & Presisi!)
    const base64Data = file.buffer.toString('base64');
    await prisma.$executeRaw`UPDATE "Document" SET "file_data" = ${base64Data}, "mime_type" = ${file.mimetype} WHERE "id" = ${document.id}`;

    const parsedDoc = {
      ...updatedDocument,
      tags: JSON.parse(updatedDocument.tags)
    };

    res.status(201).json({ document: parsedDoc });
  } catch (error) {
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
app.get('/api
