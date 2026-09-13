const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const JWT_SECRET = process.env.JWT_SECRET || 'kompas_exim_super_secret_key';

app.post('/api/login', (req, res) => {
  const { employee_id, password } = req.body;
  if (!employee_id || !password) return res.status(400).json({ error: 'Employee ID dan Password wajib diisi' });
  const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
  if (!user) return res.status(401).json({ error: 'Employee ID tidak ditemukan' });
  
  // Backwards compatibility if password_hash is not hashed yet, or compare bcrypt
  let isValid = false;
  try {
    isValid = bcrypt.compareSync(password, user.password_hash);
  } catch(e) {
    isValid = (user.password_hash === password);
  }
  if (!isValid && user.password_hash !== password) return res.status(401).json({ error: 'Kredensial tidak valid' });
  
  if (user.status_aktif === 0) return res.status(403).json({ error: 'Akun ini sudah tidak aktif, hubungi Supervisor Anda' });
  const { password_hash: _, ...userWithoutPassword } = user;
  userWithoutPassword.status_aktif = Boolean(userWithoutPassword.status_aktif);
  
  const token = jwt.sign(
    { id: user.id, employee_id: user.employee_id, level_otoritas: user.level_otoritas, departemen: user.departemen },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.status(200).json({ user: userWithoutPassword, token });
});

// Middleware Authentikasi
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    req.user = user;
    next();
  });
}