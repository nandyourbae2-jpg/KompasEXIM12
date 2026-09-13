app.post('/api/import-projects', (req, res) => {
  try {
    const {
      task_unique_number,
      supplier,
      trade,
      import_type,
      shipment_term,
      invoice_no,
      bl_no,
      etd,
      eta,
      hs_code,
      free_time_destination,
      created_by_id,
      document_requirements
    } = req.body;

    const info = db.prepare(`
      INSERT INTO import_projects (task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id, document_requirements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task_unique_number,
      supplier,
      trade,
      import_type,
      shipment_term,
      invoice_no,
      bl_no,
      etd,
      eta,
      hs_code,
      free_time_destination,
      created_by_id,
      JSON.stringify(document_requirements || [])
    );

    const newProject = db.prepare('SELECT * FROM import_projects WHERE id = ?').get(info.lastInsertRowid);

    // Insert links to master documents
    if (Array.isArray(document_requirements) && document_requirements.length) {
      const insertStmt = db.prepare('INSERT INTO import_project_documents (import_project_id, dokumen_id) VALUES (?, ?)');
      const insertMany = db.transaction((ids) => {
        for (const id of ids) insertStmt.run(info.lastInsertRowid, id);
      });
      insertMany(document_requirements);
    }

    res.json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});