const fs = require('fs');

const tc = JSON.parse(fs.readFileSync('scratch/step_83_tc_0.json', 'utf8'));
const chunks = tc.args.ReplacementChunks;

console.log("Found chunks:", chunks.length);
chunks.forEach((chunk, idx) => {
  console.log(`\n--- Chunk ${idx} ---`);
  console.log("StartLine:", chunk.StartLine, "EndLine:", chunk.EndLine);
  console.log("Target (first 100 chars):", JSON.stringify(chunk.TargetContent.substring(0, 100)));
  console.log("Replacement length:", chunk.ReplacementContent.length);
});
