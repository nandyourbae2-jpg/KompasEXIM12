import { test, expect } from '@playwright/test';

// Use a storage state that DOES NOT have a logged in user for auth tests.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication & Access Control', () => {

  test('Happy Path: Sukses login dan masuk ke Workspace', async ({ page }) => {
    // Navigasi ke halaman utama (otomatis redirect ke login atau tampil landing page)
    await page.goto('/#/login');

    // Pastikan form login terlihat
    await expect(page.getByRole('heading', { name: /Masuk ke Workspace/i })).toBeVisible();

    // Isi tipe akses dan departemen
    await page.getByTestId('login-tipe-akses').selectOption('Staff Departemen');
    await page.getByTestId('login-departemen').selectOption('Account Officer');
    
    // Isi kredensial valid
    await page.getByTestId('login-employee-id').fill('EXIM-AO-01');
    await page.getByTestId('login-password').fill('123456');

    // Submit form
    await page.getByTestId('login-submit-button').click();

    // Tunggu URL pindah ke workspace
    await page.waitForURL('**/workspace**');

    // Opsional: Verifikasi menu sidebar sesuai RBAC (AO hanya melihat menu spesifik)
    await expect(page.getByText('Peta Tugas AO')).toBeVisible();
  });

  test('Failure State: Password salah menampilkan error', async ({ page }) => {
    await page.goto('/#/login');

    // Isi tipe akses dan departemen
    await page.getByTestId('login-tipe-akses').selectOption('Staff Departemen');
    await page.getByTestId('login-departemen').selectOption('Account Officer');
    
    // Isi kredensial valid
    await page.getByTestId('login-employee-id').fill('EXIM-AO-01');
    // MASUKKAN PASSWORD SALAH
    await page.getByTestId('login-password').fill('password_salah');

    // Submit form
    await page.getByTestId('login-submit-button').click();

    // Tunggu pesan error muncul di banner error
    // Backend mengirim 'Invalid credentials' atau sejenisnya
    const errorBanner = page.locator('div').filter({ hasText: 'Invalid credentials' }).first();
    // Tapi frontend mungkin menampilkan pesan lain atau pesan aslinya
    // Kita cek teks umum error atau text box yg mengandung error
    await expect(page.getByText(/Invalid credentials|Gagal login|salah/i).first()).toBeVisible({ timeout: 5000 });
    
    // URL tetap di login
    expect(page.url()).toContain('/login');
  });

  test('Failure State: Departemen kosong untuk Staff ditolak di frontend', async ({ page }) => {
    await page.goto('/#/login');

    // Pilih Staff Departemen tapi TIDAK pilih departemen
    await page.getByTestId('login-tipe-akses').selectOption('Staff Departemen');
    await page.getByTestId('login-departemen').selectOption('');
    
    // Isi kredensial
    await page.getByTestId('login-employee-id').fill('EXIM-AO-01');
    await page.getByTestId('login-password').fill('123456');

    // Submit form
    await page.getByTestId('login-submit-button').click();

    // Harus muncul validasi dari frontend
    await expect(page.getByText('Silakan pilih departemen Anda.')).toBeVisible();
  });
});
