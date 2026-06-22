const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log("Connecting to:", dbPath);
const db = new Database(dbPath);

try {
  const pages = db.prepare("SELECT id, title, slug, content FROM pages").all();
  console.log("=== CHECKING FOR STYLE BLOCKS IN PAGES ===");
  for (const p of pages) {
    if (p.content && p.content.includes('<style>')) {
      console.log(`Page ${p.title} (${p.slug}) has style block`);
    }
  }
} catch (err) {
  console.error("Error:", err.message);
} finally {
  db.close();
}
