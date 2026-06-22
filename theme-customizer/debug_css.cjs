const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/');
  
  await page.waitForSelector('iframe.preview-frame');
  const elementHandle = await page.$('iframe.preview-frame');
  const frame = await elementHandle.contentFrame();
  
  await frame.waitForSelector('.mobile-menu-btn', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const css = await frame.evaluate(() => {
    const el = document.querySelector('#ecclesia-theme-tokens');
    return el ? el.innerHTML : 'NOT FOUND';
  });
  
  console.log("CSS FROM IFRAME:", css.substring(0, 500) + "...");
  if (css.includes(":has")) {
    console.log("CSS DOES contain :has rule");
    console.log(css.substring(css.indexOf(":has") - 50, css.indexOf(":has") + 100));
  }
  
  await frame.evaluate(() => {
    document.querySelector('.mobile-menu-btn').click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const hasPushTransform = await frame.evaluate(() => {
    const shell = document.querySelector('.shell-wrapper');
    if (!shell) return false;
    const computed = window.getComputedStyle(shell);
    console.log("computed transform:", computed.transform);
    return computed.transform !== 'none';
  });
  console.log("Shell wrapper has push transform applied:", hasPushTransform);

  await browser.close();
})();
