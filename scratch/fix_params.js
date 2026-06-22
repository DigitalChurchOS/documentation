const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'routes', 'radio.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard req.params usages with casted versions
content = content.replace(/req\.params\.idOrSlug/g, 'req.params.idOrSlug as string');
// Ensure we don't double cast if run twice, so match only when not followed by " as string"
content = content.replace(/req\.params\.id(?!OrSlug)(?!\s+as\s+string)/g, 'req.params.id as string');
content = content.replace(/req\.params\.programId(?!\s+as\s+string)/g, 'req.params.programId as string');
content = content.replace(/req\.params\.playlistId(?!\s+as\s+string)/g, 'req.params.playlistId as string');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added TypeScript type assertions for req.params in radio.ts');
