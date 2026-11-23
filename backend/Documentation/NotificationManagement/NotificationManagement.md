Group 17 — Notifications Management








fullstackinfra.substack.com


1. Notifications Management kya hota hai?
Bahi, simple example dekho.

Suppose:
- Parent ne Group 16 mein leave request submit ki.
- Admin ne leave request approve kar di.
- Ab Parent ko pata kaise chalega ke uski leave approve ho gayi?
System Parent ko notification send karega.

Example:
EduOS Notifications
3 unread


Leave Request Approved

Your leave request has been approved by the school.

Just now




New Message

You have received a new message from your teacher.

10 minutes ago




New Announcement

A new school announcement has been published.

1 hour ago



Yehi Notifications Management ka basic concept hai.
2. Group 17 ki responsibility kya hogi?
Group 17 ka kaam notifications ko centrally manage karna hai.

Iske important responsibilities:
1. Notification generate karna.
2. Correct user ko notification deliver karna.
3. In-app notifications show karna.
4. Read/Unread status manage karna.
5. Email notifications, if required.
6. Delivery status track karna.
7. Failed notifications handle karna.
8. Duplicate notifications prevent karna.
9. Notification history maintain karna.
Important: Group 17 business decision nahi karega. Business decision original module karega.

Example: Leave approve karne ka decision Group 16 lega. Group 17 sirf Parent ko inform karega.
3. Group 17 ka architecture
Is architecture ko samjho:
Group 14 — Fees & Finance

Payment verified

Group 15 — Admissions

Admission approved

Group 16 — Communication

Leave approved / New message


Group 17 — Notification Management

Central notification processing


In-App


Email


Push




Ye architecture conceptual hai. Actual event flow existing EduOS architecture inspect karne ke baad implement hoga.
4. Notification aur Event mein difference
Bahi, ye senior-level concept hai.

Event: System mein koi important action hua.

Notification: Kisi user ko us action ke bare mein inform karna.

Example:
Admin approves leave request
          ↓
LeaveApproved Event
          ↓
Group 17 receives event
          ↓
Notification created
          ↓
Parent sees notification


Samjho:
- LeaveApproved ek event hai.
- Your leave has been approved ek notification hai.
Har event notification nahi hota. Aur har notification ke liye zaroori nahi ke business event ka same content directly user ko show ho.
5. Notification ke types
A. In-App Notifications
User jab EduOS dashboard open kare to notification bell par alerts dekhe.

Example:
- New message.
- Leave approved.
- Fee payment confirmed.
- New announcement.








dribbble.com


B. Email Notifications
User ke registered email address par notification send ho.

Example:
- Admission approved.
- Payment receipt.
- Important school announcement.
Email delivery ke liye existing email integration reuse hogi.
C. Push Notifications
Agar future mein EduOS mobile app ya supported web push functionality introduce hoti hai to browser/device par notification aa sakti hai.

Senior decision: In-App notifications first. Email aur Push ko requirements aur existing infrastructure ke mutabiq implement karna. Teeno channels ek saath mandatory nahi hain.

6. Database Design — Notification Model
Conceptually notification record mein ye fields ho sakti hain:
{
  recipientId: "...",
  title: "Leave Request Approved",
  message: "Your leave request has been approved.",
  type: "LEAVE_APPROVED",
  referenceId: "...",
  referenceType: "LEAVE_REQUEST",
  isRead: false,
  readAt: null,
  createdAt: "..."
}


Baby-style explanation:
Field	Meaning
recipientId	Kis user ko notification milegi?
title	Notification ka title
message	Notification ka message
type	Kis type ki notification hai?
referenceId	Related record ka ID
referenceType	Related record kis module ka hai?
isRead	User ne notification read ki?
readAt	Kab read ki?

referenceId aur referenceType ka faida ye hai ke notification click karne par user relevant record tak ja sakta hai, provided uske paas access permission ho.

Security: Notification mein reference ID hone ka matlab ye nahi ke user ko automatically related record access mil gaya.
7. Backend APIs
Possible API design:
GET    /api/notifications
GET    /api/notifications/:id
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
GET    /api/notifications/unread-count


In APIs ka purpose:
- Notifications list karna.
- Single notification read karna.
- Notification ko read mark karna.
- All notifications read mark karna.
- Unread count show karna.
Important: User sirf apni notifications read ya update kar sake.

Admin ko doosre users ki notifications access karne ki permission automatically nahi milegi.
8. Technology Stack — Kya use hoga aur kyun?










Next.js

