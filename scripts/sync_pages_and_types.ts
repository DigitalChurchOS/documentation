import prisma from '../src/lib/prisma';
import { ThemeEngineService } from '../src/services/themeEngine';

async function main() {
  console.log('🔄 Starting database sync for pages and group types...');

  // Find active website and tenant
  const website = await prisma.website.findFirst({
    where: { isActive: true },
  });

  if (!website) {
    console.warn('⚠️ No active website found! Cannot sync pages.');
    return;
  }

  const tenantId = website.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  console.log(`⛪ Found active website: ${website.title} (${website.id})`);
  console.log(`🏢 Mapped to Tenant: ${tenant?.name || 'Unknown'} (${tenantId})`);

  // 1. Seed GroupTypes
  console.log('👥 Seeding GroupTypes...');
  const groupTypes = [
    { name: 'Cells', tierLevel: 1 },
    { name: 'Fellowships', tierLevel: 2 },
  ];
  for (const gt of groupTypes) {
    const res = await prisma.groupType.upsert({
      where: { tenantId_name: { tenantId, name: gt.name } },
      update: { tierLevel: gt.tierLevel },
      create: { tenantId, name: gt.name, tierLevel: gt.tierLevel },
    });
    console.log(`   Upserted GroupType: ${res.name} (Tier: ${res.tierLevel})`);
  }

  // 2. Delete obsolete pages
  const obsoleteSlugs = [
    'cell-groups',
    'cell-groups/sample-group',
    'groups-archive',
    'devotion'
  ];

  console.log('🗑️ Deleting obsolete pages...');
  const deleteResult = await prisma.page.deleteMany({
    where: {
      websiteId: website.id,
      slug: { in: obsoleteSlugs }
    }
  });
  console.log(`   Deleted ${deleteResult.count} obsolete page records.`);

  // 3. Re-provision/seed website content to populate cells/login/account/etc.
  console.log('🌱 Re-seeding Ecclesia website pages...');
  await ThemeEngineService.seedEcclesiaWebsiteContent(tenantId, website.id);
  console.log('✅ Pages successfully re-seeded.');

  // 4. Print final page list
  const pages = await prisma.page.findMany({
    where: { websiteId: website.id },
    select: { title: true, slug: true, status: true }
  });
  console.log(`\n📄 Current database pages (${pages.length}):`);
  pages.forEach(p => {
    console.log(`   - ${p.title} (${p.slug}) [${p.status}]`);
  });
}

main()
  .catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
