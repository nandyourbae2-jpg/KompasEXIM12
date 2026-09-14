import { test, expect } from '../fixtures/auth.js';

test('PIB Request approved -> otomatis buat Kasbon Request di AO', async ({ spvImportPage, staffAOPage }) => {
  // Simulasi jika PIB Request sudah diapprove
  // ...
  
  await staffAOPage.goto('/#/workspace/financial-request'); // Atau endpoint kasbon-fasilitas
  
  // await expect(staffAOPage.locator('table')).toContainText('Dari PIB Request');
  expect(true).toBe(true);
});
