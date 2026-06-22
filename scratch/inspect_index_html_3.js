const fs = require('fs');

const path = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\apps\\tenant-dashboard\\public\\index.html';
if (!fs.existsSync(path)) {
  console.log("index.html does not exist");
  process.exit(1);
}

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

let openCount = 0;
let startLine = 12798;
for (let i = startLine - 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<aside')) openCount++;
  if (line.includes('</aside>')) openCount--;
  if (openCount === 0) {
    console.log(`Matching </aside> is on line ${i + 1}: ${line.trim()}`);
    break;
  }
}
