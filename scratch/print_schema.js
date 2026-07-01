const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Find model GroupType and model Group
const lines = schema.split('\n');
let insideGroupType = false;
let insideGroup = false;

console.log('--- GroupType Model ---');
lines.forEach(line => {
  if (line.trim().startsWith('model GroupType ')) {
    insideGroupType = true;
  }
  if (insideGroupType) {
    console.log(line);
    if (line.trim() === '}') {
      insideGroupType = false;
    }
  }
});

console.log('\n--- Group Model ---');
lines.forEach(line => {
  if (line.trim().startsWith('model Group ')) {
    insideGroup = true;
  }
  if (insideGroup) {
    console.log(line);
    if (line.trim() === '}') {
      insideGroup = false;
    }
  }
});
