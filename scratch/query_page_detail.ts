import prisma from '../src/lib/prisma';

async function main() {
  const page = await prisma.page.findFirst({
    where: { slug: 'groups-archive' }
  });
  console.log("Page details for slug 'groups-archive':");
  console.log(JSON.stringify(page, null, 2));
}

main()
  .catch(err => console.error(err))
  .finally(async () => await prisma.$disconnect());
