const db = require('../src/database/db');

try {
  console.log("Starting general costs migration...");
  db.exec('BEGIN TRANSACTION;');

  const shipments = db.prepare('SELECT id, costs FROM import_shipments').all();

  const legacyKeys = {
    'loloPort': 'LOLO (Port)',
    'loloHico': 'LOLO (Hico/Bahandel)',
    'loloGudangPort': 'LOLO (Gudang Port)',
    'lineFreight': 'Line Freight',
    'lineLocal': 'Line Local',
    'lineExtend': 'Line Extend',
    'otheOtherCost': 'OTHE (Other Cost)'
  };

  const insertStmt = db.prepare(`
    INSERT INTO container_costs (
      shipment_id, cost_category, vendor_name, inv_no, dpp, persen_ppn, ppn, no_fp, gp_no, total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of shipments) {
    if (!s.costs) continue;
    let costsJson;
    try {
      costsJson = JSON.parse(s.costs);
    } catch (e) {
      continue;
    }

    let modified = false;

    for (const [jsonKey, dbCategory] of Object.entries(legacyKeys)) {
      const legacyData = costsJson[jsonKey];
      if (legacyData) {
        const dpp = parseFloat(legacyData.dpp) || 0;
        const pct = parseFloat(legacyData.pctPpn) || parseFloat(legacyData.ppnRate) || parseFloat(legacyData.persen_ppn) || 0;
        const ppn = parseFloat(legacyData.ppn) || (dpp * pct / 100);
        const total = dpp + ppn;
        const vendor = legacyData.vendorName || legacyData.vendor || '';
        const inv = legacyData.invoice || legacyData.noInv || legacyData.noInvPort || legacyData.noInvHico || legacyData.noInvGudangPort || '';
        const noFp = legacyData.noFp || '';
        const gpNo = legacyData.gpNo || '';

        // If it has actual data, insert it
        if (dpp > 0 || vendor || inv) {
          insertStmt.run(s.id, dbCategory, vendor, inv, dpp, pct, ppn, noFp, gpNo, total);
          console.log(`Migrated ${jsonKey} for shipment ${s.id}`);
        }

        // Delete from JSON so it's not duplicate
        delete costsJson[jsonKey];
        modified = true;
      }
    }

    if (modified) {
      db.prepare('UPDATE import_shipments SET costs = ? WHERE id = ?').run(JSON.stringify(costsJson), s.id);
    }
  }

  db.exec('COMMIT;');
  console.log("General costs migration completed successfully!");
} catch (e) {
  db.exec('ROLLBACK;');
  console.error("Migration failed:", e);
}
