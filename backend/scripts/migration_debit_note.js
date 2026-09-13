const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../kompas-exim.db');
const db = new Database(dbPath, { verbose: console.log });

try {
  // 1. Create debit_notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS debit_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      -- Identitas Debit Note
      dn_number TEXT UNIQUE NOT NULL,
      import_project_id INTEGER REFERENCES import_projects(id),
      shipment_id INTEGER REFERENCES import_shipments(id),
      shipment_un TEXT,

      -- Klaim
      claim_kategori TEXT NOT NULL CHECK (claim_kategori IN ('Claim Supplier', 'Claim Liner/FWD', 'Claim Trucking')),
      claim_jenis TEXT NOT NULL,
      claim_kepada TEXT NOT NULL,
      deskripsi TEXT NOT NULL,

      -- Jumlah
      mata_uang TEXT DEFAULT 'IDR',
      jumlah_klaim REAL NOT NULL,
      jumlah_recovery REAL DEFAULT 0,
      tanggal_recovery TEXT,

      -- Status Lifecycle
      status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
        'Draft', 'Diterbitkan', 'Diakui', 'Negosiasi', 'Settled', 'Ditolak'
      )),

      -- Referensi
      linked_job_order_id INTEGER REFERENCES job_orders(id),
      nomor_invoice_klaim TEXT,
      file_debit_note_path TEXT,
      file_bukti_path TEXT,

      -- Metadata
      dibuat_oleh_id INTEGER REFERENCES users(id),
      disetujui_oleh_id INTEGER REFERENCES users(id),
      departemen TEXT DEFAULT 'Import',
      tanggal_dn TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('Tabel debit_notes berhasil dibuat.');

  // 2. Create history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS debit_note_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debit_note_id INTEGER NOT NULL REFERENCES debit_notes(id) ON DELETE CASCADE,
      status_dari TEXT,
      status_ke TEXT NOT NULL,
      catatan TEXT,
      diubah_oleh_id INTEGER REFERENCES users(id),
      diubah_pada TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('Tabel debit_note_status_history berhasil dibuat.');

  // 3. Seed Data
  const seedData = [
    {
      dn_number: 'DN-0001-26', claim_kategori: 'Claim Supplier',
      claim_jenis: 'Manufacturing Defect', claim_kepada: 'Meijer Food Ingredients B.V.',
      jumlah_klaim: 15000000, jumlah_recovery: 15000000,
      status: 'Settled', tanggal_recovery: '2026-07-20',
      deskripsi: 'Ditemukan 12 karton produk rusak saat offloading di gudang Karawang. Produk tidak sesuai spesifikasi kontrak.',
      dibuat_oleh_id: 1
    },
    {
      dn_number: 'DN-0002-26', claim_kategori: 'Claim Liner/FWD',
      claim_jenis: 'Overcharging', claim_kepada: 'Tanto Intim Line',
      jumlah_klaim: 8500000, jumlah_recovery: 0,
      status: 'Negosiasi', tanggal_recovery: null,
      deskripsi: 'Tagihan freight origin Tanto melebihi rate yang disepakati di kontrak sebesar USD 350. Sudah disampaikan ke Tanto, menunggu respons.',
      dibuat_oleh_id: 1
    },
    {
      dn_number: 'DN-0003-26', claim_kategori: 'Claim Trucking',
      claim_jenis: 'Demurrage & Detention', claim_kepada: 'Mandiri Transport Services',
      jumlah_klaim: 4200000, jumlah_recovery: 0,
      status: 'Draft', tanggal_recovery: null,
      deskripsi: 'Kontainer TGHU5544332 terlambat dikeluarkan dari depo karena unit trucking tidak tersedia. Mengakibatkan demurrage 3 hari.',
      dibuat_oleh_id: 1
    }
  ];

  const insertDN = db.prepare(`
    INSERT OR IGNORE INTO debit_notes 
    (dn_number, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, jumlah_recovery, status, tanggal_recovery, deskripsi, dibuat_oleh_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    for (const d of seedData) {
      insertDN.run(d.dn_number, d.claim_kategori, d.claim_jenis, d.claim_kepada, d.jumlah_klaim, d.jumlah_recovery, d.status, d.tanggal_recovery, d.deskripsi, d.dibuat_oleh_id);
    }
  })();
  console.log('Seed data berhasil dimasukkan.');

} catch (err) {
  console.error('Error saat menjalankan migrasi:', err);
} finally {
  db.close();
}
