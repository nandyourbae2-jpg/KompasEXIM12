app.get('/api/staff', (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM users WHERE level_otoritas = 'Staff Dept'").all());
  } catch (error) { res.status(500).json({ error: error.message }); }
});