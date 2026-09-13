  if (!isValid && user.password_hash !== password) {
    console.log("INVALID CREDENTIALS", employee_id, password, user.password_hash);
    return res.status(401).json({ error: 'Kredensial tidak valid' });
  }
  
  if (!user.status_aktif || user.status_aktif == 0) return res.status(403).json({ error: 'Akun ini sudah tidak aktif, hubungi Supervisor Anda' });