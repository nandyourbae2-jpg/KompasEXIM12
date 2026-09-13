const request = require('supertest');
jest.mock('../src/database/db', () => require('./mockDb'));
const db = require('./mockDb');
const app = require('../index');

describe('Manager Analytics API', () => {
  let tokenManager;
  let tokenStaff;

  beforeAll(async () => {
    // Generate valid login token for Manager
    const loginResM = await request(app)
      .post('/api/login')
      .send({ employee_id: 'MGR-001', password: '123456' });
    tokenManager = loginResM.body.token;

    // Generate valid login token for Staff
    const loginResS = await request(app)
      .post('/api/login')
      .send({ employee_id: 'EXIM-IMP-02', password: '123456' });
    tokenStaff = loginResS.body.token;
  });

  beforeEach(() => {
    // Clear and setup
    db.prepare('DELETE FROM debit_notes').run();
    db.prepare('DELETE FROM job_orders').run();
    db.prepare('DELETE FROM vendor_rate_cards').run();
    db.prepare('DELETE FROM vendor_fleets').run();
    db.prepare('DELETE FROM vendors').run();

    // Insert Vendors
    db.prepare(`INSERT INTO vendors (id, nama, service_type, status, version) VALUES (1, 'Test Trucking', 'Trucking', 'Aktif', 1)`).run();
    db.prepare(`INSERT INTO vendors (id, nama, service_type, status, version) VALUES (2, 'Test Forwarder', 'Forwarder', 'Aktif', 1)`).run();

    // Insert Job Orders
    db.prepare(`INSERT INTO job_orders (id, vendor_id, total_invoice, payment_status, cost_type, job_order_code) VALUES (101, 1, 5000000, 'UNPAID', 'Trucking', 'JO-101')`).run();
    db.prepare(`INSERT INTO job_orders (id, vendor_id, total_invoice, payment_status, cost_type, job_order_code) VALUES (102, 1, 3000000, 'PAID', 'Trucking', 'JO-102')`).run();
    db.prepare(`INSERT INTO job_orders (id, vendor_id, total_invoice, payment_status, cost_type, job_order_code) VALUES (103, 2, 9000000, 'PAID', 'Forwarder', 'JO-103')`).run(); // not trucking

    // Insert Fleet
    db.prepare(`INSERT INTO vendor_fleets (id, vendor_id, compliance_status, license_plate, vehicle_type, version) VALUES (201, 1, 'Compliant', 'B 1234 CD', 'Trailer', 1)`).run();
    db.prepare(`INSERT INTO vendor_fleets (id, vendor_id, compliance_status, license_plate, vehicle_type, version) VALUES (202, 1, 'Expired', 'B 5678 EF', 'Tronton', 1)`).run();

    // Insert Debit Notes
    db.prepare(`INSERT INTO debit_notes (id, dn_number, claim_kategori, claim_jenis, claim_kepada, deskripsi, jumlah_klaim, status) VALUES (301, 'DN-301', 'Claim Trucking', 'Lainnya', 'Test Trucking', 'Test', 1500000, 'Draft')`).run();
    db.prepare(`INSERT INTO debit_notes (id, dn_number, claim_kategori, claim_jenis, claim_kepada, deskripsi, jumlah_klaim, status) VALUES (302, 'DN-302', 'Claim Supplier', 'Kekurangan Barang', 'Other', 'Test', 2500000, 'Draft')`).run(); // not trucking
  });

  it('should require authentication', async () => {
    const res = await request(app).get('/api/v1/manager/vendor-analytics');
    expect(res.status).toBe(401);
  });

  it('should require Manager role', async () => {
    const res = await request(app)
      .get('/api/v1/manager/vendor-analytics')
      .set('Authorization', `Bearer ${tokenStaff}`);
    expect(res.status).toBe(403);
  });

  it('should return aggregated KPIs for Manager', async () => {
    const res = await request(app)
      .get('/api/v1/manager/vendor-analytics')
      .set('Authorization', `Bearer ${tokenManager}`);
    
    expect(res.status).toBe(200);
    const data = res.body;

    expect(data.total_spend).toBe(8000000); // 5m + 3m (excluding forwarder)
    expect(data.total_job_orders).toBe(2);
    expect(data.active_vendors).toBe(1);

    expect(data.vendor_performance.length).toBe(1);
    expect(data.vendor_performance[0].nama).toBe('Test Trucking');
    expect(data.vendor_performance[0].spend).toBe(8000000);

    expect(data.fleet_stats.total_fleet).toBe(2);
    expect(data.fleet_stats.compliant_fleet).toBe(1);
    expect(data.fleet_stats.expired_fleet).toBe(1);
    expect(data.fleet_stats.maintenance_fleet).toBe(0);

    expect(data.claims.length).toBe(1);
    expect(data.claims[0].claim_vendor_name).toBe('Test Trucking');
    expect(data.claims[0].claim_amount).toBe(1500000);
  });
});
