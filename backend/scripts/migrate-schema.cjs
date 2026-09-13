const db = require('../src/database/db');

try {
  console.log("Starting schema migration...");
  
  db.exec('BEGIN TRANSACTION;');

  // Create new table
  db.exec(`
    CREATE TABLE container_costs_new (
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
    );
  `);

  // Copy data
  db.exec(`
    INSERT INTO container_costs_new (
      id, container_id, shipment_id, cost_category, vendor_name, inv_no, dpp, persen_ppn, ppn, no_fp, gp_no,
      biaya_dasar, inap_sasis, other_cost, ket_other, calc_day, calc_shift, act_day, act_shift,
      storage, monitoring, recooling, lolo_depo, total, job_order_id, created_at, updated_at
    )
    SELECT
      id, container_id, shipment_id, cost_category, vendor_name, inv_no, dpp, persen_ppn, ppn, no_fp, gp_no,
      biaya_dasar, inap_sasis, other_cost, ket_other, calc_day, calc_shift, act_day, act_shift,
      storage, monitoring, recooling, lolo_depo, total, job_order_id, created_at, updated_at
    FROM container_costs;
  `);

  // Drop old table and rename new table
  db.exec('DROP TABLE container_costs;');
  db.exec('ALTER TABLE container_costs_new RENAME TO container_costs;');

  db.exec('COMMIT;');
  console.log("Schema migration completed successfully!");
} catch (e) {
  db.exec('ROLLBACK;');
  console.error("Migration failed:", e);
}
