import prisma from '../src/lib/prisma';

async function main() {
  try {
    const website = await prisma.website.findUnique({
      where: { id: "c4ca0186-0df6-4839-89a2-d5fd5156eb61" }
    });
    console.log("Website themeId:", website?.themeId);

    const theme = await prisma.theme.findFirst({
      where: { id: "c8e3c80e-58ce-496c-81f7-742086c7ab52" }
    });
    console.log("Theme details:", theme);

    const websitesWithTheme = await prisma.website.findMany({
      where: { themeId: "c8e3c80e-58ce-496c-81f7-742086c7ab52" }
    });
    console.log("Websites using this theme:", websitesWithTheme.map(w => w.id));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
