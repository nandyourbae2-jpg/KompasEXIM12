CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE DocumentType (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE Document (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_file TEXT NOT NULL,
    file_path TEXT NOT NULL,
    tipe TEXT NOT NULL,
    no_referensi TEXT,
    departemen TEXT,
    versi INTEGER DEFAULT 1,
    ukuran_kb INTEGER,
    tags TEXT,
    vendor_id TEXT,
    status TEXT DEFAULT 'Aktif',
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    upload_oleh INTEGER
);
CREATE TABLE User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    departemen TEXT,
    level_otoritas TEXT NOT NULL,
    tipe_karyawan TEXT,
    status_aktif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE Task (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    assigneeId INTEGER,
    dueDate TEXT,
    importProjectId TEXT,
    shipment_un TEXT,
    sumber_tugas TEXT NOT NULL,
    assigned_by_id INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE TaskHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskId TEXT NOT NULL,
    status TEXT NOT NULL,
    label TEXT NOT NULL,
    fromStatus TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (taskId) REFERENCES Task(id) ON DELETE CASCADE
);
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  level_otoritas TEXT NOT NULL CHECK (level_otoritas IN ('Manager','Supervisor','Staff Dept')),
  departemen TEXT CHECK (departemen IN ('Import','Export','Account Officer','Administrasi Export')),
  tipe_karyawan TEXT DEFAULT 'Karyawan Tetap' CHECK (tipe_karyawan IN ('Karyawan Tetap','Karyawan Magang')),
  status_aktif INTEGER DEFAULT 1,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, password_migrated_at TEXT);
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_code TEXT UNIQUE NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  departemen TEXT NOT NULL,
  prioritas TEXT NOT NULL CHECK (prioritas IN ('Rendah','Sedang','Tinggi','Kritis')),
  status TEXT NOT NULL DEFAULT 'Backlog' CHECK (status IN ('Backlog','Akan Dikerjakan','Dalam Proses','Review','Selesai')),
  sumber_tugas TEXT NOT NULL DEFAULT 'Manual' CHECK (sumber_tugas IN ('Manual','Escalation','System')),
  assignee_id INTEGER REFERENCES users(id),
  assigned_by_id INTEGER REFERENCES users(id),
  import_project_id INTEGER,
  tenggat TEXT,
  progress INTEGER DEFAULT 0,
  catatan_progress TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE task_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status_dari TEXT,
  status_ke TEXT NOT NULL,
  diubah_oleh_id INTEGER REFERENCES users(id),
  diubah_pada TEXT DEFAULT (datetime('now'))
);
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_file TEXT NOT NULL,
  file_path TEXT,
  tipe TEXT NOT NULL,
  no_referensi TEXT,
  departemen TEXT,
  versi INTEGER DEFAULT 1,
  upload_oleh_id INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'Aktif',
  tags TEXT DEFAULT '[]',
  ukuran_kb REAL,
  vendor_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('Trucking','Forwarder','Both')),
  region TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Tidak Aktif')),
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  kontak_nama TEXT,
  kontak_email TEXT,
  kontak_telepon TEXT,
  alamat TEXT,
  layanan TEXT DEFAULT '[]',
  catatan TEXT,
  review_status TEXT DEFAULT 'CONFIRMED' CHECK (review_status IN ('NEEDS_REVIEW','CONFIRMED','NON_VENDOR')),
  review_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, version INTEGER DEFAULT 1);
