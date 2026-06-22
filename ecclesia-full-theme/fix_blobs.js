const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'assets');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));

files.forEach(f => {
  const file = path.join(dir, f);
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace orange (accent)
  content = content.replace(/rgba\(249,\s*115,\s*22,\s*([\d.]+)\)/g, (match, p1) => {
    let num = parseFloat(p1) * 100;
    return `color-mix(in srgb, var(--accent) ${Math.round(num)}%, transparent)`;
  });

  // Replace yellow (gold/accent-2)
  content = content.replace(/rgba\(250,\s*204,\s*21,\s*([\d.]+)\)/g, (match, p1) => {
    let num = parseFloat(p1) * 100;
    return `color-mix(in srgb, var(--gold) ${Math.round(num)}%, transparent)`;
  });

  fs.writeFileSync(file, content);
});
console.log('Replaced in ' + files.length + ' files.');
