const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch');
for (const file of files) {
  if (file.startsWith('view_file_step_')) {
    const fullPath = path.join('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch', file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const firstLine = content.split('\n')[0] || '';
    const secondLine = content.split('\n')[1] || '';
    const thirdLine = content.split('\n')[2] || '';
    const fourthLine = content.split('\n')[3] || '';
    const fifthLine = content.split('\n')[4] || '';
    console.log(`${file}: size=${content.length}`);
    console.log(`  L1: ${firstLine}`);
    console.log(`  L2: ${secondLine}`);
    console.log(`  L3: ${thirdLine}`);
    console.log(`  L4: ${fourthLine}`);
    console.log(`  L5: ${fifthLine}`);
  }
}
