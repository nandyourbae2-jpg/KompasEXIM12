const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '../kompas-exim.db');
const db = new Database(dbPath);

const requests = [
  { req: 'REQ-0001-26', sumber: 'import_operational', imp: 1, type: 'Trucking', vendor: 'Adhirajasa', nom: 1110000, status: 'Approved' },
  { req: 'REQ-0002-26', sumber: 'import_operational', imp: 1, type: 'Port Charges', vendor: 'Pelabuhan', nom: 1478520, status: 'Approved' },
  { req: 'REQ-0003-26', sumber: 'import_operational', imp: 2, type: 'Freight/DO', vendor: 'Meratus', nom: 42000000, status: 'Submitted' },
  { req: 'REQ-0004-26', sumber: 'manual', imp: 3, type: 'Demurrage', vendor: 'Mandiri TRP', nom: 28000000, status: 'Submitted' },
  { req: 'REQ-0005-26', sumber: 'manual', imp: 4, type: 'Perizinan', vendor: 'KKP', nom: 670000, status: 'Draft' }
];

db.transaction(() => {
  requests.forEach(r => {
    let vId = null;
    if (r.vendor) {
      const v = db.prepare("SELECT id FROM vendors WHERE nama LIKE ?").get(`%${r.vendor}%`);
      if (v) vId = v.id;
      else {
        const ins = db.prepare("INSERT INTO vendors (nama, service_type) VALUES (?, ?)").run(r.vendor, 'Forwarder');
        vId = ins.lastInsertRowid;
      }
    }

    const imp = db.prepare("SELECT id FROM import_projects WHERE id = ?").get(r.imp);
    const impId = imp ? imp.id : 1; // Fallback to 1

    const picId = 1; // Fallback to user 1 (Manager/Staff)

    const insReq = db.prepare(`
      INSERT INTO financial_requests (
        request_number, sumber, import_project_id, jenis_pengajuan, vendor_id, estimasi_nominal, status, pic_id, created_by_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(r.req, r.sumber, impId, r.type, vId, r.nom, r.status, picId, picId);

    const newId = insReq.lastInsertRowid;

    if (r.status === 'Submitted') {
      db.prepare(`UPDATE financial_requests SET submitted_at = datetime('now'), submitted_by_id = ? WHERE id = ?`).run(picId, newId);
    } else if (r.status === 'Approved') {
      db.prepare(`UPDATE financial_requests SET submitted_at = datetime('now'), submitted_by_id = ?, approved_at = datetime('now'), approved_by_id = ? WHERE id = ?`).run(picId, picId, newId);
    }

    // Link job orders (fake linking for seed)
    // Find job order with related category if possible, or just by ID
    const jo = db.prepare("SELECT id FROM job_orders WHERE vendor_id = ? LIMIT 1").get(vId);
    if (jo) {
      db.prepare("UPDATE job_orders SET financial_request_id = ? WHERE id = ?").run(newId, jo.id);
    } else {
      // Just link to first available JO without request
      const freeJo = db.prepare("SELECT id FROM job_orders WHERE financial_request_id IS NULL LIMIT 1").get();
      if (freeJo) {
         db.prepare("UPDATE job_orders SET financial_request_id = ? WHERE id = ?").run(newId, freeJo.id);
      }
    }
  });
})();

console.log('Seed Financial Requests success!');
