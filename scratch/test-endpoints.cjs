const http = require('http');

function makeRequest(path, host, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Host': host,
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('--- Requesting /api/cms/site-context with x-tenant-id ---');
    const res1 = await makeRequest('/api/cms/site-context', 'theme-test.localhost:3000', {
      'x-tenant-id': 'de4498dc-069d-45b6-bc56-1a90ade1fb34'
    });
    console.log('STATUS:', res1.status);
    console.log('BODY:', res1.body.substring(0, 500));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
