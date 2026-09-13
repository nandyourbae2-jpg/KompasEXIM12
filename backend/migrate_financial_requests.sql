PRAGMA foreign_keys=off;
BEGIN TRANSACTION;
CREATE TABLE new_financial_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_number TEXT UNIQUE NOT NULL,
  sumber TEXT NOT NULL DEFAULT 'manual' CHECK (sumber IN ('import_operational', 'manual')),
  sumber_kategori TEXT,
  import_project_id INTEGER REFERENCES import_projects(id),
  shipment_id INTEGER REFERENCES import_shipments(id),
  aju_pib TEXT,
  jenis_pengajuan TEXT NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id),
  vendor_nama_manual TEXT,
  estimasi_nominal REAL NOT NULL DEFAULT 0,
  mata_uang TEXT DEFAULT 'IDR',
  keterangan TEXT,
  pic_id INTEGER REFERENCES users(id),
  file_lampiran_path TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Checked1', 'Approved', 'Rejected', 'Cancelled')),
  submitted_at TEXT,
  submitted_by_id INTEGER REFERENCES users(id),
  approved_by_id INTEGER REFERENCES users(id),
  approved_at TEXT,
  rejected_by_id INTEGER REFERENCES users(id),
  rejected_at TEXT,
  catatan_approval TEXT,
  departemen TEXT DEFAULT 'Import',
  created_by_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
INSERT INTO new_financial_requests SELECT * FROM financial_requests;
DROP TABLE financial_requests;
ALTER TABLE new_financial_requests RENAME TO financial_requests;
COMMIT;
PRAGMA foreign_keys=on;
