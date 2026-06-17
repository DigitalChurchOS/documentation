const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log("Connecting to database at:", dbPath);
const db = new Database(dbPath);

const tenantId = 'de4498dc-069d-45b6-bc56-1a90ade1fb34'; // Theme Test Church (demo)

const missingModules = [
  { key: 'podcast', name: 'Podcast Management', category: 'Media' },
  { key: 'lms', name: 'Learning Management System', category: 'Education' },
  { key: 'worship', name: 'Worship Planning & Music', category: 'Worship' },
  { key: 'prayer', name: 'Prayer Requests & Testimonies', category: 'Engagement' },
  { key: 'events', name: 'Event Management', category: 'Scheduling' },
  { key: 'volunteer', name: 'Volunteer Coordination', category: 'Scheduling' },
];

try {
  db.transaction(() => {
    // 1. Insert missing module definitions
    const insertDef = db.prepare(`
      INSERT OR IGNORE INTO module_definitions (key, name, category, dependencies, updated_at)
      VALUES (?, ?, ?, '[]', CURRENT_TIMESTAMP)
    `);

    for (const mod of missingModules) {
      const info = insertDef.run(mod.key, mod.name, mod.category);
      if (info.changes > 0) {
        console.log(`Inserted module definition: ${mod.key}`);
      } else {
        console.log(`Module definition already exists: ${mod.key}`);
      }
    }

    // 2. Fetch all module definitions now
    const allDefs = db.prepare("SELECT key FROM module_definitions").all();
    console.log("Found all module definitions:", allDefs.map(d => d.key));

    // 3. For each definition, activate it for the demo tenant
    const insertTenantMod = db.prepare(`
      INSERT INTO tenant_modules (id, tenant_id, module_key, status, billing_rule, usage_limits, updated_at)
      VALUES (?, ?, ?, 'active', 'free', '{}', CURRENT_TIMESTAMP)
    `);

    const checkTenantMod = db.prepare(`
      SELECT id FROM tenant_modules WHERE tenant_id = ? AND module_key = ?
    `);

    for (const def of allDefs) {
      const existing = checkTenantMod.get(tenantId, def.key);
      if (!existing) {
        const id = crypto.randomUUID();
        insertTenantMod.run(id, tenantId, def.key);
        console.log(`Activated module ${def.key} for tenant ${tenantId}`);
      } else {
        console.log(`Module ${def.key} is already active for tenant ${tenantId}`);
      }
    }
  })();
  console.log("Transaction successfully completed!");
} catch (err) {
  console.error("Error activating modules:", err);
} finally {
  db.close();
}
