const fs = require('fs');

const path = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\prisma\\schema.prisma';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('model Page ')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    // Print next 30 lines
    for (let j = i; j < i + 30; j++) {
      console.log(`  ${j+1}: ${lines[j]}`);
    }
    break;
  }
}
