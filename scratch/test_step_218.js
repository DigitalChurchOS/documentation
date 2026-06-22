const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/extracted_replace_218_app.tsx.json', 'utf8'));
let target = data.TargetContent;
if (typeof target === 'string' && target.startsWith('"') && target.endsWith('"')) {
  target = JSON.parse(target);
}

// Normalize newlines
target = target.replace(/\r\n/g, '\n');

const fileContent = fs.readFileSync('page-builder/app.tsx', 'utf8').replace(/\r\n/g, '\n');

console.log("Target length:", target.length);
console.log("File content length:", fileContent.length);

console.log("Is target in file?", fileContent.includes(target));

if (!fileContent.includes(target)) {
  // Let's find how far it matches
  let matchLen = 0;
  for (let i = 1; i <= target.length; i++) {
    const sub = target.substring(0, i);
    if (fileContent.includes(sub)) {
      matchLen = i;
    } else {
      break;
    }
  }
  console.log("Matched prefix length:", matchLen);
  console.log("Mismatched target character around here:", JSON.stringify(target.substring(matchLen - 20, matchLen + 20)));
  console.log("Mismatched file content around here:", JSON.stringify(fileContent.substring(fileContent.indexOf(target.substring(0, 10)) + matchLen - 20, fileContent.indexOf(target.substring(0, 10)) + matchLen + 20)));
}
