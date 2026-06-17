const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log("Connecting to database at:", dbPath);
const db = new Database(dbPath);

try {
  const tenants = db.prepare("SELECT id, name, subdomain, status FROM tenants").all();
  console.log("=== TENANTS ===");
  console.log(tenants);

  for (const tenant of tenants) {
    const modules = db.prepare("SELECT module_key, status FROM tenant_modules WHERE tenant_id = ?").all(tenant.id);
    console.log(`=== MODULES FOR ${tenant.name} (${tenant.subdomain}) ===`);
    console.log(modules);
  }

  const websites = db.prepare("SELECT id, domain, theme_id FROM websites").all();
  console.log("=== WEBSITES ===");
  console.log(websites);

} catch (err) {
  console.error("Database query error:", err);
} finally {
  db.close();
}
