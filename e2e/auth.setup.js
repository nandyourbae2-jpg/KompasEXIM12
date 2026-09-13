import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../playwright/.auth/ao-user.json');

setup('authenticate as Account Officer', async ({ page }) => {
  // Go to the login page
  await page.goto('/');

  // Make sure we are redirected to login if unauthenticated or already at login
  // Since the base URL is http://localhost:5173, the root '/' usually redirects to '/login' or shows Landing Page.
  // The app uses hash router, so let's go to /#/login explicitly just in case, but clicking login button from landing is better.
  
  await page.goto('/#/login');
  
  // Fill the login form
  // We need to add data-testid to these fields in LoginPage.jsx!
  await page.getByTestId('login-tipe-akses').selectOption('Staff Departemen');
  await page.getByTestId('login-departemen').selectOption('Account Officer');
  await page.getByTestId('login-employee-id').fill('EXIM-AO-01');
  await page.getByTestId('login-password').fill('123456');
  
  // Submit
  await page.getByTestId('login-submit-button').click();

  // Wait until the page receives the token and navigates to workspace
  await page.waitForURL('**/workspace**');

  // Verify that the workspace is loaded by checking a heading or sidebar
  // (We use a more generic text that exists on the workspace page, e.g. "Job Saya" or a known navigation item)
  await expect(page.getByText(/Job Saya|Pekerjaan Saya/i).first()).toBeVisible();

  // End of authentication steps.
  
  // Save storage state into the file.
  await page.context().storageState({ path: authFile });
});
