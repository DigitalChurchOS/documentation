const fs = require('fs');
const path = require('path');

const prevLogPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\b6ef7979-b2e0-456b-b57d-251645bf61e7\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(prevLogPath)) {
  console.log("Log path does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(prevLogPath, 'utf8').split('\n');

const targets = [
  'themeEngine.ts',
  'app.tsx',
  'index.html',
  'local-preview.js',
  'cms_extended.test.ts'
];

let output = '';
function log(msg) {
  output += msg + '\n';
}

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    const toolCalls = data.tool_calls || [];
    for (const tc of toolCalls) {
      const targetFile = tc.args.TargetFile || tc.args.AbsolutePath || '';
      const matchedTarget = targets.find(t => targetFile.toLowerCase().includes(t.toLowerCase()));
      if (matchedTarget) {
        log(`\n========================================`);
        log(`Step ${data.step_index} - Tool: ${tc.name} - File: ${targetFile}`);
        log(`Instruction: ${tc.args.Instruction}`);
        log(`Description: ${tc.args.Description}`);
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
          log(`StartLine: ${tc.args.StartLine}, EndLine: ${tc.args.EndLine}`);
          log(`TargetContent: \n${tc.args.TargetContent}`);
          log(`ReplacementContent: \n${tc.args.ReplacementContent}`);
          if (tc.args.ReplacementChunks) {
            log(`Chunks: ${JSON.stringify(tc.args.ReplacementChunks, null, 2)}`);
          }
        } else if (tc.name === 'write_to_file') {
          log(`Overwrite: ${tc.args.Overwrite}`);
          log(`CodeContent: \n${tc.args.CodeContent.substring(0, 1000)}... (truncated)`);
        }
      }
    }
  } catch (e) {
    // ignore malformed JSON
  }
}

fs.writeFileSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\previous_changes.txt', output, 'utf8');
console.log("Wrote previous changes successfully.");
