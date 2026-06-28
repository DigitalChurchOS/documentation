import https from 'https';
import fs from 'fs';
import path from 'path';

const imageUrl = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=85';
const outputPath = path.join(__dirname, 'check_book.jpg');

const file = fs.createWriteStream(outputPath);
https.get(imageUrl, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded image successfully!');
    const stats = fs.statSync(outputPath);
    console.log('File size:', stats.size);
  });
});
