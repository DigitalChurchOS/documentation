const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\view_file_step_1101_local-preview.js.txt', 'utf8');
const lines = content.split('\n');
console.log(`view_file_step_1101_local-preview.js.txt - Lines count: ${lines.length}`);
console.log(`First 10 lines:\n${lines.slice(0, 10).join('\n')}`);
console.log(`Last 10 lines:\n${lines.slice(-10).join('\n')}`);
