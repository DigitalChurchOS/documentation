const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\edit_index_html_step_539.json', 'utf8'));
console.log("Keys of data:", Object.keys(data));
console.log("data.args:", Object.keys(data.args));
console.log("Type of ReplacementChunks:", typeof data.args.ReplacementChunks);
if (Array.isArray(data.args.ReplacementChunks)) {
  console.log("Length of ReplacementChunks:", data.args.ReplacementChunks.length);
  console.log("First chunk:", data.args.ReplacementChunks[0]);
} else {
  console.log("ReplacementChunks is not an array, value starts with:", String(data.args.ReplacementChunks).substring(0, 100));
}