CREATE TABLE vendor_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  evaluation_period TEXT NOT NULL,
  evaluator_id INTEGER REFERENCES users(id),
  service_quality_score REAL NOT NULL CHECK (service_quality_score BETWEEN 1 AND 5),
  on_time_score REAL NOT NULL CHECK (on_time_score BETWEEN 1 AND 5),
  cost_score REAL NOT NULL CHECK (cost_score BETWEEN 1 AND 5),
  responsiveness_score REAL NOT NULL CHECK (responsiveness_score BETWEEN 1 AND 5),
  compliance_score REAL NOT NULL CHECK (compliance_score BETWEEN 1 AND 5),
  overall_score REAL NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('EXCELLENT','VERY_GOOD','GOOD','FAIR','POOR')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(vendor_id, evaluation_period)
);
CREATE INDEX idx_vendor_evaluations_vendor_id ON vendor_evaluations(vendor_id);
CREATE TABLE import_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_unique_number TEXT UNIQUE NOT NULL,
  supplier TEXT NOT NULL,
  trade TEXT,
  import_type TEXT NOT NULL CHECK (import_type IN ('Raw Material','Indirect Mat. Food','Indirect Mat. Packaging','Aset','Miscellaneous','Reimport','Reexport')),
  shipment_term TEXT,
  invoice_no TEXT,
  po_co_no TEXT,               -- optional PO/CO number
  bl_no TEXT,
  etd TEXT,
  eta TEXT,
  hs_code TEXT,
  free_time_destination INTEGER,
  document_requirements TEXT NOT NULL DEFAULT '[]', -- JSON array of master_dokumen IDs
  tanggal_input TEXT DEFAULT (date('now')),
  created_by_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, financial_status TEXT DEFAULT 'Pending');
CREATE TABLE import_project_documents (
  import_project_id INTEGER NOT NULL REFERENCES import_projects(id),
  dokumen_id INTEGER NOT NULL REFERENCES master_data_dokumen(id),
  PRIMARY KEY (import_project_id, dokumen_id)
);
CREATE TABLE master_data_dokumen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_dokumen TEXT UNIQUE NOT NULL,
  nama_dokumen TEXT NOT NULL,
  keterangan TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE master_data_departemen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_departemen TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE dokumen_monitoring_baris (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_project_id INTEGER NOT NULL REFERENCES import_projects(id),
  master_dokumen_id INTEGER NOT NULL REFERENCES master_data_dokumen(id),

  -- SECTION 1: DRAFT
  draft_received_date TEXT,
  draft_confirmed_date TEXT,
  draft_confirmed_by_id INTEGER REFERENCES users(id),

  -- SECTION 2: SCAN ORIGINAL
  scan_receive_date TEXT,
  scan_shared_departemen TEXT DEFAULT '[]',

  -- SECTION 3: ORIGINAL PHYSICAL DOCUMENT
  original_receive_date TEXT,
  original_awb_no TEXT,
  original_shared_departemen TEXT DEFAULT '[]',

  last_updated_by_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, scan_confirmed_date TEXT, scan_confirmed_by_id INTEGER REFERENCES users(id), original_confirmed_date TEXT, original_confirmed_by_id INTEGER REFERENCES users(id));
CREATE TABLE dokumen_monitoring_riwayat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baris_id INTEGER NOT NULL REFERENCES dokumen_monitoring_baris(id),
  field_diubah TEXT NOT NULL,
  nilai_lama TEXT,
  nilai_baru TEXT,
  diubah_oleh_id INTEGER REFERENCES users(id),
  diubah_pada TEXT DEFAULT (datetime('now'))
);
CREATE TABLE import_shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_code TEXT UNIQUE NOT NULL,
  import_project_id INTEGER REFERENCES import_projects(id),
  un TEXT,
  kat TEXT,
  supplier TEXT,
  invoice_no TEXT,
  bl_no TEXT,
  mode_transport TEXT,
  qtty REAL,
  uom TEXT DEFAULT 'CBM',
  depo_route TEXT,
  gudang TEXT,
  ata TEXT,
  etd TEXT,
  eta TEXT,
  hs_code TEXT,
  shipment_term TEXT,
  trade TEXT,
  free_time_destination INTEGER,
  costs TEXT DEFAULT '{}',
  created_by_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, generated_request_ids TEXT DEFAULT '{}', pib_request_id INTEGER REFERENCES pib_requests(id), atd TEXT);
