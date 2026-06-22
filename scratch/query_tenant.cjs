const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const tenant = db.prepare("SELECT * FROM tenants LIMIT 1").get();
if (tenant) {
  console.log("=== TENANT ===");
  console.log(JSON.stringify(tenant, null, 2));
} else {
  console.log("No tenant found");
}

db.close();
