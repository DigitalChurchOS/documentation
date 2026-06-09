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
    const content = data.content || '';
    if (content.includes('export const App: React.FC = () =>') && content.includes('mode === \'embed\'')) {
      console.log(`Found app.tsx content in step ${data.step_index} (${data.type})`);
      // Save it to a scratch file
      const outPath = `C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\found_app_tsx_step_${data.step_index}.txt`;
      fs.writeFileSync(outPath, content);
      console.log(`Saved to ${outPath}`);
    }
  } catch (e) {
    // ignore
  }
}
