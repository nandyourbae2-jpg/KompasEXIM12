async function test() {
  const loginRes = await fetch('http://localhost:3001/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: 'SPV-IMP-01', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('LOGIN DATA:', loginData);
}

test();
