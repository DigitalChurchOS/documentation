const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/');
  
  await page.waitForSelector('iframe.preview-frame');
  const elementHandle = await page.$('iframe.preview-frame');
  const frame = await elementHandle.contentFrame();
  
  await frame.waitForSelector('#ecclesia-theme-tokens', { timeout: 5000 });
  
  const css = await frame.evaluate(() => {
    return document.querySelector('#ecclesia-theme-tokens').innerHTML;
  });
  const fs = require('fs');
  fs.writeFileSync('C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\7fb32920-8121-440a-baa6-79dc89fa8d13\\scratch\\dumped_css.txt', css);

  await browser.close();
})();
