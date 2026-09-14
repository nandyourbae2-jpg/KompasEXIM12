const http = require('http');

const data = JSON.stringify({
  ao_assignee_id: 105,
  dscs_assignee_id: 115,
  remarks: "test remarks"
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/v2/ao-workboard/supervisor/jobs/1/pair',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
    // Note: this will bypass auth if we don't have a token.
    // wait, if auth fails, we get 401. Let's see if we get 401 or 500.
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
