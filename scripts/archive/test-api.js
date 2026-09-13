const http = require('http');
const req = http.get('http://localhost:3001/api/status-shipment', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE:', data));
});
