import { test, expect } from '../fixtures/auth.js';

test.describe('CUJ 7: Logistic Status Shipment Tracking', () => {
  test('Supervisor Operasional dapat melihat Kanban Status Shipment', async ({ spvImportPage }) => {
    // 1. Masuk ke halaman Status Shipment
    await spvImportPage.goto('/#/workspace/status-shipment');
    await spvImportPage.waitForLoadState('networkidle');

    // 2. Verifikasi UI Utama Status Shipment (Kanban Board)
    await expect(spvImportPage.locator('h1', { hasText: 'Status Shipment' })).toBeVisible({ timeout: 10000 });
    
    // 3. Cek kolom-kolom status
    await expect(spvImportPage.locator('text=Shipment Active')).toBeVisible();
    await expect(spvImportPage.locator('text=Delivery Active')).toBeVisible();
    await expect(spvImportPage.locator('text=Financial Settlement')).toBeVisible();
    await expect(spvImportPage.locator('text=Status Complete')).toBeVisible();

    // 4. (Opsional) Cek kartu dalam kolom jika ada
    const activeShipmentsCount = await spvImportPage.locator('text=Shipment Active').count();
    expect(activeShipmentsCount).toBeGreaterThan(0);
  });
});
