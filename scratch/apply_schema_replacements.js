const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8').replace(/\r\n/g, '\n');

const tc = JSON.parse(fs.readFileSync('scratch/step_83_tc_0.json', 'utf8'));
const chunks = tc.args.ReplacementChunks;

console.log("Applying replacement chunks...");
chunks.forEach((chunk, idx) => {
  const target = chunk.TargetContent.replace(/\r\n/g, '\n');
  const replacement = chunk.ReplacementContent.replace(/\r\n/g, '\n');
  
  if (!schema.includes(target)) {
    console.error(`ERROR: Target content for Chunk ${idx} not found!`);
    
    // Let's print clean versions to inspect
    console.log("Expected target length:", target.length);
    process.exit(1);
  }
  
  schema = schema.replace(target, replacement);
  console.log(`Successfully applied Chunk ${idx}`);
});

fs.writeFileSync(schemaPath, schema);
console.log("Saved updated schema.prisma!");
