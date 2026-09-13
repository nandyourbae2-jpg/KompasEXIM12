const fs = require('fs');
const file = 'backend/index.js';
let content = fs.readFileSync(file, 'utf8');

const routeToInsert = `
app.get('/api/debit-notes/:id', authenticateToken, catchErrors((req, res) => {
  try {
    const dn = db.prepare(\`
      SELECT dn.*, ip.task_unique_number, ip.supplier as project_supplier, u.nama as dibuat_oleh_nama
      FROM debit_notes dn
      LEFT JOIN import_projects ip ON dn.import_project_id = ip.id
      LEFT JOIN users u ON dn.dibuat_oleh_id = u.id
      WHERE dn.id = ?
    \`).get(req.params.id);

    if (!dn) return res.status(404).json({ error: 'Debit Note tidak ditemukan' });

    // Ambil history
    const history = db.prepare(\`
      SELECT h.*, u.nama as diubah_oleh_nama
      FROM debit_note_history h
      LEFT JOIN users u ON h.diubah_oleh_id = u.id
      WHERE h.debit_note_id = ?
      ORDER BY h.diubah_pada DESC
    \`).all(dn.id);
    
    dn.history = history;
    res.json(dn);
  } catch (error) { res.status(500).json({ error: error.message }); }
}));
`;

content = content.replace("app.post('/api/debit-notes',", routeToInsert + "\napp.post('/api/debit-notes',");
fs.writeFileSync(file, content);
console.log('Patched');
