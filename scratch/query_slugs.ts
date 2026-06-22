import prisma from '../src/lib/prisma';

async function main() {
  const pages = await prisma.page.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    }
  });
  console.log("Pages in DB:");
  for (const page of pages) {
    console.log(`- ${page.title} (${page.slug}) [${page.status}]`);
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
