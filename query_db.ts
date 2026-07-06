import prisma from './src/lib/prisma';

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('--- Tenants ---');
  tenants.forEach((t: any) => console.log(`ID: ${t.id}, Name: ${t.name}, Subdomain: ${t.subdomain}`));

  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });
  console.log('--- Users ---');
  users.forEach((u: any) => {
    console.log(`ID: ${u.id}, TenantID: ${u.tenantId}, Email: ${u.email}`);
    u.userRoles.forEach((ur: any) => {
      console.log(`  Role: ${ur.role.name} (TenantID: ${ur.role.tenantId})`);
    });
  });
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());


