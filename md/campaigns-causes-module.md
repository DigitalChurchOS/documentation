# Campaigns & Causes Module

## Description
Supports goal-based initiatives such as building projects, outreaches, equipment needs, missions, community support, and other specific causes with progress tracking.

## Plain-English Overview
The Campaigns & Causes Module supports goal-based initiatives. These may include building projects, equipment needs, missions trips, community outreaches, church buses, conference support, emergency support, or special ministry causes. Each campaign should have a clear goal, progress indicator, story, media, updates, sharing links, supporter records, and reporting. This module is different from standard tithes and offerings because it focuses on specific initiatives with measurable goals.

## Section Context
Section C: Giving, Partnership & Commerce

## Core Features (with Tooltips)
- **Campaign pages**: Beautiful, distraction-free landing pages dedicated entirely to promoting a specific fundraising cause.
- **Campaign goals**: The financial target set by the church (e.g., $50,000 for a new roof) displayed publicly.
- **Progress bars**: Visual thermometers on the campaign page showing how close the church is to reaching its goal.
- **Campaign story**: A rich-text area for pastors to explain the vision, need, and impact of the specific cause.
- **Campaign images/videos**: Media galleries embedded directly on the cause page to show visual proof of the need.
- **Supporter records**: A database list tracking exactly who donated to this specific campaign and how much.
- **Campaign updates**: A blog-like timeline on the cause page where admins can post progress reports and milestones.
- **Shareable links**: Easy-to-copy URLs and social buttons empowering members to share the campaign on their timelines.
- **Campaign analytics**: Internal charts showing daily donation momentum and measuring the most effective traffic sources.
- **Product-linked campaign support**: Allows the church to sell physical items (like T-shirts) where proceeds go to the campaign.
- **Partnership-linked campaign support**: Allows recurring partners to pledge a temporary extra amount toward this cause.
- **Campaign closing/reporting**: The workflow to officially end a campaign, hide the donation form, and generate final financial reports.

## Adaptations
- Can support building projects, missions, outreach, church bus, welfare, equipment, conferences, and special causes
- Can use funnels for high-converting pages
- Can be promoted through member outreach
- Can receive support through partnerships or product sales
- Can send progress updates through communication module

## Relationships & Integrations
### Integrates With
- **Partnerships & Contributions Module**: Supporters can partner with a cause.
- **Tithes & Offerings Module**: Some churches may link special giving categories to campaigns.
- **E-Commerce / Church Store Module**: Product sales can contribute to campaign totals.
- **Member Outreach & Invite Campaign Module**: Members can share campaign invite links.
- **Ministry Funnels & Landing Pages Module**: Campaigns can have landing pages and conversion flows.
- **Communication, Notification & Follow-Up Module**: Campaign updates can be sent to supporters.
- **Analytics & Reporting Module**: Tracks progress, conversions, and share performance.

### Connections / Third-Party Services
- Stripe / PayPal / Flutterwave / Paystack
- Cloudinary
- Mailchimp / Klaviyo
- Bitly / Rebrandly
- Google Analytics / PostHog
- QuickBooks / Xero

## APIs Needed
- Campaign API
- Campaign Goal API
- Campaign Contribution API
- Campaign Progress API
- Campaign Update API
- Campaign Share Tracking API

## System Flow
1. Church admin opens the Campaigns & Causes Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Campaigns & Causes Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
campaigns_causes_module
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

campaigns_causes_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

campaigns_causes_module_settings
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
GET    /api/campaigns-causes - List all tenant records (paginated, filtered)
POST   /api/campaigns-causes - Create a record under X-Tenant-ID
GET    /api/campaigns-causes/:id - Fetch single tenant-isolated record
PATCH  /api/campaigns-causes/:id - Modify record details securely
DELETE /api/campaigns-causes/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Campaigns & Causes Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Campaigns & Causes Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- campaigns-causes.read
- campaigns-causes.create
- campaigns-causes.update
- campaigns-causes.delete
- campaigns-causes.manage_settings
- campaigns-causes.view_reports

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
