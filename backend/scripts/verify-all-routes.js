
const routes = [
  {
    "method": "POST",
    "path": "/api/v1/login"
  },
  {
    "method": "GET",
    "path": "/api/v1/import-shipments/99999/container-costs"
  },
  {
    "method": "POST",
    "path": "/api/v1/container-costs"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/container-costs/99999"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/container-costs/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/documents"
  },
  {
    "method": "POST",
    "path": "/api/v1/documents"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/documents/99999"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/documents/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/financial-request-ledger/by-project"
  },
  {
    "method": "GET",
    "path": "/api/v1/financial-request-ledger"
  },
  {
    "method": "POST",
    "path": "/api/v1/financial-request-ledger/manual"
  },
  {
    "method": "PUT",
    "path": "/api/v1/financial-request-ledger/99999"
  },
  {
    "method": "POST",
    "path": "/api/v1/financial-request-ledger/push-to-payment"
  },
  {
    "method": "GET",
    "path": "/api/v1/job-orders/available-months"
  },
  {
    "method": "GET",
    "path": "/api/v1/job-orders/available-for-mtb"
  },
  {
    "method": "GET",
    "path": "/api/v1/job-orders"
  },
  {
    "method": "POST",
    "path": "/api/v1/job-orders"
  },
  {
    "method": "POST",
    "path": "/api/v1/job-orders/sync-import"
  },
  {
    "method": "POST",
    "path": "/api/v1/job-orders/99999/payments"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/job-orders/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/debit-notes/available-months"
  },
  {
    "method": "GET",
    "path": "/api/v1/debit-notes/summary"
  },
  {
    "method": "GET",
    "path": "/api/v1/debit-notes"
  },
  {
    "method": "POST",
    "path": "/api/v1/debit-notes"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/debit-notes/99999"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/debit-notes/99999/status"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/debit-notes/99999/recovery"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/debit-notes/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/mtb-periode"
  },
  {
    "method": "POST",
    "path": "/api/v1/mtb-periode"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/mtb-periode/99999"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/mtb-periode/99999/status"
  },
  {
    "method": "GET",
    "path": "/api/v1/mtb-periode/99999/transaksi"
  },
  {
    "method": "POST",
    "path": "/api/v1/mtb-transaksi"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/mtb-transaksi/99999"
  },
  {
    "method": "PUT",
    "path": "/api/v1/mtb-transaksi/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/pib"
  },
  {
    "method": "POST",
    "path": "/api/v1/pib"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/pib/99999/status"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/pib/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/realisasi/summary"
  },
  {
    "method": "GET",
    "path": "/api/v1/financial-requests"
  },
  {
    "method": "GET",
    "path": "/api/v1/financial-requests/summary"
  },
  {
    "method": "GET",
    "path": "/api/v1/financial-requests/pending"
  },
  {
    "method": "POST",
    "path": "/api/v1/financial-requests"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/financial-requests/99999"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/financial-requests/99999/submit"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/financial-requests/99999/approve"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/financial-requests/99999/reject"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/financial-requests/99999/cancel"
  },
  {
    "method": "GET",
    "path": "/api/v1/financial-requests/99999/history"
  },
  {
    "method": "GET",
    "path": "/api/v1/pib-requests"
  },
  {
    "method": "GET",
    "path": "/api/v1/pib-requests/summary"
  },
  {
    "method": "GET",
    "path": "/api/v1/pib-requests/pending"
  },
  {
    "method": "GET",
    "path": "/api/v1/pib-requests/99999"
  },
  {
    "method": "POST",
    "path": "/api/v1/pib-requests"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/pib-requests/99999"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/pib-requests/99999/submit"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/pib-requests/99999/approve"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/pib-requests/99999/reject"
  },
  {
    "method": "GET",
    "path": "/api/v1/pib-requests/99999/history"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/pib-requests/99999/realize"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/pib-requests/99999/settle"
  },
  {
    "method": "GET",
    "path": "/api/v1/import-projects"
  },
  {
    "method": "GET",
    "path": "/api/v1/import-projects/99999"
  },
  {
    "method": "POST",
    "path": "/api/v1/import-projects"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/import-projects/99999"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/import-projects/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/dokumen-monitoring/summary"
  },
  {
    "method": "GET",
    "path": "/api/v1/dokumen-monitoring"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/dokumen-monitoring/99999"
  },
  {
    "method": "POST",
    "path": "/api/v1/dokumen-monitoring/99999/confirm"
  },
  {
    "method": "POST",
    "path": "/api/v1/dokumen-monitoring/99999/confirm-scan"
  },
  {
    "method": "POST",
    "path": "/api/v1/dokumen-monitoring/99999/confirm-original"
  },
  {
    "method": "GET",
    "path": "/api/v1/dokumen-monitoring/99999/riwayat"
  },
  {
    "method": "GET",
    "path": "/api/v1/import-shipments"
  },
  {
    "method": "GET",
    "path": "/api/v1/import-shipments/99999"
  },
  {
    "method": "POST",
    "path": "/api/v1/import-shipments"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/import-shipments/99999"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/import-shipments/99999/costs"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/import-shipments/99999"
  },
  {
    "method": "POST",
    "path": "/api/v1/import-shipments/99999/containers"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/containers/99999"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/containers/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/manager/vendor-analytics"
  },
  {
    "method": "GET",
    "path": "/api/v1/manager/strategic-analytics"
  },
  {
    "method": "GET",
    "path": "/api/v1/manager/import-control-tower"
  },
  {
    "method": "GET",
    "path": "/api/v1/manager/dashboard"
  },
  {
    "method": "GET",
    "path": "/api/v1/manager/dashboard"
  },
  {
    "method": "GET",
    "path": "/api/v1/document-types"
  },
  {
    "method": "POST",
    "path": "/api/v1/document-types"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/document-types/TEST_NAME"
  },
  {
    "method": "GET",
    "path": "/api/v1/reports"
  },
  {
    "method": "POST",
    "path": "/api/v1/reports"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/reports/99999/tanggapan"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/reports/99999/tinjau"
  },
  {
    "method": "GET",
    "path": "/api/v1/plan-gdg"
  },
  {
    "method": "GET",
    "path": "/api/v1/status-shipment"
  },
  {
    "method": "GET",
    "path": "/api/v1/control-tower/stats"
  },
  {
    "method": "GET",
    "path": "/api/v1/control-tower/staff-performance"
  },
  {
    "method": "GET",
    "path": "/api/v1/archive/history"
  },
  {
    "method": "GET",
    "path": "/api/v1/issues-escalations"
  },
  {
    "method": "POST",
    "path": "/api/v1/archive/close-quarter"
  },
  {
    "method": "GET",
    "path": "/api/v1/users/all"
  },
  {
    "method": "GET",
    "path": "/api/v1/users/assignable"
  },
  {
    "method": "GET",
    "path": "/api/v1/staff"
  },
  {
    "method": "POST",
    "path": "/api/v1/staff"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/staff/99999"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/staff/99999/status"
  },
  {
    "method": "GET",
    "path": "/api/v1/departemen"
  },
  {
    "method": "POST",
    "path": "/api/v1/departemen"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/departemen/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/tasks"
  },
  {
    "method": "POST",
    "path": "/api/v1/tasks"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/tasks/99999"
  },
  {
    "method": "POST",
    "path": "/api/v1/tasks/99999/move"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/tasks/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/vendors"
  },
  {
    "method": "GET",
    "path": "/api/v1/vendors/monitoring"
  },
  {
    "method": "GET",
    "path": "/api/v1/vendors/99999"
  },
  {
    "method": "POST",
    "path": "/api/v1/vendors"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/vendors/99999"
  },
  {
    "method": "DELETE",
    "path": "/api/v1/vendors/99999"
  },
  {
    "method": "GET",
    "path": "/api/v1/vendors/99999/rates"
  },
  {
    "method": "POST",
    "path": "/api/v1/vendors/99999/rates"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/vendors/:vendorId/rates/:rateId"
  },
  {
    "method": "GET",
    "path": "/api/v1/vendors/99999/fleets"
  },
  {
    "method": "POST",
    "path": "/api/v1/vendors/99999/fleets"
  },
  {
    "method": "PATCH",
    "path": "/api/v1/vendors/:vendorId/fleets/:fleetId"
  }
];

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

        const res = await fetch(`http://localhost:3001${route.path}`, {
          method: route.method,
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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

  console.log(`\n✅ PASS: ${results.pass.length}`);
  console.log(`❌ FAIL: ${results.fail.length}\n`);

  if (results.fail.length > 0) {
    console.log('=== DAFTAR YANG GAGAL ===');
    results.fail.forEach(f => {
      console.log(`[${f.role}] ${f.method} ${f.path} → ${f.status}: ${f.error.substring(0,100)}`);
    });
  }

  return results;
}

verifyRoutes();
