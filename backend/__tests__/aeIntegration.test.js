const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const db = require('../src/database/db');
const AeWorkflowEngine = require('../src/services/AeWorkflowEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'kompas_exim_super_secret_key';

describe('AE Module End-to-End Release Readiness Integration Tests', () => {
  let staffToken;
  let spvToken;
  let unauthorizedStaffToken;
  let testJobId;

  const staffUser = {
    id: 101,
    employee_id: 'AE-001',
    nama: 'Monica',
    level_otoritas: 'Staff Dept',
    departemen: 'Administrasi Export'
  };

  const spvUser = {
    id: 102,
    employee_id: 'SPV-AE-001',
    nama: 'Amal',
    level_otoritas: 'Supervisor',
    departemen: 'Administrasi Export'
  };

  const otherStaffUser = {
    id: 107,
    employee_id: 'AE-002',
    nama: 'Wenny',
    level_otoritas: 'Staff Dept',
    departemen: 'Administrasi Export'
  };

  beforeAll(() => {
    staffToken = jwt.sign(staffUser, JWT_SECRET);
    spvToken = jwt.sign(spvUser, JWT_SECRET);
    unauthorizedStaffToken = jwt.sign(otherStaffUser, JWT_SECRET);

    // Create a clean test export_job
    const info = db.prepare(`
      INSERT INTO export_jobs (
        job_code, business_key, customer_code, product_type, invoice_no, buyer,
        closing_docs, closing_docs_time, etd, eta, vessel, destination, ae_status, ae_progress
      ) VALUES (
        'EXP-TEST-001', 'TEST-BK-001', 'CUST-TEST', 'LOIN', 'INV-TEST-001', 'BUYER-TEST',
        '2026-09-15', '12:00:00', '2026-09-20', '2026-09-30', 'TEST VESSEL', 'ROTTERDAM', 'Pending', 0
      )
    `).run();
    testJobId = info.lastInsertRowid;
  });

  afterAll(() => {
    // Clean up created test job and its related records
    if (testJobId) {
      const docIds = db.prepare('SELECT id FROM ae_job_documents WHERE job_id = ?').all(testJobId).map(d => d.id);
      if (docIds.length > 0) {
        const verIds = db.prepare(`SELECT id FROM ae_job_document_versions WHERE job_document_id IN (${docIds.map(() => '?').join(',')})`).all(...docIds).map(v => v.id);
        if (verIds.length > 0) {
          db.prepare(`DELETE FROM ae_job_document_activities WHERE job_document_version_id IN (${verIds.map(() => '?').join(',')})`).run(...verIds);
        }
        db.prepare(`DELETE FROM ae_job_document_versions WHERE job_document_id IN (${docIds.map(() => '?').join(',')})`).run(...docIds);
        db.prepare(`DELETE FROM ae_job_documents WHERE job_id = ?`).run(testJobId);
      }
      db.prepare('DELETE FROM ae_job_remarks WHERE job_id = ?').run(testJobId);
      db.prepare('DELETE FROM ae_job_assignments WHERE job_id = ?').run(testJobId);
      db.prepare('DELETE FROM export_jobs WHERE id = ?').run(testJobId);
    }
  });

  test('1. Supervisor queue returns newly created unassigned job', async () => {
    const res = await request(app)
      .get('/api/ae/supervisor/queue')
      .set('Authorization', `Bearer ${spvToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const unassigned = res.body.data.needsAssignment;
    const found = unassigned.find(j => j.id === testJobId);
    expect(found).toBeDefined();
    expect(found.ae_status).toBe('Pending');
  });

  test('2. RBAC: Staff Dept CANNOT access supervisor queue (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/ae/supervisor/queue')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message || res.body.error || res.body.errorCode).toBeDefined();
  });

  test('3. RBAC: Staff Dept CANNOT assign jobs (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/ae/supervisor/jobs/${testJobId}/assign`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ assignee_id: staffUser.id });

    expect(res.status).toBe(403);
  });

  test('4. Supervisor assigns job to AE-001 -> Checklist auto-generated in normalized tables', async () => {
    const res = await request(app)
      .post(`/api/ae/supervisor/jobs/${testJobId}/assign`)
      .set('Authorization', `Bearer ${spvToken}`)
      .send({ assignee_id: staffUser.id, remark: 'Assigning to Monica' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify DB state
    const job = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(testJobId);
    expect(job.ae_assignee_id).toBe(staffUser.id);
    expect(job.ae_status).toBe('Assigned');

    // Verify ae_job_assignments recorded
    const assignment = db.prepare('SELECT * FROM ae_job_assignments WHERE job_id = ?').get(testJobId);
    expect(assignment).toBeDefined();
    expect(assignment.assigned_to_user_id).toBe(staffUser.id);
    expect(assignment.assigned_by_user_id).toBe(spvUser.id);

    // Verify normalized documents were created
    const docs = db.prepare('SELECT * FROM ae_job_documents WHERE job_id = ?').all(testJobId);
    expect(docs.length).toBeGreaterThan(0);

    // Verify activities were created
    const activities = db.prepare(`
      SELECT a.* FROM ae_job_document_activities a
      JOIN ae_job_document_versions v ON a.job_document_version_id = v.id
      JOIN ae_job_documents d ON v.job_document_id = d.id
      WHERE d.job_id = ?
    `).all(testJobId);
    expect(activities.length).toBeGreaterThan(0);
    expect(activities.every(a => a.status === 'PENDING')).toBe(true);
  });

  test('5. Staff AE-001 sees the job in my-jobs and context is populated', async () => {
    const res = await request(app)
      .get('/api/ae/my-jobs')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const myJob = res.body.data.find(j => j.id === testJobId);
    expect(myJob).toBeDefined();
    expect(myJob.progress).toBe(0);
    expect(myJob.pendingActionObj).toBeDefined();
    expect(myJob.pendingActionObj.activity_name).toBeDefined();
  });

  test('6. RBAC: Other staff AE-002 CANNOT mutate or execute AE-001 job (403 Forbidden)', async () => {
    const resRemark = await request(app)
      .post(`/api/ae/jobs/${testJobId}/remarks`)
      .set('Authorization', `Bearer ${unauthorizedStaffToken}`)
      .send({ remark: 'Unauthorized remark' });

    expect(resRemark.status).toBe(403);
    expect(resRemark.body.error).toContain('Access forbidden');

    const resExec = await request(app)
      .post(`/api/ae/jobs/${testJobId}/items/1/execute`)
      .set('Authorization', `Bearer ${unauthorizedStaffToken}`)
      .send({ result: 'PASS' });

    expect(resExec.status).toBe(403);
    expect(resExec.body.error).toContain('Access forbidden');
  });

  test('7. Staff AE-001 adds remark and executes first activity -> Progress updates to > 0', async () => {
    // 1. Add remark
    const resRemark = await request(app)
      .post(`/api/ae/jobs/${testJobId}/remarks`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ remark: 'Dokumen invoice sudah siap verifikasi' });

    expect(resRemark.status).toBe(200);

    // Verify remark in DB
    const remark = db.prepare('SELECT * FROM ae_job_remarks WHERE job_id = ? ORDER BY created_at DESC LIMIT 1').get(testJobId);
    expect(remark.remark).toBe('Dokumen invoice sudah siap verifikasi');

    // 2. Fetch context to get first pending action
    const ctx = AeWorkflowEngine.getJobContext(testJobId);
    const targetAction = ctx.pendingActionObj;
    expect(targetAction).toBeDefined();

    // 3. Execute activity
    const resExec = await request(app)
      .post(`/api/ae/jobs/${testJobId}/items/${targetAction.id}/execute`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        activity_id: targetAction.id,
        result: 'PASS',
        remark: 'Aktivitas diverifikasi OK'
      });

    expect(resExec.status).toBe(200);
    expect(resExec.body.success).toBe(true);
    expect(resExec.body.data.progress).toBeGreaterThan(0);
    expect(resExec.body.data.status).toBe('In Progress');

    // 4. Verify DB updated
    const updatedJob = db.prepare('SELECT * FROM export_jobs WHERE id = ?').get(testJobId);
    expect(updatedJob.ae_progress).toBeGreaterThan(0);
    expect(updatedJob.ae_status).toBe('In Progress');

    const updatedActivity = db.prepare('SELECT * FROM ae_job_document_activities WHERE id = ?').get(targetAction.id);
    expect(updatedActivity.status).toBe('COMPLETED');
  });

  test('8. Staff my-work endpoint returns real database counts', async () => {
    const res = await request(app)
      .get('/api/ae/my-work')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.actionRequired).toBe('number');
    expect(typeof res.body.data.overdue).toBe('number');
    expect(typeof res.body.data.waitingBlocked).toBe('number');
    expect(typeof res.body.data.completed).toBe('number');
  });
});
