import prisma from '../src/lib/prisma';

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('--- TENANTS ---');
  console.log(JSON.stringify(tenants, null, 2));

  const users = await prisma.user.findMany({
    include: {
      tenant: true
    }
  });
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
