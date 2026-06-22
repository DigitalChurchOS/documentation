const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('scratch').filter(f => f.startsWith('extracted_replace_') && f.endsWith('.json'));
const edits = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync('scratch/' + file));
  const match = file.match(/extracted_replace_(\d+)_(.+)\.json/);
  const step = parseInt(match[1]);
  if (step <= 260) {
    edits.push({ step, file, targetFile: (data.TargetFile || '').replace(/"/g, ''), instruction: data.Instruction, description: data.Description });
  }
}
edits.sort((a,b) => a.step - b.step);
for (const e of edits) {
  console.log(`Step ${e.step} - File: ${path.basename(e.targetFile)}`);
  console.log(`  Instruction: ${e.instruction}`);
  console.log(`  Description: ${e.description}`);
}