Notification bell, dropdown, notification page, unread count aur user interface.













Node.js

Backend notification processing.













Express.js

Notification APIs aur backend integration.













MongoDB Atlas

Notification records aur relevant delivery state store karna.













Mongoose

Notification schema, validation aur queries.













Redis — Conditional

Caching ya queue infrastructure ke liye sirf jab actual load aur architecture justify kare.













BullMQ — Conditional

Background notification jobs, retries aur scheduling. Existing job/worker system inspect karne ke baad hi decision.



Technologies jo automatically introduce nahi karni
Technology	Decision
PostgreSQL	Not Used
Kafka	Not Used
Firebase	Not Used unless push requirement justifies it
Microservices	Not Used
Separate backend framework	Not Used
Duplicate event system	Not Used

EduOS ke existing event/job architecture ko pehle inspect karna zaroori hai.
9. Background Jobs — Important concept
Bahi, suppose school 1,000 parents ko announcement notification send karta hai.

Agar backend har email ko user ki request ke andar synchronously send kare, to request slow ho sakti hai.

Is problem ke liye background jobs useful hain.
Business Event


Notification Job


Worker processes job


Success


Retry / Failure handling




Lekin bahi, background jobs ka matlab ye nahi ke hum automatically BullMQ install kar dein.

Pehle existing EduOS worker architecture inspect karenge. Agar woh suitable hai to usi ko reuse karenge.
10. Idempotency aur Duplicate Notifications
Ye bohat important senior-level concept hai.

Suppose payment provider same payment event do baar send kar deta hai.

Agar system har baar new notification create karega to user ko duplicate alerts milenge.

Solution: Idempotency (same event dobara process hone par duplicate effect na create hona).

Example:
PaymentVerified Event
       ↓
Group 17
       ↓
Check event identity
       ↓
Already processed?
    /       \
  Yes        No
   ↓          ↓
Skip       Create notification


Requirements:
- Event identity track karo.
- Duplicate event processing handle karo.
- Database constraints/indexes ka suitable use evaluate karo.
- Retry ko safe banao.
- Exactly-once delivery ka false promise mat karo; practical systems mein idempotent processing aur at-least-once delivery patterns important hain.
11. Notification Security
1. User sirf apni notifications read kare.
2. Recipient ID backend trusted context se determine ho.
3. Client kisi aur ka recipient ID specify karke notification access na le.
4. Sensitive financial/admission information unnecessarily notification text mein expose na ho.
5. Related record open karte waqt original module ki authorization dobara validate ho.
6. Email addresses aur private content secure rakho.
7. Notification event ke source ko validate karo.
8. Duplicate event handling secure ho.
9. Notification delivery errors properly log hon.
10. Unauthorized Admin access prevent ho.
12. SOLID Principles
Principle	Example
Single Responsibility	Notification creation aur email delivery ki responsibilities separate
Open/Closed	New delivery channel ko existing conventions ke through add karna
Liskov Substitution	Interchangeable channel implementations hon to apply
Interface Segregation	Unnecessary large interfaces avoid
Dependency Inversion	Business workflow ko provider-specific email code se tightly couple na karna

Senior advice: Agar sirf In-App notification required hai to email, push aur queue ke liye abhi unnecessary abstraction mat banao.
13. Failure Scenarios
Problem	Expected behavior
Email provider down	In-app notification safe rahe
Duplicate event	Duplicate notification prevent ho
Worker crash	Existing job policy ke mutabiq recovery/retry
Invalid recipient	Reject/log; unauthorized notification na create ho
User opens another user's notification	Access denied
Database failure	Controlled error and recoverable processing
Email fails after notification creation	In-app notification remain available
Related record deleted/archived	Safe fallback; no unauthorized access

14. Group 17 ke unresolved business policies
Agent ko ye rules khud se decide nahi karne:
- Kaunse events notification generate karenge?
- In-app notifications sab users ke liye mandatory hain?
- Email notifications kin events ke liye hon?
- Push notifications required hain?
- User notification preferences change kar sakta hai?
- Notifications kab expire/archive hongi?
- User notification delete kar sakta hai?
- Announcement ke liye individual notification records banenge ya audience-based delivery?
- Failed emails kitni baar retry hon?
- Notification retention policy kya hogi?
- Read receipts required hain?
- Sensitive notification content kaise handle hoga?

