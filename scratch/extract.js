const fs = require('fs');
const path = require('path');

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
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'write_to_file' && tc.args.TargetFile && tc.args.TargetFile.includes('replay_all.js')) {
          console.log("Found step_index:", data.step_index);
          try {
            // Since data is parsed, tc.args.CodeContent is already a string.
            // But wait, the raw JSON had CodeContent serialized as a JSON string or double-serialized?
            // Let's print type of tc.args.CodeContent
            console.log("Type of CodeContent:", typeof tc.args.CodeContent);
            let content = tc.args.CodeContent;
            if (content.startsWith('"') && content.endsWith('"')) {
              // It is double-serialized as a JSON string.
              content = JSON.parse(content);
            }
            fs.writeFileSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\reconstructed_replay_all.js', content);
            console.log("Wrote reconstructed file successfully.");
          } catch (innerErr) {
            console.error("Inner error:", innerErr);
          }
        }
      }
    }
  } catch (e) {
    // ignore parse error
  }
}
