const fs = require('fs');

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

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    const toolCalls = data.tool_calls || [];
    for (const tc of toolCalls) {
      if (tc.name === 'view_file') {
        const pathVal = tc.args.AbsolutePath || '';
        const matched = targets.find(t => pathVal.toLowerCase().includes(t.toLowerCase()));
        if (matched) {
          console.log(`Step ${data.step_index} - VIEW_FILE on ${pathVal} - Lines ${tc.args.StartLine}-${tc.args.EndLine}`);
        }
      }
    }
  } catch (e) {}
}
