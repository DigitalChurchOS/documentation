import prisma from '../src/lib/prisma';

async function main() {
  const menus = await prisma.navigationMenu.findMany();
  console.log(`Found ${menus.length} navigation menus in database.`);
  let updateCount = 0;
  
  for (const menu of menus) {
    let items;
    try {
      items = JSON.parse(menu.items);
    } catch (e) {
      continue;
    }
    
    if (Array.isArray(items)) {
      let updated = false;
      const updatedItems = items.map((item: any) => {
        if (item.label === 'Fellowship') {
          item.label = 'Groups';
          updated = true;
        }
        return item;
      });
      
      if (updated) {
        console.log(`Updating menu "${menu.name}" (ID: ${menu.id})`);
        await prisma.navigationMenu.update({
          where: { id: menu.id },
          data: { items: JSON.stringify(updatedItems) }
        });
        updateCount++;
      }
    }
  }
  
  console.log(`Successfully updated ${updateCount} navigation menus.`);
}

main()
  .catch(err => {
    console.error('Error updating menus:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
