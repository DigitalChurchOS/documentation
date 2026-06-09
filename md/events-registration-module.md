# Events & Registration Module

## Description
Handles non-regular activities such as conferences, seminars, workshops, crusades, concerts, retreats, special programs, RSVPs, and tickets.

## Plain-English Overview
The Events & Registration Module handles special activities that are not regular weekly services. These may include conferences, seminars, crusades, workshops, retreats, leadership meetings, trainings, concerts, special programs, and ministry gatherings. The module should support event pages, RSVPs, registration forms, tickets, reminders, QR check-ins, event media, event reports, and optional links to livestreams or meetings.

## Section Context
Section F: Events, Meetings & Interaction

## Core Features (with Tooltips)
- **Event pages**: Beautiful landing pages detailing the date, location, speakers, and schedule of an upcoming conference.
- **Event categories**: Organizational folders grouping events (e.g., "Youth Events", "Leadership Trainings").
- **Registration forms**: Customizable data collection flows asking attendees for meal preferences or t-shirt sizes.
- **RSVP**: Simple 1-click confirmation buttons for free, internal meetings where no complex registration is required.
- **Ticketing**: The generation of unique PDF tickets with scannable QR codes for entry verification.
- **Free/paid events**: Configuration options allowing the church to sell access or offer it complimentary.
- **QR check-ins**: The door management tool allowing ushers to scan tickets using their smartphones to mark people present.
- **Event reminders**: Automated emails sent 24 hours before the event with parking instructions and schedule details.
- **Event calendar**: A global, searchable schedule displaying all upcoming church activities on the website.
- **Event media**: Photo galleries and promo videos attached directly to the event’s registration page.
- **Event livestream link**: Tools to attach a private, ticketed livestream broadcast exclusively for paid virtual attendees.
- **Event meeting link**: Integrated Zoom URLs for smaller, interactive workshops or webinars.
- **Attendee lists**: Administrative dashboards showing exactly who has registered, paid, or cancelled.
- **Event reports**: Financial and attendance analytics showing the overall success and ROI of the conference.

## Adaptations
- Used for conferences, seminars, crusades, workshops, concerts, retreats, and special programs
- Separate from regular church services
- Can connect to funnels, payments, communication, media, attendance, livestream, meetings, and CRM
- Can support both physical and online events

## Relationships & Integrations
### Integrates With
- **Ministry Funnels & Landing Pages Module**: Events can have high-converting registration pages.
- **Media Module**: Events can include promotional images, videos, and replays.
- **Livestream Module**: Events can have livestreams.
- **Live Meetings Module**: Events can create meeting links.
- **Communication, Notification & Follow-Up Module**: Sends confirmations and reminders.
- **Check-In & Attendance Management Module**: Handles QR check-in.
- **Ministry CRM Module**: Event attendance updates contact history.

### Connections / Third-Party Services
- Google Calendar / Outlook Calendar
- Zoom / Google Meet / Jitsi / LiveKit
- Stripe / PayPal / Flutterwave / Paystack
- Eventbrite
- Twilio / SendGrid / Mailchimp
- Google Maps
- QR code scanning
- Cloudinary

## APIs Needed
- Event API
- Registration API
- Ticket API
- RSVP API
- Event Reminder API
- Event Check-In API

## System Flow
1. Church admin opens the Events & Registration Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Events & Registration Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
events_registration_module
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

events_registration_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

events_registration_module_settings
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
GET    /api/events-registration - List all tenant records (paginated, filtered)
POST   /api/events-registration - Create a record under X-Tenant-ID
GET    /api/events-registration/:id - Fetch single tenant-isolated record
PATCH  /api/events-registration/:id - Modify record details securely
DELETE /api/events-registration/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Events & Registration Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Events & Registration Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- events-registration.read
- events-registration.create
- events-registration.update
- events-registration.delete
- events-registration.manage_settings
- events-registration.view_reports

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
