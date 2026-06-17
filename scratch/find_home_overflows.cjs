const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const p = db.prepare("SELECT content FROM pages WHERE slug = ''").get();
if (p) {
  const blocks = JSON.parse(p.content);
  const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
  
  let pos = 0;
  let count = 0;
  console.log("=== SEARCHING 'overflow' IN HOME PAGE HTML ===");
  while ((pos = html.indexOf('overflow', pos)) !== -1) {
    count++;
    console.log(`Occurrence ${count} at index ${pos}:`);
    console.log(html.substring(pos - 60, pos + 60));
    pos += 8;
  }
}

db.close();
