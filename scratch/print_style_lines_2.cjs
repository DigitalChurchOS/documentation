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
  
  const lines = styleContent.split('\n');
  console.log("=== STYLE RANGE ===");
  for (let i = 65; i < 125 && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

db.close();
