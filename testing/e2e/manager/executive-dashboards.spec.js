import { test, expect } from '../fixtures/auth.js';

test.describe('CUJ 6: Manager Executive Dashboards', () => {
  test('Manager dapat mengakses dashboard eksekutif dan departemen-departemen', async ({ managerPage }) => {
    // 1. Masuk ke halaman Dashboard Manager
    await managerPage.goto('/#/workspace/manager');
    await managerPage.waitForLoadState('networkidle');

    // 2. Verifikasi Header dan modul
    await expect(managerPage.locator('text=Dasbor Top Management')).toBeVisible({ timeout: 10000 });
    
    // 3. Verifikasi tautan ke departemen
    await expect(managerPage.locator('text=Import Department').first()).toBeVisible();
    await expect(managerPage.locator('text=AO Department').first()).toBeVisible();

    // 4. Buka Import Department Dashboard
    await managerPage.locator('text=Import Department').first().click();
    await managerPage.waitForURL('**/workspace/manager/import**');
    
    // 5. Cek URL berubah ke import
    await expect(managerPage).toHaveURL(/.*workspace\/manager\/import/);

    // 6. Tes Buka Source Management
    await managerPage.goto('/#/workspace/manager/source');
    await expect(managerPage.locator('text=Log Schedule Source').first()).toBeVisible({ timeout: 5000 });
    await expect(managerPage.locator('text=Ingest New Version').first()).toBeVisible();
  });
});
