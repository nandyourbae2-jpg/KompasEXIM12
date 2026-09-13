datetime('now')
  } else {
    next();
const path = require('path');
const fs = require('fs');
const db = process.env.NODE_ENV === 'test' ? require('./__tests__/mockDb') : require('./src/database/db');
// Auto-migrate to add import_category_key if not exists
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN import_category_key TEXT").run();
  console.log("Migration: Added import_category_key to job_orders");
} catch (error) {
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN import_shipment_id INTEGER").run();
  console.log("Migration: Added import_shipment_id to job_orders");
} catch (error) {
  // Column already exists, ignore
}

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN invoice_no TEXT").run();
  console.log("Migration: Added invoice_no to job_orders");
} catch (error) {
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN invoice_no TEXT").run();
  console.log("Migration: Added invoice_no to job_orders");
} catch (error) {
  // Column already exists, ignore
}

// Migrate for DPP and Tax
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN dpp REAL DEFAULT 0").run();
  console.log("Migration: Added dpp to job_orders");
} catch (e) {}

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN persen_ppn REAL DEFAULT 0").run();
  console.log("Migration: Added persen_ppn to job_orders");
} catch (e) {}

try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN ppn REAL DEFAULT 0").run();
  console.log("Migration: Added ppn to job_orders");
} catch (e) {}

