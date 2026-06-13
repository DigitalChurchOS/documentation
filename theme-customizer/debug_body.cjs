const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/');
  
  await page.waitForSelector('iframe.preview-frame');
  const elementHandle = await page.$('iframe.preview-frame');
  const frame = await elementHandle.contentFrame();
  
  // Dump the body HTML
  const bodyHtml = await frame.evaluate(() => {
    return document.body.innerHTML;
  });
  
  console.log("================ BODY HTML ================");
  console.log(bodyHtml.substring(0, 2000)); // only first 2000 chars to see structure
  console.log("=============================================");
  
  await browser.close();
})();
