const db = require('../src/database/db');

// Clear all existing job orders to start fresh
db.prepare('DELETE FROM job_orders').run();
db.prepare("UPDATE financial_request_ledger SET status = 'Terisi', job_order_id = NULL WHERE actual_amount > 0").run();

const ledgers = db.prepare("SELECT * FROM financial_request_ledger WHERE actual_amount > 0").all();

for (const ledger of ledgers) {
  // Get shipment UN and ID from import project
  const project = db.prepare('SELECT p.*, s.id as s_id, s.un FROM import_projects p LEFT JOIN import_shipments s ON s.import_project_id = p.id WHERE p.id = ?').get(ledger.import_project_id);
  const un = project ? project.un : null;
  const shipmentId = project ? project.s_id : null;

  // Auto-assign vendor_id based on vendor_nama_manual
  let finalVendorId = null;
  if (ledger.vendor_nama_manual) {
    const existingVendor = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(ledger.vendor_nama_manual);
    if (existingVendor) {
      finalVendorId = existingVendor.id;
    }
  }
  
  // Create Job Order
  const invoiceNo = ledger.invoice_no || `INV-${ledger.id}`;
  const joResult = db.prepare(`
    INSERT INTO job_orders (
      job_order_code, invoice_no, vendor_id, vendor_name, cost_type, mata_uang, dpp, persen_ppn, ppn,
      total_invoice, total_paid, import_shipment_id, sumber, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'IDR', ?, ?, ?, ?, 0, ?, 'financial_request', datetime('now'), datetime('now'))
  `).run(
    invoiceNo, invoiceNo, finalVendorId, ledger.vendor_nama_manual || null, ledger.cost_category, ledger.dpp || 0, ledger.persen_ppn || 0, ledger.ppn || 0,
    ledger.actual_amount, shipmentId || null
  );
  
  const joId = joResult.lastInsertRowid;

  // Update ledger status and link job order
  db.prepare("UPDATE financial_request_ledger SET status = 'Diteruskan', job_order_id = ?, updated_at = datetime('now') WHERE id = ?")
    .run(joId, ledger.id);
}
console.log("Sync complete!");
