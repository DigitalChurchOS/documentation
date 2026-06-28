import prisma from '../src/lib/prisma';

async function main() {
  const pages = await prisma.page.findMany();
  console.log("Pages in database:");
  pages.forEach(p => {
    console.log(`- Title: "${p.title}", Slug: "${p.slug}", ID: ${p.id}`);
  });
}

main()
  .catch(err => console.error(err))
  .finally(async () => await prisma.$disconnect());
