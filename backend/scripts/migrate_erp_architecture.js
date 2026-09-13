const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../kompas-exim.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Starting Phase 1 & 2 Database Migration...');

// Helpers
function columnExists(table, column) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  return info.some(col => col.name === column);
}

try {
  db.transaction(() => {
    // 1. job_orders
    if (!columnExists('job_orders', 'payment_status')) {
      console.log('Adding payment_status to job_orders...');
      db.prepare(`ALTER TABLE job_orders ADD COLUMN payment_status TEXT DEFAULT 'UNPAID' CHECK(payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOID', 'CANCELLED'))`).run();
      
      // Backfill
      db.prepare(`
        UPDATE job_orders 
        SET payment_status = CASE 
          WHEN total_paid >= total_invoice AND total_invoice > 0 THEN 'PAID' 
          WHEN total_paid > 0 THEN 'PARTIALLY_PAID' 
          ELSE 'UNPAID' 
        END
      `).run();
    }

    // 2. realisasi_mtb_transaksi
    if (!columnExists('realisasi_mtb_transaksi', 'transaction_source')) {
      console.log('Adding transaction_source to realisasi_mtb_transaksi...');
      db.prepare(`ALTER TABLE realisasi_mtb_transaksi ADD COLUMN transaction_source TEXT DEFAULT 'MANUAL'`).run();
      
      // Backfill
      db.prepare(`UPDATE realisasi_mtb_transaksi SET transaction_source = 'FINANCIAL_PAYMENT_TRACKER' WHERE job_order_id IS NOT NULL`).run();
    }
    
    if (!columnExists('realisasi_mtb_transaksi', 'payment_log_id')) {
      db.prepare(`ALTER TABLE realisasi_mtb_transaksi ADD COLUMN payment_log_id INTEGER REFERENCES payment_logs(id)`).run();
    }
    
    if (!columnExists('realisasi_mtb_transaksi', 'payment_reference')) {
      db.prepare(`ALTER TABLE realisasi_mtb_transaksi ADD COLUMN payment_reference TEXT`).run();
    }

    // 3. master_kategori_biaya_manual flags
    const flags = [
      'allow_financial_commitment', 'allow_payment_tracker', 'allow_mtb', 
      'allow_dashboard', 'allow_reporting'
    ];
    for (const flag of flags) {
      if (!columnExists('master_kategori_biaya_manual', flag)) {
        console.log(`Adding ${flag} to master_kategori_biaya_manual...`);
        db.prepare(`ALTER TABLE master_kategori_biaya_manual ADD COLUMN ${flag} BOOLEAN DEFAULT 1`).run();
      }
    }
    
    if (!columnExists('master_kategori_biaya_manual', 'require_manager_approval')) {
      console.log(`Adding require_manager_approval to master_kategori_biaya_manual...`);
      db.prepare(`ALTER TABLE master_kategori_biaya_manual ADD COLUMN require_manager_approval BOOLEAN DEFAULT 0`).run();
    }

    // 4. Update specific categories to NOT allow MTB
    const excludedCategories = [
      'TRUC (Warehouse)', 'TRUC (Repo Depo)', 'DEPO', 'LOLO (Reimb. Lift Off)'
    ];

    for (const cat of excludedCategories) {
      const existing = db.prepare('SELECT id FROM master_kategori_biaya_manual WHERE nama_kategori = ?').get(cat);
      if (existing) {
        db.prepare('UPDATE master_kategori_biaya_manual SET allow_mtb = 0 WHERE id = ?').run(existing.id);
      } else {
        db.prepare(`
          INSERT INTO master_kategori_biaya_manual 
          (nama_kategori, keterangan, is_active, allow_mtb, allow_financial_commitment, allow_payment_tracker) 
          VALUES (?, ?, 1, 0, 1, 1)
        `).run(cat, 'Auto-generated for Master Data Config');
      }
    }

  })();
  console.log('Phase 1 & 2 Migration Completed Successfully.');
} catch (err) {
  console.error('Migration failed:', err);
}

db.close();
