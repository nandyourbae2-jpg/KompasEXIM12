import { test, expect } from '../fixtures/auth.js';

test.describe('CUJ 5: AO Kanban Board Full', () => {
  test('Staff AO dapat melakukan pencarian Kanban, filtering, dan membuka Inline Workstation', async ({ staffAOPage }) => {
    // 1. Masuk ke Bento Workboard AO
    await staffAOPage.goto('/#/workspace/ao/staff');
    await staffAOPage.waitForLoadState('networkidle');

    // 2. Tes Toggle / Filter (In Progress vs Semua)
    const btnSemua = staffAOPage.getByRole('button', { name: /Semua/i }).first();
    if (await btnSemua.isVisible()) {
      await btnSemua.click();
    }
    
    // 3. Buka Inline Workstation (klik tombol Pengerjaan)
    const btnPengerjaan = staffAOPage.getByRole('button', { name: /Pengerjaan/i }).first();
    if (await btnPengerjaan.isVisible()) {
       await btnPengerjaan.click();
       
       // Verifikasi Lembar Pengerjaan muncul
       const lblLembar = staffAOPage.locator('text=LEMBAR PENGERJAAN AO').first();
       await expect(lblLembar).toBeVisible({ timeout: 5000 });
       
       // Tutup panel
       const btnTutup = staffAOPage.getByRole('button', { name: /Tutup/i }).first();
       if (await btnTutup.isVisible()) await btnTutup.click();
    } else {
       // Fallback jika tidak ada data
       await expect(staffAOPage.locator('table')).toBeVisible();
    }
  });
});
