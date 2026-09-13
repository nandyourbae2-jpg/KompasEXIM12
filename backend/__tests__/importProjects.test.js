const request = require('supertest');
const app = require('../index');
const { getStaffToken } = require('./helpers/auth');

describe('Import Projects API', () => {
  let token;

  beforeAll(async () => {
    token = await getStaffToken('EXIM-IMP-05');
  });

  const validPayload = {
    supplier: 'PT. Hana Steel Indonesia',
    trade: 'Korea Selatan',
    import_type: 'Raw Material',
    shipment_term: 'CIF',
    invoice_no: 'INV-HSI-2026-001',
    bl_no: 'BL-20260715-001',
    etd: '2026-07-10',
    eta: '2026-07-25',
    hs_code: '7209.17.00',
    free_time_destination: 14,
    document_requirements: []
  };

  describe('POST /api/import-projects', () => {

    test('✅ Buat Import Project baru → task_unique_number ter-generate otomatis', async () => {
      const res = await request(app)
        .post('/api/import-projects')
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.task_unique_number).toMatch(/^IMP-\d{3}-\d{4}$/);
      expect(res.body.supplier).toBe('PT. Hana Steel Indonesia');
    });

    test('✅ Buat dua project → nomor urut bertambah', async () => {
      const res1 = await request(app)
        .post('/api/import-projects')
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload);

      const res2 = await request(app)
        .post('/api/import-projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validPayload, invoice_no: 'INV-HSI-2026-002' });

      const num1 = parseInt(res1.body.task_unique_number.replace('IMP-', ''));
      const num2 = parseInt(res2.body.task_unique_number.replace('IMP-', ''));
      expect(num2).toBe(num1 + 1);
    });

    test('✅ Document Requirements → baris dokumen monitoring ter-buat otomatis', async () => {
      const testDb = require('./mockDb');

      // Seed 2 master dokumen
      testDb.prepare(`
        INSERT INTO master_data_dokumen (kode_dokumen, nama_dokumen) VALUES
        ('DOC-001', 'Bill of Lading Original'),
        ('DOC-002', 'Commercial Invoice')
      `).run();

      const dok1 = testDb.prepare("SELECT id FROM master_data_dokumen WHERE kode_dokumen = 'DOC-001'").get();
      const dok2 = testDb.prepare("SELECT id FROM master_data_dokumen WHERE kode_dokumen = 'DOC-002'").get();

      const res = await request(app)
        .post('/api/import-projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validPayload, document_requirements: [dok1.id, dok2.id] });

      expect(res.status).toBe(201);

      // Cek baris monitoring ter-buat
      const checkRes = await request(app)
        .get(`/api/dokumen-monitoring?import_project_id=${res.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.length).toBe(2);
    });

    test('❌ Tanpa token → 401', async () => {
      const res = await request(app)
        .post('/api/import-projects')
        .send(validPayload);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/import-projects', () => {

    test('✅ Return list kosong kalau belum ada project', async () => {
      const res = await request(app)
        .get('/api/import-projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('✅ Return project yang sudah dibuat', async () => {
      await request(app)
        .post('/api/import-projects')
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload);

      const res = await request(app)
        .get('/api/import-projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('task_unique_number');
      expect(res.body[0]).toHaveProperty('supplier');
    });
  });

  describe('PATCH /api/import-projects/:id', () => {

    test('✅ Edit field → tersimpan, task_unique_number tidak berubah', async () => {
      const create = await request(app)
        .post('/api/import-projects')
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload);

      const originalNumber = create.body.task_unique_number;

      const res = await request(app)
        .patch(`/api/import-projects/${create.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ supplier: 'Supplier Baru', shipment_term: 'FOB' });

      expect(res.status).toBe(200);
      expect(res.body.supplier).toBe('Supplier Baru');
      expect(res.body.task_unique_number).toBe(originalNumber); // tidak berubah
    });
  });
});
