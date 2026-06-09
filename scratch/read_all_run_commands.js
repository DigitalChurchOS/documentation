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
    if (data.type === 'RUN_COMMAND') {
      const tc = data.tool_calls ? data.tool_calls[0] : null;
      const cmd = tc && tc.name === 'run_command' ? tc.args.CommandLine : null;
      console.log(`Step ${step} -> command: ${cmd}`);
    }
  } catch (e) {}
}
