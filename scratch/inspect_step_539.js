const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\edit_index_html_step_539.json', 'utf8'));
let chunks = data.args.ReplacementChunks;
if (typeof chunks === 'string') {
  chunks = JSON.parse(chunks);
}

console.log(`Step 539 - Tool: ${data.name}`);
console.log(`Instruction: ${data.args.Instruction}`);
console.log(`Number of chunks: ${chunks.length}`);

for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  console.log(`\n--- Chunk ${i + 1} ---`);
  console.log(`StartLine: ${chunk.StartLine || chunk.startLine}, EndLine: ${chunk.EndLine || chunk.endLine}`);
  const target = chunk.TargetContent || chunk.targetContent || '';
  const replacement = chunk.ReplacementContent || chunk.replacementContent || '';
  console.log(`TargetContent:\n${target}`);
  console.log(`ReplacementContent:\n${replacement}`);
}
