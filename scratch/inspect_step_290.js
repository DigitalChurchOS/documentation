const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\edit_index_html_step_290.json', 'utf8'));
console.log(`Step 290 - Tool: ${data.name}`);
console.log(`Instruction: ${data.args.Instruction}`);
console.log(`ReplacementContent length: ${data.args.ReplacementContent?.length}`);
console.log(`ReplacementContent:\n${data.args.ReplacementContent}`);
