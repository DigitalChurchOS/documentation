const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch';
const files = fs.readdirSync(scratchDir).filter(f => f.startsWith('extracted_replace_') && f.endsWith('.json'));

const edits = [];
for (const file of files) {
  const filePath = path.join(scratchDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const match = file.match(/extracted_replace_(\d+)_(.+)\.json/);
    const step = parseInt(match[1]);
    const targetFile = (data.TargetFile || data.AbsolutePath || '').replace(/"/g, '');
    edits.push({
      step,
      file,
      targetFile,
      instruction: data.Instruction,
      description: data.Description,
      startLine: data.StartLine,
      endLine: data.EndLine,
      targetLen: (data.TargetContent || '').length,
      replacementLen: (data.ReplacementContent || '').length,
      chunks: data.ReplacementChunks ? data.ReplacementChunks.length : 0
    });
  } catch (e) {
    console.error("Error parsing", file, e);
  }
}

// Sort by step
edits.sort((a, b) => a.step - b.step);

for (const edit of edits) {
  console.log(`Step ${edit.step} - File: ${path.basename(edit.targetFile)}`);
  console.log(`  Instruction: ${edit.instruction}`);
  console.log(`  Description: ${edit.description}`);
  console.log(`  Lines: ${edit.startLine}-${edit.endLine}, TargetLen: ${edit.targetLen}, ReplaceLen: ${edit.replacementLen}, Chunks: ${edit.chunks}`);
}
