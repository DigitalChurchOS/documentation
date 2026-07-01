const fs = require('fs');
const path = require('path');

const customizerSrc = path.join(__dirname, '..', 'theme-customizer', 'src');

// Search for applyThemeStructure definition in all ts/tsx files recursively
function searchDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(entryPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(entryPath, 'utf8');
      if (content.includes('applyThemeStructure')) {
        console.log(`Found in: ${path.relative(customizerSrc, entryPath)}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('applyThemeStructure') || line.includes('function applyThemeStructure')) {
            console.log(`  Line ${idx+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir(customizerSrc);
