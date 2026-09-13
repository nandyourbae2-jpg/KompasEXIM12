const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 101, employee_id: 'AE-001', role: 'Staff Dept', level_otoritas: 'Staff Dept', departemen: 'Administrasi Export' }, 'kompas_exim_super_secret_key');

fetch('http://127.0.0.1:3001/api/v2/ae-workbench/jobs/108', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
}).then(res => res.json()).then(console.log).catch(console.error);
