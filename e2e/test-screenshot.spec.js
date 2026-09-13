import { test } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/ao-user.json' });

test('Take screenshot of AO Kanban', async ({ page }) => {
  await page.goto('/#/workspace/ao/task-map');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'test-screenshot-ao-kanban.png' });
});
