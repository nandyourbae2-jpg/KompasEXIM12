const request = require('supertest');
jest.mock('../src/database/db', () => require('./mockDb'));
const db = require('./mockDb');
const app = require('../index');

describe('Workstream 7: Strict OCC Financials', () => {
  let token;
  let pibId;
  let dnId;

  beforeEach(async () => {
    // Generate valid login token
    const res = await request(app)
      .post('/api/login')
      .send({ employee_id: 'EXIM-IMP-05', password: '123456' });
    token = res.body.token;

    // Insert dummy import project
    db.prepare(`
      INSERT INTO import_projects (id, task_unique_number, supplier, import_type)
      VALUES (1, 'TEST-PROJ', 'Supplier A', 'Raw Material')
      ON CONFLICT(id) DO NOTHING
    `).run();
    const projId = 1;

    // Create a draft PIB Request for testing
    const insertPib = db.prepare(`
      INSERT INTO pib_requests (request_number, aju_pib, kasbon_diminta, status, version, import_project_id)
      VALUES (?, ?, ?, 'Draft', 1, ?)
    `).run('TEST-PIB-OCC', 'AJU-TEST-OCC', 5000000, projId);
    pibId = insertPib.lastInsertRowid;

    // Create a draft Debit Note for testing
    const insertDn = db.prepare(`
      INSERT INTO debit_notes (dn_number, claim_kategori, claim_jenis, claim_kepada, jumlah_klaim, status, version, import_project_id, deskripsi)
      VALUES (?, ?, ?, ?, ?, 'Draft', 1, ?, 'Dummy Description')
    `).run('TEST-DN-OCC', 'Claim Supplier', 'Quality', 'Supplier A', 200000, projId);
    dnId = insertDn.lastInsertRowid;
  });

  afterEach(() => {
    db.prepare('DELETE FROM pib_requests WHERE request_number = ?').run('TEST-PIB-OCC');
    db.prepare('DELETE FROM debit_notes WHERE dn_number = ?').run('TEST-DN-OCC');
    db.prepare('DELETE FROM import_projects WHERE task_unique_number = ?').run('TEST-PROJ');
  });

  describe('Missing version -> 400', () => {
    test('PATCH /pib-requests/:id/submit without version', async () => {
      const res = await request(app)
        .patch(`/api/pib-requests/${pibId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({}); // missing version

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/version is required/i);
    });

    test('PATCH /debit-notes/:id without version', async () => {
      const res = await request(app)
        .patch(`/api/debit-notes/${dnId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ jumlah_klaim: 300000 }); // missing version

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/version is required/i);
    });
  });

  describe('Stale version -> 409', () => {
    test('PATCH /pib-requests/:id/submit with stale version', async () => {
      const res = await request(app)
        .patch(`/api/pib-requests/${pibId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ version: 0 }); // Current is 1

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/modified by another transaction/i);
    });
  });

  describe('Correct version -> 200 and version increments', () => {
    test('PATCH /debit-notes/:id with correct version', async () => {
      // Current version is 1
      const res = await request(app)
        .patch(`/api/debit-notes/${dnId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          claim_kategori: 'Claim Supplier',
          claim_jenis: 'Quality',
          claim_kepada: 'Supplier A',
          jumlah_klaim: 300000,
          deskripsi: 'Update claim',
          mata_uang: 'IDR',
          tanggal_dn: '2026-08-10',
          version: 1 
        });

      expect(res.status).toBe(200);

      // Verify version incremented in DB
      const row = db.prepare('SELECT version, jumlah_klaim FROM debit_notes WHERE id = ?').get(dnId);
      expect(row.version).toBe(2);
      expect(row.jumlah_klaim).toBe(300000);
    });
  });

  describe('Concurrent requests (Race condition)', () => {
    test('Two concurrent updates with same version', async () => {
      // current version is 1 for dnId (reset by beforeEach)
      const req1 = request(app)
        .patch(`/api/debit-notes/${dnId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status_ke: 'Diterbitkan', version: 1 });

      const req2 = request(app)
        .patch(`/api/debit-notes/${dnId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status_ke: 'Ditolak', catatan: 'Tolak', version: 1 });

      const [res1, res2] = await Promise.all([req1, req2]);
      console.log('RES1:', res1.status, res1.body);
      console.log('RES2:', res2.status, res2.body);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one success (200) and one conflict (409)
      expect(statuses).toEqual([200, 409]);

      // Final version in DB should be 2 (incremented once)
      const row = db.prepare('SELECT version FROM debit_notes WHERE id = ?').get(dnId);
      expect(row.version).toBe(2);
    });
  });

  describe('Workstream 8: Expanded OCC Financials', () => {
    let frId, joId, mtbId, pibId;
    beforeEach(() => {
      const insertFr = db.prepare(`
        INSERT INTO financial_requests (request_number, jenis_pengajuan, estimasi_nominal, status, version, import_project_id)
        VALUES (?, 'Test Req', 1000000, 'Draft', 1, 1)
      `).run('TEST-FR-OCC');
      frId = insertFr.lastInsertRowid;

      const insertJo = db.prepare(`
        INSERT INTO job_orders (job_order_code, cost_type, total_invoice, total_paid, version)
        VALUES (?, 'Other', 5000000, 0, 1)
      `).run('TEST-JO-OCC');
      joId = insertJo.lastInsertRowid;

      const insertMtb = db.prepare(`
        INSERT INTO realisasi_mtb_periode (nama_periode, tanggal_mulai, tanggal_selesai, status, version)
        VALUES (?, '2026-08-01', '2026-08-31', 'Draft', 1)
      `).run('TEST-MTB-OCC');
      mtbId = insertMtb.lastInsertRowid;

      const insertPib = db.prepare(`
        INSERT INTO realisasi_pib (no_kas, tgl_payment, status, version)
        VALUES (?, '2026-08-10', 'Draft', 1)
      `).run('TEST-REALISASI-PIB');
      pibId = insertPib.lastInsertRowid;
    });

    afterEach(() => {
      db.prepare('DELETE FROM financial_requests WHERE request_number = ?').run('TEST-FR-OCC');
      db.prepare('DELETE FROM job_orders WHERE job_order_code = ?').run('TEST-JO-OCC');
      db.prepare('DELETE FROM realisasi_mtb_periode WHERE nama_periode = ?').run('TEST-MTB-OCC');
      db.prepare('DELETE FROM realisasi_pib WHERE no_kas = ?').run('TEST-REALISASI-PIB');
    });

    test('PATCH /financial-requests/:id/submit without version', async () => {
      const res = await request(app)
        .patch(`/api/financial-requests/${frId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({}); // missing version

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/version is required/i);
    });

    test('PATCH /financial-requests/:id/submit with stale version', async () => {
      const res = await request(app)
        .patch(`/api/financial-requests/${frId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ version: 0 }); // Current is 1

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/modified by another transaction/i);
    });

    test('PATCH /financial-requests/:id/submit with correct version', async () => {
      const res = await request(app)
        .patch(`/api/financial-requests/${frId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ version: 1 });

      expect(res.status).toBe(200);

      // Verify version incremented in DB
      const row = db.prepare('SELECT version, status FROM financial_requests WHERE id = ?').get(frId);
      expect(row.version).toBe(2);
      expect(row.status).toBe('Submitted');
    });

    test('Two concurrent financial_request submissions with same version', async () => {
      const req1 = request(app).patch(`/api/financial-requests/${frId}/submit`).set('Authorization', `Bearer ${token}`).send({ version: 1 });
      const req2 = request(app).patch(`/api/financial-requests/${frId}/submit`).set('Authorization', `Bearer ${token}`).send({ version: 1 });

      const [res1, res2] = await Promise.all([req1, req2]);
      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 409]);

      const row = db.prepare('SELECT version FROM financial_requests WHERE id = ?').get(frId);
      expect(row.version).toBe(2);
    });

    test('Two concurrent job_order payments with same version (Race condition)', async () => {
      const req1 = request(app).post(`/api/job-orders/${joId}/payments`).set('Authorization', `Bearer ${token}`)
        .send({ jumlah_bayar: 1000000, tanggal_bayar: '2026-08-10', metode: 'Transfer', version: 1 });
      const req2 = request(app).post(`/api/job-orders/${joId}/payments`).set('Authorization', `Bearer ${token}`)
        .send({ jumlah_bayar: 2000000, tanggal_bayar: '2026-08-10', metode: 'Transfer', version: 1 });

      const [res1, res2] = await Promise.all([req1, req2]);
      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]); // One success, one failure

      // Check DB State
      const row = db.prepare('SELECT version, total_paid FROM job_orders WHERE id = ?').get(joId);
      expect(row.version).toBe(2);
      
      // Since exactly one succeeded, total_paid must be either 1000000 or 2000000 (deterministic avoiding double-counting)
      expect([1000000, 2000000]).toContain(row.total_paid);
    });

    test('Two concurrent MTB periode status updates', async () => {
      const req1 = request(app).patch(`/api/mtb-periode/${mtbId}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Submitted', version: 1 });
      const req2 = request(app).patch(`/api/mtb-periode/${mtbId}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Approved', version: 1 });

      const [res1, res2] = await Promise.all([req1, req2]);
      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 409]);

      const row = db.prepare('SELECT version, status FROM realisasi_mtb_periode WHERE id = ?').get(mtbId);
      expect(row.version).toBe(2);
      expect(['Submitted', 'Approved']).toContain(row.status);
    });

    test('Two concurrent Realisasi PIB status updates', async () => {
      const req1 = request(app).patch(`/api/pib/${pibId}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Verified', version: 1 });
      const req2 = request(app).patch(`/api/pib/${pibId}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'Verified', version: 1 });

      const [res1, res2] = await Promise.all([req1, req2]);
      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([200, 409]);

      const row = db.prepare('SELECT version FROM realisasi_pib WHERE id = ?').get(pibId);
      expect(row.version).toBe(2);
    });
  });
});
