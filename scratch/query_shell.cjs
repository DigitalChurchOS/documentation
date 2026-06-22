const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const pages = db.prepare("SELECT id, title, slug, content, draft_content FROM pages").all();
console.log(`Found ${pages.length} pages:`);

for (const p of pages) {
  const content = p.content || '';
  const hasShell = content.includes('shell-wrapper');
  const hasLeftRail = content.includes('left-rail');
  const hasDrawer = content.includes('mobile-drawer') || content.includes('mobileDrawer');
  let blocks = [];
  try {
    blocks = content.startsWith('[') ? JSON.parse(content) : [];
  } catch(e) {}
  
  let rawHtmlLength = 0;
  let hasRawHtmlShell = false;
  let hasRawHtmlDrawer = false;
  let hasRawHtmlLeftRail = false;

  for (const b of blocks) {
    const html = b.data?.content || b.html || b.content || '';
    if (html) {
      rawHtmlLength += html.length;
      if (html.includes('shell-wrapper')) hasRawHtmlShell = true;
      if (html.includes('left-rail')) hasRawHtmlLeftRail = true;
      if (html.includes('mobile-drawer') || html.includes('mobileDrawer')) hasRawHtmlDrawer = true;
    }
  }

  console.log(`- ${p.title} (${p.slug}):`);
  console.log(`  Direct: hasShell=${hasShell}, hasLeftRail=${hasLeftRail}, hasDrawer=${hasDrawer}`);
  if (blocks.length > 0) {
    console.log(`  Blocks count: ${blocks.length}, total raw html length: ${rawHtmlLength}`);
    console.log(`  Raw HTML: hasShell=${hasRawHtmlShell}, hasLeftRail=${hasRawHtmlLeftRail}, hasDrawer=${hasRawHtmlDrawer}`);
  }
}

db.close();
