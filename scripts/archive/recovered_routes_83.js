// Migrate for DPP and Tax
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN dpp REAL DEFAULT 0").run();
  console.log("Migration: Added dpp to job_orders");
} catch (e) {}

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN persen_ppn REAL DEFAULT 0").run();
  console.log("Migration: Added persen_ppn to job_orders");
} catch (e) {}

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN ppn REAL DEFAULT 0").run();
  console.log("Migration: Added ppn to job_orders");
} catch (e) {}

try {
  // Backfill existing data
  db.prepare(`
    UPDATE job_orders 
    SET 
      dpp = ROUND(total_invoice / 1.11, 2), 
      persen_ppn = 11,
      ppn = total_invoice - ROUND(total_invoice / 1.11, 2)
    WHERE (dpp IS NULL OR dpp = 0) AND total_invoice > 0
  `).run();
  console.log("Migration: Backfilled dpp and ppn in job_orders");
} catch (error) {
  console.error("Migration backfill failed:", error);
}

