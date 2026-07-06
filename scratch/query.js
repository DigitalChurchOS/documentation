const { PrismaClient } = require('../src/generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('--- TENANTS ---');
  console.log(tenants);

  const users = await prisma.user.findMany({
    include: {
      tenant: true
    }
  });
  console.log('--- USERS ---');
  console.log(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
