app.delete('/api/document-types/:id', (req, res) => {
  try {
    // Block delete if document is in use
    const inUse = db.prepare(
      'SELECT COUNT(*) as c FROM import_project_documents WHERE dokumen_id = ?'
    ).get(req.params.id);
    const inMonitoring = db.prepare(
      'SELECT COUNT(*) as c FROM dokumen_monitoring_baris WHERE master_dokumen_id = ?'
    ).get(req.params.id);
    const totalUsage = (inUse?.c || 0) + (inMonitoring?.c || 0);
    if (totalUsage > 0) {
      return res.status(409).json({ 
        error: `Dokumen ini sedang dipakai di ${totalUsage} Import Project dan tidak bisa dihapus.` 
      });
    }
    db.prepare('DELETE FROM master_data_dokumen WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.post('/api/import-projects', (req, res) => {
  try {
    const {
      task_unique_number, supplier, trade, import_type, shipment_term,
      invoice_no, po_co_no, bl_no, etd, eta, hs_code,
      free_time_destination, created_by_id, document_requirements
    } = req.body;

    const projectId = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO import_projects (task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, po_co_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id, document_requirements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        task_unique_number, supplier, trade, import_type, shipment_term,
        invoice_no, po_co_no || null, bl_no, etd, eta, hs_code,
        free_time_destination, created_by_id,
        JSON.stringify(document_requirements || [])
      );
      const pid = info.lastInsertRowid;

      // Insert links to master documents + auto-create monitoring rows
      if (Array.isArray(document_requirements) && document_requirements.length) {
        const insertLink = db.prepare('INSERT INTO import_project_documents (import_project_id, dokumen_id) VALUES (?, ?)');
        const insertMonitoring = db.prepare('INSERT INTO dokumen_monitoring_baris (import_project_id, master_dokumen_id) VALUES (?, ?)');
        for (const docId of document_requirements) {
          insertLink.run(pid, docId);
          insertMonitoring.run(pid, docId);
        }
      }
      return pid;
    })();

    const newProject = db.prepare('SELECT * FROM import_projects WHERE id = ?').get(projectId);
    res.json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/import-projects/:id', (req, res) => {
  try {
    const allowedKeys = ['supplier', 'trade', 'import_type', 'shipment_term', 'invoice_no', 'po_co_no', 'bl_no', 'etd', 'eta', 'hs_code', 'free_time_destination'];
    const updates = [];
    const values = [];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    // Handle document_requirements update
    if (req.body.document_requirements !== undefined) {
      updates.push('document_requirements = ?');
      values.push(JSON.stringify(req.body.document_requirements));
    }
    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(req.params.id);
      db.prepare(`UPDATE import_projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    // Sync monitoring rows if document_requirements changed
    if (req.body.document_requirements !== undefined) {
      const newDocIds = req.body.document_requirements;
      const existingRows = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE import_project_id = ?').all(req.params.id);
      const existingDocIds = existingRows.map(r => r.master_dokumen_id);
      
      // Add new docs
      const insertLink = db.prepare('INSERT OR IGNORE INTO import_project_documents (import_project_id, dokumen_id) VALUES (?, ?)');
      const insertMon = db.prepare('INSERT INTO dokumen_monitoring_baris (import_project_id, master_dokumen_id) VALUES (?, ?)');
      for (const docId of newDocIds) {
        if (!existingDocIds.includes(docId)) {
          insertLink.run(req.params.id, docId);
          insertMon.run(req.params.id, docId);
        }
      }
      // Remove docs no longer needed (only if row has no progress)
      for (const row of existingRows) {
        if (!newDocIds.includes(row.master_dokumen_id)) {
          const hasProgress = row.draft_received_date || row.draft_confirmed_date || row.scan_original_receive_date || row.awb_no;
          if (!hasProgress) {
            db.prepare('DELETE FROM dokumen_monitoring_baris WHERE id = ?').run(row.id);
            db.prepare('DELETE FROM import_project_documents WHERE import_project_id = ? AND dokumen_id = ?').run(req.params.id, row.master_dokumen_id);
          }
        }
      }
    }
    res.json(db.prepare('SELECT * FROM import_projects WHERE id = ?').get(req.params.id));
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

// --- 6.5. DOKUMEN MONITORING ---
app.get('/api/dokumen-monitoring/summary', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM import_projects ORDER BY created_at DESC').all();
    const countStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN draft_confirmed_date IS NOT NULL AND scan_original_receive_date IS NOT NULL THEN 1 ELSE 0 END) as complete
      FROM dokumen_monitoring_baris WHERE import_project_id = ?
    `);
    const result = projects.map(p => {
      const counts = countStmt.get(p.id);
      return { ...p, doc_complete: counts?.complete || 0, doc_total: counts?.total || 0 };
    });
    res.json(result);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/dokumen-monitoring', (req, res) => {
  try {
    const { import_project_id } = req.query;
    if (!import_project_id) return res.status(400).json({ error: 'import_project_id required' });
    const rows = db.prepare(`
      SELECT dmb.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      LEFT JOIN users u ON u.id = dmb.draft_confirmed_by_id
      WHERE dmb.import_project_id = ?
      ORDER BY md.kode_dokumen ASC
    `).all(import_project_id);
    res.json(rows);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.patch('/api/dokumen-monitoring/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Row not found' });
    
    const allowedFields = ['draft_received_date', 'draft_confirmed_date', 'awb_no', 'scan_original_receive_date', 'shared_departemen'];
    const { diubah_oleh_id } = req.body;
    
    db.transaction(() => {
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          const oldVal = row[field];
          const newVal = field === 'shared_departemen' ? JSON.stringify(req.body[field]) : req.body[field];
          db.prepare(`UPDATE dokumen_monitoring_baris SET ${field} = ?, last_updated_by_id = ?, updated_at = datetime("now") WHERE id = ?`)
            .run(newVal, diubah_oleh_id || null, req.params.id);
          // Audit trail
          db.prepare('INSERT INTO dokumen_monitoring_riwayat (baris_id, field_diubah, nilai_lama, nilai_baru, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)')
            .run(req.params.id, field, oldVal || null, newVal || null, diubah_oleh_id || null);
        }
      }
    })();
    
    const updated = db.prepare(`
      SELECT dmb.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      LEFT JOIN users u ON u.id = dmb.draft_confirmed_by_id
      WHERE dmb.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.post('/api/dokumen-monitoring/:id/confirm', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM dokumen_monitoring_baris WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Row not found' });
    if (!row.draft_received_date) return res.status(400).json({ error: 'Draft Received Date harus diisi terlebih dahulu' });
    if (row.draft_confirmed_date) return res.status(400).json({ error: 'Sudah dikonfirmasi sebelumnya' });
    
    const { user_id } = req.body;
    const now = new Date().toISOString().split('T')[0];
    
    db.transaction(() => {
      db.prepare('UPDATE dokumen_monitoring_baris SET draft_confirmed_date = ?, draft_confirmed_by_id = ?, last_updated_by_id = ?, updated_at = datetime("now") WHERE id = ?')
        .run(now, user_id, user_id, req.params.id);
      db.prepare('INSERT INTO dokumen_monitoring_riwayat (baris_id, field_diubah, nilai_lama, nilai_baru, diubah_oleh_id) VALUES (?, ?, ?, ?, ?)')
        .run(req.params.id, 'draft_confirmed_date', null, now, user_id);
    })();
    
    const updated = db.prepare(`
      SELECT dmb.*, md.kode_dokumen, md.nama_dokumen, u.nama as confirmed_by_nama
      FROM dokumen_monitoring_baris dmb
      JOIN master_data_dokumen md ON md.id = dmb.master_dokumen_id
      LEFT JOIN users u ON u.id = dmb.draft_confirmed_by_id
      WHERE dmb.id = ?
    `).get(req.params.id);
    res.json(updated);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

app.get('/api/dokumen-monitoring/:id/riwayat', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT dmr.*, u.nama as diubah_oleh_nama
      FROM dokumen_monitoring_riwayat dmr
      LEFT JOIN users u ON u.id = dmr.diubah_oleh_id
      WHERE dmr.baris_id = ?
      ORDER BY dmr.diubah_pada DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});

// --- 7. IMPORT SHIPMENTS & CONTAINERS ---

