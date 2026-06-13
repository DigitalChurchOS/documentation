const fs = require('fs');
const path = require('path');
const dir = 'public/themes/ecclesia-full-theme';

const styleTag = `
  <style>
    /* Force Mobile Overlay Drawer */
    @media (max-width: 1080px) {
      .drawer, .mobile-drawer {
        display: block !important;
        position: fixed !important;
        top: 0 !important;
        right: -350px !important;
        width: 300px !important;
        max-width: 85vw !important;
        height: 100vh !important;
        background: var(--surface, #fff) !important;
        box-shadow: -10px 0 40px rgba(0,0,0,0.15) !important;
        z-index: 9999 !important;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        padding: 90px 24px 24px !important;
        border: none !important;
        overflow-y: auto !important;
      }
      .drawer.open, .mobile-drawer.open {
        right: 0 !important;
      }
      .drawer a, .mobile-drawer a {
        font-size: 18px !important;
        padding: 16px 0 !important;
        border-bottom: 1px solid var(--border, rgba(0,0,0,0.1)) !important;
        display: block !important;
        color: var(--text, #333) !important;
      }
      .navwrap, .header .navwrap, .header .nav-wrap {
        position: relative !important;
        z-index: 10000 !important;
      }
    }
  </style>
</head>`;

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.html')) {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    // Remove old injected style if it exists
    html = html.replace(/<style>\s*\/\* Force Mobile Overlay Drawer \*\/[\s\S]*?<\/style>\s*<\/head>/, '</head>');
    // Inject new style
    html = html.replace('</head>', styleTag);
    fs.writeFileSync(filePath, html);
  }
});
console.log('Injected styles into all HTML files');
