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
    if (step >= 0 && step <= 100) {
      if (data.type === 'RUN_COMMAND' || data.type === 'PLANNER_RESPONSE') {
        const toolCalls = data.tool_calls || [];
        const commands = toolCalls.filter(tc => tc.name === 'run_command').map(tc => tc.args.CommandLine);
        if (commands.length > 0) {
          console.log(`Step ${step} - Commands:`, commands);
        }
        if (data.type === 'RUN_COMMAND' && data.content && (data.content.includes('modified:') || data.content.includes('diff --git'))) {
          console.log(`Step ${step} - Output contains git status or diff!`);
          console.log(data.content.substring(0, 1000));
        }
      }
    }
  } catch (e) {}
}
