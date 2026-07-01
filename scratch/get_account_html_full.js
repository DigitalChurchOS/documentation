const http = require('http');

http.get('http://localhost:3000/themes/ecclesia-full-theme/account.html', (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Data length: ${data.length} characters`);
    console.log('First 300 characters:');
    console.log(data.substring(0, 300));
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
