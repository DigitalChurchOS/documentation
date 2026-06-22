const fs = require('fs');

const tc = JSON.parse(fs.readFileSync('scratch/step_83_tc_0.json', 'utf8'));
const chunk = tc.args.ReplacementChunks[2];
const content = chunk.ReplacementContent.replace(/\r/g, '');

// The replacement content includes:
//   @@map("radio_reactions")
// }
// 
// // ───...
// so we need to extract everything after the closing brace of radio_reactions.
const lines = content.split('\n');
const startIndex = lines.findIndex(line => line.includes('TV & VIDEO BROADCASTING'));
if (startIndex !== -1) {
  const tvContent = lines.slice(startIndex - 1).join('\n');
  fs.writeFileSync('scratch/tv_models_clean.prisma', tvContent);
  console.log("Saved clean TV models!");
} else {
  console.error("Could not find TV & VIDEO BROADCASTING comment!");
}
