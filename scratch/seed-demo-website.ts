import prisma from '../src/lib/prisma';
import { ThemeEngineService } from '../src/services/themeEngine';

async function main() {
  const tenantId = 'cf92f897-5326-4dfd-8bdb-be61a03fc300';
  const websiteId = 'demo-church-website';

  console.log('1. Ensuring Ecclesia system theme exists...');
  const systemTheme = await ThemeEngineService.ensureEcclesiaSystemTheme();
  console.log('System theme:', systemTheme.id);

  console.log('2. Enabling modules website-cms and theme-engine for tenant...');
  await prisma.moduleDefinition.upsert({
    where: { key: 'website-cms' },
    update: { name: 'Website CMS', category: 'Core', dependencies: '[]' },
    create: { key: 'website-cms', name: 'Website CMS', category: 'Core', dependencies: '[]' },
  });

  await prisma.moduleDefinition.upsert({
    where: { key: 'theme-engine' },
    update: { name: 'Theme Engine', category: 'Core', dependencies: '["website-cms"]' },
    create: { key: 'theme-engine', name: 'Theme Engine', category: 'Core', dependencies: '["website-cms"]' },
  });

  await prisma.tenantModule.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
    update: { status: 'active', billingRule: 'free' },
    create: { tenantId, moduleKey: 'website-cms', status: 'active', billingRule: 'free' },
  });

  await prisma.tenantModule.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: 'theme-engine' } },
    update: { status: 'active', billingRule: 'free' },
    create: { tenantId, moduleKey: 'theme-engine', status: 'active', billingRule: 'free' },
  });

  console.log('3. Finding or creating tenant theme...');
  let theme = await prisma.theme.findFirst({
    where: { tenantId, name: 'Ecclesia' },
  });

  if (!theme) {
    theme = await prisma.theme.create({
      data: {
        tenantId,
        name: 'Ecclesia',
        settings: systemTheme.settings, // Copy settings from global theme
        isCustom: false,
      },
    });
  }
  console.log('Tenant theme ID:', theme.id);

  console.log('4. Creating website with ID demo-church-website...');
  const website = await prisma.website.upsert({
    where: { id: websiteId },
    update: {
      themeId: theme.id,
      title: 'Harvest Church Website',
      isActive: true,
    },
    create: {
      id: websiteId,
      tenantId,
      themeId: theme.id,
      title: 'Harvest Church Website',
      description: 'Harvest Church Website',
      isActive: true,
    },
  });
  console.log('Website created/updated:', website.id);

  console.log('5. Seeding website pages/navigation/footer...');
  await ThemeEngineService.seedEcclesiaWebsiteContent(tenantId, websiteId);
  console.log('Website content seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
