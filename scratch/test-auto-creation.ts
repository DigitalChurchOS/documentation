import prisma from '../src/lib/prisma';
import http from 'http';

const tenantId = "de4498dc-069d-45b6-bc56-1a90ade1fb34";
const websiteId = "c4ca0186-0df6-4839-89a2-d5fd5156eb61";
const themeId = "c8e3c80e-58ce-496c-81f7-742086c7ab52";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZTdlMjhlYS05ZmJhLTQ1MjEtYjUzZS1mMDBhMTcyZDk0ZWQiLCJ0ZW5hbnRJZCI6ImRlNDQ5OGRjLTA2OWQtNDViNi1iYzU2LTFhOTBhZGUxZmIzNCIsImVtYWlsIjoiYWRtaW5AdGhlbWUtdGVzdC5jb20iLCJpYXQiOjE3ODE2NDk3NjV9.NQITrY91wCtviuWIc27bYk3BbnqHPkwjqqNPodaPlG0";

function makePublishRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/theme-engine/themes/${themeId}/customization/publish`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log("1. Cleaning up non-homepage pages for website:", websiteId);
    
    // Delete page revisions first to avoid foreign key constraint issues
    const pagesToDelete = await prisma.page.findMany({
      where: {
        websiteId,
        NOT: { slug: "" }
      },
      select: { id: true }
    });
    
    const pageIds = pagesToDelete.map(p => p.id);
    if (pageIds.length > 0) {
      await prisma.pageRevision.deleteMany({
        where: { pageId: { in: pageIds } }
      });
      await prisma.page.deleteMany({
        where: { id: { in: pageIds } }
      });
    }

    const initialPagesCount = await prisma.page.count({ where: { websiteId } });
    console.log("Initial page count (should be 1 for Homepage):", initialPagesCount);

    console.log("\n2. Making publish request to backend...");
    const res: any = await makePublishRequest();
    console.log("Publish response status:", res.status);
    console.log("Publish response body:", res.body.substring(0, 300));

    console.log("\n3. Querying pages from database after publish...");
    const pages = await prisma.page.findMany({
      where: { websiteId },
      select: { slug: true, title: true }
    });

    console.log(`Total pages now in database: ${pages.length}`);
    console.log("Slugs auto-created:", pages.map(p => p.slug));
  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
