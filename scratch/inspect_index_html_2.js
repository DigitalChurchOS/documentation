const fs = require('fs');

const path = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\apps\\tenant-dashboard\\public\\index.html';
if (!fs.existsSync(path)) {
  console.log("index.html does not exist");
  process.exit(1);
}

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log("Searching for customizer in index.html...");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id="customizer"') || lines[i].includes('class="settings-panel"')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
