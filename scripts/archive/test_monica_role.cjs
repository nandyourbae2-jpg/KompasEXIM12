const http = require('http');
const req = http.request('http://localhost:3001/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const data = JSON.parse(body);
    console.log("User Data:", data.user);
  });
});
req.write(JSON.stringify({ employee_id: 'AE-001', password: 'password123' }));
req.end();
