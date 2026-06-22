const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const p = db.prepare("SELECT content FROM pages WHERE slug = ''").get();
if (p) {
  const blocks = JSON.parse(p.content);
  const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
  
  let startIdx = 0;
  let styleContent = '';
  while (true) {
    const openTag = html.indexOf('<style', startIdx);
    if (openTag === -1) break;
    const closeTag = html.indexOf('</style>', openTag);
    if (closeTag === -1) break;
    const content = html.substring(html.indexOf('>', openTag) + 1, closeTag);
    styleContent += content + '\n';
    startIdx = closeTag + 8;
  }
  
  console.log("=== SEARCHING EMBEDDED STYLES ===");
  const lines = styleContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('left-rail') || line.includes('position') || line.includes('sticky') || line.includes('overflow') || line.includes('height') || line.includes('transform')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  }
}

db.close();
