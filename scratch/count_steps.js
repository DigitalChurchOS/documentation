const fs = require('fs');
const prevLogPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\b6ef7979-b2e0-456b-b57d-251645bf61e7\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(prevLogPath)) {
  console.log("Log path does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(prevLogPath, 'utf8').split('\n');
console.log(`Total lines in log: ${lines.length}`);

const toolCounts = {};
let matchedSteps = 0;

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    const toolCalls = data.tool_calls || [];
    for (const tc of toolCalls) {
      toolCounts[tc.name] = (toolCounts[tc.name] || 0) + 1;
      if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
        matchedSteps++;
        if (matchedSteps < 10) {
          console.log(`Step ${data.step_index}: ${tc.name} for ${tc.args.TargetFile || tc.args.AbsolutePath}`);
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

console.log("Tool counts:", toolCounts);
console.log("Total matched steps:", matchedSteps);
