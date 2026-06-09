const fs = require('fs');

const path = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\apps\\tenant-dashboard\\public\\index.html';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Theme customizer') || lines[i].includes('theme customizer')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
