const jwt = require('jsonwebtoken');

async function run() {
  const token = jwt.sign({ employee_id: 'SPV-AE-01', level_otoritas: 'Supervisor', departemen: 'Administrasi Export' }, 'kompas_exim_super_secret_key');
  const res = await fetch('http://localhost:3001/api/v2/source/imports/active/changes?_t=123', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  console.log(json);
}
run();
