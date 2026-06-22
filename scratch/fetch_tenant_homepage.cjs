const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
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
    console.log("Response HTML length:", data.length);
    console.log("HTML starts with:", data.substring(0, 1000));
    
    // Check for left-rail
    const railPos = data.indexOf('left-rail');
    if (railPos !== -1) {
      console.log("Found left-rail in response!");
      console.log(data.substring(railPos - 50, railPos + 150));
    } else {
      console.log("left-rail not found in response HTML.");
    }
  });
});

req.on('error', (err) => {
  console.error("Error fetching tenant homepage:", err);
});

req.end();
