const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

for (const slug of ['', 'ministries']) {
  const p = db.prepare("SELECT title, content FROM pages WHERE slug = ?").get(slug);
  if (p) {
    const blocks = JSON.parse(p.content);
    const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
    console.log(`=== ${p.title} (${slug}) ===`);
    
    // Find all occurrences of the string 'left-rail' in the html
    let pos = 0;
    let count = 0;
    while ((pos = html.indexOf('left-rail', pos)) !== -1) {
      count++;
      console.log(`Occurrence ${count} at index ${pos}:`);
      console.log(html.substring(pos - 50, pos + 50));
      pos += 9;
    }
    if (count === 0) {
      console.log("No occurrences of 'left-rail' found.");
    }
  }
}

db.close();
