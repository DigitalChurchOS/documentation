const fs = require('fs');
const path = require('path');

const previewPath = path.join(__dirname, '..', 'scripts', 'local-preview.js');
const content = fs.readFileSync(previewPath, 'utf8');

// Find the pages array in state
const match = content.match(/pages:\s*\[([\s\S]*?)\]/);
if (match) {
  console.log('Found pages array:');
  const pagesText = match[1];
  // Find each page block in the array
  const pageMatches = pagesText.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?slug:\s*'([^']+)'[\s\S]*?\}/g);
  for (const m of pageMatches) {
    console.log(`- ID: ${m[1]}, Slug: ${m[2]}`);
  }
} else {
  console.log('Could not find pages array in state!');
}
