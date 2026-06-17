const puppeteer = require('../theme-customizer/node_modules/puppeteer');
const path = require('path');

(async () => {
  console.log("Launching Puppeteer browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });

  page.on('pageerror', err => {
    console.error('BROWSER ERROR:', err.toString());
  });

  const url = 'http://localhost:3000/customizer/?themeId=ecclesia&websiteId=demo-church-website&pageId=';
  console.log(`Navigating to ${url} ...`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    console.log("Initial load complete. Waiting 3 seconds for UI rendering...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get document title and main header text
    const pageTitle = await page.title();
    console.log("Document Title:", pageTitle);

    const uiTextFound = await page.evaluate(() => {
      // Find text elements
      const bodyText = document.body.innerText;
      return {
        themeBuilderTitle: bodyText.includes("Theme Builder"),
        designPresetText: bodyText.includes("Preset"),
        saveDraftText: bodyText.includes("Save Draft"),
        publishText: bodyText.includes("Publish")
      };
    });
    console.log("UI elements rendering confirmation:", uiTextFound);

    // Save screenshot directly to the artifact directory
    const screenshotPath = path.join(__dirname, '..', 'customizer_stabilized.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

  } catch (err) {
    console.error("Navigation error:", err);
  } finally {
    await browser.close();
  }
})();
