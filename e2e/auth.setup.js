import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authRoles = [
  {
    name: 'Account Officer (AO)',
    file: 'ao-user.json',
    akses: 'Staff Departemen',
    departemen: 'Account Officer',
    id: 'EXIM-AO-01',
    password: '123456',
    verifyText: /Job Saya|Pekerjaan Saya|Task Map/i
  },
  {
    name: 'Admin Export (AE)',
    file: 'ae-user.json',
    akses: 'Staff Departemen',
    departemen: 'Administrasi Export',
    id: 'AE-001',
    password: '123456',
    verifyText: /Workboard/i
  },
  {
    name: 'Import Ops',
    file: 'import-user.json',
    akses: 'Staff Departemen',
    departemen: 'Import',
    id: 'EXIM-IMP-02',
    password: '123456',
    verifyText: /Import/i
  },
  {
    name: 'Manager',
    file: 'manager-user.json',
    akses: 'Manager',
    departemen: '', 
    id: 'MGR-001',
    password: '123456',
    verifyText: /Manager/i
  },
  {
    name: 'Supervisor AO',
    file: 'supervisor-ao.json',
    akses: 'Supervisor',
    departemen: '', // Spv login form in this app usually just selects 'Supervisor'
    id: 'SPV-AO-01',
    password: '123456',
    verifyText: /Peta Tugas|Dashboard/i
  }
];

for (const role of authRoles) {
  setup(`authenticate as ${role.name}`, async ({ page }) => {
    const authFile = path.join(__dirname, '../playwright/.auth/', role.file);
    
    await page.goto('/#/login');
    
    await page.getByTestId('login-tipe-akses').selectOption(role.akses);
    
    if (role.akses === 'Staff Departemen') {
        await page.getByTestId('login-departemen').selectOption(role.departemen);
    }

    
    await page.getByTestId('login-employee-id').fill(role.id);
    await page.getByTestId('login-password').fill(role.password);
    
    await page.getByTestId('login-submit-button').click();
    
    await page.waitForURL('**/workspace**');
    await expect(page.getByText(role.verifyText).first()).toBeVisible();
    
    await page.context().storageState({ path: authFile });
  });
}
