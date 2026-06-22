import prisma from '../src/lib/prisma';

async function main() {
  try {
    const pages = await prisma.page.findMany({
      select: {
        id: true,
        tenantId: true,
        websiteId: true,
        slug: true,
        title: true,
        status: true
      }
    });
    console.log("Pages currently in database:", pages);
  } catch (err) {
    console.error("Error reading database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
