import { test } from '@playwright/test';
import fs from 'fs';

test.use({ storageState: 'playwright/.auth/ao-user.json' });

test('Dump DOM', async ({ page }) => {
  await page.goto('/#/workspace/ao/task-map');
  await page.waitForTimeout(5000); // wait for load
  const html = await page.content();
  fs.writeFileSync('dom_dump.html', html);
});
