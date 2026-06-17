import prisma from '../src/lib/prisma';

async function main() {
  const homepage = await prisma.page.findFirst({
    where: { slug: '' },
    select: { content: true }
  });

  if (!homepage) {
    console.log("Homepage not found!");
  } else {
    const content = homepage.content || '';
    console.log("=== HOMEPAGE CONTENT LENGTH ===", content.length);
    // Find drawer
    const drawerIndex = content.indexOf('id="mobileDrawer"');
    if (drawerIndex === -1) {
      console.log("No id=mobileDrawer found");
    } else {
      console.log("=== Drawer substring ===");
      console.log(content.substring(drawerIndex - 100, drawerIndex + 1000));
    }
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
