const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/');
  
  await page.waitForSelector('.preview-iframe-wrapper iframe');
  const elementHandle = await page.$('.preview-iframe-wrapper iframe');
  const frame = await elementHandle.contentFrame();
  
  // Switch to Mobile view
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const mobileBtn = buttons.find(b => b.title === 'Mobile view' || b.querySelector('[data-lucide="smartphone"]'));
    if (mobileBtn) mobileBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Dump the header HTML
  const headerHtml = await frame.evaluate(() => {
    const h = document.querySelector('header');
    return h ? h.outerHTML : 'NO HEADER FOUND';
  });
  
  console.log("================ HEADER HTML ================");
  console.log(headerHtml);
  console.log("=============================================");
  
  await browser.close();
})();
