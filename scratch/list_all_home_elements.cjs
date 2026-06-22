const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const p = db.prepare("SELECT content FROM pages WHERE slug = ''").get();
if (p) {
  const blocks = JSON.parse(p.content);
  const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
  
  // Use regex to find all elements at the top level or within main
  const re = /<([a-zA-Z0-9:-]+)([^>]*)/g;
  let match;
  console.log("=== ALL ELEMENTS AND THEIR ATTRIBUTES ===");
  while ((match = re.exec(html)) !== null) {
    const tag = match[1];
    const attrs = match[2];
    if (['div', 'section', 'main', 'header', 'footer', 'aside'].includes(tag.toLowerCase())) {
      console.log(`- <${tag} ${attrs.trim().substring(0, 150)}>`);
    }
  }
}

db.close();
