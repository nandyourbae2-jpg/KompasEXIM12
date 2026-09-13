## ⚠️ ATURAN DATABASE — WAJIB DIBACA

Proyek ini HANYA menggunakan SQLite via `better-sqlite3`.
Prisma ORM TIDAK PERNAH dipakai dan DILARANG digunakan lagi.

Semua akses database WAJIB melalui:
  const db = require('./src/database/db');
  db.prepare('...').get()/.all()/.run()

Jangan pernah menambahkan @prisma/client atau PrismaClient ke kode ini.
