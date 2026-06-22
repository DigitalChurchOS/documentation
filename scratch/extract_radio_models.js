const fs = require('fs');

const logPath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\44561a8a-8ba9-4d31-bfa4-25d51e98f7da\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 18 && obj.type === 'VIEW_FILE') {
      console.log("Found step 18 VIEW_FILE!");
      fs.writeFileSync('scratch/step_18_viewed_content.txt', obj.content);
      
      // Let's print the first 20 lines to verify
      console.log(obj.content.substring(0, 1000));
    }
  } catch (err) {
    // Ignore
  }
}
