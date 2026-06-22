import prisma from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users found:", JSON.stringify(users, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
