const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

try {
  const tenants = db.prepare(`SELECT id, name, subdomain FROM tenants`).all();
  console.log('--- Tenants in SQLite ---');
  tenants.forEach(t => {
    console.log(`ID: ${t.id}, Name: ${t.name}, Subdomain: ${t.subdomain}`);
  });

  const users = db.prepare(`
    SELECT u.id, u.tenant_id, u.email, r.name as role_name, r.tenant_id as role_tenant_id 
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
  `).all();
  
  console.log('--- Users, Roles & Tenants in SQLite ---');
  users.forEach(row => {
    console.log(`Email: ${row.email}, UserTenantID: ${row.tenant_id}, Role: ${row.role_name}, RoleTenantID: ${row.role_tenant_id}`);
  });
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
