const http = require('http');

http.get('http://localhost:3000/themes/ecclesia/account.html', (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Data length: ${data.length} characters`);
    console.log('First 500 characters:');
    console.log(data.substring(0, 500));
    console.log('\nLast 500 characters:');
    console.log(data.substring(data.length - 500));
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
