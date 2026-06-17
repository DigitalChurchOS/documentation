const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/cms/render?slug=about',
  method: 'GET',
  headers: {
    'Host': 'demo.localhost:3000'
  }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const blocks = response.data.contentBlocks;
      console.log("Count of blocks:", blocks.length);
      blocks.forEach((b, idx) => {
        console.log(`Block ${idx}: slotKey=${b.slotKey}, title=${b.data?.title}, keys=${Object.keys(b.data || {})}`);
        if (b.data?.content) {
          console.log(`  content snippet: ${b.data.content.substring(0, 100).replace(/\n/g, ' ')}...`);
        }
        if (b.data?.sections) {
          console.log(`  sections count: ${b.data.sections.length}`);
          b.data.sections.forEach((s, sidx) => {
            console.log(`    Section ${sidx}: key=${s.key}, title=${s.title}, blocks=${s.blocks?.map(bl => bl.type).join(', ')}`);
          });
        }
      });
    } catch (e) {
      console.error(e);
    }
  });
});
req.end();
