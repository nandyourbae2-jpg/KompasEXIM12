import { test, expect } from '@playwright/test';
import path from 'path';

test.describe.serial('Supervisor Task Delegation', () => {

  // Test bagian 1: Supervisor membuat/assign tugas
  test('Supervisor dapat membuat dan mendelegasikan tugas ke Staf AO', async ({ browser }) => {
    // 1. Login sebagai Supervisor AO menggunakan state yang sudah disimpan
    const spvContext = await browser.newContext({ storageState: 'playwright/.auth/supervisor-ao.json' });
    const spvPage = await spvContext.newPage();

    // 2. Akses Peta Tugas AO (Atau Control Tower jika ada pembuatan tugas)
    const responsePromise = spvPage.waitForResponse(response => response.url().includes('/tasks') && response.status() === 200);
    await spvPage.goto('/#/workspace/ao/task-map');
    await responsePromise;
    await expect(spvPage.getByTestId('kanban-column-Akan-Dikerjakan')).toBeVisible();

    // 3. Cari dan klik tombol Tambah Tugas
    // Di AoTaskMap.jsx line 443 ada button "Tambah Tugas" jika isLeader.
    const btnTambah = spvPage.getByRole('button', { name: 'Tambah Tugas', exact: true }).first();
    await expect(btnTambah).toBeVisible();
    await btnTambah.click({ force: true });

    // 4. Isi form pembuatan tugas
    await expect(spvPage.getByText('Tambah Tugas Baru')).toBeVisible();
    
    // Pilih Job/Invoice
    await spvPage.getByTestId('add-task-invoice').selectOption({ index: 1 }); // pilih job pertama yang ada

    // Pilih Nama Tugas
    await spvPage.getByTestId('add-task-name').fill('Follow up Pembayaran Invoice E2E');

    // Assign ke Staff (Tren = EXIM-AO-01, id in select matches staff id)
    // The option label contains the name, let's use label
    await spvPage.getByTestId('add-task-assignee').selectOption({ label: 'Tren' });
    
    // Input deskripsi
    await spvPage.getByTestId('add-task-description').fill('Tugas ini dibuat dari E2E Automation Test');

    // Submit form
    await spvPage.getByTestId('add-task-submit').click();

    // Verifikasi notifikasi sukses
    await expect(spvPage.getByText('Tugas baru berhasil dibuat')).toBeVisible();

    await spvContext.close();
  });

  // Test bagian 2: Staf login dan melihat tugasnya
  test('Staf AO dapat melihat tugas yang didelegasikan oleh Supervisor', async ({ page }) => {
    // 1. Login sebagai Staf AO (EXIM-AO-01) menggunakan state default
    // yang sudah terset di konfigurasi global use: { storageState: ... }
    
    const responsePromise = page.waitForResponse(response => response.url().includes('/tasks') && response.status() === 200);
    await page.goto('/#/workspace/ao/task-map');
    await responsePromise;
    await expect(page.getByTestId('kanban-column-Akan-Dikerjakan')).toBeVisible();

    // 2. Verifikasi ada task card dengan judul yang kita buat
    const newTask = page.locator('[data-testid^="task-card-"]', { hasText: 'Follow up Pembayaran Invoice E2E' });
    
    // Tunggu data difetch dari API
    await expect(newTask.first()).toBeVisible({ timeout: 10000 });
  });

});
