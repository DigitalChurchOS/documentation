# Tithes & Offerings Module

## Description
Handles standard church giving such as tithes, offerings, first fruits, thanksgiving offerings, seeds, recurring giving, receipts, and giving history.

## Plain-English Overview
The Tithes & Offerings Module handles standard church giving. It is designed for regular church practices such as tithes, offerings, first fruits, seeds, thanksgiving offerings, and recurring giving. This module should provide quick giving pages, saved giving preferences, receipts, member giving history, anonymous giving where allowed, QR code giving, mobile giving, and reporting for church finance teams. It should be clearly separated from partnerships, campaigns, and commerce.

## Section Context
Section C: Giving, Partnership & Commerce

## Core Features (with Tooltips)
- **Tithe giving**: A dedicated workflow allowing members to securely submit their standard 10% tithes online.
- **Offering giving**: General donation options for members to give freewill offerings during or outside of service.
- **First fruits**: Specialized financial campaigns tracking dedicated "first fruit" seasonal giving.
- **Seeds**: Categorized giving options for members sowing specific financial seeds into the ministry.
- **Thanksgiving offerings**: Custom forms for members to attach testimonies and notes to their thanksgiving donations.
- **Special offerings**: Temporary giving funds set up for specific immediate needs, like visiting guest speakers.
- **Recurring giving**: An automated system allowing members to set up weekly or monthly automatic card deductions.
- **One-time giving**: Quick checkout flows for fast, non-recurring donations without requiring an account.
- **Giving categories**: The master list of all active funds (e.g., Building Fund, Youth Fund) members can donate towards.
- **Giving history**: A private dashboard where members can view a chronological list of all their past donations.
- **Receipts**: Automated, compliant email receipts instantly generated and sent out after every successful transaction.
- **QR giving**: Scannable codes displayed on church screens that instantly open the giving form on a smartphone.
- **Mobile giving**: Highly optimized, fast-loading donation pages specifically designed for mobile devices.
- **Anonymous giving option**: A toggle allowing donors to give financially without associating their name with the gift.
- **Finance reports**: Internal dashboards for the accounting team showing overall revenue trends across all funds.
- **Payment gateway integration**: The secure backend link connecting the platform to Stripe, PayPal, or Paystack.

## Adaptations
- Separate from partnerships, campaigns, and commerce
- Can be linked to a service
- Can appear during livestreams
- Can be available in mobile apps
- Can support Stripe, Flutterwave, Paystack, PayPal, MTN Mobile Money, Airtel Money, or other gateways
- Can support bring-your-own-payment-provider

## Relationships & Integrations
### Integrates With
- **Member Management Module**: Giving history can be linked to member profiles.
- **Church Services Module**: Giving can be linked to a specific service.
- **Livestream Module**: Giving options can appear during live services.
- **Mobile App Access Module**: Members can give from the app.
- **Analytics & Reporting Module**: Reports tithes, offerings, recurring giving, and giving trends.
- **Communication, Notification & Follow-Up Module**: Sends receipts and giving confirmations.

### Connections / Third-Party Services
- Stripe
- PayPal
- Flutterwave
- Paystack
- MTN Mobile Money
- Airtel Money
- Square
- Plaid
- QuickBooks / Xero

## APIs Needed
- Giving Category API
- Payment Checkout API
- Recurring Giving API
- Receipt API
- Giving History API
- Giving Report API

## System Flow
1. Church admin opens the Tithes & Offerings Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Tithes & Offerings Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
tithes_offerings_module
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

tithes_offerings_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

tithes_offerings_module_settings
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
GET    /api/tithes-offerings - List all tenant records (paginated, filtered)
POST   /api/tithes-offerings - Create a record under X-Tenant-ID
GET    /api/tithes-offerings/:id - Fetch single tenant-isolated record
PATCH  /api/tithes-offerings/:id - Modify record details securely
DELETE /api/tithes-offerings/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Tithes & Offerings Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Tithes & Offerings Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- tithes-offerings.read
- tithes-offerings.create
- tithes-offerings.update
- tithes-offerings.delete
- tithes-offerings.manage_settings
- tithes-offerings.view_reports

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
