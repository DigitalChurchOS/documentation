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
      if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
        let targetFile = tc.args.TargetFile || tc.args.AbsolutePath || '';
        // Clean double quotes
        targetFile = targetFile.replace(/"/g, '');
        if (!targetFile) continue;
        
        const filename = path.basename(targetFile);
        
        if (tc.name === 'write_to_file') {
          const outPath = `C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\extracted_full_${data.step_index}_${filename}`;
          let content = tc.args.CodeContent || '';
          // Check if content is double-serialized
          if (typeof content === 'string' && content.startsWith('"') && content.endsWith('"')) {
            try {
              content = JSON.parse(content);
            } catch (e) {}
          }
          fs.writeFileSync(outPath, content, 'utf8');
          console.log(`Saved step ${data.step_index} write_to_file: ${filename} to ${outPath}`);
        } else {
          const outPath = `C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\extracted_replace_${data.step_index}_${filename}.json`;
          fs.writeFileSync(outPath, JSON.stringify(tc.args, null, 2), 'utf8');
          console.log(`Saved step ${data.step_index} ${tc.name}: ${filename} to ${outPath}`);
        }
      }
    }
  } catch (e) {
    console.error("Error processing line:", e);
  }
}
