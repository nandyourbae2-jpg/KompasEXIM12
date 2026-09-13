const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 102, employee_id: 'SPV-AE-001', nama: 'Amal', level_otoritas: 'Supervisor', departemen: 'Administrasi Export' }, 'kompas_exim_super_secret_key');
fetch('http://localhost:3001/api/v2/source/imports?archived=false', {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => res.json()).then(console.log).catch(console.error);
