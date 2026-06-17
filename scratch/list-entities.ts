import prisma from '../src/lib/prisma';

async function main() {
  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, subdomain: true }
    });
    console.log("Tenants in database:", tenants);

    const websites = await prisma.website.findMany({
      select: { id: true, tenantId: true, title: true, themeId: true }
    });
    console.log("Websites in database:", websites);

    const themes = await prisma.theme.findMany({
      select: { id: true, tenantId: true, name: true }
    });
    console.log("Themes in database:", themes);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
