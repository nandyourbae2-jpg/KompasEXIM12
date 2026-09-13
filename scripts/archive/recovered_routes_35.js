const db = require('./src/database/db');

// Auto-migrate to add import_category_key if not exists
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN import_category_key TEXT").run();
  console.log("Migration: Added import_category_key to job_orders");
} catch (error) {
  // Column already exists, ignore
}