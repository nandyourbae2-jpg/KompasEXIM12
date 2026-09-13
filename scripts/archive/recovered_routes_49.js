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

