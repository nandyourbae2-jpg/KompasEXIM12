import { test, expect } from '../fixtures/auth';

test.describe('CUJ 3: Realisasi Dana / Mutasi MTB CRUD', () => {
  test('Staff dapat membuat periode MTB dan mencatat mutasi kas', async ({ staffImportPage }) => {
    const timestamp = Date.now();
    const periodeName = `MTB E2E ${timestamp}`;
    const tglMulai = '2026-08-01';
    const tglSelesai = '2026-08-10';
    const uniqueNumber = `IMP-MTB-${timestamp}`;

    // --- STEP 1: Buat Periode MTB Baru ---
    await staffImportPage.goto('/#/workspace/realisasi-dana');
    await staffImportPage.waitForLoadState('networkidle');

    // Klik Buat Periode Baru
    await staffImportPage.getByRole('button', { name: /Buat Periode Baru/i }).click();

    // Isi Form Periode
    await staffImportPage.locator('input[type="text"]').first().fill(periodeName);
    await staffImportPage.locator('input[type="date"]').nth(0).fill(tglMulai);
    await staffImportPage.locator('input[type="date"]').nth(1).fill(tglSelesai);
    await staffImportPage.locator('input[type="number"]').first().fill('100000000');

    // Simpan Periode
    await staffImportPage.getByRole('button', { name: /^Simpan$/i }).click();

    // Verifikasi periode muncul di tabel
    const row = staffImportPage.locator('tr').filter({ hasText: periodeName });
    await expect(row).toBeVisible({ timeout: 10000 });

    // --- STEP 2: Masuk ke Detail & Tambah Mutasi ---
    // Klik Detail pada baris periode yang baru dibuat
    await row.getByRole('button', { name: /Detail/i }).click();
    
    // Verifikasi masuk ke detail
    await expect(staffImportPage.locator(`text=Buku Kas MTB: ${periodeName}`)).toBeVisible({ timeout: 10000 });

    // Klik Tambah Mutasi
    await staffImportPage.getByRole('button', { name: /Tambah Mutasi/i }).click();

    // Isi Form Mutasi
    await staffImportPage.locator('div').filter({ hasText: /^Tgl Payment\*/ }).locator('input').first().fill(tglMulai); // Pakai tglMulai agar valid
    await staffImportPage.locator('div').filter({ hasText: /^Unique Number/ }).locator('input').first().fill(uniqueNumber);
    await staffImportPage.locator('div').filter({ hasText: /^DPP/ }).locator('input').first().fill('5000000');

    // Simpan Transaksi
    await staffImportPage.getByRole('button', { name: /Simpan Transaksi/i }).click();

    // Verifikasi modal tertutup dan data muncul
    await expect(staffImportPage.getByRole('button', { name: /Simpan Transaksi/i })).toBeHidden({ timeout: 10000 });
    await expect(staffImportPage.locator(`text=${uniqueNumber}`)).toBeVisible({ timeout: 10000 });
  });
});
