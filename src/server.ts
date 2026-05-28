import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Start Express listening for local, Vercel, and AWS environments
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   ⛪  ChurchOS Kernel — Phase 1           ║
  ║   🚀  Running on http://localhost:${PORT}    ║
  ║   📦  Database: SQLite (dev.db)           ║
  ╚═══════════════════════════════════════════╝
  `);
});

// Check if running inside Cloudflare Workers/Pages V8 isolate context
const isCloudflare =
  typeof (globalThis as any).WebSocket !== 'undefined' &&
  typeof (globalThis as any).caches !== 'undefined';

let cloudflareHandler: any;

if (isCloudflare) {
  try {
    const { httpServerHandler } = require('cloudflare:node');
    cloudflareHandler = httpServerHandler({ port: PORT });
  } catch (err) {
    console.error('Failed to load Cloudflare server handler:', err);
  }
}

// Export the server handler for Cloudflare Workers / Pages Functions
export default cloudflareHandler;
