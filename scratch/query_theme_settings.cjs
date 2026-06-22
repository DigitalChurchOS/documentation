const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables.map(t => t.name).join(', '));

// Find any table with "theme" in its name
for (const t of tables) {
  if (t.name.toLowerCase().includes('theme')) {
    const cols = db.prepare(`PRAGMA table_info("${t.name}")`).all();
    console.log(`\n=== ${t.name} columns ===`);
    console.log(cols.map(c => c.name).join(', '));
    const rows = db.prepare(`SELECT * FROM "${t.name}" LIMIT 3`).all();
    for (const r of rows) {
      console.log(JSON.stringify(r, null, 2));
    }
  }
}

db.close();
