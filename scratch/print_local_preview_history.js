const fs = require('fs');
const path = require('path');

const steps = [682, 686, 1025, 1031];
for (const step of steps) {
  const filePath = `C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\edit_local_preview_step_${step}.json`;
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`\n========================================`);
    console.log(`Step ${step} - Tool: ${data.name}`);
    console.log(`Instruction: ${data.args.Instruction}`);
    console.log(`Description: ${data.args.Description}`);
    console.log(`StartLine: ${data.args.StartLine}, EndLine: ${data.args.EndLine}`);
    if (data.args.ReplacementContent) {
      console.log(`ReplacementContent:\n${data.args.ReplacementContent}`);
    }
    let chunks = data.args.ReplacementChunks || [];
    if (typeof chunks === 'string') {
      chunks = JSON.parse(chunks);
    }
    if (chunks.length > 0) {
      console.log(`Chunks count: ${chunks.length}`);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`  Chunk ${i+1}: StartLine=${chunk.StartLine || chunk.startLine}, EndLine=${chunk.EndLine || chunk.endLine}`);
        console.log(`    TargetContent:\n${chunk.TargetContent || chunk.targetContent}`);
        console.log(`    ReplacementContent:\n${chunk.ReplacementContent || chunk.replacementContent}`);
      }
    }
  }
}
