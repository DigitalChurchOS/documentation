const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log("Connecting to:", dbPath);
const db = new Database(dbPath);

try {
  const p = db.prepare("SELECT content, draft_content FROM pages WHERE slug = '' OR slug IS NULL LIMIT 1").get();
  if (p) {
    const blocks = JSON.parse(p.content || "[]");
    const html = blocks[0] ? (blocks[0].html || blocks[0].content || "") : "";
    
    console.log("Length of HTML:", html.length);
    const match = html.match(/<aside[^>]*class=["'][^"']*mobile-drawer[^"']*["'][^>]*>[\s\S]*?<\/aside>/i);
    if (match) {
      console.log("=== FOUND DRAWER ===");
      console.log(match[0]);
    } else {
      console.log("Drawer not found in content HTML");
      const matchDiv = html.match(/<div[^>]*class=["'][^"']*mobile-drawer[^"']*["'][^>]*>[\s\S]*?<\/div>/i);
      if (matchDiv) {
        console.log("=== FOUND DIV DRAWER ===");
        console.log(matchDiv[0]);
      }
    }
  } else {
    console.log("Home page not found");
  }
} catch (err) {
  console.error("Error:", err.message);
} finally {
  db.close();
}
