import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  const page = await prisma.page.findFirst({
    where: { slug: 'store' }
  });
  if (page) {
    fs.writeFileSync(
      path.join(__dirname, 'store_content.json'),
      JSON.stringify(page, null, 2)
    );
    console.log("Successfully dumped store page content!");
  } else {
    console.log("Store page not found!");
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
