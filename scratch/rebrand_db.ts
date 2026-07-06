import prisma from '../src/lib/prisma';

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    if (tenant.name && tenant.name.includes('ChurchOS')) {
      const newName = tenant.name.replace(/ChurchOS/g, 'Churchtell');
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { name: newName }
      });
      console.log(`Updated tenant name in DB: "${tenant.name}" -> "${newName}"`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
