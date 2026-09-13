const request = require('supertest');
jest.mock('../src/database/db', () => require('./mockDb'));
const app = require('../index'); // Updated from ../src/app

describe('POST /api/login', () => {

  test('✅ Login berhasil dengan kredensial valid (Staff)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ employee_id: 'EXIM-IMP-05', password: '123456', departemen: 'Import' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.nama).toBe('Keenand');
    expect(res.body.user.level_otoritas).toBe('Staff Dept');
    expect(res.body.user).not.toHaveProperty('password_hash'); // jangan leak hash
  });

  test('✅ Login berhasil sebagai Supervisor', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ employee_id: 'SPV-IMP-01', password: '123456', departemen: 'Import' });

    expect(res.status).toBe(200);
    expect(res.body.user.level_otoritas).toBe('Supervisor');
    expect(res.body.user.departemen).toBe('Import');
  });

  test('✅ Login berhasil sebagai Manager (tanpa departemen)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ employee_id: 'MGR-001', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.user.level_otoritas).toBe('Manager');
  });

  test('❌ Login gagal dengan password salah', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ employee_id: 'EXIM-IMP-05', password: 'salah123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_001');
  });
  
  test('❌ Login gagal dengan password parsial / whitespace / legacy', async () => {
    const invalidPasswords = ['123', '12345', '1234567', ' 123456', '123456 ', '', 'password123'];
    for (const pwd of invalidPasswords) {
      const res = await request(app)
        .post('/api/login')
        .send({ employee_id: 'EXIM-IMP-05', password: pwd });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AUTH_001');
      expect(res.body.message).toBe('Invalid credentials');
    }
  });

  test('❌ Login gagal dengan employee_id tidak ada', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ employee_id: 'TIDAK-ADA', password: '123456' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_001');
  });

  test('❌ Login ditolak untuk akun nonaktif', async () => {
    const testDb = require('./mockDb');
    console.log("ALL USERS:", testDb.prepare("SELECT employee_id FROM users").all());
    const res = await request(app)
      .post('/api/login')
      .send({ employee_id: 'INACTIVE-01', password: '123456', departemen: 'Import' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/tidak aktif/i);
  });

  test('❌ Request tanpa body ditolak', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
  });
});