try {
  // Backfill existing data
  db.prepare(`
    UPDATE job_orders 
    SET 
      dpp = ROUND(total_invoice / 1.11, 2), 
      persen_ppn = 11,
      ppn = total_invoice - ROUND(total_invoice / 1.11, 2)
    WHERE (dpp IS NULL OR dpp = 0) AND total_invoice > 0
  `).run();
  console.log("Migration: Backfilled dpp and ppn in job_orders");
} catch (error) {
  console.error("Migration backfill failed:", error);
}
  `).run();
  
  console.log("Migration: Backfilled dpp and ppn in job_orders");
} catch (error) {
  // Columns already exist, ignore
}
}
  if (createStmt && createStmt.sql.includes('CHECK (metode IN')) {
    console.log("Migration: Rebuilding payment_logs to remove CHECK constraint on metode...");
    db.transaction(() => {
      db.prepare("PRAGMA foreign_keys = OFF").run();
      db.prepare("ALTER TABLE payment_logs RENAME TO payment_logs_old").run();
      db.prepare(`
        CREATE TABLE payment_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_order_id INTEGER NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
          jumlah_bayar REAL NOT NULL,
          tanggal_bayar TEXT NOT NULL,
          metode TEXT NOT NULL,
          file_bukti_path TEXT,
          dicatat_oleh_id INTEGER REFERENCES users(id),
          created_at TEXT DEFAULT (datetime('now'))
        )
      `).run();
      db.prepare(`
        INSERT INTO payment_logs (id, job_order_id, jumlah_bayar, tanggal_bayar, metode, file_bukti_path, dicatat_oleh_id, created_at)
        SELECT id, job_order_id, jumlah_bayar, tanggal_bayar, metode, file_bukti_path, dicatat_oleh_id, created_at FROM payment_logs_old
      `).run();
      db.prepare("DROP TABLE payment_logs_old").run();
      db.prepare("PRAGMA foreign_keys = ON").run();
    })();
    console.log("Migration: Successfully rebuilt payment_logs.");
  }
} catch (error) {
  console.error("Migration error on payment_logs:", error);
}

const app = express();

app.post('/api/job-orders/sync-import', (req, res) => {
  try {
    const { shipmentUn, activeCategories } = req.body;
    db.transaction(() => {
      // 1. Dapatkan daftar JO aktif sebelumnya untuk shipment ini
      const prevRows = db.prepare('SELECT * FROM job_orders WHERE shipment_un = ? AND sumber = ?').all(shipmentUn, 'import_operational');
      const prevMap = new Map();
      prevRows.forEach(row => prevMap.set(row.import_category_key, row));

      const activeKeys = new Set();

      // 2. Upsert masing-masing active category
      for (const cat of activeCategories) {
        if (!cat.inv || String(cat.inv).trim() === '' || cat.total <= 0) continue;
        activeKeys.add(cat.key);
        
        const existing = prevMap.get(cat.key);
        let status = 'Belum Dibayar';
        
        if (existing) {
          // Update
          const remaining = cat.total - existing.total_paid;
          if (existing.total_paid >= cat.total && cat.total > 0) status = 'Lunas';
          else if (existing.total_paid > 0) status = 'Bayar Sebagian';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const JWT_SECRET = process.env.JWT_SECRET || 'kompas_exim_super_secret_key';

app.post('/api/login', (req, res) => {
  const { employee_id, password, departemen } = req.body;
  if (!employee_id || !password) return res.status(400).json({ error: 'Data tidak lengkap' });

  console.log("DB USERS:", db.prepare("SELECT employee_id FROM users").all());

  const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
  if (!user) return res.status(401).json({ error: 'Kredensial tidak valid' });
  try {
    isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid && user.password_hash !== password) {
    console.log("INVALID CREDENTIALS", employee_id, password, user.password_hash);
    return res.status(401).json({ error: 'Kredensial tidak valid' });
  }
  
  if (!user.status_aktif || user.status_aktif == 0) return res.status(403).json({ error: 'Akun ini sudah tidak aktif, hubungi Supervisor Anda' });
  
  if (user.status_aktif === 0) return res.status(403).json({ error: 'Akun ini sudah tidak aktif, hubungi Supervisor Anda' });
  const { password_hash: _, ...userWithoutPassword } = user;
  userWithoutPassword.status_aktif = Boolean(userWithoutPassword.status_aktif);
  
  const token = jwt.sign(
    { id: user.id, employee_id: user.employee_id, level_otoritas: user.level_otoritas, departemen: user.departemen },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.status(200).json({ user: userWithoutPassword, token });
});

// Middleware Authentikasi
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    req.user = user;
// --- 1.5 USERS ---
app.get('/api/users/assignable', authenticateToken, (req, res) => {
  try {
    const { level_otoritas, departemen } = req.user;
    let rows;
    if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, tipe_karyawan, departemen
        FROM users
        WHERE level_otoritas = 'Staff Dept'
      rows = db.prepare(`
        SELECT id, nama, employee_id, tipe_karyawan, departemen, level_otoritas
        FROM users
      `).all(departemen);
    } else if (level_otoritas === 'Manager') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, departemen, tipe_karyawan
        FROM users
        WHERE level_otoritas IN ('Supervisor', 'SPV Dept')
          AND status_aktif = 1
      rows = db.prepare(`
        SELECT id, nama, employee_id, departemen, tipe_karyawan, level_otoritas
        FROM users
      rows = [];
    }
    res.json(rows);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
        }
      }
    })();
    res.json({ success: true });
  } catch (error) { 
// --- 2. TASKS ---
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { level_otoritas, departemen, id: userId } = req.user;
    let tasks;
    
    if (level_otoritas === 'Manager') {
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    } else if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      tasks = db.prepare('SELECT * FROM tasks WHERE departemen = ? ORDER BY updated_at DESC').all(departemen);
    } else if (level_otoritas === 'Staff Dept') {
      tasks = db.prepare('SELECT * FROM tasks WHERE assignee_id = ? ORDER BY updated_at DESC').all(userId);
    } else {
    let rows;
    if (level_otoritas === 'Manager') {
      rows = db.prepare('SELECT tasks.*, u.nama as assignee_nama FROM tasks LEFT JOIN users u ON tasks.assignee_id = u.id ORDER BY tasks.created_at DESC').all();
    } else if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      rows = db.prepare('SELECT tasks.*, u.nama as assignee_nama FROM tasks LEFT JOIN users u ON tasks.assignee_id = u.id WHERE tasks.departemen = ? ORDER BY tasks.created_at DESC').all(departemen);
    } else {
      rows = db.prepare('SELECT tasks.*, u.nama as assignee_nama FROM tasks LEFT JOIN users u ON tasks.assignee_id = u.id WHERE tasks.assignee_id = ? ORDER BY tasks.created_at DESC').all(req.user.id);
    }
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          
          db.prepare(`
            UPDATE job_orders 
app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    let { judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, import_project_id, tenggat } = req.body;
    
    const assigned_by_id = req.user.id;
    const creatorLevel = req.user.level_otoritas;
    if (!departemen) departemen = req.user.departemen;
      return res.status(400).json({ error: 'Judul, prioritas, dan tenggat wajib diisi' });
    }

    let finalAssigneeId;
    if (creatorLevel === 'Staff Dept') {
      finalAssigneeId = assigned_by_id; // WAJIB diri sendiri
    } else {
      finalAssigneeId = assignee_id || req.body.assigneeId; // Handle both camelCase and snake_case from body
      if (!finalAssigneeId) {
        return res.status(400).json({ error: 'assigneeId wajib diisi untuk Supervisor/Manager' });
      }
    }

    const finalAssignedById = assigned_by_id;
    const finalSumberTugas = (creatorLevel === 'Supervisor' || creatorLevel === 'Manager') && finalAssigneeId !== finalAssignedById ? 'Escalation' : (sumber_tugas || 'Manual');
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;

          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          console.log('[SYNC] Inserting new tagihan:', finalCode, cat.name, cat.total);
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked)
            VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?)
          `).run(
            finalCode, vendorId, cat.name, cat.total, shipmentUn, 'import_operational', cat.key, status
          );
