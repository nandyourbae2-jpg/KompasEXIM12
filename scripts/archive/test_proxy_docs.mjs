(async () => {
  const res = await fetch('http://localhost:5173/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: 'AE-001', password: '123456' })
  });
  const data = await res.json();
  const token = data.token;
  
  const res2 = await fetch('http://localhost:5173/api/v1/documents', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Proxy /documents status:", res2.status);
})();
