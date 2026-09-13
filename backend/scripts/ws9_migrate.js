const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../kompas-exim.db');

async function run() {
  const db = new Database(DB_PATH);
  
  // Enforce foreign keys
  db.pragma('foreign_keys = ON');

  console.log("=== PHASE C: SAFE BACKFILL ===");
  // Backfill ONLY job_orders where import_shipment_id IS NULL AND shipment_un IS NOT NULL
  const updateStmt = db.prepare(`
    UPDATE job_orders
    SET import_shipment_id = (
        SELECT id
        FROM import_shipments
        WHERE import_shipments.un = job_orders.shipment_un
    )
    WHERE import_shipment_id IS NULL
      AND shipment_un IS NOT NULL;
  `);
  
  const result = updateStmt.run();
  console.log(`Backfilled ${result.changes} job_orders.`);
  
  console.log("\n=== PHASE D: BACKFILL VERIFICATION ===");
  const joWithoutImportShipment = db.prepare("SELECT count(*) as c FROM job_orders WHERE import_shipment_id IS NULL AND shipment_un IS NOT NULL").get().c;
  console.log(`job_orders with import_shipment_id IS NULL AND shipment_un IS NOT NULL: ${joWithoutImportShipment} (Expected: 0)`);
  
  const orphans = db.prepare(`
    SELECT count(*) as c FROM job_orders 
    WHERE import_shipment_id IS NOT NULL 
    AND import_shipment_id NOT IN (SELECT id FROM import_shipments)
  `).get().c;
  console.log(`Orphan count: ${orphans} (Expected: 0)`);
  
  const joTotal = db.prepare("SELECT count(*) as c FROM job_orders").get().c;
  const joWithImportShipment = db.prepare("SELECT count(*) as c FROM job_orders WHERE import_shipment_id IS NOT NULL").get().c;
  const joWithoutImportShipmentTotal = db.prepare("SELECT count(*) as c FROM job_orders WHERE import_shipment_id IS NULL").get().c;
  
  console.log(`Expected job_orders: 13 total (${joTotal}), 13 with import_shipment_id (${joWithImportShipment}), 0 without import_shipment_id (${joWithoutImportShipmentTotal})`);
  
  if (joWithoutImportShipment !== 0 || orphans !== 0 || joTotal !== 13 || joWithImportShipment !== 13 || joWithoutImportShipmentTotal !== 0) {
    console.error("Backfill verification failed!");
    process.exit(1);
  }

  console.log("\n=== PHASE E: DEBIT NOTE SAFETY CHECK ===");
  const dnTotal = db.prepare("SELECT count(*) as c FROM debit_notes").get().c;
  const dnWithoutShipmentId = db.prepare("SELECT count(*) as c FROM debit_notes WHERE shipment_id IS NULL AND shipment_un IS NULL").get().c;
  console.log(`Debit notes total: ${dnTotal} (Expected: 2)`);
  console.log(`Debit notes unchanged: ${dnWithoutShipmentId} (Expected: 2)`);
  
  if (dnTotal !== 2 || dnWithoutShipmentId !== 2) {
    console.error("Debit note safety check failed!");
    process.exit(1);
  }

  console.log("\n=== PHASE F: FOREIGN KEY ENFORCEMENT ===");
  // Validated before rebuild to ensure the relationship is solid
  const fkCheck = db.prepare("PRAGMA foreign_key_check").all();
  if (fkCheck.length > 0) {
    console.error("FK violation detected before rebuild:", fkCheck);
    process.exit(1);
  }
  console.log("Foreign keys intact.");

  console.log("\n=== PHASE G: INDEXES ===");
  db.prepare("CREATE INDEX IF NOT EXISTS idx_job_orders_import_shipment_id ON job_orders(import_shipment_id)").run();
  console.log("Created idx_job_orders_import_shipment_id");
  db.prepare("CREATE INDEX IF NOT EXISTS idx_debit_notes_shipment_id ON debit_notes(shipment_id)").run();
  console.log("Created idx_debit_notes_shipment_id");

  console.log("\n=== PHASE H: SCHEMA REBUILD ===");
  
  db.transaction(() => {
    console.log("Rebuilding job_orders...");
    // Read old schema
    const joTableInfo = db.prepare("PRAGMA table_info(job_orders)").all();
    const columns = joTableInfo.filter(c => c.name !== 'shipment_un').map(c => c.name).join(', ');
    
    // Create new table
    db.prepare(`
      CREATE TABLE job_orders_new (
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
      )
    `).run();
    
    // Copy data
    db.prepare(`INSERT INTO job_orders_new (${columns}) SELECT ${columns} FROM job_orders`).run();
    
    // Drop old and rename
    db.prepare("DROP TABLE job_orders").run();
    db.prepare("ALTER TABLE job_orders_new RENAME TO job_orders").run();

    console.log("Rebuilding debit_notes...");
    const dnTableInfo = db.prepare("PRAGMA table_info(debit_notes)").all();
    const dnColumns = dnTableInfo.filter(c => c.name !== 'shipment_un').map(c => c.name).join(', ');

    db.prepare(`
      CREATE TABLE debit_notes_new (
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
      )
    `).run();

    db.prepare(`INSERT INTO debit_notes_new (${dnColumns}) SELECT ${dnColumns} FROM debit_notes`).run();
    db.prepare("DROP TABLE debit_notes").run();
    db.prepare("ALTER TABLE debit_notes_new RENAME TO debit_notes").run();
    
    // Recreate indexes that might have been lost
    db.prepare("CREATE INDEX IF NOT EXISTS idx_job_orders_import_shipment_id ON job_orders(import_shipment_id)").run();
    db.prepare("CREATE INDEX IF NOT EXISTS idx_debit_notes_shipment_id ON debit_notes(shipment_id)").run();
    
  })();
  console.log("Schema rebuild successful.");

  console.log("\n=== PHASE I: DATA INTEGRITY VERIFICATION ===");
  const integrity = db.prepare("PRAGMA integrity_check").get();
  console.log("Integrity check:", integrity.integrity_check);
  
  const fkCheckAfter = db.prepare("PRAGMA foreign_key_check").all();
  console.log("Foreign key violations:", fkCheckAfter.length);
  
  const finalJoTotal = db.prepare("SELECT count(*) as c FROM job_orders").get().c;
  const finalJoValid = db.prepare("SELECT count(*) as c FROM job_orders WHERE import_shipment_id IS NOT NULL").get().c;
  console.log(`job_orders: ${finalJoTotal} total, ${finalJoValid} valid import_shipment_id`);
  
  const finalDnTotal = db.prepare("SELECT count(*) as c FROM debit_notes").get().c;
  const finalDnNull = db.prepare("SELECT count(*) as c FROM debit_notes WHERE shipment_id IS NULL").get().c;
  console.log(`debit_notes: ${finalDnTotal} total, ${finalDnNull} shipment_id remains NULL`);
  
  const joInfoAfter = db.prepare("PRAGMA table_info(job_orders)").all();
  const dnInfoAfter = db.prepare("PRAGMA table_info(debit_notes)").all();
  console.log("job_orders shipment_un exists:", !!joInfoAfter.find(c => c.name === 'shipment_un'));
  console.log("debit_notes shipment_un exists:", !!dnInfoAfter.find(c => c.name === 'shipment_un'));

}

run().catch(console.error);
