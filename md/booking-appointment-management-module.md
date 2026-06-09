# Booking & Appointment Management Module

## Description
Allows members or visitors to book counselling, prayer, mentorship, pastoral appointments, and other scheduled sessions.

## Plain-English Overview
The Booking & Appointment Management Module allows members, visitors, or staff to schedule appointments with pastors, counsellors, prayer teams, mentors, or ministry leaders. It should support availability calendars, appointment types, booking forms, confirmations, reminders, cancellation rules, meeting links, and private notes. This module is useful for pastoral care, prayer sessions, mentorship, counselling, and administrative meetings.

## Section Context
Section F: Events, Meetings & Interaction

## Core Features (with Tooltips)
- **Appointment booking**: A calendar interface allowing members to self-schedule time with a pastor without calling the office.
- **Pastor/counsellor availability**: Tools for staff to block out specific hours (e.g., Tuesdays 1PM-4PM) for counseling.
- **Appointment types**: Pre-configured options like "Pre-Marital Counseling (60 min)" or "Quick Check-in (15 min)".
- **Booking forms**: Intake questionnaires requiring the member to explain the reason for the meeting before confirming.
- **Calendar view**: The internal admin dashboard showing a pastor’s daily, weekly, or monthly schedule at a glance.
- **Confirmation messages**: Automated emails sent instantly when the appointment is locked in.
- **Reminders**: Automated text messages sent 24 hours prior to reduce no-shows.
- **Cancellation rules**: Settings dictating how close to the meeting time a member is allowed to cancel or reschedule.
- **Rescheduling**: Easy, 1-click links empowering the member to pick a new time if an emergency arises.
- **Meeting link generation**: Automatically creates a Zoom or LiveKit URL if the appointment is marked as virtual.
- **Private notes**: Secure text fields where the pastor can review previous counseling history before the meeting begins.
- **Appointment status**: Tracking tags marking a session as "Completed", "No-Show", or "Follow-up Required".
- **Appointment reports**: Analytics showing which pastoral services are most requested by the congregation.

## Adaptations
- Can be used for counselling, mentorship, prayer, pastoral meetings, and admin appointments
- Can connect to Live Meetings for online appointments
- Can connect to CRM and pastoral care
- Can trigger communication reminders
- Can restrict appointment types to specific staff roles

## Relationships & Integrations
### Integrates With
- **Live Meetings Module**: Online appointments can generate meeting links.
- **Live Chat, Pastoral Care & Support Module**: Care requests and chats can lead to scheduled appointments.
- **Ministry CRM Module**: Appointments become part of relationship history.
- **Communication, Notification & Follow-Up Module**: Sends appointment confirmations and reminders.
- **User & Role Management Module**: Only certain pastors or staff can accept appointment types.

### Connections / Third-Party Services
- Calendly
- Google Calendar
- Microsoft Outlook Calendar
- Zoom / Google Meet / LiveKit / Jitsi
- Twilio / SendGrid
- Stripe / PayPal

## APIs Needed
- Booking API
- Availability API
- Appointment Type API
- Calendar API
- Reminder API
- Appointment Status API

## System Flow
1. Church admin opens the Booking & Appointment Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Booking & Appointment Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
booking_appointment_management_module
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

booking_appointment_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

booking_appointment_management_module_settings
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
GET    /api/booking-appointment-management - List all tenant records (paginated, filtered)
POST   /api/booking-appointment-management - Create a record under X-Tenant-ID
GET    /api/booking-appointment-management/:id - Fetch single tenant-isolated record
PATCH  /api/booking-appointment-management/:id - Modify record details securely
DELETE /api/booking-appointment-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Booking & Appointment Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Booking & Appointment Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- booking-appointment-management.read
- booking-appointment-management.create
- booking-appointment-management.update
- booking-appointment-management.delete
- booking-appointment-management.manage_settings
- booking-appointment-management.view_reports

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
