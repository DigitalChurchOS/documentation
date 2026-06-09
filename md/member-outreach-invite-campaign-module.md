# Member Outreach & Invite Campaign Module

## Description
Allows members to share church-approved invite materials, create personal invitation pages, record invite videos, and track outreach responses.

## Plain-English Overview
The Member Outreach & Invite Campaign Module allows church members to participate in digital evangelism and invitation campaigns. Church admins can upload approved graphics, videos, captions, hashtags, and campaign links. Members can download assets, share them on WhatsApp, Facebook, Instagram, TikTok, and other channels, or create personalized invite pages with their own photo, video, and message. These pages can point visitors to a service, event, livestream, resource, campaign, course, or church page. The system should track clicks, responses, registrations, and conversions connected to each member’s invite link.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Church-created invite campaigns**: Centralized marketing drives designed to empower members to invite their friends to church.
- **Invite graphics**: Pre-designed square and vertical images members can easily download and post on social media.
- **Invite videos**: Short, high-quality promotional clips provided by the church for members to share.
- **Share captions**: Pre-written text suggestions that members can copy/paste when posting an invite.
- **Hashtags**: Church-approved social tags provided to track the global reach of the congregation’s posts.
- **Social share links**: One-click buttons allowing members to instantly post the invite to Facebook, Twitter, or WhatsApp.
- **Downloadable assets**: Zipped folders of high-res graphics available for members who want to print flyers.
- **Personalized invite pages**: Unique landing pages generated for each member (e.g., church.com/invite/john) to share.
- **Member photo/video upload**: Tools for members to record a 30-second personal invite video to display on their unique page.
- **Personal message**: A text area where the member can write a personal welcome note to their specific friends.
- **CTA button selection**: Options for the member to choose the primary call-to-action on their page, like "Plan a Visit".
- **Unique tracking links**: Special URLs that log exactly how many people clicked John’s specific invite link.
- **QR codes**: Scannable graphics that John can save to his phone and have friends scan in person to visit his page.
- **Click tracking**: Analytics showing the member how much traffic their personal outreach link has generated.
- **Conversion tracking**: Metrics showing the member exactly how many of their friends filled out the "Plan a Visit" form.
- **Leaderboards optional**: Gamification features displaying which members have brought in the most new guests.

## Adaptations
- Can help members invite friends and family
- Can connect to services, events, livestreams, campaigns, resources, or courses
- Can generate member-specific pages under the church domain
- Can track which members are driving engagement
- Can feed new visitors into funnels and CRM

## Relationships & Integrations
### Integrates With
- **Ministry Funnels & Landing Pages Module**: Invite links often lead to landing pages.
- **Events & Registration Module**: Members can invite people to events.
- **Church Services Module**: Members can invite people to Sunday or midweek services.
- **Livestream Module**: Members can invite people to watch a livestream.
- **Campaigns & Causes Module**: Members can promote causes.
- **Media Module**: Members can download graphics and videos.
- **Ministry CRM Module**: New leads from invite links can enter CRM.
- **Analytics & Reporting Module**: Tracks clicks, responses, and conversions.

### Connections / Third-Party Services
- Bitly / Rebrandly
- Cloudinary
- Meta Pixel
- TikTok Pixel
- Google Analytics
- WhatsApp Share Links
- Canva
- OpenAI / AI providers

## APIs Needed
- Outreach Campaign API
- Invite Asset API
- Personalized Invite Page API
- Invite Link Tracking API
- Share Tracking API
- Conversion Attribution API

## System Flow
1. Church admin opens the Member Outreach & Invite Campaign Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Member Outreach & Invite Campaign Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
member_outreach_invite_campaign_module
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

member_outreach_invite_campaign_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

member_outreach_invite_campaign_module_settings
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
GET    /api/member-outreach-invite-campaign - List all tenant records (paginated, filtered)
POST   /api/member-outreach-invite-campaign - Create a record under X-Tenant-ID
GET    /api/member-outreach-invite-campaign/:id - Fetch single tenant-isolated record
PATCH  /api/member-outreach-invite-campaign/:id - Modify record details securely
DELETE /api/member-outreach-invite-campaign/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Member Outreach & Invite Campaign Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Member Outreach & Invite Campaign Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- member-outreach-invite-campaign.read
- member-outreach-invite-campaign.create
- member-outreach-invite-campaign.update
- member-outreach-invite-campaign.delete
- member-outreach-invite-campaign.manage_settings
- member-outreach-invite-campaign.view_reports

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
