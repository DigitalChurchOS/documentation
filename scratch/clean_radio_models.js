const fs = require('fs');

const content = fs.readFileSync('scratch/step_18_viewed_content.txt', 'utf8');
const lines = content.replace(/\r/g, '').split('\n');
const cleanLines = [];

for (const line of lines) {
  const cleanLine = line.replace(/^\s*\d+:\s*/, '');
  if (cleanLine.includes('model ') || cleanLine.includes('  ') || cleanLine.trim() === '}' || cleanLine.trim() === '') {
    cleanLines.push(cleanLine);
  }
}

fs.writeFileSync('scratch/radio_models_clean.prisma', cleanLines.join('\n'));
console.log("Saved clean Radio models!");
console.log(cleanLines.slice(0, 15).join('\n'));
