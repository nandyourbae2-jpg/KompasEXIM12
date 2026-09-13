const jwt = require('jsonwebtoken');

async function run() {
  const token = jwt.sign({ id: 1, role: 'Manager', level_otoritas: 'Manager', departemen: 'Administrasi Export' }, 'kompas_exim_super_secret_key');
  const res = await fetch('http://localhost:3001/api/v2/ae-assignment/unassigned', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  console.log('Unassigned jobs:', JSON.stringify(json, null, 2));

  // Test the workbench endpoint with the job we seeded
  const res2 = await fetch('http://localhost:3001/api/v2/ae-workbench/jobs/1', { // Assuming job 1 exists
    headers: { Authorization: `Bearer ${token}` }
  });
  const json2 = await res2.json();
  console.log('Workbench Job 1:', JSON.stringify(json2, null, 2));
}
run();
