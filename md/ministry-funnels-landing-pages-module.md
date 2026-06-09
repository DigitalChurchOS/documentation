# Ministry Funnels & Landing Pages Module

## Description
A high-converting landing page and funnel builder for salvation, events, new visitors, partnerships, resources, courses, and outreach campaigns.

## Plain-English Overview
The Ministry Funnels & Landing Pages Module allows churches to create high-converting pages and guided journeys for specific ministry goals. These funnels may be used for salvation calls, new visitors, event registration, service invitations, partnership campaigns, course enrollment, free resource access, livestream promotion, cell group joining, or prayer requests. A funnel can connect multiple steps together, such as invite link, landing page, registration form, reminder message, service attendance, salvation response, follow-up sequence, LMS enrollment, and cell group assignment.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Landing page builder**: A specialized drag-and-drop editor designed to build high-converting, single-purpose pages.
- **Funnel step builder**: Tools to link multiple pages together (e.g., Ad -> Landing Page -> Form -> Thank You Page).
- **CTA buttons**: Highly visible, customizable buttons designed to drive a specific action like "Register Now".
- **Form capture**: Integrated data collection tools that feed visitor emails directly into the church CRM.
- **Thank-you pages**: Automated redirect pages displaying confirmation messages and next steps after a form submission.
- **Countdown timers**: Urgency-driving widgets showing the exact time remaining before an event or registration closes.
- **Video sections**: High-impact layout blocks specifically designed to feature promotional videos or pastor invites.
- **Testimonials**: Pre-styled quotation blocks highlighting stories of life change to encourage new sign-ups.
- **Scripture blocks**: Beautiful, readable layout elements designed to prominently display a foundational Bible verse.
- **QR codes**: Automatically generated scannable codes linking directly to the specific landing page or funnel.
- **A/B testing later**: Future capability to run two different designs simultaneously to see which converts better.
- **Conversion tracking**: Analytics measuring exactly what percentage of visitors actually filled out the form.
- **Funnel analytics**: Detailed breakdown of traffic sources, drop-off rates, and overall funnel health.
- **Follow-up automation**: Links the funnel directly to the communication module to instantly email new leads.
- **Event funnels**: Specialized templates designed specifically to drive ticket sales and conference registrations.
- **Salvation funnels**: Gentle, highly sensitive templates guiding seekers to make a decision for Christ.
- **Partnership funnels**: Long-form sales-letter style pages explaining the vision to secure recurring donors.
- **Course funnels**: Templates designed to recruit students into the LMS discipleship academy.
- **Livestream funnels**: Pages designed to capture emails in exchange for a reminder link to the upcoming broadcast.
- **New visitor funnels**: Welcoming, informative pages designed specifically for first-time guests planning a visit.

## Adaptations
- Can connect member invite links to landing pages
- Can guide visitors from interest to action
- Can trigger CRM, communication, LMS, salvation, event registration, or partnership workflows
- Can help churches create high-converting pages without external tools
- Can support campaigns for services, events, resources, or causes

## Relationships & Integrations
### Integrates With
- **Content Management Module**: Funnels can use website pages or custom landing pages.
- **Member Outreach & Invite Campaign Module**: Invite links can send visitors into funnels.
- **Salvation & New Believer Journey Module**: Salvation funnels can trigger new believer journeys.
- **Events & Registration Module**: Event funnels can register attendees.
- **LMS & Discipleship Training Module**: Course funnels can enroll students.
- **Partnerships & Contributions Module**: Partnership funnels can create partner records.
- **Campaigns & Causes Module**: Campaign funnels can drive support toward a cause.
- **Communication, Notification & Follow-Up Module**: Funnels trigger follow-up emails, SMS, and push notifications.
- **Analytics & Reporting Module**: Tracks funnel conversion rates.

### Connections / Third-Party Services
- Stripe / PayPal / Flutterwave / Paystack
- Mailchimp / Klaviyo
- Twilio / SendGrid
- Google Analytics / PostHog / Mixpanel
- Meta Pixel / TikTok Pixel / Google Ads
- Typeform
- Zapier / Make

## APIs Needed
- Funnel API
- Landing Page API
- Form Capture API
- CTA API
- Conversion Tracking API
- Funnel Step API
- Automation Trigger API

## System Flow
1. Church admin opens the Ministry Funnels & Landing Pages Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Ministry Funnels & Landing Pages Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
ministry_funnels_landing_pages_module
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

ministry_funnels_landing_pages_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

ministry_funnels_landing_pages_module_settings
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
GET    /api/ministry-funnels-landing-pages - List all tenant records (paginated, filtered)
POST   /api/ministry-funnels-landing-pages - Create a record under X-Tenant-ID
GET    /api/ministry-funnels-landing-pages/:id - Fetch single tenant-isolated record
PATCH  /api/ministry-funnels-landing-pages/:id - Modify record details securely
DELETE /api/ministry-funnels-landing-pages/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Ministry Funnels & Landing Pages Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Ministry Funnels & Landing Pages Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- ministry-funnels-landing-pages.read
- ministry-funnels-landing-pages.create
- ministry-funnels-landing-pages.update
- ministry-funnels-landing-pages.delete
- ministry-funnels-landing-pages.manage_settings
- ministry-funnels-landing-pages.view_reports

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
