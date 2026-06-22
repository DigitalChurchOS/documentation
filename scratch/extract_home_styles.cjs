const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const p = db.prepare("SELECT content FROM pages WHERE slug = ''").get();
if (p) {
  const blocks = JSON.parse(p.content);
  const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
  
  // Find style tags
  let startIdx = 0;
  while (true) {
    const openTag = html.indexOf('<style', startIdx);
    if (openTag === -1) break;
    const closeTag = html.indexOf('</style>', openTag);
    if (closeTag === -1) break;
    console.log(`=== STYLE BLOCK (start: ${openTag}, end: ${closeTag}) ===`);
    console.log(html.substring(openTag, closeTag + 8));
    startIdx = closeTag + 8;
  }
}

db.close();
