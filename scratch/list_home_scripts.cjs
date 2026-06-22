const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const p = db.prepare("SELECT content FROM pages WHERE slug = ''").get();
if (p) {
  const blocks = JSON.parse(p.content);
  const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
  
  let startIdx = 0;
  console.log("=== SCRIPTS ===");
  while (true) {
    const openTag = html.indexOf('<script', startIdx);
    if (openTag === -1) break;
    const closeTag = html.indexOf('</script>', openTag);
    if (closeTag === -1) break;
    console.log(html.substring(openTag, closeTag + 9).trim());
    startIdx = closeTag + 9;
  }
}

db.close();
