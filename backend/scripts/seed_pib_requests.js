const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../kompas-exim.db');
const db = new Database(dbPath);

console.log('Menjalankan seeding data dummy untuk PIB Request...');

try {
  db.transaction(() => {
    // Cari user ID untuk pembuat dan approver (gunakan yang pertama ada)
    const user = db.prepare("SELECT id FROM users LIMIT 1").get();
    if (!user) throw new Error('Tidak ada user di database untuk digunakan sebagai creator.');
    const spv = db.prepare("SELECT id FROM users WHERE level_otoritas = 'Supervisor' LIMIT 1").get() || user;

    // Cari Import Projects (butuh 3)
    const projects = db.prepare("SELECT id, task_unique_number FROM import_projects LIMIT 3").all();
    if (projects.length < 1) throw new Error('Dibutuhkan setidaknya 1 Import Project untuk seeding.');

    // Cari shipment terkait project tersebut
    const shipments = [];
    for (const p of projects) {
      const s = db.prepare("SELECT id FROM import_shipments WHERE import_project_id = ? LIMIT 1").get(p.id);
      shipments.push(s ? s.id : null);
    }

    const now = new Date().toISOString();
    
    // Seed 1: Realized
    const req1 = db.prepare(`
      INSERT INTO pib_requests (
        request_number, import_project_id, shipment_id, aju_pib, tanggal_pengajuan,
        estimasi_bm, estimasi_ppn, estimasi_pph, estimasi_total, kasbon_diminta,
        aktual_bm, aktual_ppn, aktual_pph, aktual_total, lebih_kurang,
        status, submitted_at, submitted_by_id, approved_at, approved_by_id,
        othe_pib_synced, created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PIB-REQ-0001-26', projects[0].id, shipments[0], '20260705000088', '2026-07-05',
      71000000, 0, 800000, 71800000, 79800000,
      71152070, 0, 0, 71152070, (79800000 - 71152070),
      'Realized', now, user.id, now, spv.id,
      1, user.id, now, now
    );
    
    // Create Realisasi PIB untuk Req 1
    const rel1 = db.prepare(`
      INSERT INTO realisasi_pib (no_kas, tgl_payment, unique_number, shipment, aju_pib, amount_kasbon, bm, ppn, pph, total_pib_realisasi, lebih_kurang, pib_request_id, import_project_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Verified')
    `).run('001-26PIB-IMP', '2026-07-06', '20260705000088', null, '20260705000088', 79800000, 71152070, 0, 0, 71152070, (79800000 - 71152070), req1.lastInsertRowid, projects[0].id);
    
    db.prepare('UPDATE pib_requests SET realisasi_pib_id = ? WHERE id = ?').run(rel1.lastInsertRowid, req1.lastInsertRowid);
    
    // Seed 2: Realized
    const req2Id = projects.length > 1 ? projects[1].id : projects[0].id;
    const s2Id = projects.length > 1 ? shipments[1] : shipments[0];
    const req2 = db.prepare(`
      INSERT INTO pib_requests (
        request_number, import_project_id, shipment_id, aju_pib, tanggal_pengajuan,
        estimasi_bm, estimasi_ppn, estimasi_pph, estimasi_total, kasbon_diminta,
        aktual_bm, aktual_ppn, aktual_pph, aktual_total, lebih_kurang,
        status, submitted_at, submitted_by_id, approved_at, approved_by_id,
        othe_pib_synced, created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PIB-REQ-0002-26', req2Id, s2Id, '20260708000142', '2026-07-08',
      62000000, 0, 500000, 62500000, 68000000,
      62900775, 0, 0, 62900775, (68000000 - 62900775),
      'Realized', now, user.id, now, spv.id,
      1, user.id, now, now
    );

    const rel2 = db.prepare(`
      INSERT INTO realisasi_pib (no_kas, tgl_payment, unique_number, shipment, aju_pib, amount_kasbon, bm, ppn, pph, total_pib_realisasi, lebih_kurang, pib_request_id, import_project_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Verified')
    `).run('002-26PIB-IMP', '2026-07-09', '20260708000142', null, '20260708000142', 68000000, 62900775, 0, 0, 62900775, (68000000 - 62900775), req2.lastInsertRowid, req2Id);
    
    db.prepare('UPDATE pib_requests SET realisasi_pib_id = ? WHERE id = ?').run(rel2.lastInsertRowid, req2.lastInsertRowid);

    // Seed 3: Submitted
    const req3Id = projects.length > 2 ? projects[2].id : projects[0].id;
    const s3Id = projects.length > 2 ? shipments[2] : shipments[0];
    const req3 = db.prepare(`
      INSERT INTO pib_requests (
        request_number, import_project_id, shipment_id, aju_pib, tanggal_pengajuan,
        estimasi_bm, estimasi_ppn, estimasi_pph, estimasi_total, kasbon_diminta,
        status, submitted_at, submitted_by_id,
        created_by_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'PIB-REQ-0003-26', req3Id, s3Id, '20260721000219', '2026-07-21',
      41000000, 0, 700000, 41700000, 41700000,
      'Submitted', now, user.id,
      user.id, now, now
    );
    
    db.prepare("INSERT INTO pib_request_history (pib_request_id, status_dari, status_ke, catatan, dilakukan_oleh_id) VALUES (?, ?, ?, ?, ?)").run(req3.lastInsertRowid, 'Draft', 'Submitted', 'Mohon approval Bapak', user.id);

    console.log('✅ 3 data dummy PIB Request berhasil dimasukkan.');
  })();
} catch (error) {
  console.error('❌ Terjadi kesalahan saat seeding:', error.message);
}
