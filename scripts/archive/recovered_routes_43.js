try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN import_shipment_id INTEGER").run();
  console.log("Migration: Added import_shipment_id to job_orders");
} catch (error) {
  // Column already exists, ignore
}

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN invoice_no TEXT").run();
  console.log("Migration: Added invoice_no to job_orders");
} catch (error) {
  // Column already exists, ignore
}

// Migrate payment_logs to remove CHECK constraint
try {
  // Check if we need to migrate (if the table has the check constraint)
  const createStmt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='payment_logs'").get();
  if (createStmt && createStmt.sql.includes('CHECK (metode IN')) {
    console.log("Migration: Rebuilding payment_logs to remove CHECK constraint on metode...");
    db.transaction(() => {
      db.prepare("PRAGMA foreign_keys = OFF").run();
      db.prepare("ALTER TABLE payment_logs RENAME TO payment_logs_old").run();
      db.prepare(`
        CREATE TABLE payment_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_order_id INTEGER NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
          jumlah_bayar REAL NOT NULL,
          tanggal_bayar TEXT NOT NULL,
          metode TEXT NOT NULL,
          file_bukti_path TEXT,
          dicatat_oleh_id INTEGER REFERENCES users(id),
          created_at TEXT DEFAULT (datetime('now'))
        )
      `).run();
      db.prepare(`
        INSERT INTO payment_logs (id, job_order_id, jumlah_bayar, tanggal_bayar, metode, file_bukti_path, dicatat_oleh_id, created_at)
        SELECT id, job_order_id, jumlah_bayar, tanggal_bayar, metode, file_bukti_path, dicatat_oleh_id, created_at FROM payment_logs_old
      `).run();
      db.prepare("DROP TABLE payment_logs_old").run();
      db.prepare("PRAGMA foreign_keys = ON").run();
    })();
    console.log("Migration: Successfully rebuilt payment_logs.");
  }
} catch (error) {
  console.error("Migration error on payment_logs:", error);
}

const app = express();