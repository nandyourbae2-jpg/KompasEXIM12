const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Inisialisasi Database File untuk Vercel
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

// 2. Trik Spesial & PROMISE BARRIER: Pastikan tabel selesai dibuat sebelum proses lain berjalan
const initDbPromise = prisma.$executeRawUnsafe(`
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
  try { await prisma.$executeRawUnsafe('ALTER TABLE "Document" ADD COLUMN "file_data" TEXT'); } catch(e) {}
  try { await prisma.$executeRawUnsafe('ALTER TABLE "Document" ADD COLUMN "mime_type" TEXT'); } catch(e) {}
}).catch(e => console.error("Gagal create tabel:", e));

// Update Nama Manager
prisma.user.update({
  where: { employee_id: 'EXIM-MGR-01' },
  data: { name: 'Jori' }
}).then(() => {}).catch(() => {});

// 3. Middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// 4. Setup Uploads (Kembali ke diskStorage yang terbukti bekerja paling aman di Vercel!)
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir); } catch(e) {}
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// API: Get all documents
app.get('/api/documents', async (req, res, next) => {
  try {
    await initDbPromise; // Tahan sampai struktur tabel benar-benar siap
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
    next(error);
  }
});

// API: Download/Preview File
app.get('/api/files/:id', async (req, res, next) => {
  try {
    await initDbPromise;
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
    next(error);
  }
});

// API: Upload document
app.post('/api/documents', (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err) return next(err); // Lempar error dengan rapi ke Global Handler
    next();
  });
}, async (req, res, next) => {
  try {
    await initDbPromise; // Mencegah Error karena kolom belum terbuat
    
    const file = req.file;
    const { tipe, no_referensi, departemen, tags, vendor_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Tidak ada file yang di-upload' });
    }

    // 1. Simpan baris dokumen ke Prisma
    const document = await prisma.document.create({
      data: {
        nama_file: file.originalname,
        file_path: '', // Placeholder
        tipe: tipe || 'Unknown',
        no_referensi: no_referensi || null,
        departemen: departemen || 'Import',
        ukuran_kb: Math.round(file.size / 1024),
        tags: tags || '[]',
        vendor_id: vendor_id || null,
        upload_oleh: 1 
      }
    });

    // 2. Buat URL Preview
    const fileUrl = `/api/files/${document.id}`;
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: { file_path: fileUrl }
    });

    // 3. Pindahkan file dari folder Vercel /tmp ke dalam SQLite Database
    const fileBuffer = fs.readFileSync(file.path);
    const base64Data = fileBuffer.toString('base64');
    await prisma.$executeRaw`UPDATE "Document" SET "file_data" = ${base64Data}, "mime_type" = ${file.mimetype} WHERE "id" = ${document.id}`;

    // Hapus file dari folder sementara (bersih-bersih RAM Vercel)
    try { fs.unlinkSync(file.path); } catch(e) {}

    const parsedDoc = {
      ...updatedDocument,
      tags: JSON.parse(updatedDocument.tags)
    };

    res.status(201).json({ document: parsedDoc });
  } catch (error) {
    next(error); // Lempar ke Global Error Handler agar selalu berwujud JSON!
  }
});

// API: Soft Delete document
app.patch('/api/documents/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_deleted } = req.body;
    await prisma.document.update({
      where: { id: Number(id) },
      data: { is_deleted }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// API: Login
app.post('/api/login', async (req, res, next) => {
  try {
    const { employee_id, password } = req.body;
    const user = await prisma.user.findUnique({ where: { employee_id } });
    if (!user) return res.status(401).json({ error: 'Employee ID tidak ditemukan' });
    if (user.password !== password) return res.status(401).json({ error: 'Kredensial tidak valid' });
    if (!user.status_aktif) return res.status(403).json({ error: 'Akun ini sudah tidak aktif' });
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
});

// API: Reset Simulasi
app.get('/api/reset-simulation', async (req, res, next) => {
  try {
    await initDbPromise;
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

// 5. GLOBAL ERROR HANDLER (Mencegah HTML 500 Vercel dan mengubahnya jadi pesan error nyata)
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Multer Error: ' + err.message });
  }
  res.status(500).json({ error: 'System Error: ' + (err.message || String(err)) });
});

module.exports = app;
module.exports.config = {
  api: { bodyParser: false },
};