app.post('/api/job-orders/sync-import', (req, res) => {
  try {
    const { importShipmentId, shipmentUn, activeCategories } = req.body;
    console.log('[SYNC] Received sync request for shipmentUn:', shipmentUn, 'id:', importShipmentId);
    console.log('[SYNC] activeCategories count:', activeCategories.length);
    
    db.transaction(() => {
app.patch('/api/tasks/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, status_dari } = req.body;
    const validStatuses = ['Backlog', 'Akan Dikerjakan', 'Sedang Dikerjakan', 'Selesai'];
    if (!validStatuses.includes(status)) {
      newId = db.prepare('SELECT last_insert_rowid()').pluck().get();
      db.prepare('INSERT INTO task_status_history (task_id, status_ke, diubah_oleh_id) VALUES (?, ?, ?)').run(newId, status || 'Backlog', finalAssignedById);
    })();
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId);
    
app.patch('/api/tasks/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, status_dari } = req.body;
    const validStatuses = ['Backlog', 'Akan Dikerjakan', 'Dalam Proses', 'Review', 'Selesai'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }
    const diubah_oleh_id = req.user.id;
      db.prepare('INSERT INTO task_status_history (task_id, status_dari, status_ke, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(req.params.id, status_dari || null, status, diubah_oleh_id);
    })();
      const prevMap = new Map();
      prevRows.forEach(row => prevMap.set(row.import_category_key, row));
    try {
      db.prepare('ALTER TABLE job_orders ADD COLUMN import_category_key TEXT').run();
      console.log('Migration: Added import_category_key to job_orders');
    } catch (e) { /* Column already exists */ }
    
    try {
      db.prepare('ALTER TABLE job_orders ADD COLUMN import_shipment_id INTEGER').run();
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const task = db.prepare('SELECT sumber_tugas, assigned_by_id FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    
    // Only the creator (assigned_by_id) can delete it if it's escalation
    if (task.sumber_tugas === 'Escalation' && task.assigned_by_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda tidak dapat menghapus Tugas Escalation yang bukan buatan Anda.' });
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
        queryStr += ' AND import_shipment_id = ?';
        queryParams.push(importShipmentId);
      }
      
      const prevRows = db.prepare(queryStr).all(...queryParams);
      const prevMap = new Map();
      prevRows.forEach(row => prevMap.set(row.import_category_key, row));

      const activeKeys = new Set();

      // 2. Upsert masing-masing active category
      for (const cat of activeCategories) {
        if (!cat.inv || String(cat.inv).trim() === '' || cat.total <= 0) continue;
        activeKeys.add(cat.key);
        
        const existing = prevMap.get(cat.key);
        let status = 'Belum Dibayar';
        
        if (existing) {
          // Update
          const remaining = cat.total - existing.total_paid;
          if (existing.total_paid >= cat.total && cat.total > 0) status = 'Lunas';
          else if (existing.total_paid > 0) status = 'Bayar Sebagian';
          
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ? AND id != ?').get(finalCode, existing.id);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;

          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          db.prepare(`
            UPDATE job_orders
            SET job_order_code = ?, vendor_id = ?, cost_type = ?, total_invoice = ?, remaining_balance = ?, status_linked = ?, import_shipment_id = ?
            WHERE id = ?
          `).run(
            finalCode, vendorId, cat.name, cat.total, remaining, status, importShipmentId || null, existing.id
          );
        } else {
          // Insert
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;

          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          console.log('[SYNC] Inserting new tagihan:', finalCode, cat.name, cat.total);
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(
            finalCode, vendorId, cat.name, cat.total, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null
          );
        }
          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, invoice_no = ?, vendor_id = (SELECT id FROM vendors WHERE nama = ? LIMIT 1), 
                cost_type = ?, total_invoice = ?, remaining_balance = ?, status_linked = ?, import_shipment_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            finalCode, cat.inv, cat.vendor, cat.name, cat.total, remaining, status, importShipmentId || null, existing.id
          );
        } else {
          // Insert
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;

          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          console.log('[SYNC] Inserting new tagihan:', finalCode, cat.name, cat.total);
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(
            finalCode, cat.inv, vendorId, cat.name, cat.total, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null
          );
        }
    const jos = db.prepare('SELECT * FROM job_orders ORDER BY created_at DESC').all();
    const allPayments = db.prepare('SELECT * FROM payment_logs').all();
    
    // Group payments by job_order_id
    const paymentsByJo = {};
    for (const p of allPayments) {
      if (!paymentsByJo[p.job_order_id]) paymentsByJo[p.job_order_id] = [];
      paymentsByJo[p.job_order_id].push(p);
    }

    jos.forEach(jo => { 
      jo.remaining_balance = jo.total_invoice - jo.total_paid; 
      jo.payment_logs = paymentsByJo[jo.id] || [];
    });
    res.json(jos);
app.get('/api/staff', authenticateToken, (req, res) => {
  try {
    const { level_otoritas, departemen } = req.user;
    
    // Staff cannot access staff management
    if (level_otoritas === 'Staff Dept') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }
    
    let query = "SELECT * FROM users WHERE level_otoritas = 'Staff Dept'";
    let params = [];
    
    // SPV can only see staff in their department
    if (level_otoritas === 'Supervisor' || level_otoritas === 'SPV Dept') {
      const qDept = req.query.departemen;
      if (qDept && qDept !== departemen) {
        return res.status(403).json({ error: 'Tidak dapat mengakses departemen lain.' });
      }
      query += " AND departemen = ?";
      params.push(departemen);
    }
    
    res.json(db.prepare(query).all(...params));
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
// --- 6. IMPORT PROJECTS ---
app.get('/api/import-projects', authenticateToken, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all());
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.post('/api/import-projects', authenticateToken, (req, res) => {
  try {
    const {
      task_unique_number, supplier, trade, import_type, shipment_term,
      invoice_no, po_co_no, bl_no, etd, eta, hs_code,
      free_time_destination, document_requirements
    } = req.body;
    
    const created_by_id = req.user.id;

    if (!supplier) return res.status(400).json({ error: 'Supplier is required' });
    if (!eta) return res.status(400).json({ error: 'ETA is required' });
app.patch('/api/import-projects/:id', authenticateToken, (req, res) => {
  try {
app.post('/api/job-orders', authenticateToken, (req, res) => {
  try {
    let { job_order_code, vendor_id, vendor_nama, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un } = req.body;
    
    if (!job_order_code) {
    const newVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
    if(newVendor) newVendor.layanan = JSON.parse(newVendor.layanan || '[]');
    res.json(newVendor);
      if (lastJo && lastJo.job_order_code) {
        const match = lastJo.job_order_code.match(/JO-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      job_order_code = `JO-${String(nextNum).padStart(4, '0')}`;
    }

    if (!vendor_id && vendor_nama) {
      let vendor = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(vendor_nama);
      if (!vendor) {
        const vendorInsert = db.prepare('INSERT INTO vendors (nama, kategori) VALUES (?, ?)').run(vendor_nama, 'Other');
        vendor_id = vendorInsert.lastInsertRowid;
      } else {
        vendor_id = vendor.id;
      }
    }

    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);
    res.status(201).json(db.prepare('SELECT * FROM job_orders WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
app.post('/api/job-orders/:id/payments', authenticateToken, (req, res) => {
  try {
    const { jumlah_bayar, tanggal_bayar, metode } = req.body;
    const joId = req.params.id;
    const dicatat_oleh_id = req.user.id;
    
    // Check remaining balance
    const jo = db.prepare('SELECT total_invoice, total_paid FROM job_orders WHERE id = ?').get(joId);
    if (!jo) return res.status(404).json({ error: 'Job Order tidak ditemukan' });
    
    const remaining = jo.total_invoice - jo.total_paid;
    if (jumlah_bayar > remaining) {
      return res.status(400).json({ error: 'Jumlah bayar melebihi sisa tagihan' });
    }
app.get('/api/job-orders/available-months', (req, res) => {
  try {
    const months = db.prepare(`
      SELECT DISTINCT
        strftime('%Y-%m', COALESCE(tanggal_invoice, created_at)) as month_key,
        strftime('%m', COALESCE(tanggal_invoice, created_at)) as bulan,
        strftime('%Y', COALESCE(tanggal_invoice, created_at)) as tahun
      FROM job_orders
      WHERE COALESCE(tanggal_invoice, created_at) IS NOT NULL
      ORDER BY month_key DESC
    `).all();
    res.json(months);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
    `).all();
    res.json(months);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/job-orders', (req, res) => {
      db.prepare(`UPDATE job_orders SET total_paid = total_paid + ?, updated_at = datetime('now') WHERE id = ?`).run(jumlah_bayar, joId);
    })();
    res.status(201).json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
    jos.forEach(jo => { 
      jo.remaining_balance = jo.total_invoice - jo.total_paid;
      if (jo.total_paid >= jo.total_invoice && jo.total_invoice > 0) jo.status_badge = 'Lunas';
      else if (jo.total_paid > 0) jo.status_badge = 'Bayar Sebagian';
      else jo.status_badge = 'Belum Dibayar';
      jo.payment_logs = paymentsByJo[jo.id] || [];
    jos.forEach(jo => { 
      if (jo.vendor_id) {
        jo.vendor = db.prepare('SELECT id, nama FROM vendors WHERE id = ?').get(jo.vendor_id);
      }
      jo.remaining_balance = jo.total_invoice - jo.total_paid;
      if (jo.total_paid >= jo.total_invoice && jo.total_invoice > 0) jo.status_badge = 'Lunas';
      else if (jo.total_paid > 0) jo.status_badge = 'Bayar Sebagian';
      else jo.status_badge = 'Belum Dibayar';
      jo.payment_logs = paymentsByJo[jo.id] || [];
    });
    const jo = db.prepare('SELECT * FROM job_orders WHERE id = ?').get(req.params.id);
    if (!jo) return res.status(404).json({ error: 'Not found' });
    jo.remaining_balance = jo.total_invoice - jo.total_paid;
    if (jo.total_paid >= jo.total_invoice && jo.total_invoice > 0) jo.status_badge = 'Lunas';
    else if (jo.total_paid > 0) jo.status_badge = 'Bayar Sebagian';
    else jo.status_badge = 'Belum Dibayar';
    res.json(jo);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);
    
    const newJo = db.prepare('SELECT * FROM job_orders WHERE id = ?').get(info.lastInsertRowid);
    newJo.remaining_balance = newJo.total_invoice - newJo.total_paid;
    if (newJo.total_paid >= newJo.total_invoice && newJo.total_invoice > 0) newJo.status_badge = 'Lunas';
    else if (newJo.total_paid > 0) newJo.status_badge = 'Bayar Sebagian';
    else newJo.status_badge = 'Belum Dibayar';

    res.status(201).json(newJo);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
  try {
    let { job_order_code, vendor_id, vendor_nama, cost_type, dpp, persen_ppn, tanggal_invoice, tanggal_jatuh_tempo, shipment_un } = req.body;
    
    if (dpp === undefined) dpp = 0;
    if (persen_ppn === undefined) persen_ppn = 0;
    
    // Calculate total invoice on backend
    const ppn = dpp * persen_ppn / 100;
    const total_invoice = dpp + ppn;

    if (!job_order_code) {
      const lastJo = db.prepare('SELECT job_order_code FROM job_orders ORDER BY id DESC LIMIT 1').get();
      let nextNum = 1;
      if (lastJo && lastJo.job_order_code) {
        const match = lastJo.job_order_code.match(/JO-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      job_order_code = `JO-${String(nextNum).padStart(4, '0')}`;
    }

    if (!vendor_id && vendor_nama) {
      let vendor = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(vendor_nama);
      if (!vendor) {
        const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(vendor_nama, 'Trucking');
        vendor_id = vendorInsert.lastInsertRowid;
      } else {
        vendor_id = vendor.id;
      }
    }

    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/import-projects/:id/documents', authenticateToken, (req, res) => {
  try {
    const documents = db.prepare(`
      SELECT 
        dmb.*, 
        md.kode_dokumen, md.nama_dokumen
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      WHERE dmb.import_project_id = ?
    `).all(req.params.id);
    res.json(documents);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.delete('/api/import-projects/:id', authenticateToken, (req, res) => {
});

app.delete('/api/job-orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const jo = db.prepare('SELECT id FROM job_orders WHERE id = ?').get(id);
    if (!jo) {
      return res.status(404).json({ error: 'Job Order not found' });
    }
    
    db.transaction(() => {
      db.prepare('DELETE FROM payment_logs WHERE job_order_id = ?').run(id);
      db.prepare('DELETE FROM job_orders WHERE id = ?').run(id);
    })();
    
      // 2. Upsert masing-masing active category
      // 2. Upsert masing-masing active category
      for (const cat of activeCategories) {
        if (!cat.inv || String(cat.inv).trim() === '' || cat.dpp <= 0) continue;
        activeKeys.add(cat.key);
        const existing = prevMap.get(cat.key);
        let status = 'Belum Dibayar';
        
        // Resolve vendor ID or create new one
        let vendorId = null;
        if (cat.vendor && cat.vendor !== 'Unknown') {
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) {
            vendorId = vendorObj.id;
          } else {
            const vendorInsert = db.prepare('INSERT INTO vendors (nama, service_type) VALUES (?, ?)').run(cat.vendor, 'Forwarder');
            vendorId = vendorInsert.lastInsertRowid;
          }
        }
          // Update - only update cost values, don't touch total_paid
          const remaining = totalInvoice - existing.total_paid;
          if (existing.total_paid >= totalInvoice && totalInvoice > 0) status = 'Lunas';
          else if (existing.total_paid > 0) status = 'Bayar Sebagian';
          
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ? AND id != ?').get(finalCode, existing.id);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          
          db.prepare(`
            UPDATE job_orders 
            SET job_order_code = ?, invoice_no = ?, vendor_id = ?, 
                cost_type = ?, dpp = ?, persen_ppn = ?, ppn = ?, total_invoice = ?, status_linked = ?, import_shipment_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, status, importShipmentId || null, existing.id
          );
        } else {
          // Insert
          let finalCode = cat.inv;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;
          const dup = db.prepare('SELECT id FROM job_orders WHERE job_order_code = ?').get(finalCode);
          if (dup) finalCode = `${cat.inv}-${cat.key}`;

          // Fallback vendor_id to null if not found
          let vendorId = null;
          const vendorObj = db.prepare('SELECT id FROM vendors WHERE nama = ?').get(cat.vendor);
          if (vendorObj) vendorId = vendorObj.id;
          
          db.prepare(`
            INSERT INTO job_orders (job_order_code, invoice_no, vendor_id, cost_type, dpp, persen_ppn, ppn, total_invoice, tanggal_jatuh_tempo, shipment_un, sumber, import_category_key, status_linked, import_shipment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, ?, ?)
          `).run(
            finalCode, cat.inv, vendorId, cat.name, dpp, persenPpn, ppn, totalInvoice, shipmentUn, 'import_operational', cat.key, status, importShipmentId || null
          );
        }
      }
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 5').all();
    
    const stagnantDNs = db.prepare(`
      SELECT dn_number, claim_kepada, jumlah_klaim, status, tanggal_dn
      FROM debit_notes
      WHERE status IN ('Diterbitkan', 'Diakui')
      AND (julianday('now') - julianday(tanggal_dn)) > 30
    `).all();

    res.json({ totalShipmentAktif, outstandingUtang: utang, openProblemReports: openReports, latestTasks: tasks, stagnantDNs });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

// --- 8. DEBIT NOTES ---
app.get('/api/debit-notes/summary', authenticateToken, (req, res) => {
  try {
    const { level_otoritas, departemen, id: userId } = req.user;
    const { bulan } = req.query;

    let query = `SELECT * FROM debit_notes dn WHERE 1=1`;
    const params = [];

    if (level_otoritas === 'Staff Dept') {
      query += ` AND dn.dibuat_oleh_id = ?`;
      params.push(userId);
    } else if (level_otoritas === 'Supervisor') {
      query += ` AND dn.departemen = ?`;
      params.push(departemen);
    }

    if (bulan) {
      query += ` AND strftime('%Y-%m', dn.tanggal_dn) = ?`;
      params.push(bulan);
    }

    const dns = db.prepare(query).all(...params);

    const total_klaim = dns.reduce((sum, dn) => sum + dn.jumlah_klaim, 0);
    const total_recovery = dns.filter(dn => dn.status === 'Settled').reduce((sum, dn) => sum + dn.jumlah_recovery, 0);
    const outstanding = total_klaim - total_recovery;
    const dn_aktif = dns.filter(dn => ['Draft', 'Diterbitkan', 'Diakui', 'Negosiasi'].includes(dn.status)).length;

    res.json({ total_klaim, total_recovery, outstanding, dn_aktif });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/debit-notes/available-months', (req, res) => {
  try {
    const months = db.prepare(`
      SELECT DISTINCT
        strftime('%Y-%m', tanggal_dn) as month_key,
        strftime('%m', tanggal_dn) as bulan,
        strftime('%Y', tanggal_dn) as tahun
      FROM debit_notes
      WHERE tanggal_dn IS NOT NULL
      ORDER BY month_key DESC
    `).all();
    res.json(months);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/debit-notes', authenticateToken, (req, res) => {
  try {
    const { level_otoritas, departemen, id: userId } = req.user;
    const { status, kategori, bulan, search } = req.query;

    let query = \`
      SELECT dn.*,
        ip.task_unique_number, ip.supplier as project_supplier,
        u.nama as dibuat_oleh_nama
      FROM debit_notes dn
      LEFT JOIN import_projects ip ON dn.import_project_id = ip.id
      LEFT JOIN users u ON dn.dibuat_oleh_id = u.id
      WHERE 1=1
    \`;
    const params = [];

    // RBAC filter
    if (level_otoritas === 'Staff Dept') {
      query += \` AND dn.dibuat_oleh_id = ?\`;
      params.push(userId);
    } else if (level_otoritas === 'Supervisor') {
      query += \` AND dn.departemen = ?\`;
      params.push(departemen);
    }
    // Manager: tidak ada filter tambahan — lihat semua

    if (status && status !== 'Semua Status') { query += \` AND dn.status = ?\`; params.push(status); }
    if (kategori && kategori !== 'Semua Kategori') { query += \` AND dn.claim_kategori = ?\`; params.push(kategori); }
    if (bulan) {
      query += \` AND strftime('%Y-%m', dn.tanggal_dn) = ?\`;
      params.push(bulan);
    }
    if (search) {
      query += \` AND (dn.dn_number LIKE ? OR dn.claim_kepada LIKE ? OR dn.deskripsi LIKE ?)\`;
      params.push(\`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`);
    }

    query += \` ORDER BY dn.created_at DESC\`;
    res.json(db.prepare(query).all(...params));
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/debit-notes/:id', authenticateToken, (req, res) => {
  try {
    const dn = db.prepare(\`
      SELECT dn.*, ip.task_unique_number, ip.supplier as project_supplier, u.nama as dibuat_oleh_nama
      FROM debit_notes dn
      LEFT JOIN import_projects ip ON dn.import_project_id = ip.id
      LEFT JOIN users u ON dn.dibuat_oleh_id = u.id
      WHERE dn.id = ?\`).get(req.params.id);
    if (!dn) return res.status(404).json({ error: 'Debit note tidak ditemukan' });

    dn.history = db.prepare(\`
      SELECT h.*, u.nama as diubah_oleh_nama
      FROM debit_note_status_history h
      LEFT JOIN users u ON h.diubah_oleh_id = u.id
      WHERE h.debit_note_id = ?
      ORDER BY h.diubah_pada DESC\`).all(dn.id);

    res.json(dn);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

function generateDNNumber() {
  const tahun = new Date().getFullYear().toString().slice(-2);
  const last = db.prepare("SELECT dn_number FROM debit_notes ORDER BY id DESC LIMIT 1").get();
  let nextNum = 1;
  if (last) {
    const match = last.dn_number.match(/DN-(\\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  return \`DN-\${String(nextNum).padStart(4, '0')}-\${tahun}\`;
}

app.post('/api/debit-notes', authenticateToken, (req, res) => {
  try {
    const { import_project_id, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, tanggal_dn } = req.body;
    const dn_number = generateDNNumber();
    const departemen = req.user.departemen || 'Import';

    let newId;
    db.transaction(() => {
      db.prepare(\`
        INSERT INTO debit_notes (dn_number, import_project_id, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, departemen, dibuat_oleh_id, tanggal_dn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`).run(dn_number, import_project_id, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id || null, mata_uang || 'IDR', departemen, req.user.id, tanggal_dn || new Date().toISOString().split('T')[0]);
      
      newId = db.prepare('SELECT last_insert_rowid()').pluck().get();
      db.prepare('INSERT INTO debit_note_status_history (debit_note_id, status_ke, catatan, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(newId, 'Draft', 'Debit note dibuat', req.user.id);
    })();
    res.status(201).json({ success: true, id: newId });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.patch('/api/debit-notes/:id', authenticateToken, (req, res) => {
  try {
    const { claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id, mata_uang, tanggal_dn } = req.body;
    
    // Check if status is Draft or Diterbitkan
    const dn = db.prepare('SELECT status FROM debit_notes WHERE id = ?').get(req.params.id);
    if (!dn || (dn.status !== 'Draft' && dn.status !== 'Diterbitkan')) {
      return res.status(403).json({ error: 'Hanya DN dengan status Draft atau Diterbitkan yang dapat diedit.' });
    }

    db.prepare(\`
      UPDATE debit_notes 
      SET claim_kategori=?, claim_jenis=?, claim_kepada=?, jumlah_klaim=?, deskripsi=?, linked_job_order_id=?, mata_uang=?, tanggal_dn=?, updated_at=datetime('now')
      WHERE id = ?
    \`).run(claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, deskripsi, linked_job_order_id || null, mata_uang, tanggal_dn, req.params.id);
    
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.patch('/api/debit-notes/:id/status', authenticateToken, (req, res) => {
  try {
    const { status_ke, catatan } = req.body;
    const diubah_oleh_id = req.user.id;
    
    if (status_ke === 'Ditolak' && !catatan) {
      return res.status(400).json({ error: 'Catatan wajib diisi jika klaim Ditolak.' });
    }

    db.transaction(() => {
      const dn = db.prepare('SELECT status FROM debit_notes WHERE id = ?').get(req.params.id);
      const status_dari = dn ? dn.status : '';

      db.prepare(\`UPDATE debit_notes SET status = ?, updated_at = datetime('now') WHERE id = ?\`).run(status_ke, req.params.id);
      db.prepare('INSERT INTO debit_note_status_history (debit_note_id, status_dari, status_ke, catatan, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)').run(req.params.id, status_dari, status_ke, catatan || null, diubah_oleh_id);
    })();
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.patch('/api/debit-notes/:id/recovery', authenticateToken, (req, res) => {
  try {
    const { jumlah_recovery, tanggal_recovery } = req.body;
    db.prepare(\`UPDATE debit_notes SET jumlah_recovery = ?, tanggal_recovery = ?, updated_at = datetime('now') WHERE id = ?\`).run(jumlah_recovery, tanggal_recovery, req.params.id);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.delete('/api/debit-notes/:id', authenticateToken, (req, res) => {
  try {
    const dn = db.prepare('SELECT status, dibuat_oleh_id, departemen FROM debit_notes WHERE id = ?').get(req.params.id);
    if (!dn) return res.status(404).json({ error: 'DN tidak ditemukan' });
    if (dn.status !== 'Draft') return res.status(403).json({ error: 'Hanya DN Draft yang bisa dihapus' });
    
    // RBAC for delete
    const { level_otoritas, departemen, id: userId } = req.user;
    if (level_otoritas === 'Staff Dept' && dn.dibuat_oleh_id !== userId) {
      return res.status(403).json({ error: 'Anda hanya dapat menghapus DN milik Anda sendiri.' });
    } else if (level_otoritas === 'Supervisor' && dn.departemen !== departemen) {
      return res.status(403).json({ error: 'Anda hanya dapat menghapus DN di departemen Anda.' });
    } else if (level_otoritas === 'Manager') {
      return res.status(403).json({ error: 'Manager tidak dapat menghapus DN.' });
    }

    db.prepare('DELETE FROM debit_notes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});
  return `DN-${String(nextNum).padStart(4, '0')}-${tahun}`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
function generateDNNumber() {
  const tahun = new Date().getFullYear().toString().slice(-2);
  const prefix = `DN-%-${tahun}`;
  const last = db.prepare("SELECT dn_number FROM debit_notes WHERE dn_number LIKE ? ORDER BY dn_number DESC LIMIT 1").get(prefix);
  let nextNum = 1;
  if (last && last.dn_number) {
    const match = last.dn_number.match(/DN-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `DN-${String(nextNum).padStart(4, '0')}-${tahun}`;
}