CREATE TABLE containers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id INTEGER NOT NULL REFERENCES import_shipments(id) ON DELETE CASCADE,
  no_kontainer TEXT NOT NULL,
  stack TEXT,
  gate_out TEXT,
  trucking_repo_vendor TEXT,
  tru_repo_arrival TEXT,
  tru_repo_depart TEXT,
  trucking_wh_vendor TEXT,
  gate_in_wh TEXT,
  offloading_start TEXT,
  offloading_end TEXT,
  gate_out_wh TEXT,
  fish_issue INTEGER DEFAULT 0,
  queue_issue INTEGER DEFAULT 0,
  space_issue INTEGER DEFAULT 0,
  other_issue INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, depo_route TEXT, gudang TEXT);
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipe TEXT NOT NULL CHECK (tipe IN ('Weekday Report','Problem Report','Progress Update','Solve Update')),
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  departemen TEXT NOT NULL,
  dibuat_oleh_id INTEGER NOT NULL REFERENCES users(id),
  problem_report_id INTEGER REFERENCES reports(id),
  tanggapan_manager TEXT,
  ditanggapi_oleh_id INTEGER REFERENCES users(id),
  tanggapan_pada TEXT,
  ditinjau_manager INTEGER DEFAULT 0,
  tanggal TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE archive_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periode TEXT UNIQUE NOT NULL,
  snapshot_data TEXT NOT NULL,
  archived_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE payment_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_order_id INTEGER NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
          jumlah_bayar REAL NOT NULL,
          tanggal_bayar TEXT NOT NULL,
          metode TEXT NOT NULL,
          file_bukti_path TEXT,
          dicatat_oleh_id INTEGER REFERENCES users(id),
          created_at TEXT DEFAULT (datetime('now'))
        , correlation_id TEXT);
CREATE TABLE debit_note_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debit_note_id INTEGER NOT NULL REFERENCES debit_notes(id) ON DELETE CASCADE,
      status_dari TEXT,
      status_ke TEXT NOT NULL,
      catatan TEXT,
      diubah_oleh_id INTEGER REFERENCES users(id),
      diubah_pada TEXT DEFAULT (datetime('now'))
    );
CREATE TABLE realisasi_mtb_periode (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_periode TEXT NOT NULL,
        tanggal_mulai TEXT NOT NULL,
        tanggal_selesai TEXT NOT NULL,
        saldo_awal REAL DEFAULT 0,
        saldo_akhir REAL,
        total_kredit REAL DEFAULT 0,
        total_debet REAL DEFAULT 0,
        
        status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Submitted','Checked1','Checked2','Checked3','Approved')),
        
        prepared_by_id INTEGER REFERENCES users(id),
        prepared_at TEXT,
        checked1_by_id INTEGER REFERENCES users(id),
        checked1_at TEXT,
        checked2_by_id INTEGER REFERENCES users(id),
        checked2_at TEXT,
        checked3_by_id INTEGER REFERENCES users(id),
        checked3_at TEXT,
        approved_by_id INTEGER REFERENCES users(id),
        approved_at TEXT,
        tgl_dana_balik TEXT,
        
        departemen TEXT DEFAULT 'Import',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      , version INTEGER DEFAULT 1);
