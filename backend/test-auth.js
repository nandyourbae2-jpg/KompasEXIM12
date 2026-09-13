const axios = require('axios');
const jwt = require('jsonwebtoken');

const users = [
  { role: 'manager', employee_id: '0100', name: 'Bapak Manager' },
  { role: 'spvAe', employee_id: '0200', name: 'Amal' },
  { role: 'staffAe', employee_id: '0201', name: 'Monica' },
  { role: 'spvImport', employee_id: '0300', name: 'Bapak SPV Import' },
  { role: 'staffImport', employee_id: '0301', name: 'Yoda' },
  { role: 'staffAo', employee_id: '0401', name: 'Staff AO Budi' },
];

async function test() {
  for (const u of users) {
    try {
      const loginRes = await axios.post('http://localhost:3001/api/v1/login', {
        employee_id: u.employee_id,
        password: '123456'
      });
      const token = loginRes.data.token || loginRes.data.data.token;
      const decoded = jwt.decode(token);
      
      let status = null;
      let msg = null;
      try {
        const res = await axios.get('http://localhost:3001/api/v2/source/imports', {
          headers: { Authorization: `Bearer ${token}` }
        });
        status = res.status;
      } catch (err) {
        status = err.response ? err.response.status : 'error';
        msg = err.response ? err.response.data : err.message;
      }
      
      console.log(`User: ${u.name} | Dept: ${decoded.departemen} | Level: ${decoded.level_otoritas} | Status: ${status}`);
    } catch (err) {
      console.log(`Error logging in ${u.name}:`, err.message);
    }
  }
}

test();
