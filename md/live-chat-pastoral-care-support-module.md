# Live Chat, Pastoral Care & Support Module

## Description
Provides real-time care through live chat, prayer requests, counselling requests, salvation follow-ups, care agents, and support conversations.

## Plain-English Overview
The Live Chat, Pastoral Care & Support Module provides real-time and structured care for online visitors, members, and event attendees. It allows people to ask questions, request prayer, submit testimonies, request counselling, ask for follow-up, or speak with a church representative. Church staff can manage conversations, assign care agents, tag conversations, add internal notes, and create follow-up tasks. This module helps online church engagement feel personal and pastoral.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Website live chat**: A floating chat bubble on the church website allowing visitors to instantly ask questions.
- **Livestream chat support**: Private, 1-on-1 direct messaging tools for pastors to counsel viewers during a live broadcast.
- **Mobile app chat**: In-app messaging allowing members to securely text the church office from their phones.
- **Prayer request intake**: A specialized workflow routing incoming prayer needs directly to the intercessory team.
- **Testimony intake**: Tools to collect, review, and approve praise reports submitted by members via chat.
- **Counselling requests**: Secure forms for members to request an appointment or call from a pastoral counselor.
- **Salvation follow-up chat**: A prioritized chat queue specifically for new believers needing immediate guidance.
- **Agent assignment**: Routing logic that assigns a specific incoming chat to an available volunteer or pastor.
- **Conversation tags**: Labels (like "Needs Prayer" or "First Time Guest") attached to a chat to organize the inbox.
- **Internal notes**: Private comments that staff can leave on a chat thread that the visitor cannot see.
- **Saved replies**: Pre-written answers (like service times or location directions) that agents can insert with one click.
- **Offline message capture**: A form that appears when no agents are online, converting the chat into an email ticket.
- **Priority levels**: Visual indicators showing agents which chats are urgent (like counselling) vs general questions.
- **Follow-up tasks**: To-do items generated directly from a chat conversation to ensure the person gets a phone call later.
- **Conversation history**: An archived log showing every past chat the church has ever had with a specific member.

## Adaptations
- Can make online viewers feel personally cared for
- Can connect chat activity to CRM
- Can turn prayer requests into care cases
- Can turn counselling requests into bookings
- Can route salvation responses to care agents
- Can support live event and livestream support

## Relationships & Integrations
### Integrates With
- **Livestream Module**: Live viewers can chat, request prayer, or ask questions.
- **Salvation & New Believer Journey Module**: People who respond to salvation can be routed to care agents.
- **Ministry CRM Module**: Conversations are stored in relationship history.
- **Communication, Notification & Follow-Up Module**: Care follow-ups can trigger SMS, email, or push messages.
- **Member Management Module**: Known members can be identified in chat.
- **Booking & Appointment Management Module**: A chat can lead to a counselling or prayer appointment.

### Connections / Third-Party Services
- Intercom
- Crisp
- Tawk.to
- Zendesk
- Freshdesk
- Twilio Conversations
- Pusher / Ably
- WhatsApp Business Platform

## APIs Needed
- Chat Conversation API
- Chat Message API
- Care Request API
- Agent Assignment API
- Prayer Request API
- Testimony Submission API
- Follow-Up Task API

## System Flow
1. Church admin opens the Live Chat, Pastoral Care & Support Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Live Chat, Pastoral Care & Support Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
live_chat_pastoral_care_support_module
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

live_chat_pastoral_care_support_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

live_chat_pastoral_care_support_module_settings
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
GET    /api/live-chat-pastoral-care-support - List all tenant records (paginated, filtered)
POST   /api/live-chat-pastoral-care-support - Create a record under X-Tenant-ID
GET    /api/live-chat-pastoral-care-support/:id - Fetch single tenant-isolated record
PATCH  /api/live-chat-pastoral-care-support/:id - Modify record details securely
DELETE /api/live-chat-pastoral-care-support/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Live Chat, Pastoral Care & Support Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Live Chat, Pastoral Care & Support Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- live-chat-pastoral-care-support.read
- live-chat-pastoral-care-support.create
- live-chat-pastoral-care-support.update
- live-chat-pastoral-care-support.delete
- live-chat-pastoral-care-support.manage_settings
- live-chat-pastoral-care-support.view_reports

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
