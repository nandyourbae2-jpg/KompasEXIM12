const db = require('../src/database/db');
const fs = require('fs');
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log(`Starting Vendor Migration... Mode: ${isDryRun ? 'DRY-RUN' : 'EXECUTE'}\n`);

// 1. GLOBAL VENDOR_ID CONSUMER AUDIT
console.log("--- 1. GLOBAL VENDOR_ID CONSUMER AUDIT ---");
const tablesWithVendorId = [];
const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
allTables.forEach(t => {
  const tableInfo = db.prepare(`PRAGMA table_info("${t.name}")`).all();
  if (tableInfo.some(col => col.name === 'vendor_id')) {
    tablesWithVendorId.push(t.name);
  }
});
console.log(`Tables containing 'vendor_id': ${tablesWithVendorId.join(', ')}`);

const mapping = {
  12: 6,
  8: 7,
  9: 7,
  10: 7,
  13: 7,
  14: 7
};

const deactivateIds = [11, 17, 18, 23, 24]; // Non-vendor / Data Quality

// Pre-migration duplicate references count
console.log("\n--- 2. PRE-MIGRATION DUPLICATE USAGE ---");
const preMigrationCounts = {};
for (const dupId of Object.keys(mapping)) {
  let count = 0;
  tablesWithVendorId.forEach(t => {
    const usage = db.prepare(`SELECT COUNT(*) as c FROM "${t}" WHERE vendor_id = ?`).get(dupId);
    if (usage && usage.c > 0) {
      count += usage.c;
      console.log(`  - Table '${t}' has ${usage.c} references to vendor_id ${dupId}`);
    }
  });
  preMigrationCounts[dupId] = count;
  console.log(`Total usage for Duplicate ID ${dupId}: ${count}`);
}

// Pre-migration non-vendor usage
console.log("\n--- 3. NON-VENDOR PRE-MIGRATION USAGE ---");
deactivateIds.forEach(id => {
  let count = 0;
  tablesWithVendorId.forEach(t => {
    const usage = db.prepare(`SELECT COUNT(*) as c FROM "${t}" WHERE vendor_id = ?`).get(id);
    if (usage && usage.c > 0) {
      count += usage.c;
    }
  });
  console.log(`Non-Vendor ID ${id} total transactions: ${count}`);
});


if (isDryRun) {
  console.log("\n[DRY-RUN] No modifications will be made.");
  let totalReassigned = 0;
  tablesWithVendorId.forEach(t => {
    for (const [oldId, newId] of Object.entries(mapping)) {
      const usage = db.prepare(`SELECT COUNT(*) as c FROM "${t}" WHERE vendor_id = ?`).get(oldId);
      if (usage && usage.c > 0) {
        console.log(`[DRY-RUN] Would reassign ${usage.c} rows in ${t} (vendor_id ${oldId} -> ${newId})`);
        totalReassigned += usage.c;
      }
    }
  });
  console.log(`[DRY-RUN] Total rows to reassign: ${totalReassigned}`);
  
  let totalDeactivated = Object.keys(mapping).length + deactivateIds.length;
  console.log(`[DRY-RUN] Total vendors to deactivate: ${totalDeactivated}`);
  console.log(`[DRY-RUN] Dry run finished successfully. Run without --dry-run to execute.`);
  process.exit(0);
}

// ACTUAL MIGRATION
console.log("\n--- 4. MIGRATION EXECUTION ---");
try {
  db.prepare('BEGIN').run();
  
  let totalReassigned = 0;
  
  // A. Duplicate Remapping
  for (const [oldId, newId] of Object.entries(mapping)) {
    tablesWithVendorId.forEach(t => {
      const result = db.prepare(`UPDATE "${t}" SET vendor_id = ? WHERE vendor_id = ?`).run(newId, oldId);
      if (result.changes > 0) {
        console.log(`Updated ${result.changes} rows in '${t}' (vendor_id ${oldId} -> ${newId})`);
        totalReassigned += result.changes;
      }
    });
    // Set duplicate to inactive
    db.prepare(`UPDATE vendors SET status = 'Tidak Aktif' WHERE id = ?`).run(oldId);
  }
  
  // B. Non-Vendor Deactivation
  deactivateIds.forEach(id => {
    db.prepare(`UPDATE vendors SET status = 'Tidak Aktif' WHERE id = ?`).run(id);
  });
  
  // C. Integrity Validation
  let orphanCount = 0;
  tablesWithVendorId.forEach(t => {
    const orphans = db.prepare(`SELECT COUNT(*) as c FROM "${t}" WHERE vendor_id IS NOT NULL AND vendor_id NOT IN (SELECT id FROM vendors)`).get();
    if (orphans && orphans.c > 0) {
      console.error(`INTEGRITY ERROR: Orphan references found in ${t}! Count: ${orphans.c}`);
      orphanCount += orphans.c;
    }
  });
  
  let duplicateRemaining = 0;
  for (const oldId of Object.keys(mapping)) {
    tablesWithVendorId.forEach(t => {
      const remaining = db.prepare(`SELECT COUNT(*) as c FROM "${t}" WHERE vendor_id = ?`).get(oldId);
      if (remaining && remaining.c > 0) {
        console.error(`INTEGRITY ERROR: Duplicate ID ${oldId} still has ${remaining.c} references in ${t}!`);
        duplicateRemaining += remaining.c;
      }
    });
  }
  
  if (orphanCount > 0 || duplicateRemaining > 0) {
    console.error("MIGRATION FAILED VALIDATION. ROLLBACK INITIATED.");
    db.prepare('ROLLBACK').run();
    process.exit(1);
  }
  
  db.prepare('COMMIT').run();
  
  const totalActive = db.prepare(`SELECT COUNT(*) as c FROM vendors WHERE status = 'Aktif'`).get().c;
  
  console.log("\n--- 5. POST-MIGRATION REPORT ---");
  console.log(`Rows Reassigned: ${totalReassigned}`);
  console.log(`Vendors Deactivated: ${Object.keys(mapping).length + deactivateIds.length}`);
  console.log(`Tables Affected: ${tablesWithVendorId.join(', ')}`);
  console.log(`Historical Rows Preserved: YES (Names unchanged)`);
  console.log(`Orphan References: 0`);
  console.log(`Active Vendor Master Remaining: ${totalActive}`);
  
  console.log("\nMIGRATION SUCCESSFUL.");
} catch (e) {
  console.error("FATAL ERROR DURING MIGRATION:", e);
  db.prepare('ROLLBACK').run();
  process.exit(1);
}
