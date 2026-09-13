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