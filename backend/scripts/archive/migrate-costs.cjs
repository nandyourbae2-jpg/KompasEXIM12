const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'kompas-exim.db');
console.log(`Connecting to database at ${dbPath}`);
const db = new Database(dbPath);

console.log('Creating container_costs table...');

db.exec(`
CREATE TABLE IF NOT EXISTS container_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Relasi
  container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  shipment_id  INTEGER NOT NULL REFERENCES import_shipments(id),

  -- Kategori biaya
  cost_category TEXT NOT NULL,

  -- Field umum (semua kategori)
  vendor_name  TEXT,
  inv_no       TEXT,           -- Nomor Invoice dari vendor
  dpp          REAL DEFAULT 0, -- Dasar Pengenaan Pajak
  persen_ppn   REAL DEFAULT 0, -- %PPN (0 jika tidak kena PPN)
  ppn          REAL DEFAULT 0, -- Auto: dpp * persen_ppn / 100
  no_fp        TEXT,           -- Nomor Faktur Pajak
  gp_no        TEXT,           -- GP Reference Number

  -- Field khusus TRUC (Warehouse)
  biaya_dasar  REAL DEFAULT 0,
  inap_sasis   REAL DEFAULT 0,
  other_cost   REAL DEFAULT 0,
  ket_other    TEXT,

  -- Field khusus DEPO
  calc_day     INTEGER DEFAULT 0,
  calc_shift   INTEGER DEFAULT 0,
  act_day      INTEGER DEFAULT 0,
  act_shift    INTEGER DEFAULT 0,
  storage      REAL DEFAULT 0,
  monitoring   REAL DEFAULT 0,
  recooling    REAL DEFAULT 0,
  lolo_depo    REAL DEFAULT 0,

  -- Total (dihitung otomatis di backend)
  total        REAL DEFAULT 0, -- dpp + ppn

  -- Sync ke Financial Tracker
  job_order_id INTEGER REFERENCES job_orders(id),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_container_costs_shipment ON container_costs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_container_costs_container ON container_costs(container_id);
`);

console.log('Migrating existing data...');
const shipments = db.prepare('SELECT * FROM import_shipments').all();
const CONTAINER_COST_CATEGORIES = [
  'TRUC (Repo Depo)', 'TRUC (Warehouse)',
  'LOLO (Reimb. Lift Off)', 'LOLO (Port)', 'LOLO (Hico/Bahandel)', 'LOLO (Gudang Port)',
  'DEPO'
];

const mapOldKey = {
  'TRUC (Repo Depo)': 'trucRepo',
  'TRUC (Warehouse)': 'trucWh',
  'LOLO (Reimb. Lift Off)': 'loloReimb',
  'LOLO (Port)': 'loloPort',
  'LOLO (Hico/Bahandel)': 'loloHico',
  'LOLO (Gudang Port)': 'loloGudang',
  'DEPO': 'depo'
};

let migratedCount = 0;

for (const shipment of shipments) {
  let costs = {};
  try {
    costs = JSON.parse(shipment.costs || '{}');
  } catch(e) {}
  
  const containers = db.prepare('SELECT * FROM containers WHERE shipment_id = ?').all(shipment.id);
  if (containers.length === 0) continue;

  const firstContainer = containers[0];
  
  for (const category of CONTAINER_COST_CATEGORIES) {
    const oldKey = mapOldKey[category];
    if (!costs[oldKey]) continue;
    
    const old = costs[oldKey];
    
    let oldDpp = old.dpp || 0;
    let oldPpn = old.ppn || 0;
    let oldNoFp = old.noFp || old.no_fp || null;
    let oldPersenPpn = old.pctPpn || old.persen_ppn || 0;
    let oldTotal = old.total || 0;
    
    if (category === 'LOLO (Reimb. Lift Off)' && old.dppLiftoff) {
        oldDpp = old.dppLiftoff;
        oldPpn = old.ppnLiftoff;
        oldNoFp = old.noFpLiftoff;
    }
    
    if (category === 'DEPO') {
        oldDpp = Number(old.storage || 0) + Number(old.monitoring || 0) + Number(old.recooling || 0) + Number(old.lolo || 0);
    }
    
    if (category === 'TRUC (Warehouse)') {
        oldDpp = Number(old.biayaDasar || 0) + Number(old.inapSasis || 0) + Number(old.other || 0);
    }

    if (oldDpp > 0 || (old.storage > 0)) {
      if (!oldTotal) {
          oldTotal = Number(oldDpp) + (Number(oldDpp) * Number(oldPersenPpn) / 100);
      }
      
      db.prepare(`
        INSERT INTO container_costs
        (container_id, shipment_id, cost_category, vendor_name, inv_no,
         dpp, persen_ppn, ppn, no_fp, gp_no, 
         biaya_dasar, inap_sasis, other_cost, ket_other,
         calc_day, calc_shift, act_day, act_shift,
         storage, monitoring, recooling, lolo_depo,
         total, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        firstContainer.id, shipment.id, category,
        old.vendorName || old.vendor_name || null, 
        old.invNo || old.noInvRepo || old.noInvTruk || old.noReimbLiftoff || old.noInvDepo || null,
        Number(oldDpp), Number(oldPersenPpn),
        Number(oldPpn) || (Number(oldDpp) * Number(oldPersenPpn) / 100),
        oldNoFp, old.gpNo || null,
        
        old.biayaDasar || 0, old.inapSasis || 0, old.other || 0, old.otherNotes || null,
        old.calcDay || 0, old.calcShift || 0, old.actDay || 0, old.actShift || 0,
        old.storage || 0, old.monitoring || 0, old.recooling || 0, old.lolo || 0,
        
        oldTotal
      );
      migratedCount++;
    }
  }
}

console.log(`Migration completed successfully! Inserted ${migratedCount} container costs.`);
