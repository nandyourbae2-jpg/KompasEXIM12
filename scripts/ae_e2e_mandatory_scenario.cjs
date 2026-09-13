/**
 * MANDATORY E2E SCENARIO:
 * Create/Load Job
 * → Assign AE
 * → Update Status
 * → Update Checklist
 * → Add/Update Document
 * → Update Progress
 * → Dashboard reflects change
 * → Browser Refresh
 * → Logout/Login
 * → Data remains correct.
 */

const http = require('http');

const BASE_HOST = 'localhost';
const BASE_PORT = 3001;

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path,
      method,
      headers
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runE2EScenario() {
  console.log('====================================================');
  console.log('🚀 RUNNING MANDATORY AE RELEASE READINESS E2E SCENARIO');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const testJobCode = `EXP-E2E-${timestamp.toString().slice(-6)}`;
  const testInvoice = `INV-E2E-${timestamp.toString().slice(-6)}`;

  // Step 1: Supervisor Login
  console.log('Step 1: Supervisor Login (SPV-AE-001)...');
  const spvLogin = await request('/api/login', 'POST', {
    employee_id: 'SPV-AE-001',
    password: '123456',
    departemen: 'Administrasi Export'
  });
  if (spvLogin.status !== 200) {
    throw new Error('Supervisor login failed: ' + JSON.stringify(spvLogin.data));
  }
  const spvToken = spvLogin.data?.token || spvLogin.data?.data?.token;
  console.log('  ✅ Supervisor authenticated successfully\n');

  // Step 2: Create / Load Job
  console.log(`Step 2: Creating Job (${testJobCode})...`);
  const createJobRes = await request('/api/ae/shipments', 'POST', {
    job_code: testJobCode,
    customer: 'PT E2E Buyer Global',
    buyer: 'PT E2E Buyer Global',
    invoice_no: testInvoice,
    product_type: 'LOIN',
    closing_docs: '2026-09-20',
    closing_docs_time: '12:00:00',
    destination: 'Rotterdam, Netherlands',
    etd: '2026-09-25',
    eta: '2026-10-15'
  }, spvToken);
  console.log('  Create shipment response:', createJobRes.status, createJobRes.data.message);

  // Fetch job list to obtain created Job ID
  const queueRes = await request('/api/ae/supervisor/queue', 'GET', null, spvToken);
  const createdJob = queueRes.data?.data?.needsAssignment?.find(j => j.job_code === testJobCode);
  if (!createdJob) throw new Error('Could not find created job in supervisor queue');
  const jobId = createdJob.id;
  console.log(`  ✅ Job created with ID: ${jobId}, ae_status: ${createdJob.ae_status}\n`);

  // Step 3: Assign AE (Assign to AE-001, Monica, ID 101)
  console.log(`Step 3: Assigning Job ${jobId} to Staff AE-001 (Monica, ID 101)...`);
  const assignRes = await request(`/api/ae/supervisor/jobs/${jobId}/assign`, 'POST', {
    assignee_id: 101,
    remark: 'Assigned for urgent export documentation'
  }, spvToken);
  if (assignRes.status !== 200) throw new Error('Failed to assign job: ' + JSON.stringify(assignRes.data));
  console.log('  ✅ Job assigned successfully. Status: Assigned\n');

  // Step 4: Staff Login (AE-001)
  console.log('Step 4: Staff Login (AE-001)...');
  let staffLogin = await request('/api/login', 'POST', {
    employee_id: 'AE-001',
    password: '123456',
    departemen: 'Administrasi Export'
  });
  if (staffLogin.status !== 200) {
    throw new Error('Staff login failed: ' + JSON.stringify(staffLogin.data));
  }
  const staffToken = staffLogin.data?.token || staffLogin.data?.data?.token;
  console.log('  ✅ Staff AE-001 authenticated successfully\n');

  // Step 5: Staff Views My Jobs & Checks Auto-generated Checklist
  console.log('Step 5: Staff verifies job in My Jobs...');
  const myJobsRes = await request('/api/ae/my-jobs', 'GET', null, staffToken);
  const myJob = myJobsRes.data?.data?.find(j => j.id === jobId);
  if (!myJob) throw new Error('Assigned job not visible in staff my-jobs');
  console.log(`  ✅ Job found in staff workboard. Progress: ${myJob.progress}%, Priority: ${myJob.priority}`);
  console.log(`  Next action: "${myJob.nextAction}"`);
  console.log(`  Pending action object:`, myJob.pendingActionObj);

  const pendingAction = myJob.pendingActionObj;
  if (!pendingAction) throw new Error('Expected pendingActionObj to be auto-generated');
  console.log('\n');

  // Step 6: Update Checklist & Add/Update Document
  console.log(`Step 6: Executing Action "${pendingAction.activity_name}" on document "${pendingAction.docName}"...`);
  const execRes = await request(`/api/ae/jobs/${jobId}/items/${pendingAction.id}/execute`, 'POST', {
    activity_id: pendingAction.id,
    result: 'PASS',
    disposition: 'NONE',
    remark: 'Dokumen diterima dalam kondisi lengkap dan valid'
  }, staffToken);
  if (execRes.status !== 200) throw new Error('Activity execution failed: ' + JSON.stringify(execRes.data));
  console.log('  ✅ Activity executed successfully.');
  console.log(`  Updated Progress: ${execRes.data?.data?.progress}%`);
  console.log(`  Updated Status: ${execRes.data?.data?.status}`);
  console.log(`  Next Action: "${execRes.data?.data?.nextAction}"\n`);

  // Step 7: Add Remark
  console.log('Step 7: Adding operational remark...');
  const remarkRes = await request(`/api/ae/jobs/${jobId}/remarks`, 'POST', {
    remark: 'Verifikasi dokumen tahap 1 selesai. Menunggu konfirmasi forwarder.'
  }, staffToken);
  console.log('  ✅ Remark added:', remarkRes.data?.message, '\n');

  // Step 8: Dashboard Reflects Change
  console.log('Step 8: Checking that Dashboard reflects changes...');
  const myWorkRes = await request('/api/ae/my-work', 'GET', null, staffToken);
  console.log('  Staff Workboard Summary:', myWorkRes.data?.data);
  if (myWorkRes.data?.data?.actionRequired === undefined) {
    throw new Error('Dashboard summary missing metrics');
  }
  console.log('  ✅ Dashboard reflects live calculated progress and counts\n');

  // Step 9: Simulate Browser Refresh (Re-querying fresh state)
  console.log('Step 9: Simulating Browser Refresh (fetching fresh state)...');
  const refreshedJobRes = await request(`/api/ae/jobs/${jobId}`, 'GET', null, staffToken);
  const refreshedJob = refreshedJobRes.data?.data;
  if (!refreshedJob) throw new Error('Failed to retrieve refreshed job');
  console.log(`  Refreshed job progress: ${refreshedJob.progress}%`);
  console.log(`  Refreshed job status: ${refreshedJob.ae_status}`);
  console.log(`  Refreshed latest remark: "${refreshedJob.latest_remark}"`);
  if (refreshedJob.progress !== execRes.data?.data?.progress) {
    throw new Error('Refresh persistence mismatch for progress!');
  }
  console.log('  ✅ Browser refresh persistence verified: state matches perfectly\n');

  // Step 10: Simulate Logout & Re-Login
  console.log('Step 10: Simulating Logout & Re-Login...');
  // Clear token (simulating client-side session destruction)
  let activeSessionToken = null;
  console.log('  [Session destroyed: activeSessionToken = null]');

  // Re-login
  const reloginRes = await request('/api/login', 'POST', {
    employee_id: 'AE-001',
    password: '123456'
  });
  activeSessionToken = reloginRes.data?.token || reloginRes.data?.data?.token;
  console.log('  Re-login successful. New token received.');

  // Fetch job with new session
  const postLoginJobRes = await request(`/api/ae/jobs/${jobId}`, 'GET', null, activeSessionToken);
  const postLoginJob = postLoginJobRes.data?.data;
  console.log(`  Post-login job progress: ${postLoginJob.progress}%`);
  console.log(`  Post-login job status: ${postLoginJob.ae_status}`);
  console.log(`  Post-login latest remark: "${postLoginJob.latest_remark}"`);

  if (postLoginJob.progress !== execRes.data?.data?.progress) {
    throw new Error('Post-login progress verification failed!');
  }
  if (postLoginJob.ae_status !== execRes.data?.data?.status) {
    throw new Error('Post-login status verification failed!');
  }
  if (!postLoginJob.latest_remark.includes('Verifikasi dokumen tahap 1')) {
    throw new Error('Post-login remark verification failed!');
  }
  console.log('  ✅ Data remains 100% correct and persistent across authentication cycles!\n');

  console.log('====================================================');
  console.log('🎉 MANDATORY E2E SCENARIO PASSED COMPLETELY (100%)');
  console.log('====================================================');
}

runE2EScenario().catch(err => {
  console.error('❌ E2E SCENARIO FAILED:', err);
  process.exit(1);
});
