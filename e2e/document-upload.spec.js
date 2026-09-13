import { test, expect } from '@playwright/test';
import path from 'path';

test.describe.serial('Document Upload & Verification', () => {
  // Gunakan state auth AO Staff (Tren, EXIM-AO-01)
  test.use({ storageState: 'playwright/.auth/ao-user.json' });

  test.beforeEach(async ({ page }) => {
    // 1. AO membuka detail sebuah task di kolom "Dalam Proses" (atau kolom mana saja)
    await page.goto('/#/workspace/ao/task-map');
    
    // Tunggu Kanban termuat
    await expect(page.getByTestId('kanban-column-Dalam-Proses')).toBeVisible();

    // Pastikan ada task card yang bisa diklik. Jika tidak ada, buat dummy task atau abaikan
    // Pada E2E kita tau seed DB pasti punya task.
    const taskCard = page.locator('[data-testid^="task-card-"]').first();
    await taskCard.click();

    // Verifikasi modal detail tugas terbuka dan area dokumen ada
    await expect(page.getByTestId('document-dropzone')).toBeVisible();
  });

  test('Skenario Kegagalan: Upload file format tidak diizinkan (.sh)', async ({ page }) => {
    // Siapkan path file dummy.sh
    const filePath = 'e2e/fixtures/dummy.sh';
    
    // Attach file ke hidden input
    await page.setInputFiles('[data-testid="hidden-file-input"]', filePath);
    
    // Verifikasi toast error muncul
    await expect(page.getByText(/Format file tidak didukung/i)).toBeVisible();
  });

  test('Skenario Utama: Upload dokumen PDF/JPG sukses', async ({ page }) => {
    // Siapkan path file dummy.jpg
    const filePath = 'e2e/fixtures/dummy.jpg';
    
    // Listen for upload response
    const uploadResponsePromise = page.waitForResponse(response => 
      response.url().includes('/documents') && response.request().method() === 'POST'
    );
    
    // Attach file ke hidden input
    await page.setInputFiles('[data-testid="hidden-file-input"]', filePath);
    
    // Tunggu upload selesai
    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBe(201);
    
    // Verifikasi toast sukses
    await expect(page.getByText(/Dokumen berhasil diunggah/i)).toBeVisible();
    
    // Verifikasi list dokumen bertambah (nama file muncul di modal)
    await expect(page.locator('div', { hasText: 'dummy.jpg' }).first()).toBeVisible();
  });
});
