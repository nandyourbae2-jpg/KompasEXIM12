const jwt = require('jsonwebtoken');

async function run() {
  const token = jwt.sign({ employee_id: 'SPV-AE-01', level_otoritas: 'Supervisor', departemen: 'Administrasi Export' }, 'kompas_exim_super_secret_key');
  const res = await fetch('http://localhost:3001/api/v2/source/imports?archived=false', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Status:', res.status);
  console.log('Cache-Control:', res.headers.get('cache-control'));
  console.log('Pragma:', res.headers.get('pragma'));
  console.log('Expires:', res.headers.get('expires'));
}
run();
