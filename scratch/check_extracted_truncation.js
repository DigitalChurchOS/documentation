const fs = require('fs');

const path = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\extracted_themeEngine_step_212.ts';
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  console.log("File size:", content.length, "bytes");
  console.log("Contains truncated tag?", content.includes('<truncated'));
  if (content.includes('<truncated')) {
    console.log("Truncated snippet context:");
    const index = content.indexOf('<truncated');
    console.log(content.substring(index - 200, index + 200));
  } else {
    console.log("Entire content matches successfully without truncation!");
  }
} else {
  console.log("File does not exist");
}
