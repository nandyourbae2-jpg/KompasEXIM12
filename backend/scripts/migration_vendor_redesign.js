/**
 * Migration: Vendor Management Redesign
 * 1. Extend service_type CHECK to include 'Both'
 * 2. Create vendor_evaluations table
 */
const db = require('../src/database/db');

function migrate() {
  console.log('[Migration] Vendor Management Redesign — starting...');

  // 1. Check if vendor_evaluations table already exists
  const evalTableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='vendor_evaluations'"
  ).get();

  if (!evalTableExists) {
    console.log('[Migration] Creating vendor_evaluations table...');
    db.exec(`
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
    `);
    db.exec('CREATE INDEX idx_vendor_evaluations_vendor_id ON vendor_evaluations(vendor_id);');
    console.log('[Migration] vendor_evaluations table created.');
  } else {
    console.log('[Migration] vendor_evaluations table already exists — skipping.');
  }

  // 2. Extend service_type to support 'Both'
  // SQLite cannot ALTER CHECK constraints, so we handle this at application level.
  // We need to recreate the table if the CHECK is too restrictive.
  // First, test if 'Both' is already allowed:
  try {
    db.exec("UPDATE vendors SET service_type = 'Both' WHERE 0"); // no-op test
    console.log('[Migration] service_type already supports Both.');
  } catch (err) {
    if (err.message.includes('CHECK constraint')) {
      console.log('[Migration] Extending service_type CHECK to include Both...');
      
      db.exec('PRAGMA foreign_keys = OFF;');
      
      db.transaction(() => {
        // Create temp table with new CHECK
        db.exec(`
          CREATE TABLE vendors_new (
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
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            version INTEGER DEFAULT 1
          );
        `);

        // Copy data
        db.exec(`
          INSERT INTO vendors_new (id, nama, service_type, region, status, rating, review_count,
            kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan, created_at, updated_at, version)
          SELECT id, nama, service_type, region, status, rating, review_count,
            kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan, created_at, updated_at, version
          FROM vendors;
        `);

        // Drop old, rename new
        db.exec('DROP TABLE vendors;');
        db.exec('ALTER TABLE vendors_new RENAME TO vendors;');
      })();

      db.exec('PRAGMA foreign_keys = ON;');
      console.log('[Migration] service_type CHECK updated.');
    } else {
      console.error('[Migration] Unexpected error testing service_type:', err.message);
    }
  }

  // 3. Summary
  const vendorCount = db.prepare('SELECT COUNT(*) as count FROM vendors').get().count;
  const evalCount = db.prepare('SELECT COUNT(*) as count FROM vendor_evaluations').get().count;
  console.log(`[Migration] Done. Vendors: ${vendorCount}, Evaluations: ${evalCount}`);
}

migrate();
