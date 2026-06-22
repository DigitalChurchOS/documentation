const fs = require('fs');
const path = require('path');

const tasksDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\b6ef7979-b2e0-456b-b57d-251645bf61e7\\.system_generated\\tasks';
if (!fs.existsSync(tasksDir)) {
  console.log("Tasks dir does not exist");
  process.exit(1);
}

const files = fs.readdirSync(tasksDir);
for (const file of files) {
  if (!file.endsWith('.log')) continue;
  const filePath = path.join(tasksDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`=== File: ${file} (${content.length} bytes) ===`);
  console.log(content.substring(0, 500));
  console.log("--------------------------------------------------\n");
}
