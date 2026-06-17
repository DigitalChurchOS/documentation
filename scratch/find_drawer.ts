import prisma from '../src/lib/prisma';

async function main() {
  const homepage = await prisma.page.findFirst({
    where: { slug: '' },
    select: { content: true }
  });

  if (!homepage) {
    console.log("Homepage not found!");
    return;
  }

  const content = homepage.content || '';
  
  // Search for any occurrence of "drawer"
  let index = 0;
  while (true) {
    index = content.indexOf('drawer', index);
    if (index === -1) break;
    console.log(`Found 'drawer' at index ${index}:`);
    console.log(content.substring(Math.max(0, index - 50), Math.min(content.length, index + 150)));
    console.log("-----------------------------------------");
    index += 6; // move past 'drawer'
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
