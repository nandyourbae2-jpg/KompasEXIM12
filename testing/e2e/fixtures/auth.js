import { test as base, expect } from '@playwright/test';

const CREDENTIALS = {
  staffImport:  { employeeId: 'EXIM-IMP-05', password: '123456', departemen: 'Import' },
  spvImport:    { employeeId: 'SPV-IMP-01',  password: '123456', departemen: 'Import' },
  manager:      { employeeId: 'MGR-001',     password: '123456', departemen: null },
  staffAE:      { employeeId: 'AE-001',      password: '123456', departemen: 'Administrasi Export' },
  spvAE:        { employeeId: 'SPV-AE-001',  password: '123456', departemen: 'Administrasi Export' },
  staffAO:      { employeeId: 'EXIM-AO-01',  password: '123456', departemen: 'Account Officer' },
  spvAO:        { employeeId: 'SPV-AO-01',   password: '123456', departemen: 'Account Officer' },
};

async function loginAs(page, roleKey) {
  const cred = CREDENTIALS[roleKey];
  await page.goto('/#/login');
  
  const akses = roleKey.includes('spv') ? 'Supervisor' : roleKey.includes('manager') ? 'Manager' : 'Staff Departemen';
  
  await page.getByTestId('login-tipe-akses').selectOption(akses);
  
  if (akses === 'Staff Departemen' && cred.departemen) {
    await page.getByTestId('login-departemen').selectOption(cred.departemen);
  }
  
  await page.getByTestId('login-employee-id').fill(cred.employeeId);
  await page.getByTestId('login-password').fill(cred.password);
  await page.getByTestId('login-submit-button').click();
  
  // Wait until we reach the workspace
  await page.waitForURL('**/workspace**', { timeout: 10000 });
}

export const test = base.extend({
  staffImportPage: async ({ page }, use) => { await loginAs(page, 'staffImport'); await use(page); },
  spvImportPage:   async ({ page }, use) => { await loginAs(page, 'spvImport');   await use(page); },
  managerPage:     async ({ page }, use) => { await loginAs(page, 'manager');     await use(page); },
  staffAEPage:     async ({ page }, use) => { await loginAs(page, 'staffAE');     await use(page); },
  spvAEPage:       async ({ page }, use) => { await loginAs(page, 'spvAE');       await use(page); },
  staffAOPage:     async ({ page }, use) => { await loginAs(page, 'staffAO');     await use(page); },
  spvAOPage:       async ({ page }, use) => { await loginAs(page, 'spvAO');       await use(page); },
});

export { expect };
