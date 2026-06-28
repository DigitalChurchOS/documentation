const fs = require('fs');
const path = require('path');

const themeDir = 'c:\\Users\\Administrator\\Documents\\Churchtell\\ecclesia-full-theme';

const newDrawerHtml = `
  <aside class="mobile-drawer" id="mobileDrawer">
    <div class="drawer-close-row">
      <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
        <i data-lucide="x"></i>
      </button>
    </div>

    <nav class="drawer-nav">
      <a class="pjax-link" href="index.html"><i data-lucide="home"></i> Home</a>
      <a class="pjax-link" href="about.html"><i data-lucide="info"></i> About</a>
      <a class="pjax-link" href="sermons.html"><i data-lucide="play-square"></i> Sermons</a>
      <a class="pjax-link" href="events.html"><i data-lucide="calendar-days"></i> Events</a>
      <a class="pjax-link" href="ministries.html"><i data-lucide="users-round"></i> Ministries</a>
      <a class="pjax-link" href="prayer.html"><i data-lucide="heart-handshake"></i> Prayer</a>
      <a class="pjax-link" href="contact.html"><i data-lucide="mail"></i> Contact</a>
    </nav>

    <div class="drawer-actions">
      <a href="livestream-page.html" class="btn btn-light btn-full pjax-link">
        <i data-lucide="radio"></i>
        Watch Live
      </a>

      <a href="contact.html" class="btn btn-primary btn-full pjax-link">
        <i data-lucide="map-pin"></i>
        Plan Visit
      </a>
    </div>
  </aside>
`;

const files = fs.readdirSync(themeDir).filter(f => f.endsWith('.html'));

let changed = 0;

for (const file of files) {
  const filePath = path.join(themeDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Regexes to remove the old drawer
  const oldDrawerRegexes = [
    /<div class="mobile-drawer" id="mobileDrawer">[\s\S]*?<\/div>/,
    /<div class="drawer" id="drawer">[\s\S]*?<\/div>/
  ];
  
  let didMatch = false;
  for (const regex of oldDrawerRegexes) {
    if (regex.test(content)) {
      content = content.replace(regex, '');
      didMatch = true;
    }
  }
  
  if (didMatch) {
    // Check if the new drawer is already there (in case we run this multiple times)
    if (!content.includes('<aside class="mobile-drawer" id="mobileDrawer">')) {
      // Add the new drawer just before </body>
      if (content.includes('</body>')) {
        content = content.replace('</body>', newDrawerHtml + '\n</body>');
      } else {
        content += newDrawerHtml;
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
      changed++;
    }
  } else if (!content.includes('<aside class="mobile-drawer" id="mobileDrawer">')) {
     console.log(`Warning: ${file} does not have old drawer but needs updating.`);
  }
}

console.log(`Successfully updated ${changed} files.`);
