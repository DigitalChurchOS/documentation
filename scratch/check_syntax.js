const fs = require('fs');
const vm = require('vm');

try {
  const html = fs.readFileSync('dashboard.html', 'utf8');
  // Find the main script block
  const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    const code = match[1];
    if (code.includes('modules =') || code.includes('renderSidebarModules')) {
      console.log(`Checking script block #${scriptCount} (length: ${code.length})...`);
      try {
        new vm.Script(code, { filename: 'dashboard.html <script>' });
        console.log('Script block is syntactically valid!');
      } catch (err) {
        console.error('Syntax error in script block:', err);
      }
    }
  }
} catch (err) {
  console.error('Failed to read or check dashboard.html:', err);
}
