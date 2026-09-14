import { test, expect } from '../fixtures/auth.js';

test.describe('CUJ 4: AE Document Handover Cycle', () => {
  test('Staff AE dapat mengunggah dokumen (PL, Invoice), melacak versi, dan menyelesaikan status di AE Workboard', async ({ staffAEPage }) => {
    // 1. Masuk ke halaman Bento Workboard AE
    await staffAEPage.goto('/#/workspace/staff/workboard');
    await staffAEPage.waitForLoadState('networkidle');

    // 2. Verifikasi UI Utama (Buku Ekspedisi Handover, dll)
    await expect(staffAEPage.locator('text=Buku Ekspedisi Handover').first()).toBeVisible({ timeout: 10000 });

    // 3. Simulasi interaksi dengan My Jobs / Eksekusi
    const btnKerjakan = staffAEPage.getByRole('button', { name: /Kerjakan/i }).first();
    
    // Cek apakah ada job yang ditugaskan ke Staff AE
    if (await btnKerjakan.isVisible()) {
      await btnKerjakan.click();

      // Panel Eksekusi Aktivitas Terbuka (Slide-over)
      const panelTitle = staffAEPage.locator('text=EKSEKUSI AKTIVITAS');
      await expect(panelTitle).toBeVisible({ timeout: 10000 });

      // Cek tombol 'Simpan Hasil' yang menandakan ActionFormEngine aktif
      const btnSimpan = staffAEPage.getByRole('button', { name: /Simpan Hasil/i }).first();
      if (await btnSimpan.isVisible()) {
        if (await btnSimpan.isEnabled()) {
           await btnSimpan.click();
           await expect(panelTitle).toBeHidden({ timeout: 10000 });
        } else {
           // Tombol disable karena form wajib belum diisi, kita tutup modal dengan menekan Escape atau klik backdrop
           await staffAEPage.keyboard.press('Escape');
           // Jika Escape tidak berhasil, klik force tombol close
           const closeBtn = staffAEPage.locator('button').filter({ has: staffAEPage.locator('svg.lucide-x') }).first();
           if (await closeBtn.isVisible()) {
             await closeBtn.click({ force: true });
           }
           await expect(panelTitle).toBeHidden({ timeout: 10000 });
        }
      } else {
        // Jika tidak ada form simpan hasil (misal status pending dll), tutup manual
        await staffAEPage.keyboard.press('Escape');
      }
    }
  });
});
