const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch');
for (const file of files) {
  if (file.startsWith('view_file_step_') && file.includes('local-preview.js')) {
    const fullPath = path.join('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch', file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    console.log(`\n========================================`);
    console.log(`${file} (size=${content.length})`);
    console.log(`  Header: ${lines[2]}`);
    console.log(`  Lines 6-15:\n${lines.slice(5, 15).join('\n')}`);
  }
}
