-- ============================================================
-- AO Module Migration — Account Officer Tables
-- ============================================================

-- 1.1 Letter of Credit (LC)
CREATE TABLE IF NOT EXISTS lc_management (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lc_number TEXT UNIQUE NOT NULL,
  import_project_id INTEGER REFERENCES import_projects(id),

  bank_penerbit TEXT NOT NULL,
  nomor_lc_bank TEXT,
  jenis_lc TEXT DEFAULT 'Sight LC' CHECK (jenis_lc IN ('Sight LC', 'Usance LC', 'Standby LC')),

  beneficiary TEXT NOT NULL,
  nilai_lc REAL NOT NULL,
  mata_uang TEXT DEFAULT 'USD',

  tanggal_pengajuan TEXT DEFAULT (date('now')),
  tanggal_terbit TEXT,
  tanggal_expired TEXT,
  latest_shipment_date TEXT,

  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
    'Draft', 'Submitted', 'Issued', 'Amended', 'Utilized', 'Expired', 'Closed', 'Rejected'
  )),

  utilisasi_saat_ini REAL DEFAULT 0,
  catatan TEXT,

  dibuat_oleh_id INTEGER REFERENCES users(id),
  disetujui_oleh_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 1.1b LC Amendment History
CREATE TABLE IF NOT EXISTS lc_amendment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lc_id INTEGER NOT NULL REFERENCES lc_management(id) ON DELETE CASCADE,
  jenis_amandemen TEXT,
  detail TEXT,
  tanggal_amandemen TEXT DEFAULT (date('now')),
  dilakukan_oleh_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 1.2 Bank Guarantee
CREATE TABLE IF NOT EXISTS bank_guarantee (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bg_number TEXT UNIQUE NOT NULL,
  import_project_id INTEGER REFERENCES import_projects(id),

  bank_penerbit TEXT NOT NULL,
  tujuan_bg TEXT NOT NULL,
  penerima_bg TEXT NOT NULL,

  nilai_bg REAL NOT NULL,
  mata_uang TEXT DEFAULT 'IDR',

  tanggal_terbit TEXT,
  tanggal_expired TEXT,

  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
    'Draft', 'Aktif', 'Diperpanjang', 'Dicairkan', 'Expired', 'Ditutup'
  )),

  biaya_provisi REAL DEFAULT 0,
  catatan TEXT,

  dibuat_oleh_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 1.3a Fasilitas Kredit (Master)
CREATE TABLE IF NOT EXISTS fasilitas_kredit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_fasilitas TEXT NOT NULL,
  bank TEXT NOT NULL,
  jenis_fasilitas TEXT,
  limit_fasilitas REAL NOT NULL,
  mata_uang TEXT DEFAULT 'IDR',
  tanggal_mulai TEXT,
  tanggal_expired TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Expired', 'Ditutup')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 1.3b Kasbon Request
CREATE TABLE IF NOT EXISTS kasbon_request (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kasbon_number TEXT UNIQUE NOT NULL,

  sumber TEXT NOT NULL DEFAULT 'manual' CHECK (sumber IN ('pib_request', 'manual')),
  pib_request_id INTEGER REFERENCES pib_requests(id),
  import_project_id INTEGER REFERENCES import_projects(id),

  fasilitas_kredit_id INTEGER REFERENCES fasilitas_kredit(id),
  jumlah_diminta REAL NOT NULL,
  keterangan TEXT,

  status TEXT NOT NULL DEFAULT 'Diajukan' CHECK (status IN (
    'Diajukan', 'Disetujui', 'Dicairkan', 'Ditolak'
  )),

  diajukan_oleh_id INTEGER REFERENCES users(id),
  disetujui_oleh_id INTEGER REFERENCES users(id),
  tanggal_pencairan TEXT,

  catatan_approval TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 1.4 FX Booking
CREATE TABLE IF NOT EXISTS fx_booking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fx_number TEXT UNIQUE NOT NULL,

  job_order_id INTEGER REFERENCES job_orders(id),
  import_project_id INTEGER REFERENCES import_projects(id),

  mata_uang_asal TEXT DEFAULT 'IDR',
  mata_uang_tujuan TEXT DEFAULT 'USD',
  nominal_asal REAL NOT NULL,
  kurs REAL NOT NULL,
  nominal_tujuan REAL,

  tanggal_booking TEXT DEFAULT (date('now')),
  bank_pelaksana TEXT,

  status TEXT DEFAULT 'Booked' CHECK (status IN ('Booked', 'Settled', 'Dibatalkan')),

  dibuat_oleh_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 1.5 T/T Instruction
CREATE TABLE IF NOT EXISTS tt_instruction (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tt_number TEXT UNIQUE NOT NULL,

  job_order_id INTEGER NOT NULL REFERENCES job_orders(id),
  fx_booking_id INTEGER REFERENCES fx_booking(id),

  bank_pengirim TEXT NOT NULL,
  nomor_rekening_tujuan TEXT,
  nama_penerima TEXT,
  nominal REAL NOT NULL,
  mata_uang TEXT DEFAULT 'IDR',

  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Diproses', 'Terkirim', 'Gagal')),
  tanggal_eksekusi TEXT,
  bukti_tt_path TEXT,

  dibuat_oleh_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lc_import_project ON lc_management(import_project_id);
CREATE INDEX IF NOT EXISTS idx_lc_status ON lc_management(status);
CREATE INDEX IF NOT EXISTS idx_bg_import_project ON bank_guarantee(import_project_id);
CREATE INDEX IF NOT EXISTS idx_bg_status ON bank_guarantee(status);
CREATE INDEX IF NOT EXISTS idx_kasbon_pib ON kasbon_request(pib_request_id);
CREATE INDEX IF NOT EXISTS idx_kasbon_status ON kasbon_request(status);
CREATE INDEX IF NOT EXISTS idx_fx_job_order ON fx_booking(job_order_id);
CREATE INDEX IF NOT EXISTS idx_tt_job_order ON tt_instruction(job_order_id);
