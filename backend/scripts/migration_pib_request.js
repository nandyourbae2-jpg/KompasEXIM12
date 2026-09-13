const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../kompas-exim.db');
const db = new Database(dbPath);

console.log('Menjalankan migrasi database untuk fitur PIB Request...');

try {
  db.transaction(() => {
    // 1. Buat tabel pib_requests
    db.prepare(`
      CREATE TABLE IF NOT EXISTS pib_requests (
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
      )
    `).run();

    // 2. Buat tabel pib_request_history
    db.prepare(`
      CREATE TABLE IF NOT EXISTS pib_request_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pib_request_id INTEGER NOT NULL REFERENCES pib_requests(id) ON DELETE CASCADE,
        status_dari TEXT,
        status_ke TEXT NOT NULL,
        catatan TEXT,
        dilakukan_oleh_id INTEGER REFERENCES users(id),
        dilakukan_pada TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `).run();

    // 3. Tambahkan kolom pib_request_id ke import_shipments
    try {
      db.prepare('ALTER TABLE import_shipments ADD COLUMN pib_request_id INTEGER REFERENCES pib_requests(id)').run();
      console.log('Kolom pib_request_id berhasil ditambahkan ke import_shipments.');
    } catch (e) {
      if (!e.message.includes('duplicate column name')) throw e;
    }

    // 4. Update CHECK constraint tabel realisasi_pib
    // Karena SQLite tidak mendukung alter constraint, kita buat tabel temporary, copy data, dan rename
    
    // a. Buat tabel realisasi_pib_new
    db.prepare(`
      CREATE TABLE IF NOT EXISTS realisasi_pib_new (
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
      )
    `).run();
    
    // b. Copy data dari realisasi_pib yang lama (jika ada) ke realisasi_pib_new
    // Cek apakah tabel lama ada (pasti ada, tapi jaga-jaga)
    const oldTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='realisasi_pib'").get();
    
    if (oldTableExists) {
      // Ambil struktur kolom tabel lama untuk mencegah error mapping
      const columnsInfo = db.prepare("PRAGMA table_info(realisasi_pib)").all();
      const columnNames = columnsInfo.map(c => c.name);
      
      const colsToCopy = columnNames.filter(col => 
        ['id', 'no_kas', 'tgl_payment', 'unique_number', 'shipment', 'party', 'invoice', 'bl', 'aju_pib', 'amount_kasbon', 'bm', 'ppn', 'pph', 'total_pib_realisasi', 'lebih_kurang', 'expense_gp', 'periode', 'import_project_id', 'status', 'verified_by_id', 'verified_at', 'departemen', 'created_at', 'updated_at'].includes(col)
      );
      
      if (colsToCopy.length > 0) {
        const colString = colsToCopy.join(', ');
        db.prepare(`INSERT INTO realisasi_pib_new (${colString}) SELECT ${colString} FROM realisasi_pib`).run();
        console.log('Data dari tabel lama realisasi_pib berhasil di-copy ke tabel baru.');
      }
      
      // c. Hapus tabel lama
      db.prepare('DROP TABLE realisasi_pib').run();
    }
    
    // d. Rename tabel baru menjadi nama aslinya
    db.prepare('ALTER TABLE realisasi_pib_new RENAME TO realisasi_pib').run();
    console.log('Tabel realisasi_pib berhasil direstrukturisasi.');

    console.log('✅ Migrasi database untuk PIB Request selesai tanpa error.');
  })();
} catch (error) {
  console.error('❌ Terjadi kesalahan saat migrasi:', error.message);
}
