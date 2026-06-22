const db = require('better-sqlite3')('prisma/dev.db');

// Update tenant subdomain to 'demo'
const result = db.prepare("UPDATE tenants SET subdomain = 'demo' WHERE id = 'de4498dc-069d-45b6-bc56-1a90ade1fb34'").run();
console.log("Updated rows:", result.changes);

// Verify
const tenant = db.prepare("SELECT id, name, subdomain FROM tenants WHERE id = 'de4498dc-069d-45b6-bc56-1a90ade1fb34'").get();
console.log("Tenant:", tenant);

db.close();
