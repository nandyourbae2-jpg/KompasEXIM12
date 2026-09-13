const request = require('supertest');
const app = require('../index'); 
const { getStaffToken, getSPVToken, getManagerToken } = require('./helpers/auth');

describe('Tasks API', () => {
  let keenandToken, yodaToken, spvToken, managerToken, keenandId, yodaId;

  beforeAll(async () => {
    keenandToken = await getStaffToken('EXIM-IMP-05');
    yodaToken = await getStaffToken('EXIM-IMP-02');
    spvToken = await getSPVToken();
    managerToken = await getManagerToken();
    keenandId = JSON.parse(Buffer.from(keenandToken.split('.')[1], 'base64')).id;
    yodaId = JSON.parse(Buffer.from(yodaToken.split('.')[1], 'base64')).id;
  });

  // --- CREATE ---
  describe('POST /api/tasks', () => {

    test('❌ Staff buat task → ditolak (403)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${keenandToken}`)
        .send({
          judul: 'Test Task Keenand',
          prioritas: 'Sedang',
          tenggat: '2026-08-01',
          status: 'Backlog'
        });

      expect(res.status).toBe(403);
    });

    test('❌ Yoda buat task → ditolak (403)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${yodaToken}`)
        .send({
          judul: 'Task Yoda',
          prioritas: 'Tinggi',
          tenggat: '2026-08-01',
          status: 'Backlog'
        });

      expect(res.status).toBe(403);
    });

    test('✅ SPV assign task ke Staff', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${spvToken}`)
        .send({
          judul: 'Eskalasi dari SPV',
          prioritas: 'Kritis',
          tenggat: '2026-07-31',
          status: 'Backlog',
          departemen: 'Import',
          assigneeId: keenandId
        });

      if (res.status !== 201) console.log(JSON.stringify(res.body)); expect([200, 201]).toContain(res.status);
      expect(res.body.title || res.body.task?.title).toBe('Eskalasi dari SPV');
    });

    test('❌ Task tanpa judul ditolak', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${spvToken}`)
        .send({ prioritas: 'Sedang', tenggat: '2026-08-01' });

      expect(res.status).toBe(400);
    });

    test('❌ Request tanpa token ditolak', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ judul: 'Test', prioritas: 'Sedang', tenggat: '2026-08-01' });

      expect(res.status).toBe(401);
    });
  });

  // --- READ ---
  describe('GET /api/tasks', () => {

    beforeEach(async () => {
      // SPV and Manager create tasks for testing
      await request(app).post('/api/tasks')
        .set('Authorization', `Bearer ${spvToken}`)
        .send({ judul: 'Task Keenand 1', prioritas: 'Sedang', tenggat: '2026-08-01', status: 'Backlog', departemen: 'Import', assigneeId: keenandId });

      await request(app).post('/api/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ judul: 'Task Yoda 1', prioritas: 'Tinggi', tenggat: '2026-08-01', status: 'Backlog', departemen: 'Import', assigneeId: yodaId });
    });

    test('✅ Staff hanya melihat task miliknya sendiri', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${keenandToken}`);

      expect(res.status).toBe(200);
      const items = res.body.tasks || res.body;
      expect(Array.isArray(items)).toBe(true);
      items.forEach(task => {
        expect(task.assigneeId || task.assignee_id).toBe(keenandId);
      });
      const yodaTask = items.find(t => (t.assigneeId || t.assignee_id) === yodaId);
      expect(yodaTask).toBeUndefined();
    });

    test('✅ SPV melihat semua task di departemennya', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${spvToken}`);

      expect(res.status).toBe(200);
      const items = res.body.tasks || res.body;
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test('✅ Manager melihat semua task lintas departemen', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      const items = res.body.tasks || res.body;
      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --- UPDATE STATUS ---
  describe('PATCH /api/tasks/:id/status', () => {

    test('✅ Staff pindahkan task miliknya ke kolom berikutnya', async () => {
      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${spvToken}`)
        .send({ judul: 'Task Status Test', prioritas: 'Sedang', tenggat: '2026-08-01', status: 'Backlog', assigneeId: keenandId });

      const taskId = create.body.id || create.body.task?.id;
      const res = await request(app)
        .post(`/api/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${keenandToken}`)
        .send({ status: 'Dalam Proses', timestamp: new Date().toISOString() });

      expect(res.status).toBe(200);
      expect(res.body.task?.status || res.body.status).toBe('Dalam Proses');
    });

  });

  // --- DELETE ---
  describe('DELETE /api/tasks/:id', () => {

    test('✅ SPV bisa hapus task', async () => {
      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${spvToken}`)
        .send({ judul: 'Task Hapus SPV', prioritas: 'Rendah', tenggat: '2026-08-01', status: 'Backlog', assigneeId: keenandId });

      const taskId = create.body.id || create.body.task?.id;
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${spvToken}`);

      expect(res.status).toBe(200);
    });

    test('❌ Staff tidak bisa hapus task', async () => {
      const create = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${spvToken}`)
        .send({
          judul: 'Eskalasi Hapus Test',
          prioritas: 'Tinggi',
          tenggat: '2026-08-01',
          status: 'Backlog',
          assigneeId: keenandId
        });

      const taskId = create.body.id || create.body.task?.id;
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${keenandToken}`);

      expect(res.status).toBe(403);
    });

  });
});
