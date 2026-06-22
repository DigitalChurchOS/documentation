const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const supportsHas = await page.evaluate(() => CSS.supports("selector(:has(.a))"));
  console.log("Supports :has()?", supportsHas);
  await browser.close();
})();
