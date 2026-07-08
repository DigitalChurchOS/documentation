# Walkthrough of Branding, Logo Integration, and Structured CMS Module

This walkthrough details the implementation and verification of changes to dynamically substitute church branding across the frontend layout, theme customizer, and progressive web application (PWA) manifest download, alongside the newly streamlined and structured Churchfront CMS dashboard.

---

## Changes Made

### 1. Backend Dynamic Manifest serving
- **Cloudflare Edge (`src/worker.ts`)**: Intercepts requests targeting `/manifest.json` on tenant subdomains, queries the Cloudflare API binding to resolve the church identity metadata, and returns a dynamically constructed PWA manifest payload containing the church name, description, and custom logo.
- **Node Local Express (`src/app.ts`)**: Replicates the Cloudflare routing middleware logic for local subdomains. Imports Prisma to query the database, parse the `ecclesia-global-content` reusable block, and dynamically output the PWA manifest JSON mapping the church's name and custom logo.

### 2. Backend site context API extension
- **CMS Context (`src/api-worker.ts`)**: Expanded `makeSiteContextForContext` to fetch and include `globalContent: makeGlobalContentForContext(context)` directly in the `/api/cms/site-context` payload, avoiding the need for additional roundtrips.

### 3. Frontend App & Brand logo components
- **App Context & Bootstrapping (`apps/church-frontend/src/types.ts` & `App.tsx`)**:
  - Registered `globalContent` inside `SiteContext` interfaces.
  - Resolved `globalContent` in `contextValue` fallback.
  - Dynamically sets the page document title and favicon (resolving `churchIdentity.faviconUrl`) when loading the site context.
- **Brand Header & Footer Logos (`apps/church-frontend/src/themes/ecclesia/EcclesiaHeader.tsx` & `EcclesiaFooter.tsx`)**:
  - Conditional rendering added: if `globalContent?.churchIdentity?.logoUrl` exists, it renders an `<img>` tag fitting the branding container, falling back to the standard `<Church />` icon.
  - **Dark Mode Logo Support**: Updated both components to render `logoDarkUrl` if the current theme settings have dark/slate mode active and `logoDarkUrl` is available, falling back to `logoUrl`.

### 4. Theme Customizer Live Preview
- **Fallback Template (`theme-customizer/src/App.tsx`)**: Adjusted the fallback HTML template's header structure to use standard class styling: `.brand` and `.brand-mark` elements instead of a generic `.logo` node.
- **Customizer Parser (`theme-customizer/src/utils/domParser.ts`)**:
  - Enhanced search pattern array to dynamically find and substitute "Ecclesia" with the active church name.
  - Injected logo image rendering on brand nodes matching standard templates.

### 5. Two-Way Branding Synchronization & Customizer Preview Fixes
- **Two-Way Database Sync (`src/routes/cms.ts` & `src/services/domainTenantManagement.ts`)**:
  - Modified `ensureEcclesiaGlobalContent` on backend to check for logo/branding settings configured during the onboarding process (stored in `domain-tenant-management` module settings) and automatically copy them into the `ecclesia-global-content` block upon generation.
  - Updated `/api/cms/global-content` PATCH handler to synchronize saved branding details (logo, favicon, contact details) back to the onboarding settings, keeping both modules completely in sync.
  - **Dark Mode Logo Sync**: Extended backend `updateBranding` to support `logoDark`, process base64 image data URLs, upload to Cloudinary, save it in `ModuleSettings`, and sync it as `logoDarkUrl` in the `ecclesia-global-content` block.

### 6. Admin Dashboard Branding Interface
- **Layout & Interactions (`apps/tenant-dashboard/public/index.html`)**:
  - Added a drag-and-drop, crop-supported upload zone for the **Dark Mode Logo** next to the light mode logo on the branding tab (under a new responsive 3-column layout).
  - Integrated javascript event hooks for file selection, cropping modal application, clearing, and PATCH request payload sending for the dark mode logo.

### 7. Structured Pages & Assisting Pages Layout (`apps/tenant-dashboard/public/index.html`)
- Replaced the single flat pages list grid container (`#cmsPagesGrid`) with two structured layout sections:
  1. **Main Pages** (`#cmsMainPagesGrid`): Displays primary public pages (e.g. Home, Services, Sermons, Events, Ministries, Groups, Courses, Branches, Volunteer, Announcements).
  2. **Assisting Pages** (`#cmsAssistingPagesGrid`): Displays background/legal pages (e.g. Privacy Policy, Terms of Service, Successful Payment, Order Confirmed, Checkout, Shopping Cart).

### 8. Page Activation & Auto-Provisioning Toggles
- **Locked Default States**: Default pages (`Home`, `About`, `Contact`) display a locked `Default Page` badge and cannot be deactivated (as they must always be active on a church website).
- **Interactive Toggles**: Other pages are equipped with active/inactive switch sliders. Toggling a page updates its status to `published` or `draft` in the database dynamically via a PATCH API call.
- **On-Demand Provisioning**: Toggling on a background assisting page (like `Privacy Policy` or `Successful Payment`) that does not yet exist in the tenant's database triggers an on-demand POST request to provision the page dynamically with premium default text templates.

### 9. Shopify-Style Page Content Editor Modal
- Replaced the complex block builder editor button with a targeted **Page Content Editor** modal (`#cmsPageContentModal`) that dynamically renders field sets tailored specifically to each page type:
  - **Home**: Headline, subtitle, button label, button link, and background image URL.
  - **About**: Headline, story text (short bio), vision, mission, and core values list.
  - **Services**: Services title, Sunday service rhythm times, midweek/youth gatherings, and meeting address.
  - **Contact**: Headline, email address, phone number, and show location map toggle.
  - **Generic / Assisting / Legal**: Page title and standard body content textarea (with HTML/Markdown support).
- Clicking "Save" compiles these inputs into a structured JSON content block payload and fires a PATCH request to save updates in the database, making changes instantly visible to customizer previews and frontend renders.

### 10. Re-targeted Templates Tab
- Renamed the tab from **Page Templates** to **Templates** in both the HTML navigation structure and module configuration workspaces list (`['Pages', 'Templates', 'Menus', 'Footer', 'Reusable Sections']`).
- Replaced the static page generator grid with a dynamic template catalogue representing standard page formats (Blog, Media & Sermons, Events Calendar, E-Commerce Store, Groups, Discipleship, Podcast, Resource Library).
- Clicking "Edit" on any dynamic template redirects the user to the consolidated Hero & CTA editor inside the Reusable Sections tab, focusing and highlighting the template scope select menu.

---

## Verification Results

### 1. Local API server validation
- The Express API server is active on `http://localhost:3000`.
- Verified using `curl.exe -s http://localhost:3000/api/cms/pages` that the API is fully alive and correctly enforcing tenant identity checks (returning `"Missing x-tenant-id header"`).

### 2. Client-Side CMS Controller Integrity
- Verified that all javascript handlers (`togglePageActive`, `provisionAssistingPage`, `openCmsPageContentEditor`, `saveCmsPageContent`, `openTemplateSettings`) are attached to the global `window` context.
- Verified that all modal inputs (`homeHeroTitle`, `aboutShortBio`, `servicesSundayTimes`, `contactEmail`, `genericBody`) exist in the HTML template and map seamlessly without any reference or selection errors.
