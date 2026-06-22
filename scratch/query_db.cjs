const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log("Connecting to database at:", dbPath);
const db = new Database(dbPath);

try {
  const tenants = db.prepare("SELECT id, subdomain, name FROM tenants").all();
  console.log("=== TENANTS ===");
  console.log(JSON.stringify(tenants, null, 2));

  const websites = db.prepare("SELECT id, tenant_id, theme_id, domain FROM websites").all();
  console.log("=== WEBSITES ===");
  console.log(JSON.stringify(websites, null, 2));

  const pages = db.prepare("SELECT id, title, slug, website_id, status FROM pages").all();
  console.log("=== PAGES ===");
  console.log(JSON.stringify(pages, null, 2));

} catch (err) {
  console.error("Database query error:", err);
} finally {
  db.close();
}
