import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const isPassword123 = await bcrypt.compare('password123', user.passwordHash);
    const isPassword123Excl = await bcrypt.compare('Password123!', user.passwordHash);
    console.log(`User: ${user.email}`);
    console.log(`  Matches 'password123': ${isPassword123}`);
    console.log(`  Matches 'Password123!': ${isPassword123Excl}`);
    
    // If it doesn't match either, let's reset it to 'password123' to be absolutely sure!
    if (!isPassword123 && !isPassword123Excl) {
      const newHash = await bcrypt.hash('password123', 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });
      console.log(`  -> Reset password to 'password123'`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
