const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const slug = process.argv[2] || 'ministries';
const p = db.prepare("SELECT * FROM pages WHERE slug = ?").get(slug);
if (p) {
  console.log(`Title: ${p.title}`);
  console.log(`Slug: ${p.slug}`);
  const content = p.content || '';
  const blocks = content.startsWith('[') ? JSON.parse(content) : [];
  console.log(`Blocks Count: ${blocks.length}`);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    console.log(`Block ${i}: type=${b.type || b.slotKey || 'unknown'}`);
    const html = b.data?.content || b.html || b.content || '';
    console.log(`  HTML length: ${html.length}`);
    if (html) {
      console.log(`  HTML starts with: ${html.substring(0, 250)}`);
      console.log(`  HTML has shell-wrapper: ${html.includes('shell-wrapper')}`);
      console.log(`  HTML has left-rail: ${html.includes('left-rail')}`);
      console.log(`  HTML has mobile-drawer: ${html.includes('mobile-drawer') || html.includes('mobileDrawer')}`);
    }
  }
} else {
  console.log(`Page not found for slug: ${slug}`);
}

db.close();
