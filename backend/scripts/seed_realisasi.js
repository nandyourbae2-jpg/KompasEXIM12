const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../kompas-exim.db');
const db = new Database(dbPath);

console.log('Menjalankan migrasi dan seeding untuk fitur Realisasi Dana Import (MTB + PIB)...');

try {
  db.transaction(() => {
    // 1. Drop existing tables if they exist to start fresh
    db.prepare('DROP TABLE IF EXISTS realisasi_mtb_transaksi').run();
    db.prepare('DROP TABLE IF EXISTS realisasi_mtb_periode').run();
    db.prepare('DROP TABLE IF EXISTS realisasi_pib').run();

    // 2. Create realisasi_mtb_periode
    db.prepare(`
      CREATE TABLE realisasi_mtb_periode (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_periode TEXT NOT NULL,
        tanggal_mulai TEXT NOT NULL,
        tanggal_selesai TEXT NOT NULL,
        saldo_awal REAL DEFAULT 0,
        saldo_akhir REAL,
        total_kredit REAL DEFAULT 0,
        total_debet REAL DEFAULT 0,
        
        status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Submitted','Checked1','Checked2','Checked3','Approved')),
        
        prepared_by_id INTEGER REFERENCES users(id),
        prepared_at TEXT,
        checked1_by_id INTEGER REFERENCES users(id),
        checked1_at TEXT,
        checked2_by_id INTEGER REFERENCES users(id),
        checked2_at TEXT,
        checked3_by_id INTEGER REFERENCES users(id),
        checked3_at TEXT,
        approved_by_id INTEGER REFERENCES users(id),
        approved_at TEXT,
        tgl_dana_balik TEXT,
        
        departemen TEXT DEFAULT 'Import',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `).run();

    // 3. Create realisasi_mtb_transaksi
    db.prepare(`
      CREATE TABLE realisasi_mtb_transaksi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        periode_id INTEGER NOT NULL REFERENCES realisasi_mtb_periode(id) ON DELETE CASCADE,
        no_urut INTEGER,
        
        tgl_payment TEXT NOT NULL,
        unique_number TEXT,
        category TEXT NOT NULL,
        shipment TEXT,
        party TEXT,
        invoice_shipment TEXT,
        bl_number TEXT,
        no_kwitansi TEXT,
        
        amount_exclude_tax REAL DEFAULT 0,
        vat REAL DEFAULT 0,
        pot_pph23_diskon REAL DEFAULT 0,
        materai_adm REAL DEFAULT 0,
        adm_bank REAL DEFAULT 0,
        kredit REAL,
        debet REAL DEFAULT 0,
        
        expense_gp TEXT,
        saldo_running REAL,
        
        import_project_id INTEGER REFERENCES import_projects(id),
        
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `).run();

    // 4. Create realisasi_pib
    db.prepare(`
      CREATE TABLE realisasi_pib (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no_kas TEXT,
        tgl_payment TEXT NOT NULL,
        
        unique_number TEXT,
        shipment TEXT,
        party TEXT,
        invoice TEXT,
        bl TEXT,
        aju_pib TEXT,
        
        amount_kasbon REAL NOT NULL DEFAULT 0,
        bm REAL DEFAULT 0,
        ppn REAL DEFAULT 0,
        pph REAL DEFAULT 0,
        total_pib_realisasi REAL,
        
        lebih_kurang REAL,
        
        expense_gp TEXT,
        periode TEXT,
        
        import_project_id INTEGER REFERENCES import_projects(id),
        
        status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Verified','Closed')),
        verified_by_id INTEGER REFERENCES users(id),
        verified_at TEXT,
        
        departemen TEXT DEFAULT 'Import',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `).run();

    // 5. SEED DATA MTB Periode 1
    const p1 = db.prepare(`
      INSERT INTO realisasi_mtb_periode (
        nama_periode, tanggal_mulai, tanggal_selesai, saldo_awal, saldo_akhir, 
        total_kredit, total_debet, status, departemen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("06-07 JUL 2026", "2026-07-06", "2026-07-07", -886293745, -895156685, 8862940, 0, "Approved", "Import");

    // 6. SEED DATA MTB Transaksi 1
    const mtbTx = db.prepare(`
      INSERT INTO realisasi_mtb_transaksi (
        periode_id, no_urut, tgl_payment, unique_number, category, shipment,
        amount_exclude_tax, vat, pot_pph23_diskon, materai_adm, adm_bank, kredit, debet, saldo_running
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    mtbTx.run(p1.lastInsertRowid, 1, "2026-07-06", "IMP-001-2026", "INS BOSOWA", "IMP083", 1000000, 0, 0, 10000, 0, 1010000, 0, -887303745);
    mtbTx.run(p1.lastInsertRowid, 2, "2026-07-06", "IMP-002-2026", "CB SINAR", "IMP062", 2000000, 220000, 40000, 0, 5000, 2185000, 0, -889488745);
    mtbTx.run(p1.lastInsertRowid, 3, "2026-07-07", "IMP-003-2026", "CB SINAR", "IMP063", 3000000, 330000, 60000, 0, 5000, 3275000, 0, -892763745);
    mtbTx.run(p1.lastInsertRowid, 4, "2026-07-07", "IMP-004-2026", "CB SINAR", "IMP064", 2185000, 240350, 43700, 11290, 0, 2392940, 0, -895156685);

    // 7. SEED DATA MTB Periode 2
    const p2 = db.prepare(`
      INSERT INTO realisasi_mtb_periode (
        nama_periode, tanggal_mulai, tanggal_selesai, saldo_awal, saldo_akhir, 
        total_kredit, total_debet, status, departemen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("08-17 JUL 2026", "2026-07-08", "2026-07-17", -895156685, -923956685, 28800000, 0, "Submitted", "Import");

    mtbTx.run(p2.lastInsertRowid, 1, "2026-07-08", "IMP-001-2026", "PNBP KKP", "IMP083", 5000000, 0, 0, 0, 0, 5000000, 0, -900156685);
    mtbTx.run(p2.lastInsertRowid, 2, "2026-07-09", "IMP-002-2026", "PNBP KKP", "IMP083", 3800000, 0, 0, 0, 0, 3800000, 0, -903956685);
    mtbTx.run(p2.lastInsertRowid, 3, "2026-07-10", "IMP-003-2026", "DO EVG", "IMP085", 20000000, 0, 0, 0, 0, 20000000, 0, -923956685);

    // 8. SEED DATA PIB
    const pibTx = db.prepare(`
      INSERT INTO realisasi_pib (
        no_kas, tgl_payment, unique_number, shipment, amount_kasbon, 
        bm, ppn, pph, total_pib_realisasi, lebih_kurang, status, departemen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    pibTx.run("001-26PIB-IMP", "2026-07-06", "IMP085-26", "IMP085", 79800000, 20000000, 30000000, 21152070, 71152070, 8647930, "Closed", "Import");
    pibTx.run("002-26PIB-IMP", "2026-07-08", "IMP084-26", "IMP084", 68000000, 15000000, 25000000, 22900775, 62900775, 5099225, "Verified", "Import");
    pibTx.run("003-26PIB-IMP", "2026-07-12", "IMP087-26", "IMP087", 41700000, 12000000, 15000000, 15628458, 42628458, -928458, "Draft", "Import");

    console.log('Migrasi dan Seeding tabel realisasi_mtb_periode, realisasi_mtb_transaksi, realisasi_pib berhasil!');
  })();
} catch (err) {
  console.error('Error saat seeding:', err);
}
