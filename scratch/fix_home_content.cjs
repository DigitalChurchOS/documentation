const http = require('http');
const fs = require('fs');
const path = require('path');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZTdlMjhlYS05ZmJhLTQ1MjEtYjUzZS1mMDBhMTcyZDk0ZWQiLCJ0ZW5hbnRJZCI6ImRlNDQ5OGRjLTA2OWQtNDViNi1iYzU2LTFhOTBhZGUxZmIzNCIsImVtYWlsIjoiYWRtaW5AdGhlbWUtdGVzdC5jb20iLCJpYXQiOjE3ODE2NDk3NjV9.NQITrY91wCtviuWIc27bYk3BbnqHPkwjqqNPodaPlG0';
const tenantId = 'de4498dc-069d-45b6-bc56-1a90ade1fb34';
const homePageId = '759ba501-9900-4763-a0cb-a1a9c0fb5de6';

// Read the actual theme template
const templatePath = path.join(__dirname, '..', 'ecclesia-full-theme', 'index.html');
const templateHtml = fs.readFileSync(templatePath, 'utf-8');
console.log("Template HTML length:", templateHtml.length);
console.log("Has <header>:", templateHtml.includes('<header'));
console.log("Has <footer>:", templateHtml.includes('<footer'));

// Wrap as blocks payload
const content = JSON.stringify([{ html: templateHtml }]);

// Update the page via API
const body = JSON.stringify({ content });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/cms/pages/${homePageId}`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId,
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    try {
      const json = JSON.parse(data);
      if (json.data) {
        console.log("Updated page:", json.data.title);
        console.log("Content length:", json.data.content?.length);
        // Verify
        const blocks = JSON.parse(json.data.content);
        console.log("Block 0 html has <header>:", blocks[0].html.includes('<header'));
        console.log("Block 0 html has <footer>:", blocks[0].html.includes('<footer'));
      } else {
        console.log("Response:", data.substring(0, 500));
      }
    } catch(e) {
      console.log("Response:", data.substring(0, 500));
    }
  });
});

req.write(body);
req.end();
