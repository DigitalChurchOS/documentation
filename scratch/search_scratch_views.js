const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch');
for (const file of files) {
  if (file.endsWith('.txt')) {
    const content = fs.readFileSync(path.join('C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch', file), 'utf8');
    if (content.includes('makePageContent')) {
      console.log(`Found makePageContent in ${file}`);
      console.log(content.substring(0, 1000));
    }
  }
}