CREATE TABLE realisasi_mtb_transaksi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        periode_id INTEGER NOT NULL REFERENCES realisasi_mtb_periode(id) ON DELETE CASCADE,
        no_urut INTEGER,
        
        tgl_payment TEXT NOT NULL,
        unique_number TEXT,
        category TEXT NOT NULL,
        shipment TEXT,
        party TEXT,
        invoice_shipment TEXT,
        bl_number TEXT,
        no_kwitansi TEXT,
        
        amount_exclude_tax REAL DEFAULT 0,
        vat REAL DEFAULT 0,
        pot_pph23_diskon REAL DEFAULT 0,
        materai_adm REAL DEFAULT 0,
        adm_bank REAL DEFAULT 0,
        kredit REAL,
        debet REAL DEFAULT 0,
        
        expense_gp TEXT,
        saldo_running REAL,
        
        import_project_id INTEGER REFERENCES import_projects(id),
        
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      , job_order_id INTEGER, is_deleted INTEGER DEFAULT 0, version INTEGER DEFAULT 1, correlation_id TEXT, transaction_source TEXT DEFAULT 'MANUAL', payment_log_id INTEGER REFERENCES payment_logs(id), payment_reference TEXT);
CREATE TABLE financial_request_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES financial_requests(id) ON DELETE CASCADE,
  status_dari TEXT,
  status_ke TEXT NOT NULL,
  catatan TEXT,
  dilakukan_oleh_id INTEGER REFERENCES users(id),
  dilakukan_pada TEXT DEFAULT (datetime('now'))
);
CREATE TABLE pib_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_number TEXT UNIQUE NOT NULL,
        import_project_id INTEGER NOT NULL REFERENCES import_projects(id),
        shipment_id INTEGER REFERENCES import_shipments(id),
        aju_pib TEXT NOT NULL,
        tanggal_pengajuan TEXT NOT NULL DEFAULT (date('now')),
        
        estimasi_bm REAL DEFAULT 0,
        estimasi_ppn REAL DEFAULT 0,
        estimasi_pph REAL DEFAULT 0,
        estimasi_total REAL,
        kasbon_diminta REAL NOT NULL,
        
        aktual_bm REAL,
        aktual_ppn REAL,
        aktual_pph REAL,
        aktual_total REAL,
        lebih_kurang REAL,
        
        no_invoice_pib TEXT,
        bl_number TEXT,
        file_dokumen_pib_path TEXT,
        
        status TEXT NOT NULL DEFAULT 'Draft'
          CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Realized', 'Settled')),
          
        submitted_at TEXT,
        submitted_by_id INTEGER REFERENCES users(id),
        approved_by_id INTEGER REFERENCES users(id),
        approved_at TEXT,
        rejected_by_id INTEGER REFERENCES users(id),
        rejected_at TEXT,
        catatan_approval TEXT,
        
        othe_pib_synced INTEGER DEFAULT 0,
        realisasi_pib_id INTEGER,
        
        departemen TEXT DEFAULT 'Import',
        created_by_id INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      , shipment_manual_text TEXT, version INTEGER DEFAULT 1);
CREATE TABLE pib_request_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pib_request_id INTEGER NOT NULL REFERENCES pib_requests(id) ON DELETE CASCADE,
        status_dari TEXT,
        status_ke TEXT NOT NULL,
        catatan TEXT,
        dilakukan_oleh_id INTEGER REFERENCES users(id),
        dilakukan_pada TEXT DEFAULT (datetime('now', 'localtime'))
      );
CREATE TABLE IF NOT EXISTS "realisasi_pib" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no_kas TEXT,
        tgl_payment TEXT NOT NULL,
        
        unique_number TEXT,
        shipment TEXT,
        party TEXT,
        invoice TEXT,
        bl TEXT,
        aju_pib TEXT,
        
        amount_kasbon REAL NOT NULL DEFAULT 0,
        bm REAL DEFAULT 0,
        ppn REAL DEFAULT 0,
        pph REAL DEFAULT 0,
        total_pib_realisasi REAL,
        
        lebih_kurang REAL,
        
        expense_gp TEXT,
        periode TEXT,
        
        import_project_id INTEGER REFERENCES import_projects(id),
        pib_request_id INTEGER REFERENCES pib_requests(id),
        
        status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Verified','Closed', 'Realized')),
        verified_by_id INTEGER REFERENCES users(id),
        verified_at TEXT,
        
        departemen TEXT DEFAULT 'Import',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      , version INTEGER DEFAULT 1);
