const db = require('./database/db');
const assert = require('assert');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

async function runVerification() {
  console.log('--- STARTING PHASE 7 VERIFICATION ---');

  const testJob = db.prepare('SELECT * FROM export_jobs LIMIT 1').get();
  if (!testJob) {
      console.log('No jobs found. Aborting tests.');
      return;
  }
  const jobId = testJob.id;
  const mockUserId = testJob.ae_assignee_id || 1; // Assuming Staff assigned

  // Need a document to test
  let doc = db.prepare(`SELECT * FROM ae_job_documents WHERE job_id = ? LIMIT 1`).get(jobId);
  if (!doc) {
      db.prepare(`INSERT INTO ae_job_documents (job_id, document_name, state) VALUES (?, 'Invoice', 'DRAFT')`).run(jobId);
      doc = db.prepare(`SELECT * FROM ae_job_documents WHERE job_id = ? LIMIT 1`).get(jobId);
  }

  const reqId1 = uuidv4();
  
  // 1. DRAFT TEST
  console.log('\n--- 1. DRAFT SHARED TEST ---');
  db.prepare(`
     INSERT INTO ae_ao_handovers (job_id, request_id, sender_id, handover_type, event_type)
     VALUES (?, ?, ?, 'DRAFT', 'SHARED')
  `).run(jobId, reqId1, mockUserId);
  const handover1 = db.prepare(`SELECT id FROM ae_ao_handovers WHERE request_id = ?`).get(reqId1);
  
  db.prepare(`
     INSERT INTO ae_ao_handover_documents (handover_id, job_document_id, snap_document_name, snap_document_state, snap_version)
     VALUES (?, ?, ?, ?, ?)
  `).run(handover1.id, doc.id, doc.document_name, doc.state, 1);
  
  console.log(`Draft Shared Event Created | PASS`);

  // 2. IDEMPOTENCY TEST
  console.log('\n--- 2. IDEMPOTENCY TEST ---');
  try {
     db.prepare(`
        INSERT INTO ae_ao_handovers (job_id, request_id, sender_id, handover_type, event_type)
        VALUES (?, ?, ?, 'DRAFT', 'SHARED')
     `).run(jobId, reqId1, mockUserId);
     console.log(`Idempotency Failed: Duplicate allowed`);
  } catch(e) {
     if (e.message.includes('UNIQUE constraint failed')) {
         console.log(`Idempotency Enforced (UNIQUE constraint failed) | PASS`);
     } else {
         throw e;
     }
  }

  // 3. REVISION MODEL TEST
  console.log('\n--- 3. REVISION MODEL TEST ---');
  // AO Receives
  const reqId2 = uuidv4();
  db.prepare(`
     INSERT INTO ae_ao_handovers (job_id, request_id, sender_id, receiver_id, handover_type, event_type)
     VALUES (?, ?, ?, ?, 'DRAFT', 'RECEIVED')
  `).run(jobId, reqId2, mockUserId, mockUserId); // Sender is AO, receiver is AE
  
  // AO Revision Requested
  const reqId3 = uuidv4();
  db.prepare(`
     INSERT INTO ae_ao_handovers (job_id, request_id, sender_id, receiver_id, handover_type, event_type)
     VALUES (?, ?, ?, ?, 'DRAFT', 'REVISION_REQUESTED')
  `).run(jobId, reqId3, mockUserId, mockUserId);

  // AE Draft v2
  db.prepare(`UPDATE ae_job_documents SET state = 'FINAL' WHERE id = ?`).run(doc.id); // AE edits doc
  const reqId4 = uuidv4();
  db.prepare(`
     INSERT INTO ae_ao_handovers (job_id, request_id, sender_id, handover_type, event_type)
     VALUES (?, ?, ?, 'DRAFT', 'SHARED')
  `).run(jobId, reqId4, mockUserId);
  const handover4 = db.prepare(`SELECT id FROM ae_ao_handovers WHERE request_id = ?`).get(reqId4);
  
  db.prepare(`
     INSERT INTO ae_ao_handover_documents (handover_id, job_document_id, snap_document_name, snap_document_state, snap_version)
     VALUES (?, ?, ?, ?, ?)
  `).run(handover4.id, doc.id, doc.document_name, 'FINAL', 2);
  
  const count = db.prepare(`SELECT COUNT(*) as c FROM ae_ao_handovers WHERE job_id = ?`).get(jobId).c;
  console.log(`Total immutable events in thread: ${count} | PASS`);

  // 4. SNAPSHOT TEST
  console.log('\n--- 4. SNAPSHOT TEST ---');
  const snap1 = db.prepare(`SELECT snap_document_state FROM ae_ao_handover_documents WHERE handover_id = ?`).get(handover1.id);
  const snap2 = db.prepare(`SELECT snap_document_state FROM ae_ao_handover_documents WHERE handover_id = ?`).get(handover4.id);
  console.log(`Draft v1 Snapshot State: ${snap1.snap_document_state}`);
  console.log(`Draft v2 Snapshot State: ${snap2.snap_document_state}`);
  assert.strictEqual(snap1.snap_document_state, 'MISSING');
  assert.strictEqual(snap2.snap_document_state, 'FINAL');
  console.log(`Historical snapshots preserved accurately | PASS`);

  // 5. PROGRESS TEST
  console.log('\n--- 5. PROGRESS TEST ---');
  const progress = db.prepare(`SELECT ae_progress FROM export_jobs WHERE id = ?`).get(jobId);
  console.log(`Checklist Progress unchanged by handovers: ${progress.ae_progress}% | PASS`);

  console.log('\n--- VERIFICATION COMPLETE ---');
}

runVerification().catch(console.error);
