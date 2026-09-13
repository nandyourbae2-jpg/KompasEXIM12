const request = require('supertest');
const app = require('../index');
const { getStaffToken } = require('./helpers/auth');

describe('Persistensi Data', () => {
  let token;

  beforeAll(async () => {
    token = await getStaffToken('SPV-IMP-01');
  });

  test('✅ Task tersimpan dan bisa diambil ulang (simulasi refresh)', async () => {
    // Buat task
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Persistent Task', status: 'Backlog', prioritas: 'Tinggi', tenggat: '2026-08-01' });

    const taskId = create.body.id;

    // Ambil ulang (simulasi refresh browser)
    const fetch = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    const items = fetch.body.tasks || fetch.body; const found = items.find(t => t.id === taskId);
    expect(found).toBeDefined();
    expect(found.judul || found.title).toBe('Persistent Task');
  });

  test('✅ Import Project tersimpan dan bisa diambil ulang', async () => {
    const create = await request(app)
      .post('/api/import-projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplier: 'Persistent Supplier',
        import_type: 'Raw Material',
        invoice_no: 'INV-PERSIST-001',
        bl_no: 'BL-PERSIST-001',
        eta: '2026-08-15',
        document_requirements: []
      });

    const projectId = create.body.id;

    const fetch = await request(app)
      .get('/api/import-projects')
      .set('Authorization', `Bearer ${token}`);

    const items = fetch.body.tasks || fetch.body; const found = items.find(p => p.id === projectId);
    expect(found).toBeDefined();
    expect(found.supplier).toBe('Persistent Supplier');
  });
});
