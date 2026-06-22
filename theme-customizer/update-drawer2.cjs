const fs = require('fs');
const path = require('path');
const dir = 'public/themes/ecclesia-full-theme/assets';

const css = `
/* Overlay Drawer Fix */
.navwrap {
  position: relative !important;
  z-index: 10000 !important;
}

.drawer, .mobile-drawer {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100vh !important;
  background: var(--surface, #fff) !important;
  z-index: 9999 !important;
  padding: 100px 24px 24px !important;
  transform: translateX(100%) !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: block !important;
  border: none !important;
  overflow-y: auto !important;
}

.drawer.open, .mobile-drawer.open {
  transform: translateX(0) !important;
}

.drawer a, .mobile-drawer a {
  font-size: 24px !important;
  padding: 20px 0 !important;
  color: var(--text) !important;
  border-bottom: 1px solid var(--border) !important;
  text-align: center !important;
  display: block !important;
}
`;

fs.readdirSync(dir).filter(f => f.endsWith('.css')).forEach(f => fs.appendFileSync(path.join(dir, f), css));
console.log('Done');