CREATE TABLE debit_note_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debit_note_id INTEGER NOT NULL REFERENCES debit_notes(id),
  status_dari TEXT,
  status_ke TEXT NOT NULL,
  catatan TEXT,
  diubah_oleh_id INTEGER NOT NULL REFERENCES users(id),
  diubah_pada TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS "financial_requests" (
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
, version INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS "container_costs" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      container_id INTEGER REFERENCES containers(id) ON DELETE CASCADE,
      shipment_id  INTEGER NOT NULL REFERENCES import_shipments(id),
      cost_category TEXT NOT NULL,
      vendor_name  TEXT,
      inv_no       TEXT,
      dpp          REAL DEFAULT 0,
      persen_ppn   REAL DEFAULT 0,
      ppn          REAL DEFAULT 0,
      no_fp        TEXT,
      gp_no        TEXT,
      biaya_dasar  REAL DEFAULT 0,
      inap_sasis   REAL DEFAULT 0,
      other_cost   REAL DEFAULT 0,
      ket_other    TEXT,
      calc_day     INTEGER DEFAULT 0,
      calc_shift   INTEGER DEFAULT 0,
      act_day      INTEGER DEFAULT 0,
      act_shift    INTEGER DEFAULT 0,
      storage      REAL DEFAULT 0,
      monitoring   REAL DEFAULT 0,
      recooling    REAL DEFAULT 0,
      lolo_depo    REAL DEFAULT 0,
      total        REAL DEFAULT 0,
      job_order_id INTEGER REFERENCES job_orders(id),
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    , jenis_cost TEXT DEFAULT 'OTHER');
CREATE TABLE ref_commitment_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incoterm_applies_to TEXT,
    transport_mode TEXT,
    cost_category TEXT NOT NULL,
    commitment_type TEXT NOT NULL,
    default_baseline_amount REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT 1
);
CREATE TABLE financial_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ledger_id INTEGER NOT NULL,
    job_order_id INTEGER NOT NULL,
    allocated_amount REAL NOT NULL,
    forex_variance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ledger_id) REFERENCES financial_request_ledger(id) ON DELETE CASCADE,
    FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "financial_request_ledger" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_project_id INTEGER NOT NULL,
    request_number TEXT,
    cost_category TEXT NOT NULL,
    vendor_id INTEGER,
    vendor_nama_manual TEXT,
    invoice_no TEXT,
    dpp REAL DEFAULT 0,
    persen_ppn REAL DEFAULT 0,
    ppn REAL DEFAULT 0,
    total_estimasi REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Terisi', 'Diteruskan', 'Lunas', 'Cancelled')),
    keterangan TEXT,
    source TEXT DEFAULT 'standard' CHECK(source IN ('standard', 'manual')),
    job_order_id INTEGER,
    submitted_at DATETIME,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, baseline_amount REAL DEFAULT 0, actual_amount REAL DEFAULT 0, currency TEXT DEFAULT 'IDR', shipment_id INTEGER REFERENCES import_shipments(id) ON DELETE SET NULL,
    FOREIGN KEY (import_project_id) REFERENCES import_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
    FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE SET NULL
);
CREATE INDEX idx_frl_project ON financial_request_ledger(import_project_id);
CREATE TABLE test_undef (id INTEGER, val TEXT);
CREATE TABLE master_kategori_biaya_manual (id INTEGER PRIMARY KEY AUTOINCREMENT, nama_kategori TEXT UNIQUE NOT NULL, keterangan TEXT, is_active BOOLEAN DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), allow_financial_commitment BOOLEAN DEFAULT 1, allow_payment_tracker BOOLEAN DEFAULT 1, allow_mtb BOOLEAN DEFAULT 1, allow_dashboard BOOLEAN DEFAULT 1, allow_reporting BOOLEAN DEFAULT 1, require_manager_approval BOOLEAN DEFAULT 0);
CREATE TABLE realisasi_mtb_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mtb_transaksi_id INTEGER NOT NULL REFERENCES realisasi_mtb_transaksi(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      perubahan TEXT,
      dilakukan_oleh_id INTEGER REFERENCES users(id),
      dilakukan_pada TEXT DEFAULT (datetime('now', 'localtime'))
    , correlation_id TEXT);
