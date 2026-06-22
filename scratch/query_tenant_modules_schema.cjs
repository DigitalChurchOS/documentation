const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log("Connecting to database at:", dbPath);
const db = new Database(dbPath);

try {
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE name='tenant_modules'").get();
  console.log("=== TENANT MODULES SCHEMA ===");
  console.log(schema.sql);
} catch (err) {
  console.error("Database query error:", err);
} finally {
  db.close();
}
