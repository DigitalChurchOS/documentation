# Check-In & Attendance Management Module

## Description
Tracks attendance for services, events, groups, children, volunteers, and classes using QR codes, manual check-ins, or automatic digital records.

## Plain-English Overview
The Check-In & Attendance Management Module tracks attendance across services, events, classes, volunteer activities, children’s ministry, cell meetings, and courses. It should support QR check-ins, manual check-ins, mobile check-ins, attendance reports, and history per person. This module gives churches a clearer view of participation and helps identify people who may need follow-up.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **QR check-in**: Fast, touchless attendance logging where members scan their phone at a kiosk upon arrival.
- **Manual check-in**: An administrative view where staff can search for a name and manually mark a member as present.
- **Mobile check-in**: Allows parents to check their kids in from the car using the church app before walking inside.
- **Service attendance**: The core system tracking how many adults attended the main Sunday gathering.
- **Event attendance**: Specific rosters and check-in tools designed for conferences, youth camps, or paid events.
- **Cell attendance**: Mobile-friendly check-in lists for small group leaders to log who attended their mid-week meeting.
- **LMS class attendance**: Tools tracking which students physically or virtually attended the discipleship training session.
- **Children check-in**: Highly secure workflows generating matching parent/child name tags with allergy alerts.
- **Volunteer check-in**: Tracking systems verifying that the scheduled usher or camera operator actually arrived for their shift.
- **Attendance reports**: Charts showing the historical growth or decline of service numbers over months and years.
- **Absence tracking**: Automated alerts that notify a pastor if a previously consistent member misses three weeks in a row.
- **Attendance export**: Tools to download raw check-in data as an Excel file for internal church records.

## Adaptations
- Can work for physical and online attendance
- Can connect to services, events, cells, LMS, children’s ministry, and volunteers
- Can update CRM engagement scores
- Can trigger follow-up messages for absences
- Can support branch-specific attendance

## Relationships & Integrations
### Integrates With
- **Church Services Module**: Tracks service attendance.
- **Events & Registration Module**: Tracks event check-ins.
- **Cell / Fellowship Module**: Tracks cell meeting attendance.
- **Children & Family Ministry Module**: Tracks children check-in and pickup.
- **LMS & Discipleship Training Module**: Tracks class attendance.
- **Ministry CRM Module**: Attendance affects engagement scores and follow-up.
- **Communication, Notification & Follow-Up Module**: Absence can trigger follow-up messages.

### Connections / Third-Party Services
- QR code generation library
- Google Maps / Places
- NFC / RFID hardware
- Apple Wallet / Google Wallet
- Google Sheets export

## APIs Needed
- Check-In API
- QR Code API
- Attendance API
- Attendance Report API
- Location Check-In API
- Attendance Export API

## System Flow
1. Church admin opens the Check-In & Attendance Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Check-In & Attendance Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
check_in_attendance_management_module
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

check_in_attendance_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

check_in_attendance_management_module_settings
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
GET    /api/check-in-attendance-management - List all tenant records (paginated, filtered)
POST   /api/check-in-attendance-management - Create a record under X-Tenant-ID
GET    /api/check-in-attendance-management/:id - Fetch single tenant-isolated record
PATCH  /api/check-in-attendance-management/:id - Modify record details securely
DELETE /api/check-in-attendance-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Check-In & Attendance Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Check-In & Attendance Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- check-in-attendance-management.read
- check-in-attendance-management.create
- check-in-attendance-management.update
- check-in-attendance-management.delete
- check-in-attendance-management.manage_settings
- check-in-attendance-management.view_reports

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
