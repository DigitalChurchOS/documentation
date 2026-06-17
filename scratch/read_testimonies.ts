import prisma from '../src/lib/prisma';

async function main() {
  const page = await prisma.page.findFirst({
    where: { slug: 'testimonies' },
  });
  if (page) {
    console.log("TESTIMONIES PAGE:");
    console.log("Content:", page.content);
    console.log("Draft:", page.draftContent);
  } else {
    console.log("Testimonies page not found");
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
