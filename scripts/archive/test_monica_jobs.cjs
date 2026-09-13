const http = require('http');

// 1. Login Monica
const req = http.request('http://localhost:3001/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const data = JSON.parse(body);
    const token = data.token;
    console.log("Login Token:", token ? "Exists" : "Missing", "- Status:", res.statusCode);
    
    if (!token) return;

    // 2. Fetch My Jobs
    const req2 = http.request('http://localhost:3001/api/v2/ae/my-jobs', { 
      method: 'GET', 
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } 
    }, (res2) => {
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => {
        console.log("My Jobs Response:", res2.statusCode);
        console.log("Body:", body2.substring(0, 200));
      });
    });
    req2.end();
  });
});
req.write(JSON.stringify({ employee_id: 'AE-001', password: 'dummy_hash' }));
req.end();
