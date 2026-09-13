import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/supervisor-ao.json');

setup('authenticate as Supervisor AO', async ({ page }) => {
  await page.goto('/#/login');
  
  await page.getByTestId('login-tipe-akses').selectOption('Supervisor');
  await page.getByTestId('login-employee-id').fill('SPV-AO-01');
  await page.getByTestId('login-password').fill('123456');
  
  await page.getByTestId('login-submit-button').click();

  await page.waitForURL('**/workspace**');
  // Verify that the workspace is loaded by checking a heading or sidebar
  await expect(page.getByText(/Job Saya|Pekerjaan Saya|Peta Tugas/i).first()).toBeVisible();

  await page.context().storageState({ path: authFile });
});
