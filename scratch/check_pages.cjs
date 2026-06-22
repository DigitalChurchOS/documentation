const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables.map(t => t.name).join(', '));

// Try to find page tables
for (const t of tables) {
  if (t.name.toLowerCase().includes('page') || t.name.toLowerCase().includes('site') || t.name.toLowerCase().includes('web')) {
    const cols = db.prepare(`PRAGMA table_info("${t.name}")`).all();
    console.log(`\n=== ${t.name} columns ===`);
    console.log(cols.map(c => c.name).join(', '));
    const rows = db.prepare(`SELECT * FROM "${t.name}" LIMIT 3`).all();
    console.log(`Rows (${rows.length}):`);
    for (const r of rows) {
      // Truncate large fields
      const display = {};
      for (const [k, v] of Object.entries(r)) {
        display[k] = typeof v === 'string' && v.length > 200 ? v.substring(0, 200) + '...' : v;
      }
      console.log(JSON.stringify(display, null, 2));
    }
  }
}
db.close();
