const fs = require('fs');

const logPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\0555240a-672e-4d77-8893-c3014627a7d0\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log("Log path does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    const step = data.step_index;
    if (step < 500 && data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(tc.name)) {
          console.log(`Step ${step} - Tool: ${tc.name} -> Target: ${tc.args.TargetFile}`);
        }
      }
    }
  } catch (e) {}
}
