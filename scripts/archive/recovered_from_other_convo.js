const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Setup middlewares
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());

// Setup uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files from uploads
app.use('/uploads', express.static(uploadsDir));

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
app.post('/api/documents', upload.single('file'), async (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
