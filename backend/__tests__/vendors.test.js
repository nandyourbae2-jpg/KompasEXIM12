const request = require('supertest');
jest.mock('../src/database/db', () => require('./mockDb'));
const db = require('./mockDb');
const app = require('../index');
describe('Vendors OCC and Capabilities', () => {
  let token;
  let testVendor;
  let testRate;
  let testFleet;

  beforeAll(async () => {
    // Generate valid login token for Manager
    const loginRes = await request(app)
      .post('/api/login')
      .send({ employee_id: 'MGR-001', password: '123456' });
    token = loginRes.body.token;
  });

  beforeEach(() => {
    // Clear and setup
    db.prepare('DELETE FROM vendor_rate_cards').run();
    db.prepare('DELETE FROM vendor_fleets').run();
    db.prepare('DELETE FROM vendors').run();

    const info = db.prepare(`
      INSERT INTO vendors (nama, service_type, version) VALUES ('Test Vendor', 'Trucking', 1)
    `).run();
    
    testVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);

    const infoRate = db.prepare(`
      INSERT INTO vendor_rate_cards (vendor_id, route_origin, route_destination, vehicle_type, price, version)
      VALUES (?, 'JKT', 'SBY', 'Tronton', 15000000, 1)
    `).run(testVendor.id);
    testRate = db.prepare('SELECT * FROM vendor_rate_cards WHERE id = ?').get(infoRate.lastInsertRowid);

    const infoFleet = db.prepare(`
      INSERT INTO vendor_fleets (vendor_id, license_plate, vehicle_type, version)
      VALUES (?, 'B 1234 CD', 'Trailer', 1)
    `).run(testVendor.id);
    testFleet = db.prepare('SELECT * FROM vendor_fleets WHERE id = ?').get(infoFleet.lastInsertRowid);
  });

  describe('Vendor Profile OCC', () => {
    it('should reject update without version', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nama: 'New Name' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VERSION_REQUIRED');
    });

    it('should reject update with stale version', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nama: 'New Name', version: 99 });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('CONCURRENCY_CONFLICT');
    });

    it('should accept valid version and increment it', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${testVendor.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nama: 'Updated Name', version: testVendor.version });
      
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(testVendor.version + 1);
      testVendor = res.body; // update reference
    });
  });

  describe('Vendor Rate Cards API', () => {
    it('should create a rate card with version 1', async () => {
      const res = await request(app)
        .post(`/api/vendors/${testVendor.id}/rates`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          route_origin: 'JKT',
          route_destination: 'SBY',
          vehicle_type: 'Tronton',
          price: 15000000
        });
      
      expect(res.status).toBe(201);
      expect(res.body.version).toBe(1);
      testRate = res.body;
    });

    it('should enforce OCC on rate card update', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${testVendor.id}/rates/${testRate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 16000000, version: 1 });
      
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(2);
      expect(res.body.price).toBe(16000000);
    });
  });

  describe('Vendor Fleets API', () => {
    it('should create a fleet with version 1', async () => {
      const res = await request(app)
        .post(`/api/vendors/${testVendor.id}/fleets`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          license_plate: 'B 1234 CD',
          vehicle_type: 'Trailer'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.version).toBe(1);
      testFleet = res.body;
    });

    it('should enforce OCC on fleet update', async () => {
      const res = await request(app)
        .patch(`/api/vendors/${testVendor.id}/fleets/${testFleet.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ compliance_status: 'Expired', version: 1 });
      
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(2);
      expect(res.body.compliance_status).toBe('Expired');
    });
  });
});
