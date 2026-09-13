const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../kompas-exim.db');
const BACKUP_PATH = path.join(__dirname, '../kompas-exim.db.bak_ws10');

async function run() {
  console.log("=== WS10 PHASE A: DATABASE SCHEMA MIGRATION ===");
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database file not found at", DB_PATH);
    process.exit(1);
  }
  
  // Create backup before mutation
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  console.log(`Backup created at: ${BACKUP_PATH}`);

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  
  // 1. Add version to vendors
  try {
    const tableInfo = db.prepare("PRAGMA table_info(vendors)").all();
    if (!tableInfo.find(c => c.name === 'version')) {
      db.prepare("ALTER TABLE vendors ADD COLUMN version INTEGER DEFAULT 1").run();
      console.log("Added version column to vendors.");
    } else {
      console.log("version column already exists in vendors.");
    }
  } catch (e) {
    console.error("Error adding version to vendors:", e.message);
    process.exit(1);
  }

  // 2. Create vendor_rate_cards
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS vendor_rate_cards (
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
      )
    `).run();
    db.prepare("CREATE INDEX IF NOT EXISTS idx_vendor_rate_cards_vendor_id ON vendor_rate_cards(vendor_id)").run();
    console.log("Created vendor_rate_cards table.");
  } catch (e) {
    console.error("Error creating vendor_rate_cards:", e.message);
    process.exit(1);
  }

  // 3. Create vendor_fleets
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS vendor_fleets (
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
      )
    `).run();
    db.prepare("CREATE INDEX IF NOT EXISTS idx_vendor_fleets_vendor_id ON vendor_fleets(vendor_id)").run();
    console.log("Created vendor_fleets table.");
  } catch (e) {
    console.error("Error creating vendor_fleets:", e.message);
    process.exit(1);
  }

  // Integrity checks
  const integrity = db.prepare("PRAGMA integrity_check").get();
  console.log("Integrity check after migration:", integrity.integrity_check);
  
  if (integrity.integrity_check !== 'ok') {
    console.error("Integrity check failed. Please restore backup.");
    process.exit(1);
  }

  console.log("=== WS10 SCHEMA MIGRATION SUCCESSFUL ===");
}

run().catch(console.error);
