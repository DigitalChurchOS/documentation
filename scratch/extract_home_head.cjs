const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const p = db.prepare("SELECT content FROM pages WHERE slug = ''").get();
if (p) {
  const blocks = JSON.parse(p.content);
  const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
  
  const headStart = html.indexOf('<head>');
  const headEnd = html.indexOf('</head>');
  if (headStart !== -1 && headEnd !== -1) {
    console.log("=== HEAD ===");
    console.log(html.substring(headStart, headEnd + 7));
  } else {
    console.log("No <head> section found.");
  }
}

db.close();
