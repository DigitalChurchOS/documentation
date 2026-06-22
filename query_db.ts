import prisma from './src/lib/prisma';


async function main() {
  const pages = await prisma.page.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      content: true,
      draftContent: true,
    }
  });

  for (const page of pages) {
    console.log(`\n--- PAGE: ${page.title} (${page.slug}) ---`);
    console.log("Has content:", !!page.content);
    console.log("Has draftContent:", !!page.draftContent);
    const contentStr = typeof page.content === 'string' ? page.content : JSON.stringify(page.content);
    const draftStr = typeof page.draftContent === 'string' ? page.draftContent : JSON.stringify(page.draftContent);
    console.log("Content includes mobile-drawer:", contentStr?.includes("mobile-drawer") || contentStr?.includes("mobileDrawer"));
    console.log("Content includes class=\"drawer\":", contentStr?.includes('class="drawer"') || contentStr?.includes("class=\\\"drawer\\\""));
    console.log("Draft includes mobile-drawer:", draftStr?.includes("mobile-drawer") || draftStr?.includes("mobileDrawer"));
  }
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
