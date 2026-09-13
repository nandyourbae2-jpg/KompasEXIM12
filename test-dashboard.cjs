const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/login');
  
  // Login
  await page.type('input[type="text"]', 'MGR-001');
  await page.type('input[type="password"]', 'Manager123!');
  await page.click('button[type="submit"]');
  
  // Wait for load and navigate
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.goto('http://localhost:5173/workspace/manager', { waitUntil: 'networkidle0' });
  
  // Take screenshot
  await page.screenshot({ path: '/Users/macbookair/.gemini/antigravity-ide/brain/a7153040-de3b-4ef3-bef8-c998ca90e5e8/dashboard-preview.png', fullPage: true });
  
  await browser.close();
})();
