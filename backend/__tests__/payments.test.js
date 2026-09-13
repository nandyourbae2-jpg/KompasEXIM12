const request = require('supertest');
const app = require('../index');
const { getStaffToken, getSPVToken } = require('./helpers/auth');

describe('Payments API', () => {
  let staffToken, spvToken;

  beforeAll(async () => {
    staffToken = await getStaffToken('EXIM-IMP-05');
    spvToken = await getSPVToken();
  });

  const jobOrderPayload = {
    job_order_code: "JO-PAY-001",
    
    vendor_nama: "PT Ocean Pelayaran",
    cost_type: "FREIGHT",
    dpp: 185000000,
    persen_ppn: 0,
    tanggal_invoice: "2026-07-10",
    tanggal_jatuh_tempo: "2026-07-30",
    authorized_workflow: true
  };

  describe('POST /api/job-orders', () => {

    test('✅ Buat Job Order baru', async () => {
      const res = await request(app)
        .post('/api/job-orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(jobOrderPayload);

      expect(res.status).toBe(201);
      expect(res.body.total_invoice).toBe(185000000);
      expect(res.body.total_paid).toBe(0);
    });

    test('✅ Status badge: Belum Dibayar (paid=0) (via GET)', async () => {
      const create = await request(app)
        .post('/api/job-orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(jobOrderPayload);

      if (create.status !== 201) throw new Error(JSON.stringify(create.body));

      const res = await request(app).get('/api/job-orders').set('Authorization', `Bearer ${staffToken}`);
      const jo = res.body.find(j => j.id === create.body.id);
      expect(jo.status_badge).toBe('Belum Dibayar');
    });
  });

  describe('POST /api/job-orders/:id/payments', () => {

    test('✅ Tambah pembayaran → remaining_balance berkurang', async () => {
      const create = await request(app)
        .post('/api/job-orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(jobOrderPayload);

      const pay = await request(app)
        .post(`/api/job-orders/${create.body.id}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          jumlah_bayar: 100000000,
          tanggal_bayar: '2026-07-20',
          metode: 'Bank Transfer',
          version: 1
        });

      expect(pay.status).toBe(201);

      // Cek remaining balance
      const check = await request(app)
        .get(`/api/job-orders`)
        .set('Authorization', `Bearer ${staffToken}`);

      const jo = check.body.find(j => j.id === create.body.id);
      expect(jo.total_paid).toBe(100000000);
      expect(jo.remaining_balance).toBe(85000000);
      expect(jo.status_badge).toBe('Bayar Sebagian');
    });

    test('✅ Bayar lunas → status = Lunas, remaining = 0', async () => {
      const create = await request(app)
        .post('/api/job-orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ ...jobOrderPayload, job_order_code: 'TEST-JO-5678', dpp: 50000000 });

      await request(app)
        .post(`/api/job-orders/${create.body.id}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ jumlah_bayar: 50000000, tanggal_bayar: '2026-07-20', metode: 'Bank Transfer', version: 1 });

      const check = await request(app)
        .get(`/api/job-orders`)
        .set('Authorization', `Bearer ${staffToken}`);

      const jo = check.body.find(j => j.id === create.body.id);
      expect(jo.remaining_balance).toBe(0);
      expect(jo.status_badge).toBe('Lunas');
    });

    test('❌ Jumlah bayar melebihi sisa → ditolak', async () => {
      const create = await request(app)
        .post('/api/job-orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ ...jobOrderPayload, job_order_code: 'TEST-JO-9999', dpp: 10000000 });

      const pay = await request(app)
        .post(`/api/job-orders/${create.body.id}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ jumlah_bayar: 20000000, tanggal_bayar: '2026-07-20', metode: 'Bank Transfer', version: 1 });

      expect(pay.status).toBe(400);
      expect(pay.body.error).toMatch(/sisa/i);
    });
  });
});
