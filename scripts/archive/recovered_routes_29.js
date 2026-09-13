app.post('/api/import-projects', (req, res) => {
  try {
    const {
      task_unique_number, supplier, trade, import_type, shipment_term,
      invoice_no, po_co_no, bl_no, etd, eta, hs_code,
      free_time_destination, created_by_id, document_requirements
    } = req.body;

    if (!created_by_id) {
      return res.status(400).json({ error: 'created_by_id is required' });
    }

    let finalTaskNumber = task_unique_number;
    if (!finalTaskNumber) {
      const lastProject = db.prepare('SELECT task_unique_number FROM import_projects ORDER BY id DESC LIMIT 1').get();
      let nextNum = 1;
      if (lastProject && lastProject.task_unique_number) {
        const match = lastProject.task_unique_number.match(/IMP-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      finalTaskNumber = `IMP-${String(nextNum).padStart(4, '0')}`;
    }

    const projectId = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO import_projects (task_unique_number, supplier, trade, import_type, shipment_term, invoice_no, po_co_no, bl_no, etd, eta, hs_code, free_time_destination, created_by_id, document_requirements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        finalTaskNumber, supplier, trade, import_type, shipment_term,
        invoice_no, po_co_no || null, bl_no, etd, eta, hs_code,
        free_time_destination, created_by_id,
        JSON.stringify(document_requirements || [])
      );
      return info.lastInsertRowid;
    })();

    res.status(201).json({ id: projectId, task_unique_number: finalTaskNumber });
  } catch (error) {
    console.error('Error creating import project:', error);
    res.status(500).json({ error: error.message });
  }
});