15. Group 17 ka final technology decision
Technology	Decision
Next.js	Use existing
Node.js	Use existing
Express.js	Use existing
MongoDB Atlas	Use existing
Mongoose	Use existing
JWT	Use existing
Existing Event System	Reuse
Existing Worker System	Reuse if suitable
BullMQ	Conditional
Redis	Conditional
Email Provider	Existing provider, inspect first
Push Service	Conditional
Kafka	Not Used
Microservices	Not Used
==============================================================================
# EDUOS — GROUP 17: NOTIFICATION MANAGEMENT
## Senior AI Agent Engineering Instructions

### 1. Role

Act as a Senior Backend Engineer, Software Architect, Security Engineer, and QA Engineer.

Your responsibility is to inspect, plan, implement, test, and verify Group 17 — Notification Management in the existing EduOS application.

Think like an engineer maintaining a real production system.

Do not immediately generate code. Understand the existing architecture and integrations first.

### 2. Existing Technology Stack

Approved existing stack:

- Frontend: Next.js.
- Backend: Node.js + Express.js.
- Database: MongoDB Atlas.
- ODM: Mongoose.
- Authentication: Existing JWT.
- Authorization: Existing permission middleware.
- Ownership: Existing ownership middleware.
- Events: Existing event architecture, if present.
- Jobs: Existing worker/job architecture, if present.
- Email: Existing provider, if present.

Architecture:

Client → Route → Middleware → Controller → Service → Existing Policy/Repository → Model → MongoDB Atlas.

Architecture type: Modular Monolith.

### 3. Non-Negotiable Rules

1. Preserve existing folder structure.
2. Do not create folders without a justified requirement and approval.
3. Do not introduce microservices.
4. Do not introduce Kafka.
5. Do not introduce a second database.
6. Do not create a duplicate authentication system.
7. Do not create a second event system if an existing one is suitable.
8. Do not create a duplicate job/worker architecture.
9. Do not introduce Redis or BullMQ automatically.
10. Do not add a new email provider without approval.
11. Do not modify unrelated modules.
12. Do not claim production readiness without evidence.
13. Do not invent business policies.

If the repository conflicts with these requirements, stop and report the conflict.

### 4. Group 17 Responsibilities

Group 17 centrally manages:

1. In-App Notifications.
2. Email Notifications, if required.
3. Push Notifications, if required.
4. Read/Unread Management.
5. Notification History.
6. Delivery Tracking.
7. Retry and Failure Handling.
8. Duplicate Event Prevention.
9. Notification Preferences, only if approved.

Group 17 does not own business decisions.

The source modules own their respective workflows. Group 17 informs relevant users about approved business events.

### 5. Event Integration

Inspect integrations from:

- Group 14 — Fees & Finance.
- Group 15 — Admissions.
- Group 16 — Communication.

Potential events include:

- Payment Verified.
- Payment Failed, if approved.
- Admission Approved.
- Admission Rejected.
- New Message.
- Complaint Submitted.
- Complaint Status Updated.
- Leave Request Submitted.
- Leave Request Approved.
- Leave Request Rejected.
- Announcement Published.

These are candidate events, not automatically approved notification policies.

Do not invent or emit events that the source modules do not actually support.

### 6. Notification Data Model

Inspect existing models and conventions before proposing a new model.

A conceptual notification may contain:

- Recipient reference.
- Notification type.
- Title.
- Message.
- Related entity type.
- Related entity reference.
- Read status.
- Read timestamp.
- Creation timestamp.

Additional delivery records may be required if multiple channels need independent status tracking.

Do not automatically place every delivery field in one document.

Avoid unnecessary duplication.

### 7. In-App Notifications

Requirements:

- Users can view their own notifications.
- Users can view unread count.
- Users can mark one notification as read.
- Users can mark all their notifications as read.
- Pagination must follow existing project conventions.
- Access to another user's notification must be rejected.
- Read state updates must be validated.
- Related entity navigation must not bypass original module authorization.

Possible API responsibilities:

- List notifications.
- Get notification details.
- Mark notification as read.
- Mark all notifications as read.
- Get unread count.

Inspect existing route conventions before deciding actual paths.

### 8. Email Notifications

First inspect the existing email provider and delivery architecture.

If email notifications are required:

- Reuse the existing provider.
- Use approved templates or existing template conventions.
- Avoid exposing sensitive information.
- Track delivery outcomes where supported.
- Handle provider errors.
- Avoid making core business operations depend on synchronous email delivery.
- Follow approved retry policy.

Do not introduce another email provider without approval.

### 9. Push Notifications

Do not implement push notifications unless an actual web/mobile push requirement is approved.

