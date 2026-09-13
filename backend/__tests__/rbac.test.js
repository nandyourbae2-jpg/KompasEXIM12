const request = require('supertest');
const app = require('../index');
const { getStaffToken, getSPVToken, getManagerToken } = require('./helpers/auth');

describe('RBAC — Visibilitas & Akses', () => {
  let keenandToken, yodaToken, spvToken, managerToken;

  beforeAll(async () => {
    keenandToken = await getStaffToken('EXIM-IMP-05');
    yodaToken = await getStaffToken('EXIM-IMP-02');
    spvToken = await getSPVToken();
    managerToken = await getManagerToken();
  });

  test('✅ Staff bisa akses endpoint staff management (tapi hanya melihat dirinya sendiri)', async () => {
    const res = await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${keenandToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].employee_id).toBe('EXIM-IMP-05');
  });

  test('✅ SPV bisa akses daftar staff di departemennya', async () => {
    const res = await request(app)
      .get('/api/staff?departemen=Import')
      .set('Authorization', `Bearer ${spvToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('✅ SPV mengabaikan query departemen dan hanya melihat staff di departemennya sendiri', async () => {
    const res = await request(app)
      .get('/api/staff?departemen=Export')
      .set('Authorization', `Bearer ${spvToken}`);

    expect(res.status).toBe(200);
    // Should still return Import staff because it ignores the query string
    expect(res.body.every(u => u.departemen === 'Import')).toBe(true);
  });

  test('✅ Manager bisa akses semua departemen', async () => {
    const res = await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
  });

  test('✅ GET /api/users/assignable untuk Staff → return active assignable users (termasuk dirinya sendiri)', async () => {
    const res = await request(app)
      .get('/api/users/assignable')
      .set('Authorization', `Bearer ${keenandToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('✅ GET /api/users/assignable untuk SPV → list Staff aktif', async () => {
    const res = await request(app)
      .get('/api/users/assignable')
      .set('Authorization', `Bearer ${spvToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4); // Yoda, Katon, Thomas, Keenand
    res.body.forEach(u => {
      expect(u.level_otoritas).toBe('Staff Dept');
      expect(u.departemen).toBe('Import');
    });
  });

  test('✅ GET /api/users/assignable untuk Manager → list Supervisor aktif', async () => {
    const res = await request(app)
      .get('/api/users/assignable')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    res.body.forEach(u => {
      expect(u.level_otoritas).toBe('Supervisor');
    });
  });
});
