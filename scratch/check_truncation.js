const fs = require('fs');

const prevLogPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\b6ef7979-b2e0-456b-b57d-251645bf61e7\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(prevLogPath)) {
  console.log("Log path does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(prevLogPath, 'utf8').split('\n');
let truncatedCount = 0;
let totalWrites = 0;

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(tc.name)) {
          totalWrites++;
          // Check if any arg value contains "<truncated"
          const str = JSON.stringify(tc.args);
          if (str.includes('<truncated')) {
            truncatedCount++;
            console.log(`Step ${data.step_index} - Tool: ${tc.name} is truncated!`);
            console.log(`TargetFile: ${tc.args.TargetFile}`);
          }
        }
      }
    }
  } catch (e) {
    // Check if the line itself was truncated and failed to parse
    if (line.includes('<truncated')) {
      truncatedCount++;
      console.log(`Line failed to parse and contains truncation!`);
    }
  }
}

console.log(`Total write/replace tools found: ${totalWrites}`);
console.log(`Truncated write/replace tools found: ${truncatedCount}`);
