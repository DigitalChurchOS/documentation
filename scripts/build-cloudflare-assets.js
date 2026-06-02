const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'dist', 'public');

function copyFile(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

copyFile(path.join(root, 'dashboard.html'), path.join(outputDir, 'index.html'));
copyFile(path.join(root, 'dashboard.html'), path.join(outputDir, 'dashboard.html'));
copyFile(path.join(root, 'churchos.html'), path.join(outputDir, 'churchos.html'));
copyFile(path.join(root, 'marketplace.html'), path.join(outputDir, 'marketplace.html'));
copyFile(path.join(root, 'index.html'), path.join(outputDir, 'legacy-index.html'));
copyFile(path.join(root, 'dark.png'), path.join(outputDir, 'dark.png'));
copyFile(path.join(root, 'light.png'), path.join(outputDir, 'light.png'));
copyDirectory(path.join(root, 'page-builder'), path.join(outputDir, 'page-builder'));

console.log(`Cloudflare assets prepared in ${path.relative(root, outputDir)}`);
