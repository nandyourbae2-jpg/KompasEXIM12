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
, password_migrated_at TEXT, personal_notes TEXT);
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
, reference_id TEXT);
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
  service_type TEXT NOT NULL CHECK (service_type IN ('Trucking','Forwarder')),
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
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, version INTEGER DEFAULT 1, review_status TEXT DEFAULT 'CONFIRMED', review_note TEXT);
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
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, is_active INTEGER DEFAULT 1);
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
      , vendor_name TEXT);
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
CREATE TABLE document_types ( id INTEGER PRIMARY KEY AUTOINCREMENT, nama_tipe TEXT UNIQUE NOT NULL, created_at TEXT DEFAULT (datetime('now')) );
CREATE TABLE ae_document_versions (
        id TEXT PRIMARY KEY,
        ae_document_checklist_id TEXT REFERENCES ae_document_checklists(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        file_hash TEXT,
        uploaded_by_id TEXT REFERENCES users(id),
        uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
CREATE INDEX idx_tasks_reference_id ON tasks(reference_id);
CREATE TABLE ae_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    reference TEXT,
    old_value JSON,
    new_value JSON,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    industry TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Suspended')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);
CREATE TABLE ao_customer_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    version INTEGER DEFAULT 1,
    UNIQUE(user_id, customer_id)
);
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    shipment_type TEXT NOT NULL CHECK(shipment_type IN ('IMPORT', 'EXPORT')),
    shipment_id INTEGER NOT NULL, -- Logical FK to either import_shipments or ae_export_shipments
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'IDR',
    due_date TEXT,
    status TEXT DEFAULT 'UNPAID' CHECK(status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE TABLE lc_management (
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
CREATE TABLE lc_amendment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lc_id INTEGER NOT NULL REFERENCES lc_management(id) ON DELETE CASCADE,
  jenis_amandemen TEXT,
  detail TEXT,
  tanggal_amandemen TEXT DEFAULT (date('now')),
  dilakukan_oleh_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE bank_guarantee (
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
CREATE TABLE fasilitas_kredit (
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
CREATE TABLE kasbon_request (
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
CREATE TABLE fx_booking (
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
CREATE TABLE tt_instruction (
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
CREATE INDEX idx_lc_import_project ON lc_management(import_project_id);
CREATE INDEX idx_lc_status ON lc_management(status);
CREATE INDEX idx_bg_import_project ON bank_guarantee(import_project_id);
CREATE INDEX idx_bg_status ON bank_guarantee(status);
CREATE INDEX idx_kasbon_pib ON kasbon_request(pib_request_id);
CREATE INDEX idx_kasbon_status ON kasbon_request(status);
CREATE INDEX idx_fx_job_order ON fx_booking(job_order_id);
CREATE INDEX idx_tt_job_order ON tt_instruction(job_order_id);
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
CREATE TABLE idempotency_keys (key TEXT PRIMARY KEY, user_id INTEGER, endpoint TEXT, request_payload_hash TEXT, response_status INTEGER, response_body TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE source_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_code TEXT UNIQUE NOT NULL,               -- e.g. IMP-2026-003
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_kb REAL,
    rows_read INTEGER DEFAULT 0,
    records_new INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_unchanged INTEGER DEFAULT 0,
    records_invalid INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Processing' CHECK (status IN ('Processing','Success','Warning','Failed')),
    error_summary TEXT,                             -- JSON array of validation errors
    uploaded_by_id INTEGER NOT NULL REFERENCES users(id),
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_source_imports_code ON source_imports(import_code);
CREATE INDEX idx_source_imports_status ON source_imports(status);
CREATE TABLE export_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_code TEXT UNIQUE NOT NULL,                   -- e.g. EXP-2026-000124 (immutable)
    business_key TEXT UNIQUE NOT NULL,               -- normalized "INV|NO_BC" (matching key)

    -- ── SOURCE-OWNED FIELDS (updated by source sync, read-only for AE/AO) ──
    customer_code TEXT,
    product_type TEXT,                               -- FG / WR / BP
    invoice_no TEXT,
    pi TEXT,
    buyer TEXT,
    description_goods TEXT,
    destination TEXT,
    destination_country TEXT,
    fwd_trucking TEXT,
    liner TEXT,
    no_bc TEXT,
    container_qty TEXT,
    warehouse TEXT,
    req_trucking TEXT,
    in_date TEXT,
    in_time TEXT,
    data_loading TEXT,
    closing_bki TEXT,
    closing_docs TEXT,
    closing_docs_time TEXT,
    closing_cy TEXT,
    closing_cy_time TEXT,
    initial_etd TEXT,
    etd TEXT,
    eta TEXT,
    vessel TEXT,
    fasilitas_kite TEXT,
    respon TEXT,                                     -- SAFE / PPB (inspection status)
    stacking_terminal TEXT,
    source_pic TEXT,

    -- ── AE-OWNED OPERATIONAL DATA (NEVER overwritten by source sync) ──
    bl_mbl TEXT,
    cc_non_cc TEXT CHECK (cc_non_cc IN ('CC', 'NON CC')),
    coo_form TEXT,
    qc_attend INTEGER DEFAULT 0,
    ae_assignee_id INTEGER REFERENCES users(id),
    ae_status TEXT DEFAULT 'Pending' CHECK (ae_status IN (
        'Pending','Assigned','In Progress','Review','Completed','On Hold','Cancelled'
    )),
    ae_progress INTEGER DEFAULT 0,
    ae_checklist TEXT DEFAULT '{}',
    ae_remarks TEXT,
    ae_handover_status TEXT DEFAULT 'Not Started' CHECK (ae_handover_status IN (
        'Not Started','Draft Shared','Final Shared','Completed'
    )),
    ae_handover_at TEXT,

    -- ── AO-OWNED OPERATIONAL DATA (NEVER overwritten by source sync) ──
    ao_assignee_id INTEGER REFERENCES users(id),
    ao_status TEXT DEFAULT 'Pending' CHECK (ao_status IN (
        'Pending','Assigned','In Progress','Verification','Completed','On Hold','Cancelled'
    )),
    ao_progress INTEGER DEFAULT 0,
    ao_checklist TEXT DEFAULT '{}',
    ao_verification_status TEXT DEFAULT 'Not Verified',
    ao_remarks TEXT,
    ao_completion_status TEXT DEFAULT 'Incomplete',

    -- ── METADATA ──
    source TEXT DEFAULT 'log_schedule' CHECK (source IN ('log_schedule','manual')),
    first_import_id INTEGER REFERENCES source_imports(id),
    last_import_id INTEGER REFERENCES source_imports(id),
    created_by_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);
CREATE INDEX idx_export_jobs_code ON export_jobs(job_code);
CREATE INDEX idx_export_jobs_bkey ON export_jobs(business_key);
CREATE INDEX idx_export_jobs_ae_assignee ON export_jobs(ae_assignee_id);
CREATE INDEX idx_export_jobs_ao_assignee ON export_jobs(ao_assignee_id);
CREATE INDEX idx_export_jobs_ae_status ON export_jobs(ae_status);
CREATE INDEX idx_export_jobs_ao_status ON export_jobs(ao_status);
CREATE INDEX idx_export_jobs_closing_docs ON export_jobs(closing_docs);
CREATE INDEX idx_export_jobs_etd ON export_jobs(etd);
CREATE TABLE source_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_import_id INTEGER NOT NULL REFERENCES source_imports(id),
    business_key TEXT NOT NULL,                      -- normalized "INV|NO_BC"
    export_job_id INTEGER REFERENCES export_jobs(id),

    -- RAW SOURCE FIELDS (exact values from Excel)
    raw_customer_code TEXT,
    raw_type TEXT,
    raw_invoice_no TEXT,
    raw_pi TEXT,
    raw_buyer TEXT,
    raw_description_goods TEXT,
    raw_destination TEXT,
    raw_fwd_trucking TEXT,
    raw_liner TEXT,
    raw_no_bc TEXT,
    raw_container_qty TEXT,
    raw_warehouse TEXT,
    raw_req_trucking TEXT,
    raw_in_date TEXT,
    raw_in_time TEXT,
    raw_data_loading TEXT,
    raw_closing_bki TEXT,
    raw_closing_docs TEXT,
    raw_closing_docs_time TEXT,
    raw_closing_cy TEXT,
    raw_closing_cy_time TEXT,
    raw_initial_etd TEXT,
    raw_etd TEXT,
    raw_eta TEXT,
    raw_vessel TEXT,
    raw_fasilitas_kite TEXT,
    raw_respon TEXT,
    raw_stacking_terminal TEXT,
    raw_source_pic TEXT,
    raw_column_p TEXT,                               -- unknown column, preserved as-is

    -- NORMALIZED FIELDS
    norm_destination TEXT,
    norm_destination_country TEXT,
    norm_product_type TEXT,
    norm_respon TEXT,

    -- RECORD METADATA
    source_row_numbers TEXT,                         -- JSON array of Excel row numbers
    is_valid INTEGER DEFAULT 1,
    validation_errors TEXT,                          -- JSON array of error messages
    sync_action TEXT CHECK (sync_action IN ('NEW','UPDATED','UNCHANGED','INVALID')),
    created_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);
CREATE INDEX idx_source_records_import ON source_records(source_import_id);
CREATE INDEX idx_source_records_bkey ON source_records(business_key);
CREATE INDEX idx_source_records_job ON source_records(export_job_id);
CREATE INDEX idx_source_records_action ON source_records(sync_action);
CREATE TABLE source_record_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_record_id INTEGER NOT NULL REFERENCES source_records(id),
    source_import_id INTEGER NOT NULL REFERENCES source_imports(id),
    export_job_id INTEGER REFERENCES export_jobs(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_src_changes_record ON source_record_changes(source_record_id);
CREATE INDEX idx_src_changes_import ON source_record_changes(source_import_id);
CREATE INDEX idx_src_changes_job ON source_record_changes(export_job_id);
CREATE TABLE IF NOT EXISTS "ae_document_checklists" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    status TEXT DEFAULT 'Required' CHECK (status IN ('Required', 'Received', 'Under Review', 'Verified', 'Missing', 'Rejected', 'Need Revision')),
    notes TEXT,
    verified_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TEXT,
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
);
CREATE INDEX idx_ae_document_shipment ON ae_document_checklists(shipment_id);
CREATE INDEX idx_ae_document_status ON ae_document_checklists(status);
CREATE TABLE IF NOT EXISTS "ae_followup_records" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER REFERENCES export_jobs(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    followup_type TEXT NOT NULL,
    external_party TEXT,
    contact_person TEXT,
    contact_channel TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Contacted', 'Waiting Response', 'Follow-Up Required', 'Resolved', 'Cancelled')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    due_date TEXT,
    last_contact_at TEXT,
    next_follow_up_at TEXT,
    resolution TEXT,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1,
    related_entity_type TEXT,
    related_entity_id INTEGER
);
CREATE INDEX idx_ae_followup_shipment ON ae_followup_records(shipment_id);
CREATE INDEX idx_ae_followup_status ON ae_followup_records(status);
CREATE INDEX idx_followups_entity ON ae_followup_records(related_entity_type, related_entity_id);
CREATE TABLE IF NOT EXISTS "ae_discrepancies" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER REFERENCES export_jobs(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Waiting', 'Resolved', 'Cancelled')),
    resolution TEXT,
    resolved_at TEXT,
    reported_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1,
    related_entity_type TEXT,
    related_entity_id INTEGER
);
CREATE INDEX idx_ae_discrepancies_shipment ON ae_discrepancies(shipment_id);
CREATE INDEX idx_ae_discrepancies_status ON ae_discrepancies(status);
CREATE INDEX idx_discrepancies_entity ON ae_discrepancies(related_entity_type, related_entity_id);

CREATE TABLE IF NOT EXISTS ae_job_document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    logical_document_id INTEGER NOT NULL REFERENCES ae_job_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    reason TEXT,
    requested_by INTEGER REFERENCES users(id),
    fixed_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(logical_document_id, version_number)
);
CREATE INDEX idx_ae_doc_vers_doc ON ae_job_document_versions(logical_document_id);

CREATE TABLE IF NOT EXISTS ae_job_blockers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
    reason TEXT NOT NULL,
    remark TEXT,
    opened_by INTEGER REFERENCES users(id),
    resolved_by INTEGER REFERENCES users(id),
    opened_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
);
CREATE INDEX idx_ae_job_blockers_job ON ae_job_blockers(job_id);
