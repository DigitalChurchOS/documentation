const fs = require('fs');
const path = require('path');

const themeDir = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\ecclesia-full-theme';
const files = fs.readdirSync(themeDir).filter(f => f.endsWith('.html'));

console.log(`Found ${files.length} HTML files to process.`);

let processedCount = 0;
let modifiedCount = 0;

for (const file of files) {
  const filePath = path.join(themeDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Inject styles.css if not present
  if (!content.includes('assets/styles.css')) {
    // Insert before </head>
    const headIndex = content.indexOf('</head>');
    if (headIndex !== -1) {
      content = content.substring(0, headIndex) + '  <link rel="stylesheet" href="assets/styles.css" />\n' + content.substring(headIndex);
      modified = true;
    }
  }

  // 2. Inject app.js if not present
  if (!content.includes('assets/app.js')) {
    // Insert before </body>
    const bodyIndex = content.indexOf('</body>');
    if (bodyIndex !== -1) {
      content = content.substring(0, bodyIndex) + '<script src="assets/app.js"></script>\n' + content.substring(bodyIndex);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  }
  processedCount++;
}

console.log(`Processed ${processedCount} files. Modified ${modifiedCount} files.`);
