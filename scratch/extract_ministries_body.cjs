const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const p = db.prepare("SELECT content FROM pages WHERE slug = 'ministries'").get();
if (p) {
  const blocks = JSON.parse(p.content);
  const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
  
  const bodyStart = html.indexOf('<body');
  if (bodyStart !== -1) {
    const bodyContent = html.substring(bodyStart, html.indexOf('</body>') + 7);
    console.log("=== MINISTRIES BODY STRUCTURE ===");
    console.log(bodyContent.substring(0, 2000));
  }
}

db.close();
