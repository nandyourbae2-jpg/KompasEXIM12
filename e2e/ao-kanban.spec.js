import { test, expect } from '@playwright/test';

test.describe('AO Task Management (Kanban Board)', () => {
  // We use the authenticated AO user state saved in phase 1
  test.use({ storageState: 'playwright/.auth/ao-user.json' });

  test.beforeEach(async ({ page }) => {
    // Siapkan promise untuk menunggu response
    const responsePromise = page.waitForResponse(response => response.url().includes('/tasks') && response.status() === 200);
    
    // Navigate to AO Kanban Board directly
    await page.goto('/#/workspace/ao/task-map');
    
    // Tunggu request selesai
    await responsePromise;

    // Tunggu Kanban termuat
    await expect(page.getByTestId('kanban-column-Akan-Dikerjakan')).toBeVisible();
  });

  test('Happy Path: Sukses melakukan drag & drop task', async ({ page }) => {
    // Cari sebuah tugas di kolom "Akan Dikerjakan" yang diassign ke EXIM-AO-01
    const sourceColumn = page.getByTestId('kanban-column-Akan-Dikerjakan');
    const targetColumn = page.getByTestId('kanban-column-Dalam-Proses');
    
    // Pilih task pertama (contohnya) yang bisa didrag
    // Karena Playwright's dragTo API expects a source and target locator
    const taskCard = sourceColumn.locator('[data-testid^="task-card-"]').first();
    
    // Pastikan task tersebut ada sebelum di drag
    await expect(taskCard).toBeVisible();
    // Setup response listener for PUT to see what happens
    const putResponsePromise = page.waitForResponse(response => response.url().includes('/status') && response.request().method() === 'PUT');

    // Dapatkan data-testid sebelum di-drag, karena elemen akan berpindah DOM
    const taskCardId = await taskCard.getAttribute('data-testid');

    // Lakukan aksi drag and drop ke target column
    await taskCard.dragTo(targetColumn);

    // Wait for response and log it
    const putResponse = await putResponsePromise;
    console.log('PUT Response:', putResponse.status(), await putResponse.json());

    // Verifikasi toast message sukses dari backend
    await expect(page.getByText(/Tugas dipindahkan ke Dalam Proses/i)).toBeVisible();

    // Verifikasi card sudah berpindah ke kolom "Dalam Proses"
    await expect(targetColumn.locator(`[data-testid="${taskCardId}"]`)).toBeVisible();
  });

  test('Failure State: Unauthorized drag task milik staf lain', async ({ page }) => {
    // Cari tugas yang bukan milik user AO-01. 
    // Di database, staff EXIM-AO-01 adalah Tren. Misal ada task milik 'EXIM-AO-02' (Bella).
    // Kita cek teks "Bella" di card.
    const bellaTask = page.locator('[data-testid^="task-card-"]', { hasText: 'Bella' }).first();
    
    // Jika tidak ada task milik bella, lewati atau pastikan ada di seed database
    if (await bellaTask.isVisible()) {
      const targetColumn = page.getByTestId('kanban-column-Dalam-Proses');
      
      // Lakukan drag and drop
      await bellaTask.dragTo(targetColumn);

      // Verifikasi munculnya toast message error
      await expect(page.getByText(/Anda tidak memiliki izin|Gagal memindahkan tugas/i)).toBeVisible();
    }
  });
});
