const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    console.log("Response HTML length:", data.length);
    console.log("HTML starts with:", data.substring(0, 500));
    
    const railPos = data.indexOf('left-rail');
    if (railPos !== -1) {
      console.log("Found left-rail in response!");
      console.log(data.substring(railPos - 50, railPos + 150));
    } else {
      console.log("left-rail not found in raw response HTML.");
    }
  });
}).on('error', (err) => {
  console.error("Error fetching homepage:", err);
});
