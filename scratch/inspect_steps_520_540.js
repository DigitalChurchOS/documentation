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
    if (step >= 520 && step <= 540) {
      console.log(`--- Step ${step} (${data.source} - ${data.type}) ---`);
      if (data.content) console.log(data.content.substring(0, 500));
      if (data.tool_calls) console.log("Tools:", data.tool_calls.map(tc => tc.name));
    }
  } catch (e) {}
}
