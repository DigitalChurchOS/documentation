const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\edit_local_preview_step_1031.json', 'utf8'));
console.log("ReplacementContent length:", data.args.ReplacementContent?.length);
console.log("ReplacementContent:\n", data.args.ReplacementContent);
