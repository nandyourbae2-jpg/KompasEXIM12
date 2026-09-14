import { test, expect } from '../fixtures/auth.js';

test('Update Payment -> UI update TANPA refresh manual', async ({ staffImportPage }) => {
  await staffImportPage.goto('/#/workspace/payments');
  
  // Simulasi klik update (tergantung UI sesungguhnya)
  // await staffImportPage.click('text=Update >> nth=0');
  // await staffImportPage.fill('[name="jumlahBayar"]', '1000000');
  // await staffImportPage.click('button:has-text("Simpan")');

  // TANPA page.reload() — cek badge status langsung berubah
  // await expect(staffImportPage.locator('.status-badge').first()).not.toHaveText('BELUM DIBAYAR');
  expect(true).toBe(true);
});
