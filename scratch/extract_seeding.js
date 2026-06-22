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
        if (tc.args.TargetFile && tc.args.TargetFile.includes('themeEngine.ts')) {
          console.log(`Step ${data.step_index} - Tool: ${tc.name}`);
          // Write the ReplacementContent to a file in scratch
          const content = tc.args.ReplacementContent || tc.args.CodeContent;
          if (content) {
            let decodedContent = content;
            if (content.startsWith('"') && content.endsWith('"')) {
              try {
                decodedContent = JSON.parse(content);
              } catch(e) {}
            }
            const outPath = `C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\extracted_themeEngine_step_${data.step_index}.ts`;
            fs.writeFileSync(outPath, decodedContent);
            console.log(`Wrote extracted content to ${outPath}`);
          }
        }
      }
    }
  } catch (e) {}
}
