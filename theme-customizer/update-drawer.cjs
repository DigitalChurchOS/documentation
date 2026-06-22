const fs = require('fs');
const path = require('path');
const dir = 'public/themes/ecclesia-full-theme/assets';
const css = `
/* Overlay Drawer Fix (Updated) */
.drawer, .mobile-drawer {
  position: fixed !important;
  top: 82px !important;
  right: -100% !important;
  width: 300px !important;
  max-width: 80vw !important;
  height: calc(100vh - 82px) !important;
  background: var(--surface, #fff) !important;
  box-shadow: -10px 0 40px rgba(0,0,0,0.15) !important;
  z-index: 1000 !important;
  padding: 24px !important;
  border-top: none !important;
  display: block !important;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow-y: auto !important;
}
.drawer.open, .mobile-drawer.open {
  right: 0 !important;
}
.drawer a, .mobile-drawer a {
  font-size: 18px !important;
  padding: 16px 0 !important;
  border-bottom: 1px solid var(--border, #eee) !important;
}
`;
fs.readdirSync(dir).filter(f => f.endsWith('.css')).forEach(f => fs.appendFileSync(path.join(dir, f), css));
console.log('Done');
