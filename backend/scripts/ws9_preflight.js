const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../kompas-exim.db');
const BACKUP_PATH = path.join(__dirname, '../kompas-exim.db.bak');

async function run() {
  console.log("=== PHASE A: DATABASE BACKUP ===");
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database file not found at", DB_PATH);
    process.exit(1);
  }
  
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  const stats = fs.statSync(BACKUP_PATH);
  console.log(`Backup created at: ${BACKUP_PATH}`);
  console.log(`Size: ${stats.size} bytes`);
  console.log(`Timestamp: ${stats.mtime}`);
  
  const db = new Database(DB_PATH);
  
  const integrity = db.prepare("PRAGMA integrity_check").get();
  console.log("Integrity check:", integrity.integrity_check);
  
  if (integrity.integrity_check !== 'ok') {
    console.error("Integrity check failed. Stopping.");
    process.exit(1);
  }

  console.log("\n=== PHASE B: PRE-MIGRATION DATABASE PREFLIGHT ===");
  const joTotal = db.prepare("SELECT count(*) as c FROM job_orders").get().c;
  const joWithImportShipment = db.prepare("SELECT count(*) as c FROM job_orders WHERE import_shipment_id IS NOT NULL").get().c;
  const joWithoutImportShipment = db.prepare("SELECT count(*) as c FROM job_orders WHERE import_shipment_id IS NULL").get().c;
  const joWithShipmentUn = db.prepare("SELECT count(*) as c FROM job_orders WHERE shipment_un IS NOT NULL").get().c;
  
  console.log("job_orders:");
  console.log(`- total rows: ${joTotal}`);
  console.log(`- rows with import_shipment_id: ${joWithImportShipment}`);
  console.log(`- rows without import_shipment_id: ${joWithoutImportShipment}`);
  console.log(`- rows with shipment_un: ${joWithShipmentUn}`);

  const dnTotal = db.prepare("SELECT count(*) as c FROM debit_notes").get().c;
  const dnWithShipmentId = db.prepare("SELECT count(*) as c FROM debit_notes WHERE shipment_id IS NOT NULL").get().c;
  const dnWithShipmentUn = db.prepare("SELECT count(*) as c FROM debit_notes WHERE shipment_un IS NOT NULL").get().c;

  console.log("\ndebit_notes:");
  console.log(`- total rows: ${dnTotal}`);
  console.log(`- rows with shipment_id: ${dnWithShipmentId}`);
  console.log(`- rows with shipment_un: ${dnWithShipmentUn}`);
  
  const fkStatus = db.prepare("PRAGMA foreign_keys").get();
  console.log("\nforeign_keys:", Object.values(fkStatus)[0]);
  
  const joInfo = db.prepare("PRAGMA table_info(job_orders)").all();
  const dnInfo = db.prepare("PRAGMA table_info(debit_notes)").all();
  
  console.log("\njob_orders shipment_un exists:", !!joInfo.find(c => c.name === 'shipment_un'));
  console.log("job_orders import_shipment_id exists:", !!joInfo.find(c => c.name === 'import_shipment_id'));
  console.log("debit_notes shipment_un exists:", !!dnInfo.find(c => c.name === 'shipment_un'));
  console.log("debit_notes shipment_id exists:", !!dnInfo.find(c => c.name === 'shipment_id'));

  console.log("\n=== PHASE C: SAFE BACKFILL (PRE-VALIDATION) ===");
  // We need to resolve job_orders.shipment_un -> import_shipments.un
  const legacyJos = db.prepare("SELECT id, shipment_un FROM job_orders WHERE import_shipment_id IS NULL AND shipment_un IS NOT NULL").all();
  
  let uniqueMatch = 0;
  let noMatch = 0;
  let multipleMatch = 0;
  
  for (const jo of legacyJos) {
    const matches = db.prepare("SELECT id FROM import_shipments WHERE un = ?").all(jo.shipment_un);
    if (matches.length === 1) uniqueMatch++;
    else if (matches.length === 0) noMatch++;
    else if (matches.length > 1) multipleMatch++;
  }
  
  console.log(`UNIQUE_MATCH = ${uniqueMatch}`);
  console.log(`NO_MATCH = ${noMatch}`);
  console.log(`MULTIPLE_MATCH = ${multipleMatch}`);
  
  if (noMatch > 0 || multipleMatch > 0 || uniqueMatch !== legacyJos.length) {
    console.error("Validation failed for backfill. Ambiguous or missing relationships. Stopping.");
    process.exit(1);
  }
  console.log("\nValidation PASSED. Ready for backfill.");
}

run().catch(console.error);
