const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/');
  
  await page.waitForSelector('iframe.preview-frame');
  const elementHandle = await page.$('iframe.preview-frame');
  const frame = await elementHandle.contentFrame();
  
  // Wait for the native drawer button to be attached by app.js
  await frame.waitForSelector('.mobile-menu-btn', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Dump body attributes
  const bodyAttrs = await frame.evaluate(() => {
    return document.body.outerHTML.substring(0, 300);
  });
  console.log("Body HTML:", bodyAttrs);

  // Click the mobile menu button
  await frame.evaluate(() => {
    document.querySelector('.mobile-menu-btn').click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const hasPushTransform = await frame.evaluate(() => {
    const shell = document.querySelector('.shell-wrapper');
    if (!shell) return false;
    const computed = window.getComputedStyle(shell);
    console.log("computed transform:", computed.transform);
    // Is the class .open present?
    const drawer = document.querySelector('.mobile-drawer');
    console.log("drawer has open class?", drawer.classList.contains('open'));
    return computed.transform !== 'none';
  });
  console.log("Shell wrapper has push transform applied:", hasPushTransform);

  await browser.close();
})();
