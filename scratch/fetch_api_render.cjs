const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/cms/render?slug=',
  method: 'GET',
  headers: {
    'Host': 'demo.localhost:3000'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    console.log("Response JSON length:", data.length);
    try {
      const obj = JSON.parse(data);
      console.log("JSON Keys:", Object.keys(obj));
      if (obj.data) {
        console.log("Title:", obj.data.title);
        console.log("Slug:", obj.data.slug);
        console.log("Theme details:", obj.data.theme?.name);
      }
    } catch(e) {
      console.log("Failed to parse JSON, first 200 chars:", data.substring(0, 200));
    }
  });
});

req.on('error', (err) => {
  console.error("Error fetching API render:", err);
});

req.end();
