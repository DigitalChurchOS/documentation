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
  
  // Check if .open was added to .mobile-drawer
  let drawerClasses = await frame.evaluate(() => {
    return document.querySelector('.mobile-drawer').className;
  });
  console.log("Drawer classes BEFORE click:", drawerClasses);

  // Click the mobile menu button
  console.log("Clicking native mobile menu button...");
  await frame.evaluate(() => {
    document.querySelector('.mobile-menu-btn').click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  drawerClasses = await frame.evaluate(() => {
    return document.querySelector('.mobile-drawer').className;
  });
  console.log("Drawer classes AFTER click:", drawerClasses);
  
  const hasPushTransform = await frame.evaluate(() => {
    // Check if shell-wrapper has a transform applied due to the :has rule
    const shell = document.querySelector('.shell-wrapper');
    if (!shell) return false;
    const computed = window.getComputedStyle(shell);
    console.log("computed transform:", computed.transform);
    return computed.transform !== 'none';
  });
  console.log("Shell wrapper has push transform applied:", hasPushTransform);

  await browser.close();
})();
