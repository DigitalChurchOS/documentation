# E-Commerce / Church Store Module

## Description
Allows churches to sell physical and digital products such as T-shirts, caps, books, Bibles, courses, sermon series, and event merchandise.

## Plain-English Overview
The E-Commerce / Church Store Module allows churches to sell physical and digital products. Products may include T-shirts, caps, hoodies, Bibles, books, sermon series, eBooks, devotionals, course materials, conference resources, worship materials, and promotional items. The module should support product categories, variants, inventory, digital downloads, cart, checkout, receipts, order tracking, pickup, delivery, shipping options, coupon codes, and product-linked campaigns.

## Section Context
Section C: Giving, Partnership & Commerce

## Core Features (with Tooltips)
- **Product listings**: The catalog interface displaying all items currently available for purchase in the church store.
- **Physical products**: Support for selling tangible items like books, apparel, or CDs that require shipping or pickup.
- **Digital products**: Support for selling downloadable files like MP3 teachings or PDF study guides.
- **Product categories**: Folders organizing the store inventory (e.g., "Sermon Series", "Apparel", "Books").
- **Product tags**: Searchable keywords attached to items (like "youth" or "summer") for easier filtering.
- **Product variants**: Options allowing users to select different sizes (S, M, L) or colors for a specific product.
- **Inventory**: Stock tracking that automatically hides a product or marks it "Sold Out" when quantities hit zero.
- **Product images**: Upload tools to display multiple high-quality photos for each product from different angles.
- **Cart**: A virtual shopping basket allowing users to accumulate multiple products before paying.
- **Checkout**: The secure, final payment screen where users enter shipping details and credit card information.
- **Orders**: The internal database where admins can view, manage, and fulfill all incoming purchases.
- **Receipts**: Automated order confirmations sent to the customer’s email immediately after purchase.
- **Coupons**: Discount codes (like "SUMMER20") that users can apply at checkout to reduce their total cost.
- **Shipping**: Configuration tools to set flat-rate or weight-based delivery costs for physical products.
- **Pickup options**: A checkout toggle allowing local members to skip shipping fees and collect their item at church.
- **Digital downloads**: The secure, automated delivery of download links for digital products immediately after payment.
- **Order status**: A tracking system allowing admins to mark orders as "Pending", "Processing", or "Shipped".
- **Customer history**: A profile view showing every order a specific member has placed in the store over time.

## Adaptations
- Can sell T-shirts, caps, books, Bibles, eBooks, sermon series, course materials, event merchandise
- Can connect product sales to campaigns
- Can use media module for product images and digital files
- Can support mobile app commerce
- Can support different payment providers

## Relationships & Integrations
### Integrates With
- **Media Module**: Product images, digital files, and previews are stored in Media.
- **Campaigns & Causes Module**: Products can be linked to campaigns.
- **Member Management Module**: Orders can be linked to members.
- **Communication, Notification & Follow-Up Module**: Sends order confirmations, receipts, delivery updates.
- **Analytics & Reporting Module**: Reports sales, revenue, products, and customer activity.
- **Mobile App Access Module**: The store can be available in the app.

### Connections / Third-Party Services
- Stripe / PayPal / Flutterwave / Paystack
- Shippo / EasyPost
- Avalara / TaxJar
- Cloudinary
- Printful / Printify
- QuickBooks / Xero
- Mailchimp / Klaviyo

## APIs Needed
- Product API
- Cart API
- Checkout API
- Order API
- Inventory API
- Coupon API
- Digital Download API

## System Flow
1. Church admin opens the E-Commerce / Church Store Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates E-Commerce / Church Store Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
e_commerce_church_store_module
- id
- tenant_id
- title/name
- description
- status
- settings_json
- visibility
- created_by
- created_at
- updated_at

e_commerce_church_store_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

e_commerce_church_store_module_settings
- id
- tenant_id
- module_key
- enabled
- billing_plan
- provider_mode
- config_json
- updated_at
```

## API Playground / Suggested Endpoints
```text
GET    /api/e-commerce-church-store - List all tenant records (paginated, filtered)
POST   /api/e-commerce-church-store - Create a record under X-Tenant-ID
GET    /api/e-commerce-church-store/:id - Fetch single tenant-isolated record
PATCH  /api/e-commerce-church-store/:id - Modify record details securely
DELETE /api/e-commerce-church-store/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for E-Commerce / Church Store Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with E-Commerce / Church Store Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- e-commerce-church-store.read
- e-commerce-church-store.create
- e-commerce-church-store.update
- e-commerce-church-store.delete
- e-commerce-church-store.manage_settings
- e-commerce-church-store.view_reports

## Frontend Build Requirements
- Create responsive dashboard pages.
- Create empty states, loading states, and error states.
- Create forms with validation.
- Create listing pages with search/filter/sort.
- Create detail pages.
- Create settings page.
- Use clean modern UI with accessible buttons and readable typography.

## Backend Build Requirements
- Create database tables with tenant_id.
- Create API routes with tenant isolation.
- Add RBAC permission checks.
- Add audit/activity logs.
- Add validation and error handling.
- Add analytics event hooks.
- Add tests for create, read, update, delete, permissions, and tenant isolation.

## Acceptance Criteria
- A church admin can activate and configure the module.
- Records are isolated per tenant.
- Unauthorized users cannot access restricted data.
- Users can create, edit, view, and manage records according to permissions.
- The UI works on desktop and mobile.
- APIs return clear success and error responses.
- Activity is tracked for analytics and reporting.

## AI Agent Instruction
Build this module from database schema to frontend UI, API routes, service logic, validation, permissions, analytics hooks, and tests. Follow a modular architecture so this feature can be enabled, disabled, billed, extended, and integrated with other modules later.
