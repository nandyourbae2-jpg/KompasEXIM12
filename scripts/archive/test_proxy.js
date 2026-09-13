const fetch = require('node-fetch');
(async () => {
  // First login directly
  const res = await fetch('http://localhost:3001/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: 'AE-001', password: '123456' })
  });
  const data = await res.json();
  const token = data.token;
  console.log("Token:", token.substring(0, 10));

  // Now hit Vite Proxy
  const res2 = await fetch('http://localhost:5173/api/v1/users/all', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Proxy /users/all status:", res2.status);
})();
