import { test, expect } from '../fixtures/auth.js';

test('Staff buat task -> assignee HARUS diri sendiri, bukan orang lain', async ({ staffImportPage }) => {
  await staffImportPage.goto('/#/workspace/tasks');
  await staffImportPage.waitForLoadState('networkidle');
  
  await staffImportPage.getByRole('button', { name: /\+ Tambah Tugas|Tambah Tugas/i }).click();
  await staffImportPage.getByPlaceholder('Masukkan judul tugas...').fill('E2E Test Task');
  
  // Select 'Sedang' for Prioritas, scoped correctly to the modal or by label context
  await staffImportPage.locator('select:has(option[value="Sedang"])').first().selectOption('Sedang');

  await staffImportPage.getByPlaceholder('cth: 21 Jul').fill('2026-12-31');
  await staffImportPage.getByRole('button', { name: 'Simpan Tugas' }).click();

  const taskCard = staffImportPage.locator('text=E2E Test Task').locator('..');
  await expect(taskCard).toContainText('Keenand'); // EXIM-IMP-05 is Keenand
});
