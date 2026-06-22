const fs = require('fs');
const path = require('path');

const testPath = path.join(__dirname, '..', 'src', 'tests', 'radio.test.ts');
let content = fs.readFileSync(testPath, 'utf8');

// Replace all .post, .put, .delete, and .get calls under request(app) to include the x-tenant-id header.
// To do this reliably, we match .post(url) or similar and insert .set('x-tenant-id', tenantId) right after it,
// making sure not to duplicate it if already present.

const methods = ['post', 'get', 'put', 'delete'];

methods.forEach(method => {
  const regex = new RegExp(`\\.(${method}\\([^\\)]+\\))(?!\\s*\\.set\\(['"]x-tenant-id['"])`, 'g');
  content = content.replace(regex, (match, p1) => {
    // If it's a get call, it might have .set('X-Tenant-Id', tenantId) on the next line (case insensitive check)
    return `.${p1}\n        .set('x-tenant-id', tenantId)`;
  });
});

// Clean up any potential duplicates like X-Tenant-Id vs x-tenant-id
content = content.replace(/\.set\('X-Tenant-Id', tenantId\)\s*\.set\('x-tenant-id', tenantId\)/g, ".set('x-tenant-id', tenantId)");
content = content.replace(/\.set\('x-tenant-id', tenantId\)\s*\.set\('X-Tenant-Id', tenantId\)/g, ".set('x-tenant-id', tenantId)");

fs.writeFileSync(testPath, content, 'utf8');
console.log('Successfully added x-tenant-id header to all test API requests in radio.test.ts');
