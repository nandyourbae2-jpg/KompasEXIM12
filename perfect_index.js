const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = process.env.NODE_ENV === 'test' ? require('./__tests__/mockDb') : require('./src/database/db');
// Auto-migrate to add import_category_key if not exists
try {
  db.prepare("ALTER TABLE job_orders ADD COLUMN import_category_key TEXT").run();
  console.log("Migration: Added import_category_key to job_orders");
} catch (error) {
  // Column already exists, ignore
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir + '/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// --- 1. AUTHENTICATION ---
app.post('/api/log-error', (req, res) => {
  console.log('FRONTEND ERROR LOGGED:', req.body);
  fs.writeFileSync(path.join(__dirname, 'frontend-error.log'), JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { employee_id, password } = req.body;
  if (!employee_id || !password) return res.status(400).json({ error: 'Employee ID dan Password wajib diisi' });
  const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
  if (!user) return res.status(401).json({ error: 'Employee ID tidak ditemukan' });
  if (user.password_hash !== password) return res.status(401).json({ error: 'Kredensial tidak valid' });
  if (user.status_aktif === 0) return res.status(403).json({ error: 'Akun ini sudah tidak aktif, hubungi Supervisor Anda' });
  const { password_hash: _, ...userWithoutPassword } = user;
  userWithoutPassword.status_aktif = Boolean(userWithoutPassword.status_aktif);
  res.status(200).json({ user: userWithoutPassword });
});

// --- 1.5 USERS ---
app.get('/api/users/assignable', (req, res) => {
  try {
    const { level_otoritas, departemen } = req.query;
    let rows;
    if (level_otoritas === 'Supervisor') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, tipe_karyawan, departemen
        FROM users
        WHERE level_otoritas = 'Staff Dept'
          AND departemen = ?
          AND status_aktif = 1
        ORDER BY nama ASC
      `).all(departemen);
    } else if (level_otoritas === 'Manager') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, departemen, tipe_karyawan
        FROM users
        WHERE level_otoritas = 'Supervisor'
          AND status_aktif = 1
        ORDER BY departemen ASC, nama ASC
      `).all();
    } else {
      rows = [];
    }
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 2. TASKS ---
app.get('/api/tasks', (req, res) => {
  try {
    const { level_otoritas, departemen, userId } = req.query;
    let tasks;
    
    if (level_otoritas === 'Manager') {
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    } else if (level_otoritas === 'Supervisor') {
      tasks = db.prepare('SELECT * FROM tasks WHERE departemen = ? ORDER BY updated_at DESC').all(departemen);
    } else if (level_otoritas === 'Staff Dept' && userId) {
      tasks = db.prepare('SELECT * FROM tasks WHERE assignee_id = ? ORDER BY updated_at DESC').all(userId);
    } else {
      // Fallback
      tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC').all();
    }

    const historyStmt = db.prepare('SELECT * FROM task_status_history WHERE task_id = ? ORDER BY diubah_pada ASC');
    const usersMap = {};
    db.prepare('SELECT id, nama, level_otoritas, departemen FROM users').all().forEach(u => { usersMap[u.id] = u; });

    tasks.forEach(t => { 
      t.statusHistory = historyStmt.all(t.id); 
      t.assignee = usersMap[t.assignee_id] || null;
      t.assigned_by = usersMap[t.assigned_by_id] || null;
    });
    res.json(tasks);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, assigned_by_id, import_project_id, tenggat } = req.body;
    
    if (!judul || !prioritas || !tenggat) {
      return res.status(400).json({ error: 'Judul, prioritas, dan tenggat wajib diisi' });
    }
    
    if (!assigned_by_id) {
      return res.status(400).json({ error: 'assigned_by_id wajib diisi' });
    }
    
    const creator = db.prepare('SELECT level_otoritas FROM users WHERE id = ?').get(assigned_by_id);
    if (!creator) {
      return res.status(400).json({ error: 'User tidak valid' });
    }

    let finalAssigneeId;
    if (creator.level_otoritas === 'Staff Dept') {
      finalAssigneeId = assigned_by_id; // WAJIB diri sendiri
    } else {
      finalAssigneeId = assignee_id;
      if (!finalAssigneeId) {
        return res.status(400).json({ error: 'assigneeId wajib diisi untuk Supervisor/Manager' });
      }
    }

    const finalAssignedById = assigned_by_id;
    const finalSumberTugas = sumber_tugas || 'Manual';
    const lastTask = db.prepare("SELECT task_code FROM tasks ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (lastTask) {
      const match = lastTask.task_code.match(/TSK-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const taskCode = `TSK-${String(nextNum).padStart(4, '0')}`;

    let newId;
    db.transaction(() => {
      db.prepare(`
        INSERT INTO tasks (task_code, judul, deskripsi, departemen, prioritas, status, sumber_tugas, assignee_id, assigned_by_id, import_project_id, tenggat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(taskCode, judul, deskripsi || null, departemen, prioritas, status || 'Backlog', finalSumberTugas, finalAssigneeId, finalAssignedById, import_project_id, tenggat);
      newId = db.prepare('SELECT last_insert_rowid()').pluck().get();
      db.prepare('INSERT INTO task_status_history (task_id, status_ke, diubah_oleh_id) VALUES (?, ?, ?)').run(newId, status || 'Backlog', finalAssignedById);
    })();
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId);
    res.json(newTask);
  } catch (error) { res.status(500).json({ error: error.message }); }
});
app.patch('/api/tasks/:id/status', (req, res) => {
  try {
    const { status, diubah_oleh_id, status_dari } = req.body;
    db.transaction(() => {
      db.prepare('UPDATE tasks SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, req.params.id);
      db.prepare('INSERT INTO task_status_history (task_id, status_dari, status_ke, diubah_oleh_id) VALUES (?, ?, ?, ?)').run(req.params.id, status_dari, status, diubah_oleh_id);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/tasks/:id/catatan', (req, res) => {
  try {
    const { catatan_progress, progress } = req.body;
    db.prepare('UPDATE tasks SET catatan_progress = ?, progress = ?, updated_at = datetime("now") WHERE id = ?').run(catatan_progress, progress, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT sumber_tugas FROM tasks WHERE id = ?').get(req.params.id);
    if (task && task.sumber_tugas === 'Escalation') {
      return res.status(403).json({ error: 'Tugas Escalation tidak bisa dihapus.' });
    }
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 3. DOCUMENTS ---
app.get('/api/documents', (req, res) => {
  try {
    const documents = db.prepare('SELECT * FROM documents WHERE status != "Deleted" ORDER BY created_at DESC').all();
    documents.forEach(d => { d.tags = JSON.parse(d.tags || '[]'); });
    res.json(documents);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/documents', (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  try {
    const file = req.file;
    const { tipe, no_referensi, departemen, tags, vendor_id, upload_oleh_id } = req.body;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const info = db.prepare(`
      INSERT INTO documents (nama_file, file_path, tipe, no_referensi, departemen, ukuran_kb, tags, vendor_id, upload_oleh_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(file.originalname, '/uploads/' + file.filename, tipe, no_referensi, departemen, Math.round(file.size / 1024), tags || '[]', vendor_id, upload_oleh_id);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(info.lastInsertRowid);
    doc.tags = JSON.parse(doc.tags);
    res.status(201).json(doc);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/documents/:id', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE documents SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, req.params.id);
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/documents/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 4. VENDORS ---
app.get('/api/vendors', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY created_at DESC').all();
    vendors.forEach(v => { v.layanan = JSON.parse(v.layanan || '[]'); });
    res.json(vendors);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/vendors', (req, res) => {
  try {
    const { nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan } = req.body;
    const info = db.prepare(`
      INSERT INTO vendors (nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, layanan, catatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nama, service_type, region, kontak_nama, kontak_email, kontak_telepon, alamat, JSON.stringify(layanan || []), catatan);
    res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/vendors/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE vendors SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 5. JOB ORDERS & PAYMENTS ---
app.get('/api/job-orders', (req, res) => {
  try {
    const jos = db.prepare('SELECT * FROM job_orders ORDER BY created_at DESC').all();
    jos.forEach(jo => { jo.remaining_balance = jo.total_invoice - jo.total_paid; });
    res.json(jos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/job-orders', (req, res) => {
  try {
    const { job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un } = req.body;
    const info = db.prepare(`
      INSERT INTO job_orders (job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(job_order_code, vendor_id, cost_type, total_invoice, tanggal_invoice, tanggal_jatuh_tempo, shipment_un);
    res.json(db.prepare('SELECT * FROM job_orders WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/job-orders/:id/payments', (req, res) => {
  try {
    const { jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id } = req.body;
    const joId = req.params.id;
    db.transaction(() => {
      db.prepare('INSERT INTO payment_logs (job_order_id, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id) VALUES (?, ?, ?, ?, ?)').run(joId, jumlah_bayar, tanggal_bayar, metode, dicatat_oleh_id);
      db.prepare('UPDATE job_orders SET total_paid = total_paid + ?, updated_at = datetime("now") WHERE id = ?').run(jumlah_bayar, joId);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/job-orders/:id/payments', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM payment_logs WHERE job_order_id = ? ORDER BY created_at DESC').all(req.params.id));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 6. IMPORT PROJECTS ---
app.get('/api/import-projects', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/import-projects', (req, res) => {
  try {
    const { task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id } = req.body;
    const info = db.prepare(`
      INSERT INTO import_projects (task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id);
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/import-projects/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM import_projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 7. IMPORT SHIPMENTS & CONTAINERS ---
app.get('/api/import-shipments', (req, res) => {
  try {
    const shipments = db.prepare('SELECT * FROM import_shipments ORDER BY created_at DESC').all();
    const contStmt = db.prepare('SELECT * FROM containers WHERE shipment_id = ?');
    shipments.forEach(s => {
      s.costs = JSON.parse(s.costs || '{}');
      s.containers = contStmt.all(s.id);
    });
    res.json(shipments);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/import-shipments', (req, res) => {
  try {
    const { shipment_code, import_project_id, supplier, created_by_id } = req.body;
    const info = db.prepare(`
      INSERT INTO import_shipments (shipment_code, import_project_id, supplier, created_by_id)
      VALUES (?, ?, ?, ?)
    `).run(shipment_code, import_project_id, supplier, created_by_id);
    res.json(db.prepare('SELECT * FROM import_shipments WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/import-shipments/:id', (req, res) => {
  try {
    const allowedKeys = ['un', 'kat', 'supplier', 'invoice_no', 'bl_no', 'mode_transport', 'qtty', 'uom', 'depo_route', 'gudang', 'ata', 'etd', 'eta', 'hs_code', 'shipment_term', 'trade', 'free_time_destination'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(req.params.id);
      db.prepare(`UPDATE import_shipments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/import-shipments/:id/costs', (req, res) => {
  try {
    db.prepare('UPDATE import_shipments SET costs = ?, updated_at = datetime("now") WHERE id = ?').run(JSON.stringify(req.body.costs), req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/import-shipments/:id/containers', (req, res) => {
  try {
    const { no_kontainer } = req.body;
    const info = db.prepare('INSERT INTO containers (shipment_id, no_kontainer) VALUES (?, ?)').run(req.params.id, no_kontainer);
    res.json(db.prepare('SELECT * FROM containers WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/containers/:id', (req, res) => {
  try {
    const allowedKeys = ['stack', 'gate_out', 'trucking_repo_vendor', 'tru_repo_arrival', 'tru_repo_depart', 'trucking_wh_vendor', 'gate_in_wh', 'offloading_start', 'offloading_end', 'gate_out_wh', 'fish_issue', 'queue_issue', 'space_issue', 'other_issue'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(req.params.id);
      db.prepare(`UPDATE containers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 8. REPORTS ---
app.get('/api/reports', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM reports ORDER BY tanggal DESC').all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/reports', (req, res) => {
  try {
    const { tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id } = req.body;
    const info = db.prepare(`
      INSERT INTO reports (tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(tipe, judul, isi, departemen, dibuat_oleh_id, problem_report_id || null);
    res.json(db.prepare('SELECT * FROM reports WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/reports/:id/tanggapan', (req, res) => {
  try {
    const { tanggapan_manager, ditanggapi_oleh_id } = req.body;
    db.prepare('UPDATE reports SET tanggapan_manager = ?, ditanggapi_oleh_id = ?, tanggapan_pada = datetime("now") WHERE id = ?').run(tanggapan_manager, ditanggapi_oleh_id, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/reports/:id/tinjau', (req, res) => {
  try {
    db.prepare('UPDATE reports SET ditinjau_manager = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 9. STAFF ---
app.get('/api/staff', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM users WHERE level_otoritas = "Staff Dept"').all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/staff/:id/status', (req, res) => {
  try {
    const { status_aktif } = req.body;
    db.prepare('UPDATE users SET status_aktif = ? WHERE id = ?').run(status_aktif ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 10. COMPUTED ENDPOINTS ---
app.get('/api/plan-gdg', (req, res) => {
  try {
    // Return read-only data derived from import_shipments
    const shipments = db.prepare('SELECT * FROM import_shipments ORDER BY created_at DESC').all();
    const contStmt = db.prepare('SELECT * FROM containers WHERE shipment_id = ?');
    
    const plans = shipments.map(s => {
      const containers = contStmt.all(s.id);
      let readiness = 'Siap';
      if (containers.length === 0 || containers.some(c => !c.trucking_repo_vendor || !c.trucking_wh_vendor)) {
        readiness = 'Menunggu Vendor';
      }
      return {
        shipment_code: s.shipment_code,
        eta: s.eta,
        bl_swb: s.bl_no,
        free_time: s.free_time_destination,
        readiness
      };
    });
    res.json(plans);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/status-shipment', (req, res) => {
  try {
    const shipments = db.prepare('SELECT * FROM import_shipments ORDER BY created_at DESC').all();
    const contStmt = db.prepare('SELECT * FROM containers WHERE shipment_id = ?');
    const joStmt = db.prepare('SELECT total_invoice, total_paid FROM job_orders WHERE shipment_un = ?');
    
    const statusData = shipments.map(s => {
      const containers = contStmt.all(s.id);
      let stage = 'Shipment Active';
      
      if (s.ata) {
        stage = 'Delivery Active';
        
        const allGateOutWh = containers.length > 0 && containers.every(c => c.gate_out_wh);
        if (allGateOutWh) {
          stage = 'Financial Settlement';
          
          if (s.un) {
            const jos = joStmt.all(s.un);
            const allPaid = jos.length > 0 && jos.every(jo => jo.total_invoice - jo.total_paid <= 0);
            if (allPaid) {
              stage = 'Status Complete';
            }
          }
        }
      }
      return { ...s, stage, containers };
    });
    res.json(statusData);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/dashboard/manager/summary', (req, res) => {
  try {
    const totalShipmentAktif = db.prepare('SELECT count(*) as c FROM import_shipments').get().c;
    const utang = db.prepare('SELECT sum(total_invoice - total_paid) as u FROM job_orders').get().u || 0;
    const openReports = db.prepare('SELECT count(*) as c FROM reports WHERE tipe="Problem Report" AND id NOT IN (SELECT problem_report_id FROM reports WHERE problem_report_id IS NOT NULL)').get().c;
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 5').all();
    
    res.json({ totalShipmentAktif, outstandingUtang: utang, openProblemReports: openReports, latestTasks: tasks });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Backend server is running on http://localhost:${PORT}`));
}
module.exports = app;