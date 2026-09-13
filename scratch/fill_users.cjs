const http = require('http');
const jwt = require('../backend/node_modules/jsonwebtoken');

const API = 'http://localhost:3001/api/v2';

function request(url, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fillUser(userId, empId, name) {
  console.log(`\n=== Generating token for ${name} (${empId}) ===`);
  const token = jwt.sign(
    { id: userId, employee_id: empId, role: 'Staff Dept', level_otoritas: 'Staff Dept', departemen: 'Administrasi Export' }, 
    'kompas_exim_super_secret_key'
  );
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  console.log(`Fetching jobs for ${name}...`);
  const jobsRes = await request(`${API}/ae/my-jobs`, { method: 'GET', headers });
  const jobs = jobsRes.data || jobsRes;
  
  if (!jobs || jobs.length === 0) {
    console.log(`No jobs found for ${name}.`);
    return;
  }

  for (const job of jobs) {
    console.log(`Processing Job ${job.id} (Invoice: ${job.invoice_no})...`);
    
    let hasPending = true;
    while (hasPending) {
      const workbenchRes = await request(`${API}/ae-workbench/jobs/${job.id}`, { method: 'GET', headers });
      const items = workbenchRes.data?.items || workbenchRes.items || [];
      
      const pendingItems = items.filter(i => i.next_action_mode === 'EXECUTE' || i.next_action_mode === 'REVISE');
      
      if (pendingItems.length === 0) {
        hasPending = false;
        console.log(`[OK] Job ${job.id} is fully completed! Handover is ready.`);
        break;
      }
      
      const item = pendingItems[0];
      const activityId = item.next_activity_id || (item.next_activity && item.next_activity.id) || null;
      console.log(` -> Completing Activity ${activityId} for Item ${item.id} (${item.nama_dokumen})...`);
      
      let payload = {
        activity_id: activityId,
        status: 'COMPLETED',
        result: JSON.stringify({ status: 'PASS', receivedFrom: 'System', generic_completed: true }),
        disposition: 'NONE',
        remark: `Auto-filled for testing handover (${name})`,
        evidence_path: null
      };

      const res = await request(`${API}/ae-workbench/jobs/${job.id}/items/${item.id}/execute`, { method: 'POST', headers }, payload);
      if (!res.success) {
        console.error("Failed to complete activity:", res);
        break;
      }
    }
  }
}

async function run() {
    await fillUser(107, 'AE-002', 'Wenny');
    await fillUser(108, 'AE-003', 'Ama');
}

run().catch(console.error);
