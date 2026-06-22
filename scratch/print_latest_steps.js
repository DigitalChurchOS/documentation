const fs = require('fs');

const steps = [1011, 1015];
for (const step of steps) {
  const filePath = `C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch\\edit_index_html_step_${step}.json`;
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`\n========================================`);
    console.log(`Step ${step} - Tool: ${data.name}`);
    console.log(`Instruction: ${data.args.Instruction}`);
    console.log(`Description: ${data.args.Description}`);
    console.log(`StartLine: ${data.args.StartLine}, EndLine: ${data.args.EndLine}`);
    if (data.args.ReplacementContent) {
      console.log(`ReplacementContent: \n${data.args.ReplacementContent}`);
    }
  }
}
