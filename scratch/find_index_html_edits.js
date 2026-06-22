const fs = require('fs');
const path = require('path');

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
    const toolCalls = data.tool_calls || [];
    for (const tc of toolCalls) {
      const targetFile = tc.args.TargetFile || '';
      if (targetFile.includes('index.html')) {
        console.log(`Step ${data.step_index} - Tool: ${tc.name}`);
        const outPath = `C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\edit_index_html_step_${data.step_index}.json`;
        fs.writeFileSync(outPath, JSON.stringify(tc, null, 2));
        console.log(`Saved edit details to ${outPath}`);
      }
    }
  } catch (e) {}
}
