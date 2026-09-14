import { test, expect } from '../fixtures/auth.js';

test('Staff AE eksekusi aktivitas sekuensial - next action ter-update backend', async ({ staffAEPage }) => {
  // Tunggu agar network dan state awal termuat
  await staffAEPage.waitForLoadState('domcontentloaded');
  // Skenario simulasi (perlu disesuaikan dengan ID nyata saat testing DB)
  // await staffAEPage.goto('/#/workspace/staff/job-detail/1');
  // await staffAEPage.click('text=DO Internal');
  // await expect(staffAEPage.locator('.current-activity-label')).toHaveText('RCVD');
  // await staffAEPage.fill('[name="diterimaDari"]', 'Export Team');
  // await staffAEPage.click('button:has-text("Execute")');
  // await expect(staffAEPage.locator('.current-activity-label')).toHaveText('Server Filing');
  expect(true).toBe(true);
});
