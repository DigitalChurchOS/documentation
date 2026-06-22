const fs = require('fs');
const path = require('path');

const themeDir = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\theme-customizer\\public\\themes\\ecclesia-full-theme';

const files = fs.readdirSync(themeDir).filter(f => f.endsWith('.html'));

console.log(`Verifying ${files.length} HTML templates in theme...`);
let allOk = true;

for (const file of files) {
  const filePath = path.join(themeDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const hasMobileDrawer = content.includes('class="mobile-drawer"') || content.includes('id="mobileDrawer"');
  const hasStylesCss = content.includes('assets/styles.css');

  console.log(`- ${file}: mobile-drawer=${hasMobileDrawer ? '✅' : '❌'}, styles.css=${hasStylesCss ? '✅' : '❌'}`);
  if (!hasMobileDrawer || !hasStylesCss) {
    allOk = false;
  }
}

if (allOk) {
  console.log("🎉 All pages verified successfully!");
} else {
  console.log("⚠️ Some pages have missing assets or incorrect drawer configurations!");
}
