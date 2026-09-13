const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes/v1');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

const routes = [];
const regex = /router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g;

for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    let routePath = match[2];
    
    // Convert express params :id to test values like 1 or 99999
    // For specific routes we might need specific IDs, but for a 404 test, a numeric ID is fine.
    // Wait, the user wants us to test 404/500, so 99999 is good.
    routePath = routePath.replace(/:id/g, '99999');
    routePath = routePath.replace(/:name/g, 'TEST_NAME');
    routePath = routePath.replace(/:projectId/g, '99999');
    
    routes.push({ method, path: '/api/v1' + routePath });
  }
}

// Write the verify script
const verifyScript = `
const routes = ${JSON.stringify(routes, null, 2)};

async function login(employee_id, password, departemen) {
  const res = await fetch('http://localhost:3001/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id, password })
  });
  const data = await res.json();
  if (!data.token) throw new Error('Login failed for ' + employee_id);
  return data.token;
}

async function verifyRoutes() {
  const results = { pass: [], fail: [] };

  const tokens = {
    staff: await login('EXIM-IMP-02', '123456', 'Import'),
    spv: await login('SPV-IMP-01', '123456', 'Import'),
    manager: await login('MGR-001', '123456', null),
  };

  for (const route of routes) {
    for (const [role, token] of Object.entries(tokens)) {
      try {
        const dummyPayload = {
          title: "test", status: "Aktif", nama: "test", periode: "2026-Q1", 
          cost_type: "LOLO", import_shipment_id: 1, import_project_id: 1,
          container_id: 1, cost_category: "LOLO", nama_departemen: "Import",
          email: "test@test.com", role: "Staff", supplier: "Supplier", 
          tgl_payment: "2026-01-01", jenis_pengajuan: "LOLO", catatan: "test",
          nama_periode: "2026", periode_id: 1, no_kontainer: "C123"
        };

        const res = await fetch(\`http://localhost:3001\${route.path}\`, {
          method: route.method,
          headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
          body: (route.method !== 'GET' && route.method !== 'DELETE') ? JSON.stringify(dummyPayload) : undefined
        });

        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        if (res.status === 404 && !isJson) {
          results.fail.push({ ...route, role, status: 404, error: 'ENDPOINT BENAR-BENAR TIDAK DITEMUKAN (HTML 404)' });
        } else if (res.status === 404 && isJson) {
          results.pass.push({ ...route, role, status: 404, note: 'ENDPOINT DITEMUKAN TAPI DATA TIDAK ADA' });
        } else if (res.status >= 500) {
          let errorText = 'Server error';
          if (isJson) {
            try {
              const body = await res.json();
              errorText = body.error || errorText;
            } catch(e) {}
          } else {
            errorText = await res.text();
          }
          results.fail.push({ ...route, role, status: res.status, error: errorText });
        } else {
          results.pass.push({ ...route, role, status: res.status });
        }
      } catch (err) {
        results.fail.push({ ...route, role, status: 'CRASH', error: err.message });
      }
    }
  }

  console.log(\`\\n✅ PASS: \${results.pass.length}\`);
  console.log(\`❌ FAIL: \${results.fail.length}\\n\`);

  if (results.fail.length > 0) {
    console.log('=== DAFTAR YANG GAGAL ===');
    results.fail.forEach(f => {
      console.log(\`[\${f.role}] \${f.method} \${f.path} → \${f.status}: \${f.error.substring(0,100)}\`);
    });
  }

  return results;
}

verifyRoutes();
`;

fs.writeFileSync(path.join(__dirname, 'verify-all-routes.js'), verifyScript);
console.log('Generated verify-all-routes.js with ' + routes.length + ' routes.');
