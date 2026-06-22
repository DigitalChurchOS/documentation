const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'assets');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));

files.forEach(f => {
  const file = path.join(dir, f);
  let content = fs.readFileSync(file, 'utf8');
  
  // Protect variable declarations
  content = content.replace(/--accent:\s*#f97316/g, '___ACCENT_VAR___');
  content = content.replace(/--gold:\s*#facc15/g, '___GOLD_VAR___');

  // Replace dark colors with color-mix responsive to --accent
  content = content.replace(/#1d1812/gi, 'color-mix(in srgb, var(--accent) 14%, #18181b)');
  content = content.replace(/#15110d/gi, 'color-mix(in srgb, var(--accent) 10%, #111111)');
  content = content.replace(/rgba\(29,\s*24,\s*18,\s*([\d.]+)\)/g, 'color-mix(in srgb, var(--accent) 14%, rgba(24,24,27,$1))');
  
  // Replace dark browns used in gradients
  content = content.replace(/#3a1f0d/gi, 'color-mix(in srgb, var(--accent) 30%, #18181b)');
  content = content.replace(/#431407/gi, 'color-mix(in srgb, var(--accent) 40%, #18181b)');
  
  // Replace hardcoded accent colors globally
  content = content.replace(/#f97316/gi, 'var(--accent)');
  content = content.replace(/#facc15/gi, 'var(--gold)');

  // Restore variable declarations
  content = content.replace(/___ACCENT_VAR___/g, '--accent:#f97316');
  content = content.replace(/___GOLD_VAR___/g, '--gold:#facc15');

  fs.writeFileSync(file, content);
});
console.log('Replaced dark backgrounds in ' + files.length + ' files.');
