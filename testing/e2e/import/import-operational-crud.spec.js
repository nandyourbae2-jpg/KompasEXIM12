import { test, expect } from '../fixtures/auth';

test.describe('CUJ 1: Import Operational CRUD', () => {
  test('Staff dapat membuat shipment manual dan melihat detail OTHE', async ({ staffImportPage }) => {
    // 1. Masuk ke halaman Import Operational
    await staffImportPage.goto('/#/workspace/import-operational');
    await staffImportPage.waitForLoadState('networkidle');

    // 2. Klik Tambah Shipment
    await staffImportPage.getByRole('button', { name: /\+ Tambah Shipment|Tambah Shipment/i }).click();

    // 3. Pilih mode manual
    await staffImportPage.getByRole('button', { name: /Buat Manual/i }).click();

    // 4. Isi field wajib
    const unCode = `UN-E2E-${Date.now()}`;
    await staffImportPage.getByPlaceholder('mis. UN-001').fill(unCode);
    
    // Select Supplier (the select inside a div containing 'Supplier *')
    const supplierSelect = staffImportPage.locator('div').filter({ hasText: /^Supplier \*/ }).locator('select');
    const supplierText = await supplierSelect.locator('option').nth(1).innerText();
    await supplierSelect.selectOption({ label: supplierText });

    await staffImportPage.getByPlaceholder('mis. INV-2026-0001').fill(`INV-${Date.now()}`);

    // 5. Submit form
    await staffImportPage.getByRole('button', { name: /Buat & Buka Detail/i }).click();

    // 6. Verifikasi redirect ke halaman detail
    await staffImportPage.waitForURL('**/workspace/import-operational/*');
    await expect(staffImportPage.locator(`text=${unCode}`).first()).toBeVisible({ timeout: 10000 });

    // 7. Verifikasi section OTHE (On the Fly Estimation)
    await expect(staffImportPage.getByText(/OTHE/i).first()).toBeVisible();
  });
});
