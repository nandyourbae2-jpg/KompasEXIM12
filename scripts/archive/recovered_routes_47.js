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
          AND departemen = ?
          AND status_aktif = 1
        ORDER BY nama ASC
      `).all(departemen);
    } else if (level_otoritas === 'Manager') {
      rows = db.prepare(`
        SELECT id, nama, employee_id, departemen, tipe_karyawan
        FROM users
        WHERE level_otoritas IN ('Supervisor', 'SPV Dept')
          AND status_aktif = 1
        ORDER BY departemen ASC, nama ASC
      `).all();
    } else {
      rows = [];
    }
    res.json(rows);
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});