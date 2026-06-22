const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch');
for (const file of files) {
  if (file.startsWith('edit_index_html_step_')) {
    const fullPath = path.join('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch', file);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    console.log(`\n========================================`);
    console.log(`Step ${data.step_index || file} - Tool: ${data.name}`);
    console.log(`Instruction: ${data.args.Instruction}`);
    console.log(`Description: ${data.args.Description}`);
    console.log(`StartLine: ${data.args.StartLine}, EndLine: ${data.args.EndLine}`);
    if (data.args.ReplacementContent) {
      console.log(`ReplacementContent (len=${data.args.ReplacementContent.length}): \n${data.args.ReplacementContent.substring(0, 500)}...`);
    }
    
    const chunks = data.args.ReplacementChunks || [];
    if (chunks.length > 0) {
      console.log(`Chunks count: ${chunks.length}`);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const target = chunk.TargetContent || chunk.targetContent || '';
        const replacement = chunk.ReplacementContent || chunk.replacementContent || '';
        console.log(`  Chunk ${i+1}: StartLine=${chunk.StartLine || chunk.startLine}, EndLine=${chunk.EndLine || chunk.endLine}`);
        console.log(`    TargetContent (len=${target.length}): ${target.substring(0, 100).replace(/\n/g, '\\n')}...`);
        console.log(`    ReplacementContent (len=${replacement.length}): ${replacement.substring(0, 100).replace(/\n/g, '\\n')}...`);
      }
    }
  }
}
