const db = require('better-sqlite3')('prisma/dev.db');
const tenants = db.prepare("SELECT id, name, subdomain, status FROM tenants").all();
console.log("=== TENANTS ===");
tenants.forEach(t => console.log(`  ${t.name} subdomain='${t.subdomain}' status=${t.status} id=${t.id}`));
db.close();
