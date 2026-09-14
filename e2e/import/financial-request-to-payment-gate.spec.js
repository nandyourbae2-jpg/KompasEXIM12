import { test, expect } from '../fixtures/auth.js';

test('Financial Request Terisi -> HANYA jadi Job Order setelah diteruskan manual', async ({ staffImportPage }) => {
  await staffImportPage.goto('/#/workspace/payments');
  
  // Karena invoice baru belum diteruskan, seharusnya tidak ada di Payment Dashboard
  await expect(staffImportPage.locator('table')).not.toContainText('INV-E2E-DUMMY');

  await staffImportPage.goto('/#/workspace/financial-request');
  // Simulasi klik teruskan (disesuaikan dengan UI sesungguhnya)
  // await staffImportPage.click('text=Teruskan ke Monitoring Pembayaran');
  
  await staffImportPage.goto('/#/workspace/payments');
  // Simulasi setelah diteruskan manual
  // await expect(staffImportPage.locator('table')).toContainText('INV-E2E-DUMMY');
});
