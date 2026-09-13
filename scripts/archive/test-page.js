const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5174/login', {waitUntil: 'networkidle2'});
  
  // Log in as Manager
  await page.type('input[type="text"]', 'MGR-001');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({waitUntil: 'networkidle2'});
  
  console.log('Current URL after login:', page.url());
  
  await browser.close();
})();
