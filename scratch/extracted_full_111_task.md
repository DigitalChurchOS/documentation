# Checklist for Unified Website Editing Studio Integration

- `[ ]` Extend SQLite schema in `prisma/schema.prisma`
- `[ ]` Run Prisma Client generation and database migrations
- `[ ]` Implement Theme Customization Draft/Publish/Reset/Discard APIs in backend
- `[ ]` Implement Page Get/Draft/Publish/Preview APIs in backend
- `[ ]` Implement Theme Default Pages Seeding on Theme Activation
- `[ ]` Reconstruct Page Builder `page-builder/app.tsx` to support embed mode, fetch page data, and set up the postMessage communication bridge
- `[ ]` Update Tenant Dashboard `apps/tenant-dashboard/public/index.html` to unify Theme Customizer with Page Builder tabs, controls, and save/publish flows
- `[ ]` Compile Page Builder TypeScript files
- `[ ]` Verify with backend tests and manual flows