First inspect the frontend and existing application capabilities.

If push is needed, present provider, token storage, security, consent, and lifecycle decisions before implementation.

Do not introduce Firebase automatically.

### 10. Event Processing and Idempotency

Inspect existing event processing and worker architecture.

Requirements:

- Handle repeated event delivery safely.
- Prevent duplicate notification effects.
- Use stable event identity where available.
- Design retry-safe processing.
- Handle partial failures.
- Do not promise exactly-once delivery without evidence.
- Consider transactional consistency between business data and event creation.
- Use existing outbox/event patterns if available and suitable.

Do not implement a new outbox or queue without identifying a real requirement and obtaining approval.

### 11. Background Jobs

Inspect existing worker/job infrastructure.

Use existing jobs where suitable.

BullMQ and Redis are conditional technologies, not mandatory dependencies.

Recommend them only if existing infrastructure cannot satisfy a measured requirement.

Explain trade-offs before introducing new infrastructure.

### 12. Authorization and Security

Reuse existing JWT, permission, and ownership middleware.

Requirements:

- Recipient identity must be determined by trusted backend logic.
- Never trust arbitrary client-provided recipient IDs.
- Users must access only their own notifications unless a specific authorized administrative capability exists.
- Protect notification references.
- Validate source events.
- Avoid exposing sensitive payment, admission, or personal information.
- Protect email and push tokens.
- Validate all notification actions.
- Prevent unauthorized notification deletion or modification.
- Follow existing audit conventions.

### 13. Failure Handling

Consider:

- Invalid recipient.
- Duplicate event.
- Database failure.
- Worker crash.
- Email provider outage.
- Push provider failure.
- Partial delivery.
- Retry exhaustion.
- Expired related record.
- Unauthorized notification access.

Notification delivery failure must not incorrectly reverse a successfully completed business operation.

Use controlled logging and recovery based on existing project conventions.

### 14. SOLID and Code Quality

Apply SOLID where it genuinely improves maintainability.

Avoid unnecessary classes, interfaces, abstractions, or patterns.

Separate responsibilities when there is a real reason.

Use existing naming, validation, error handling, and testing conventions.

### 15. Testing Requirements

Plan and perform:

1. Notification creation tests.
2. Recipient validation tests.
3. User ownership tests.
4. Read/unread tests.
5. Unread count tests.
6. Pagination tests.
7. Duplicate event tests.
8. Event integration tests.
9. Worker failure tests.
10. Email failure tests, if email is implemented.
11. Push failure tests, if push is implemented.
12. Authorization tests.
13. Regression tests.
14. Retry and recovery tests.

Do not report tests as passed unless they were actually executed and inspected.

### 16. Business Policy Questions

Do not invent answers for:

- Notification event catalog.
- Mandatory versus optional channels.
- Email delivery rules.
- Push requirements.
- User notification preferences.
- Retention and archival.
- Notification deletion.
- Retry policy.
- Read receipts.
- Announcement delivery strategy.
- Sensitive content rules.

List unresolved policies and request approval.

### 17. Mandatory Workflow

Phase 1: Repository Inspection.

Phase 2: Inspection Report.

Phase 3: Integration and Event Mapping.

Phase 4: Business Policy Clarification.

Phase 5: Technical Implementation Plan.

Phase 6: User Approval.

Phase 7: Incremental Implementation.

Phase 8: Testing.

Phase 9: Verification.

Phase 10: Documentation Update.

Phase 11: Completion Report.

### 18. Current Task — INSPECTION ONLY

Do not create, edit, delete, or rename source code files.

Inspect and report:

A. Project structure.

B. Existing notification-related code.

C. Existing event architecture.

D. Existing job and worker architecture.

E. Existing email provider and templates.

F. Existing authentication and authorization.

G. Existing User and profile relationships.

H. Existing frontend notification components.

I. Existing database models and indexes.

J. Existing testing infrastructure.

K. Integrations with Groups 14, 15, and 16.

L. Missing capabilities and security gaps.

M. Recommended Group 17 architecture.

N. Unresolved business policies.

O. Proposed implementation sequence.

For each finding, identify the exact relevant file paths.

Distinguish verified facts from assumptions and recommendations.

### 19. Stop Rule

After the inspection report:

STOP.

Do not implement anything.

Wait for explicit approval.

If an architecture change is necessary, explain why, identify affected files, describe alternatives and trade-offs, and request approval.

Your goal is a secure, reliable, maintainable notification system that reuses EduOS infrastructure rather than introducing unnecessary complexity.