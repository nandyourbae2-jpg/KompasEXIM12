const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 102, level_otoritas: 'Supervisor', departemen: 'Administrasi Export' }, 'kompas_exim_super_secret_key');

fetch('http://localhost:3001/api/v2/ae-assignment/assign', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ export_job_id: 1, staff_id: 101, reason: "Automated test" })
}).then(res => res.json()).then(console.log).catch(console.error);
