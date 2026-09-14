import { test, expect } from '../fixtures/auth.js';

test('SPV AE TIDAK melihat menu atau data Import', async ({ spvAEPage }) => {
  // Dalam navigasi Kompas EXIM, SPV dashboard dialihkan ke dashboard dinamis
  await spvAEPage.goto('/#/workspace/supervisor/dashboard-saya');
  
  // Karena routing AE SPV mungkin diarahkan ke AE, verifikasi tidak ada kata Import
  await expect(spvAEPage.locator('body')).not.toContainText('Departemen Import');
  await expect(spvAEPage.locator('body')).not.toContainText('Shipment Monitoring');
});

test('Staff Import TIDAK bisa akses route Supervisor via URL langsung', async ({ staffImportPage }) => {
  await staffImportPage.goto('/#/workspace/supervisor/control-tower');
  
  // Ekspektasi: diarahkan kembali ke fallback staff
  await expect(staffImportPage).not.toHaveURL(/.*supervisor\/control-tower/);
});
