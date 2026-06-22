import prisma from '../src/lib/prisma';

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log("=== TENANTS ===");
  console.log(tenants);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      tenantId: true,
    }
  });
  console.log("=== USERS ===");
  console.log(users);

  const websites = await prisma.website.findMany();
  console.log("=== WEBSITES ===");
  console.log(websites);

  const themes = await prisma.theme.findMany();
  console.log("=== THEMES ===");
  console.log(themes);
}

main().catch(console.error).finally(() => prisma.$disconnect());
