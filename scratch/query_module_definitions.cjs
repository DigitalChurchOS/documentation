const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log("Connecting to database at:", dbPath);
const db = new Database(dbPath);

try {
  const modules = db.prepare("SELECT * FROM module_definitions").all();
  console.log("=== MODULE DEFINITIONS ===");
  console.log(modules.map(m => m.key));
} catch (err) {
  console.error("Database query error:", err);
} finally {
  db.close();
}
