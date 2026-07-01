const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'theme-customizer', 'src', 'App.tsx');
const content = fs.readFileSync(appPath, 'utf8');
const lines = content.split('\n');

console.log('Mentions of localStorage in App.tsx:');
lines.forEach((line, idx) => {
  if (line.includes('localStorage')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
