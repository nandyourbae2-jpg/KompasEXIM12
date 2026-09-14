import { test, expect } from '../fixtures/auth';

test.describe('CUJ 2: Vendor & Payment Flow', () => {
  test('Staff dapat membuat vendor baru dan mencatat tagihan/invoice', async ({ staffImportPage }) => {
    const timestamp = Date.now();
    const vendorName = `PT Vendor E2E ${timestamp}`;
    const impNo = `IMP-E2E-${timestamp}`;
    const dppAmount = '5000000'; // 5 juta

    // --- STEP 1: Buat Vendor Baru ---
    await staffImportPage.goto('/#/workspace/vendors');
    await staffImportPage.waitForLoadState('networkidle');

    // Klik Tambah Vendor
    await staffImportPage.getByRole('button', { name: /Tambah Vendor/i }).click();

    // Isi form vendor
    // input name="nama"
    await staffImportPage.locator('input[name="nama"]').fill(vendorName);
    // input name="region"
    await staffImportPage.locator('input[name="region"]').fill('Jakarta E2E');
    
    // Simpan Vendor
    await staffImportPage.getByRole('button', { name: /Simpan Vendor/i }).click();

    // Verifikasi vendor muncul di list
    await expect(staffImportPage.locator(`text=${vendorName}`)).toBeVisible({ timeout: 10000 });

    // --- STEP 2: Catat Tagihan/Invoice ---
    await staffImportPage.goto('/#/workspace/payments');
    await staffImportPage.waitForLoadState('networkidle');

    // Klik Tambah Tagihan
    await staffImportPage.getByRole('button', { name: /Tambah Tagihan/i }).click();

    // Isi IMP NO (menggunakan placeholder karena ini input search yang terbuka)
    const impInput = staffImportPage.getByPlaceholder('mis. IMP-015-2026');
    await impInput.fill(impNo);
    await staffImportPage.keyboard.press('Escape'); // close dropdown if opens

    // Isi Vendor Name
    const vendorInput = staffImportPage.getByPlaceholder('Pilih atau ketik nama vendor');
    await vendorInput.fill(vendorName);
    // Tekan enter atau escape untuk trigger blur/select
    await staffImportPage.keyboard.press('Enter');
    
    // Isi DPP (Cari input yang ada di dalam label DPP)
    // Label-nya "DPP *"
    const dppInput = staffImportPage.locator('div').filter({ hasText: /^DPP \*/ }).locator('input').first();
    await dppInput.fill(dppAmount);

    // Simpan Data Invoice
    await staffImportPage.getByRole('button', { name: /Simpan Data Invoice/i }).click();

    // Verifikasi tagihan muncul di list (Payment Dashboard)
    // Tunggu sampai loading hilang atau modal tertutup
    await expect(staffImportPage.getByRole('button', { name: /Simpan Data Invoice/i })).toBeHidden({ timeout: 10000 });
    
    // Pastikan IMP NO muncul di tabel
    await expect(staffImportPage.locator(`text=${impNo}`).first()).toBeVisible({ timeout: 10000 });
  });
});
