const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/cms/site-context',
  method: 'GET',
  headers: {
    'x-tenant-id': 'de4498dc-069d-45b6-bc56-1a90ade1fb34'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log("Status Code:", res.statusCode);
      console.log("Tenant:", parsed.data.tenant);
      console.log("Theme:", parsed.data.theme.name);
      console.log("Entitlements list:", parsed.data.moduleEntitlements);
    } catch (err) {
      console.error("Failed to parse JSON response:", err);
      console.log("Raw response:", data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
