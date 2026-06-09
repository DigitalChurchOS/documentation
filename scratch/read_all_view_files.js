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
    if (data.type === 'VIEW_FILE' && data.status === 'DONE') {
      const content = data.content || '';
      // Extract target file name from content
      let filename = '';
      if (content.includes('page-builder/app.tsx')) filename = 'app.tsx';
      else if (content.includes('apps/tenant-dashboard/public/index.html')) filename = 'index.html';
      else if (content.includes('scripts/local-preview.js')) filename = 'local-preview.js';
      else if (content.includes('src/services/themeEngine.ts')) filename = 'themeEngine.ts';

      if (filename) {
        const outPath = `C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\view_file_step_${data.step_index}_${filename}.txt`;
        fs.writeFileSync(outPath, content);
        console.log(`Saved step ${data.step_index} view_file for ${filename} to ${outPath} (${content.length} bytes)`);
      }
    }
  } catch (e) {
    // ignore
  }
}
