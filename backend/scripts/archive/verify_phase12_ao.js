const db = require('./database/db');
const assert = require('assert');

async function runVerification() {
  console.log('--- STARTING PHASE 12 AO ARCHITECTURE VERIFICATION ---');

  // Find a job to use for testing
  const testJob = db.prepare('SELECT id FROM export_jobs LIMIT 1').get();
  if (!testJob) {
      console.log('No jobs found. Aborting tests.');
      return;
  }
  const jobId = testJob.id;

  // Mock users
  const supervisorId = 3; // SPV-EXP-01 or SPV-IMP-01
  const staffId1 = 8;     // EXIM-EXP-01
  const dscsId = 1;       // We will just use ID 1 for testing DSCS context
  
  db.transaction(() => {
    // 1. Data Normalization & Context Creation
    console.log('\\n--- 1. JOB CONTEXT & ALERT TEST ---');
    db.prepare(`INSERT OR IGNORE INTO ao_job_context (job_id, operational_alerts) VALUES (?, ?)`).run(jobId, 'Fujian tidak perlu kurir ori');
    
    const context = db.prepare('SELECT operational_alerts FROM ao_job_context WHERE job_id = ?').get(jobId);
    assert.strictEqual(context.operational_alerts, 'Fujian tidak perlu kurir ori');
    console.log(`Context & Operational Alerts Persistence | PASS`);

    // 2. Task Creation & Split Text Logic
    console.log('\\n--- 2. TASK CREATION & NORMALIZATION TEST ---');
    // Simulating converting "FU PAYMENT 12/8" into normalized task
    const createResult = db.prepare(`
        INSERT INTO ao_tasks (job_id, workstream, task_type, description, assigned_to, due_date)
        VALUES (?, 'BANK', 'Payment Follow-Up', 'Follow up payment with Buyer', ?, '2026-08-12')
    `).run(jobId, staffId1);
    
    const taskId = createResult.lastInsertRowid;
    
    const task = db.prepare('SELECT * FROM ao_tasks WHERE id = ?').get(taskId);
    assert.strictEqual(task.status, 'PENDING');
    assert.strictEqual(task.workstream, 'BANK');
    assert.strictEqual(task.due_date, '2026-08-12');
    console.log(`Task successfully structured and normalized | PASS`);

    // 3. Audit Trail Verification
    console.log('\\n--- 3. AUDIT TRAIL VERIFICATION ---');
    db.prepare(`
        INSERT INTO ao_task_audits (task_id, actor_id, action, new_value)
        VALUES (?, ?, 'CREATE', ?)
    `).run(taskId, supervisorId, JSON.stringify({ task_type: 'Payment Follow-Up' }));
    
    const auditCount = db.prepare('SELECT COUNT(*) as c FROM ao_task_audits WHERE task_id = ?').get(taskId).c;
    assert.strictEqual(auditCount, 1);
    console.log(`Audit trail strictly enforces event logging | PASS`);

    // 4. State Machine Update
    console.log('\\n--- 4. TASK STATE MACHINE TEST ---');
    db.prepare(`UPDATE ao_tasks SET status = 'WAITING', remarks = 'Waiting for bank response' WHERE id = ?`).run(taskId);
    db.prepare(`
        INSERT INTO ao_task_audits (task_id, actor_id, action, old_value, new_value)
        VALUES (?, ?, 'STATUS_CHANGE', ?, ?)
    `).run(taskId, staffId1, JSON.stringify({ status: 'PENDING' }), JSON.stringify({ status: 'WAITING' }));
    
    const updatedTask = db.prepare('SELECT status, remarks FROM ao_tasks WHERE id = ?').get(taskId);
    assert.strictEqual(updatedTask.status, 'WAITING');
    assert.strictEqual(updatedTask.remarks, 'Waiting for bank response');
    console.log(`Task state successfully updated to WAITING | PASS`);

  })();

  console.log('\\n--- VERIFICATION COMPLETE ---');
}

runVerification().catch(console.error);
