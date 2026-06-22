const fs = require('fs');

const currLogPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\0555240a-672e-4d77-8893-c3014627a7d0\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(currLogPath)) {
  console.log("Log path does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(currLogPath, 'utf8').split('\n');
let total = 0;
let truncated = 0;
for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.step_index < 500 && data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(tc.name)) {
          total++;
          const str = JSON.stringify(tc.args);
          if (str.includes('<truncated')) {
            truncated++;
            console.log(`Step ${data.step_index} - Tool: ${tc.name} is truncated! Target: ${tc.args.TargetFile}`);
          }
        }
      }
    }
  } catch (e) {}
}
console.log(`Total current edits: ${total}, Truncated: ${truncated}`);
