const http = require('http');
const req = http.request('http://localhost:3001/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const data = JSON.parse(body);
    const token = data.token;
    
    const req2 = http.request('http://localhost:3001/api/financial-requests/pending', { 
      headers: { 'Authorization': 'Bearer ' + token } 
    }, (res2) => {
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => {
        console.log("Pending response:", res2.statusCode, body2.substring(0, 50));
      });
    });
    req2.end();
  });
});
req.write(JSON.stringify({ employee_id: 'MGR-001', password: 'password123' }));
req.end();
