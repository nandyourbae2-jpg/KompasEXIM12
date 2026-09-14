const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="text"]', 'SPV-IMP-01');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);

  console.log('--- CONSOLE ERRORS ---');
  errors.forEach(e => console.log(e));
  console.log('----------------------');

  await browser.close();
})();
