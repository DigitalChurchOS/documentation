const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

try {
  const homepage = db.prepare("SELECT content FROM Page WHERE slug = '' LIMIT 1").get();
  if (!homepage) {
    console.log("Homepage not found!");
  } else {
    const content = homepage.content;
    console.log("=== HOMEPAGE CONTENT LENGTH ===", content.length);
    // Find drawer
    const drawerIndex = content.indexOf('id="mobileDrawer"');
    if (drawerIndex === -1) {
      console.log("No id=mobileDrawer found");
    } else {
      console.log("=== Drawer substring ===");
      console.log(content.substring(drawerIndex - 100, drawerIndex + 1000));
    }
  }
} catch (err) {
  console.error("Error:", err);
} finally {
  db.close();
}