CREATE TABLE IF NOT EXISTS "job_orders" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_order_code TEXT UNIQUE NOT NULL,
        vendor_id INTEGER REFERENCES vendors(id),
        vendor_name TEXT,
        cost_type TEXT NOT NULL,
        mata_uang TEXT DEFAULT 'IDR',
        total_invoice REAL NOT NULL DEFAULT 0,
        total_paid REAL NOT NULL DEFAULT 0,
        tanggal_invoice TEXT,
        tanggal_jatuh_tempo TEXT,
        sumber TEXT DEFAULT 'manual' CHECK (sumber IN ('manual','import_operational', 'financial_request')),
        status_linked TEXT DEFAULT 'linked',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        import_category_key TEXT,
        import_shipment_id INTEGER,
        invoice_no TEXT,
        dpp REAL DEFAULT 0,
        persen_ppn REAL DEFAULT 11,
        ppn REAL DEFAULT 0,
        financial_request_id INTEGER REFERENCES financial_requests(id),
        payment_status TEXT DEFAULT 'UNPAID' CHECK(payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOID', 'CANCELLED')),
        version INTEGER DEFAULT 1
      );
CREATE TABLE IF NOT EXISTS "debit_notes" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dn_number TEXT UNIQUE NOT NULL,
        import_project_id INTEGER REFERENCES import_projects(id),
        shipment_id INTEGER REFERENCES import_shipments(id),
        claim_kategori TEXT NOT NULL CHECK (claim_kategori IN ('Claim Supplier', 'Claim Liner/FWD', 'Claim Trucking')),
        claim_jenis TEXT NOT NULL,
        claim_kepada TEXT NOT NULL,
        deskripsi TEXT NOT NULL,
        mata_uang TEXT DEFAULT 'IDR',
        jumlah_klaim REAL NOT NULL,
        jumlah_recovery REAL DEFAULT 0,
        tanggal_recovery TEXT,
        status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
          'Draft', 'Diterbitkan', 'Diakui', 'Negosiasi', 'Settled', 'Ditolak'
        )),
        linked_job_order_id INTEGER REFERENCES job_orders(id),
        nomor_invoice_klaim TEXT,
        file_debit_note_path TEXT,
        file_bukti_path TEXT,
        dibuat_oleh_id INTEGER REFERENCES users(id),
        disetujui_oleh_id INTEGER REFERENCES users(id),
        departemen TEXT DEFAULT 'Import',
        tanggal_dn TEXT DEFAULT (date('now')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        financial_request_id INTEGER REFERENCES financial_requests(id),
        nomor_dn_actual TEXT,
        version INTEGER DEFAULT 1
      );
CREATE INDEX idx_job_orders_import_shipment_id ON job_orders(import_shipment_id);
CREATE INDEX idx_debit_notes_shipment_id ON debit_notes(shipment_id);
CREATE TABLE vendor_rate_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        route_origin TEXT NOT NULL,
        route_destination TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        price REAL NOT NULL,
        effective_date DATE,
        status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
        version INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
      );
CREATE INDEX idx_vendor_rate_cards_vendor_id ON vendor_rate_cards(vendor_id);
CREATE TABLE vendor_fleets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        license_plate TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        capacity TEXT,
        compliance_status TEXT DEFAULT 'Compliant' CHECK (compliance_status IN ('Compliant', 'Expired', 'Maintenance')),
        version INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
      );
CREATE INDEX idx_vendor_fleets_vendor_id ON vendor_fleets(vendor_id);
