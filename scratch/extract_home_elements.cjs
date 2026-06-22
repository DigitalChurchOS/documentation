const Database = require('better-sqlite3');
const db = new Database('prisma/dev.db');

const p = db.prepare("SELECT content FROM pages WHERE slug = ''").get();
if (p) {
  const blocks = JSON.parse(p.content);
  const html = blocks[0].html || blocks[0].data?.content || blocks[0].content || '';
  
  console.log("=== CHECK ELEMENTS ===");
  
  // Left rail
  const railIndex = html.indexOf('class="left-rail"');
  const railIndex2 = html.indexOf("class='left-rail'");
  const railIdx = railIndex !== -1 ? railIndex : railIndex2;
  if (railIdx !== -1) {
    console.log("Found left-rail text around index:", railIdx);
    console.log(html.substring(railIdx - 100, railIdx + 400));
  } else {
    console.log("No left-rail text found.");
  }
  
  // Mobile drawer
  const drawerIndex = html.indexOf('id="mobileDrawer"');
  const drawerIndex2 = html.indexOf("id='mobileDrawer'");
  const drawerIdx = drawerIndex !== -1 ? drawerIndex : drawerIndex2;
  if (drawerIdx !== -1) {
    console.log("Found mobileDrawer text around index:", drawerIdx);
    console.log(html.substring(drawerIdx - 100, drawerIdx + 500));
  } else {
    console.log("No mobileDrawer text found.");
  }
  
  // Let's print all top-level body tags/elements roughly.
  // We can find occurrences of "<body" and "</body"
  const bodyStart = html.indexOf('<body');
  if (bodyStart !== -1) {
    console.log("=== BODY STRUCTURE ===");
    const bodyContent = html.substring(bodyStart, html.indexOf('</body>') + 7);
    // Let's find tags in bodyContent that are at the top level (i.e. just match <tag ... > ... </tag> or similar)
    // Actually, let's just print the first 2000 characters of bodyContent
    console.log("Body starts with:\n", bodyContent.substring(0, 3000));
  }
} else {
  console.log("Home page not found");
}

db.close();
