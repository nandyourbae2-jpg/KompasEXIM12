app.post('/api/login', (req, res) => {
  const { employee_id, password, departemen } = req.body;
  if (!employee_id || !password) return res.status(400).json({ error: 'Data tidak lengkap' });

  console.log("DB USERS:", db.prepare("SELECT employee_id FROM users").all());

  const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
  if (!user) return res.status(401).json({ error: 'Kredensial tidak valid' });