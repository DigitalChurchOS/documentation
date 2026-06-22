const fs = require('fs');

const logPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\44561a8a-8ba9-4d31-bfa4-25d51e98f7da\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach((tc, idx) => {
        const fileArg = tc.args && (tc.args.TargetFile || tc.args.Target);
        if (fileArg && fileArg.includes('schema.prisma')) {
          console.log(`Step ${obj.step_index}: type=${obj.type}, tool=${tc.name}`);
        }
      });
    }
  } catch (err) {
    // Ignore
  }
}
