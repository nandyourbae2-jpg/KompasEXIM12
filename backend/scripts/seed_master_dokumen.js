// backend/scripts/seed_master_dokumen.js
// Run with: node backend/scripts/seed_master_dokumen.js
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../kompas-exim.db'));

// Helper to generate sequential DOC codes
function generateDocCode(index) {
  return `DOC-${String(index).padStart(3, '0')}`;
}

// 12 dokumen sesuai PRD
const seedDocs = [
  'Bill of Lading Original',
  'Packing List',
  'Commercial Invoice',
  'Certificate of Origin (COO)',
  'PIB',
  'Health Certificate',
  'Fumigation Certificate',
  'Phytosanitary Certificate',
  'MSDS',
  'Insurance Certificate',
  'DO (Delivery Order)',
  'Surat Jalan'
];

db.transaction(() => {
  // Clear existing data (safe for new feature)
  db.prepare('DELETE FROM import_project_documents').run();
  db.prepare('DELETE FROM master_data_dokumen').run();

  const insertStmt = db.prepare(
    `INSERT INTO master_data_dokumen (kode_dokumen, nama_dokumen) VALUES (?, ?)`
  );

  seedDocs.forEach((name, idx) => {
    const code = generateDocCode(idx + 1);
    insertStmt.run(code, name);
  });
})();

console.log(`✅ Seed master_data_dokumen completed — ${seedDocs.length} docs inserted`);
