const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  // Set localStorage before navigation
  await page.evaluateOnNewDocument(() => {
    // Clear stale cache
    localStorage.removeItem('ec_autosave_html');
    localStorage.setItem('churchos.tenantId', 'de4498dc-069d-45b6-bc56-1a90ade1fb34');
    localStorage.setItem('churchos.token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZTdlMjhlYS05ZmJhLTQ1MjEtYjUzZS1mMDBhMTcyZDk0ZWQiLCJ0ZW5hbnRJZCI6ImRlNDQ5OGRjLTA2OWQtNDViNi1iYzU2LTFhOTBhZGUxZmIzNCIsImVtYWlsIjoiYWRtaW5AdGhlbWUtdGVzdC5jb20iLCJpYXQiOjE3ODE2NDk3NjV9.NQITrY91wCtviuWIc27bYk3BbnqHPkwjqqNPodaPlG0');
  });
  
  console.log("Navigating to customizer...");
  await page.goto('http://localhost:3000/customizer/', { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait a bit for the page content to fully load from the API
  await new Promise(r => setTimeout(r, 3000));
  
  const screenshotPath = path.resolve(__dirname, '..', '..', '.gemini', 'antigravity', 'brain', 'dba9a1bd-435d-4d79-9068-cd3246255808', 'customizer_fixed.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log("Screenshot saved to:", screenshotPath);
  
  // Check the iframe content
  const frames = page.frames();
  console.log("Frames count:", frames.length);
  for (const frame of frames) {
    const url = frame.url();
    if (url === 'about:srcdoc' || url.includes('srcdoc')) {
      const bodyHtml = await frame.evaluate(() => document.body ? document.body.innerHTML.substring(0, 300) : 'NO BODY');
      console.log("iframe body (first 300):", bodyHtml);
      const hasHeader = await frame.evaluate(() => !!document.querySelector('header'));
      const hasFooter = await frame.evaluate(() => !!document.querySelector('footer'));
      const hasHero = await frame.evaluate(() => !!document.querySelector('.hero'));
      console.log("iframe has header:", hasHeader);
      console.log("iframe has footer:", hasFooter);
      console.log("iframe has hero:", hasHero);
    }
  }
  
  await browser.close();
  console.log("Done!");
})();
