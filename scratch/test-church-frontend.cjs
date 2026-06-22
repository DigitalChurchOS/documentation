const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching Puppeteer browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set Host header using request interception to simulate theme-test.localhost:3000
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const headers = req.headers();
    headers['Host'] = 'theme-test.localhost:3000';
    req.continue({ headers });
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

  console.log("Navigating to http://localhost:3000/church/ ...");
  const response = await page.goto('http://localhost:3000/church/', { waitUntil: 'networkidle0' });
  console.log("Response status:", response.status());

  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log("Body HTML length:", bodyHtml.length);
  console.log("Contains Connection Offline:", bodyHtml.includes("Connection Offline"));
  console.log("Contains Page Not Found:", bodyHtml.includes("Page Not Found"));
  console.log("Contains Customizer Page Required:", bodyHtml.includes("Customizer Page Required"));
  console.log("Visible text preview:", await page.evaluate(() => document.body.innerText.substring(0, 500)));

  // Let's also check if there is an error in the document
  const offlineErrorText = await page.evaluate(() => {
    const el = document.querySelector('.error-fallback');
    return el ? el.textContent : null;
  });
  console.log("Offline error element text:", offlineErrorText);

  await browser.close();
})();
