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

