const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/');
  
  await page.waitForSelector('iframe.preview-frame');
  const elementHandle = await page.$('iframe.preview-frame');
  const frame = await elementHandle.contentFrame();
  
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
