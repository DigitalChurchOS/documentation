const fs = require('fs');

const prevLogPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\b6ef7979-b2e0-456b-b57d-251645bf61e7\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(prevLogPath)) {
  console.log("Log path does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(prevLogPath, 'utf8').split('\n');
for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.args.TargetFile && tc.args.TargetFile.includes('schema.prisma')) {
          console.log(`Step ${data.step_index} - Tool: ${tc.name}`);
          console.log("Args:", JSON.stringify(tc.args, null, 2).substring(0, 1000));
        }
      }
    }
  } catch (e) {}
}
