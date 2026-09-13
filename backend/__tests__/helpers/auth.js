const request = require('supertest');
const app = require('../../index'); // Updated from ../../src/app

async function getToken(employeeId = 'EXIM-IMP-05', password = '123456', departemen = 'Import') {
  const res = await request(app)
    .post('/api/login')
    .send({ employee_id: employeeId, password, departemen });
  if (res.status !== 200) {
    console.error("GET TOKEN FAILED:", employeeId, res.status, res.body);
  }
  return res.body.token;
}

async function getManagerToken() {
  return getToken('MGR-001', '123456', null);
}

async function getSPVToken() {
  return getToken('SPV-IMP-01', '123456', 'Import');
}

async function getStaffToken(employeeId = 'EXIM-IMP-05') {
  return getToken(employeeId, '123456', 'Import');
}

module.exports = { getToken, getManagerToken, getSPVToken, getStaffToken };
