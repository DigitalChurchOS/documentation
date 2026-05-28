import prisma from './lib/prisma';

/**
 * Seed Script
 * -----------
 * Populates the Permission table with the baseline permission keys
 * required by the kernel RBAC system. Safe to run multiple times
 * (upserts by unique `name`).
 */
const PERMISSIONS = [
  // Member module
  { name: 'member.create', description: 'Create new member profiles' },
  { name: 'member.read', description: 'View member profiles' },
  { name: 'member.update', description: 'Edit member profiles' },
  { name: 'member.delete', description: 'Delete member profiles' },

  // Branch module
  { name: 'branch.create', description: 'Create new branches / campuses' },
  { name: 'branch.read', description: 'View branch details' },
  { name: 'branch.update', description: 'Edit branch details' },
  { name: 'branch.delete', description: 'Delete branches' },

  // Role management
  { name: 'role.create', description: 'Create custom roles' },
  { name: 'role.read', description: 'View roles and permissions' },
  { name: 'role.update', description: 'Modify role permissions' },
  { name: 'role.delete', description: 'Delete custom roles' },

  // User management
  { name: 'user.create', description: 'Invite new users' },
  { name: 'user.read', description: 'View user accounts' },
  { name: 'user.update', description: 'Edit user accounts' },
  { name: 'user.delete', description: 'Deactivate user accounts' },

  // Tenant administration
  { name: 'tenant.settings', description: 'Manage church/tenant settings' },
];

const PROVIDER_CATEGORIES = [
  { id: 'payment', name: 'Payment Gateway' },
  { id: 'sms', name: 'SMS Gateway' },
  { id: 'media_storage', name: 'Media Storage' },
  { id: 'video_streaming', name: 'Video Streaming Integration' },
  { id: 'ai_copilot', name: 'AI Copilot Gateway' },
];

const PROVIDERS = [
  { id: 'stripe', categoryId: 'payment', name: 'Stripe Payment Engine' },
  { id: 'paystack', categoryId: 'payment', name: 'Paystack Checkout' },
  { id: 'twilio', categoryId: 'sms', name: 'Twilio SMS' },
  { id: 'africastalking', categoryId: 'sms', name: "Africa's Talking Gateway" },
  { id: 'aws_s3', categoryId: 'media_storage', name: 'AWS S3 Storage' },
  { id: 'cloudflare_r2', categoryId: 'media_storage', name: 'Cloudflare R2 Bucket' },
  { id: 'vimeo', categoryId: 'video_streaming', name: 'Vimeo Video Cloud' },
  { id: 'livekit', categoryId: 'video_streaming', name: 'LiveKit WebRTC' },
  { id: 'openai', categoryId: 'ai_copilot', name: 'OpenAI Copilot' },
  { id: 'gemini', categoryId: 'ai_copilot', name: 'Google Gemini AI' },
];

async function seed() {
  console.log('🌱 Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ Seeded ${PERMISSIONS.length} permissions.`);

  console.log('🌱 Seeding provider categories...');
  for (const cat of PROVIDER_CATEGORIES) {
    await prisma.providerCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name },
      create: cat,
    });
  }
  console.log(`✅ Seeded ${PROVIDER_CATEGORIES.length} categories.`);

  console.log('🌱 Seeding providers...');
  for (const prov of PROVIDERS) {
    await prisma.provider.upsert({
      where: { id: prov.id },
      update: { name: prov.name, categoryId: prov.categoryId },
      create: prov,
    });
  }
  console.log(`✅ Seeded ${PROVIDERS.length} providers.`);

  console.log('🌱 Seeding module definitions...');
  const MODULES = [
    { key: 'website-cms', name: 'Core Website & CMS', category: 'Core', dependencies: '[]' },
    { key: 'theme-engine', name: 'Theme Engine', category: 'Core', dependencies: '[]' },
    { key: 'member-crm', name: 'Member CRM', category: 'Engagement', dependencies: '[]' },
    { key: 'media-sermons', name: 'Media Streaming & Sermons', category: 'Content', dependencies: '["website-cms"]' },
    { key: 'giving-donations', name: 'Tithes & Offerings', category: 'Finance', dependencies: '[]' },
  ];
  for (const mod of MODULES) {
    await prisma.moduleDefinition.upsert({
      where: { key: mod.key },
      update: { name: mod.name, category: mod.category, dependencies: mod.dependencies },
      create: mod,
    });
  }
  console.log(`✅ Seeded ${MODULES.length} modules.`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
