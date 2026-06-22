# Checklist for Unified Website Editing Studio Integration

- `[x]` Extend SQLite schema in `prisma/schema.prisma`
- `[x]` Run Prisma Client generation and database migrations
- `[x]` Implement Theme Customization Draft/Publish/Reset/Discard APIs in backend
- `[x]` Implement Page Get/Draft/Publish/Preview APIs in backend
- `[x]` Implement Theme Default Pages Seeding on Theme Activation
- `[x]` Reconstruct Page Builder `page-builder/app.tsx` to support embed mode, fetch page data, and set up the postMessage communication bridge
- `[x]` Update Tenant Dashboard `apps/tenant-dashboard/public/index.html` to unify Theme Customizer with Page Builder tabs, controls, and save/publish flows
- `[x]` Compile Page Builder TypeScript files
- `[x]` Verify with backend tests and manual flows
