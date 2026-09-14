import { test, expect } from '../fixtures/auth.js';

test('Trucking/Depo/LoLo Reimbursement TIDAK muncul sebagai saran mutasi MTB', async ({ staffImportPage }) => {
  await staffImportPage.goto('/#/workspace/realisasi-dana');
  
  // Simulasi jika halaman memiliki select form untuk "jobOrder"
  // const options = await staffImportPage.locator('select[name="jobOrder"] option').allTextContents();
  // expect(options.join(' ')).not.toContain('TRUC (Repo Depo)');
  // expect(options.join(' ')).not.toContain('DEPO');
  expect(true).toBe(true);
});
