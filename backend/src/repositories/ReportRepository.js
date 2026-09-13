const db = require('../database/db');

class ReportRepository {
  // --- REPORTS DOMAIN (OWNED) ---
  findReports(departemen, tipe) {
    let query = 'SELECT r.*, u.nama as pembuat_nama FROM reports r LEFT JOIN users u ON r.dibuat_oleh_id = u.id WHERE 1=1';
    const params = [];
    if (departemen) { query += ' AND r.departemen = ?'; params.push(departemen); }
    if (tipe) { query += ' AND r.tipe = ?'; params.push(tipe); }
    query += ' ORDER BY r.created_at DESC';
    return db.prepare(query).all(...params);
  }

  createReport(tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id) {
    return db.prepare('INSERT INTO reports (tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id || null);
  }

  updateTanggapan(id, tanggapan_manager, ditanggapi_oleh_id) {
    return db.prepare(`UPDATE reports SET tanggapan_manager = ?, ditanggapi_oleh_id = ?, tanggapan_pada = datetime('now') WHERE id = ?`)
      .run(tanggapan_manager, ditanggapi_oleh_id, id);
  }

  updateTinjau(id) {
    return db.prepare(`UPDATE reports SET ditinjau_manager = 1 WHERE id = ?`).run(id);
  }

  // --- DOWNSTREAM DEPENDENCIES (READ-ONLY) ---
  getShipmentsWithProjects() {
    return db.prepare('SELECT s.*, ip.task_unique_number FROM import_shipments s LEFT JOIN import_projects ip ON s.import_project_id = ip.id').all();
  }

  getContainersForShipments(shipmentIds) {
    if (!shipmentIds || shipmentIds.length === 0) return [];
    const placeholders = shipmentIds.map(() => '?').join(',');
    return db.prepare(`SELECT * FROM containers WHERE shipment_id IN (${placeholders})`).all(...shipmentIds);
  }

  getJobOrdersForShipments(importShipmentIds, sumber) {
    if (!importShipmentIds || importShipmentIds.length === 0) return [];
    const placeholders = importShipmentIds.map(() => '?').join(',');
    return db.prepare(`SELECT total_paid, total_invoice, import_shipment_id FROM job_orders WHERE import_shipment_id IN (${placeholders}) AND sumber = ?`).all(...importShipmentIds, sumber);
  }

  getTasksByDepartment(departemen) {
    return db.prepare('SELECT status, prioritas FROM tasks WHERE departemen = ?').all(departemen);
  }

  getJobOrdersFinancials() {
    return db.prepare('SELECT total_invoice, total_paid FROM job_orders').all(); 
  }

  getArchiveHistory() {
    return db.prepare('SELECT * FROM archive_snapshots ORDER BY archived_at DESC').all();
  }
}

module.exports = new ReportRepository();
