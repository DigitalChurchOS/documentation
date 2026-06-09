const fs = require('fs');

const logPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\0555240a-672e-4d77-8893-c3014627a7d0\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');
for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(tc.name)) {
          console.log(`Step ${data.step_index} - Tool: ${tc.name}`);
          console.log("Args keys & types:", Object.keys(tc.args).map(k => `${k}: ${typeof tc.args[k]}`));
          console.log("TargetFile:", tc.args.TargetFile);
          if (tc.args.CodeContent) {
            console.log("CodeContent starts/ends with quote?", tc.args.CodeContent.startsWith('"'), tc.args.CodeContent.endsWith('"'));
            console.log("CodeContent preview:", tc.args.CodeContent.substring(0, 100));
          }
          console.log("-----------------------------------------");
        }
      }
    }
  } catch (e) {}
}
