const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZTdlMjhlYS05ZmJhLTQ1MjEtYjUzZS1mMDBhMTcyZDk0ZWQiLCJ0ZW5hbnRJZCI6ImRlNDQ5OGRjLTA2OWQtNDViNi1iYzU2LTFhOTBhZGUxZmIzNCIsImVtYWlsIjoiYWRtaW5AdGhlbWUtdGVzdC5jb20iLCJpYXQiOjE3ODE2NDk3NjV9.NQITrY91wCtviuWIc27bYk3BbnqHPkwjqqNPodaPlG0';
const tenantId = 'de4498dc-069d-45b6-bc56-1a90ade1fb34';

function apiGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(new Error(data)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const pageRes = await apiGet('/api/cms/pages/759ba501-9900-4763-a0cb-a1a9c0fb5de6');
  const page = pageRes.data;
  const blocks = JSON.parse(page.content);
  const html = blocks[0].html;
  
  // Search for key elements
  const searches = ['<header', '<footer', '<nav', '<main', 'class="header"', 'class="hero"', 'class="nav"', 'Grace City', 'GraceHouse', '<body', '</body', '<html', '</html'];
  for (const s of searches) {
    const idx = html.indexOf(s);
    console.log(`"${s}": ${idx >= 0 ? `found at ${idx}` : 'NOT FOUND'}`);
  }
  
  // Print a few segments of the HTML
  console.log("\n=== FIRST 500 chars ===");
  console.log(html.substring(0, 500));
  console.log("\n=== CHARS 500-1000 ===");
  console.log(html.substring(500, 1000));
  console.log("\n=== BODY section ===");
  const bodyIdx = html.indexOf('<body');
  if (bodyIdx >= 0) {
    console.log(html.substring(bodyIdx, bodyIdx + 1000));
  } else {
    console.log("No <body> found");
  }
  
  console.log("\n=== LAST 500 chars ===");
  console.log(html.substring(html.length - 500));
}

main().catch(e => console.error("Fatal:", e));
