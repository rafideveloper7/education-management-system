EduOS — Group 16: Communication Management
Architecture decision
Recommended

- Architecture: Modular Monolith
- Backend: Existing Node.js + Express.js
- Database: Existing MongoDB Atlas + Mongoose
- Frontend: Existing Next.js
- Authentication: Existing JWT system
- Authorization: Existing permissions and ownership middleware
- Notifications: Group 17 integration
- Real-time: Only if requirements justify it
- Deployment: Existing infrastructure

1. Group 16 ka purpose
EduOS mein students, parents, teachers aur admins ke darmiyan communication ko organized, secure aur trackable banana.

Is group ka goal sirf messages send karna nahi hai. Iska goal communication-related workflows ko manage karna hai.
Group 16 ke main modules
Module	Purpose
1. Messages Management	Users ke darmiyan private communication
2. Complaints Management	Formal complaints aur resolution
3. Leave Requests	Student leave requests aur approval
4. Announcements	School-wide ya selected audience communication
5. Communication History	Communication records aur audit history

Note: Ye conceptual modules hain. Final APIs, database collections aur permissions repository inspection ke baad decide hongi.
2. Technology Stack — Kya use hoga aur kyun?










Next.js — Frontend

Parent, Teacher, Student aur Admin dashboards, message interfaces, complaint forms, leave request forms aur announcement management.













Node.js — Runtime

Backend JavaScript code execute karne ke liye. Existing backend runtime ko hi reuse karenge.













Express.js — Backend Framework

Routes, middleware, controllers aur APIs implement karne ke liye. NestJS ya koi doosra framework introduce nahi karna.













MongoDB Atlas — Database

Conversations, messages, complaints, leave requests aur announcements store karne ke liye.













Mongoose — ODM

Schemas, validation, relationships aur database operations manage karne ke liye.













Socket.IO — Conditional Technology

Sirf tab jab real-time messaging, live updates ya instant communication ki actual requirement ho.













Existing Cloudinary — Conditional File Storage

Sirf agar complaints ya communication mein attachments ki requirement ho aur existing Cloudinary configuration privacy/security requirements meet karti ho.



Technologies jo automatically add nahi karni
Technology	Decision
PostgreSQL	Not Used
Redis	Not Used unless justified
Kafka	Not Used
Microservices	Not Used
GraphQL	Not Used
Firebase	Not Used
Separate authentication system	Not Used
Separate notification engine	Not Used

Reason: EduOS ka existing architecture Express + MongoDB Atlas par based hai. Group 16 ke liye unnecessary technology introduce karna complexity aur maintenance cost barhaye ga.

3. Module 1 — Messages Management
Purpose
Parent, Teacher aur Admin ke darmiyan private communication manage karna.
Important concepts
Conversation vs Message
- Conversation: Do ya zyada users ke darmiyan communication thread.
- Message: Conversation ke andar individual communication.
Example:
Conversation: Parent ↔ Teacher

Message 1: Parent: Homework ka issue hai.
Message 2: Teacher: Please assignment check karein.
Message 3: Parent: Thank you.


Conceptual database structure
Conversation:
{
  participants: [],
  createdBy: "...",
  lastMessageAt: "...",
  status: "ACTIVE"
}


Message:
{
  conversationId: "...",
  senderId: "...",
  content: "...",
  createdAt: "...",
  readAt: null
}


Ye initial conceptual examples hain, final schema nahi.
Business rules
1. Sirf authorized users conversation create kar saken.
2. Conversation ke participants hi us conversation ko access kar saken.
3. Sender identity backend authentication se aaye.
4. Client apna senderId bhej kar kisi doosre user ki identity use na kar sake.
5. Unauthorized users messages read ya send na kar saken.
6. Message history protected rahe.
7. Duplicate requests aur repeated submissions handle hon.
8. Read/unread tracking ki exact requirements define ki jayen.
REST API approach
Examples:
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations/:id/messages
GET    /api/conversations/:id/messages
PATCH  /api/messages/:id/read


Agent existing API naming conventions inspect karega. Ye endpoint examples mandatory final routes nahi hain.
Real-time messaging: Socket.IO kab?
REST API normal request/response communication ke liye kaafi hai.

Socket.IO tab consider karenge jab requirement ho:
- Instant message delivery.
- Live conversation updates.
- Online/offline presence.
- Live typing indicators.
Senior decision: Pehle REST-based messaging implement karo. Real-time ki actual requirement confirm hone par Socket.IO add karo. Sirf modern technology dikhane ke liye add nahi karni.

4. Module 2 — Complaints Management
Purpose
Parents, students ya authorized users ko school-related complaints submit karne aur unka resolution track karne ki facility dena.
Example workflow
Complaint Submitted


Under Review


In Progress


Resolved

Illustrative lifecycle. Final statuses aur transitions school policy ke mutabiq approve honge.

Conceptual database structure
{
  submittedBy: "...",
  category: "...",
  subject: "...",
  description: "...",
  status: "SUBMITTED",
  assignedTo: null,
  reviewedBy: null,
  resolvedAt: null
}


Business rules
1. Authorized user complaint submit kare.
2. User sirf apni complaint access kar sake, unless additional permissions exist.
3. Admin ya assigned authorized person complaint review kare.
4. Parent khud complaint ko resolved mark na kar sake.
5. Har status transition validate ho.
6. Assignment aur reassignment authorized hon.
7. Complaint history aur decision audit maintain ho.
8. Duplicate submissions handle hon.
9. Sensitive complaint data sirf authorized users ko accessible ho.
Possible API examples
POST   /api/complaints
GET    /api/complaints
GET    /api/complaints/:id
PATCH  /api/complaints/:id/assign
PATCH  /api/complaints/:id/status
GET    /api/complaints/:id/history


Final endpoints existing project conventions ke mutabiq honge.

5. Module 3 — Leave Requests Management
Purpose
Parent ya policy ke mutabiq eligible user student ke liye leave request submit kare aur authorized school staff usko review kare.
Example workflow
Parent
  ↓
Leave Request Submitted
  ↓
Authorized Review
  ↓
Approved / Rejected
  ↓
Request History


Conceptual database structure
{
  studentId: "...",
  requestedBy: "...",
  startDate: "...",
  endDate: "...",
  reason: "...",
  status: "PENDING",
  reviewedBy: null,
  reviewNote: null
}


Business rules
1. Parent sirf apne linked student ke liye request submit kare.
2. Teacher/Admin ki approval authority existing permissions ke mutabiq ho.
3. Start date aur end date validate hon.
4. Invalid date ranges reject hon.
5. Unauthorized person request approve/reject na kar sake.
6. Duplicate requests handle hon.
7. Review history maintain ho.
8. Already approved/rejected request par invalid transition block ho.
9. Leave request approval se attendance automatically modify na ho jab tak approved business policy integration define na kare.
Group 11 integration
Group 11 Attendance Management aur Group 16 Leave Requests alag responsibilities hain.
- Group 16: Leave request aur approval manage karega.
- Group 11: Actual attendance record manage karega.
Agar future mein approved leave ka attendance par effect define hota hai, to explicit integration implement hogi. Group 16 directly attendance records modify nahi karega.

6. Module 4 — Announcements Management
Purpose
School Admin ya authorized staff important announcements publish kar saken.

Examples:
- School holiday announcement.
- Parent meeting.
- Examination schedule notice.
- Fee submission reminder.
- School event information.
Audience targeting
Announcement ka audience system-defined roles ya relevant groups ho sakte hain:
- All Parents.
- All Teachers.
- All Students.
- Selected Class.
- Selected Section.
- Selected authorized audience.
Conceptual database structure
{
  title: "...",
  content: "...",
  createdBy: "...",
  audience: [],
  status: "DRAFT",
  publishedAt: null,
  expiresAt: null
}


Business rules
1. Sirf authorized users announcement create/publish kar saken.
2. Audience targeting backend validate kare.
3. Unauthorized users restricted announcements access na kar saken.
4. Published announcement ka edit/delete behavior policy-defined ho.
5. Draft aur published content separate handle hon.
6. Publication history maintain ho.
7. Expiration behavior approved requirements ke mutabiq ho.
8. Announcement notification Group 17 handle karega.
API examples
POST   /api/announcements
GET    /api/announcements
GET    /api/announcements/:id
PATCH  /api/announcements/:id
PATCH  /api/announcements/:id/publish
PATCH  /api/announcements/:id/archive



7. Module 5 — Communication History & Audit
Bahi, ye senior-level important concept hai.

Suppose Admin ne complaint ka status change kiya. Baad mein koi poochta hai ke complaint kisne resolve ki?

System ke paas record hona chahiye.

Conceptual audit information:
{
  entityType: "COMPLAINT",
  entityId: "...",
  action: "STATUS_UPDATED",
  performedBy: "...",
  previousValue: "...",
  newValue: "...",
  createdAt: "..."
}


Rules
- Important status changes track hon.
- Unauthorized user audit records modify na kar sake.
- Audit information normal user ko automatically expose na ho.
- Existing audit/history mechanism ho to reuse ho.
- Sensitive message content unnecessary duplicate na kiya jaye.
- Data retention policy confirm ki jaye.

8. Backend Architecture
EduOS ka existing backend flow same rahega:
Client / Next.js


Route


Authentication Middleware


Permission Middleware


Ownership Middleware


Controller


Service


Policy / Repository (where existing architecture requires it)


Model / Mongoose


MongoDB Atlas


Responsibilities
Layer	Responsibility
Route	API endpoints
Auth Middleware	User identity
Permission Middleware	Action permission
Ownership Middleware	Specific record access
Controller	Request/response
Service	Business logic
Policy/Repository	Existing policy/data access conventions
Model	MongoDB schema
MongoDB	Persistent storage

Important: Har module mein unnecessary layers ya new abstraction introduce nahi karni. Existing repository conventions ko follow karna hai.
9. Authentication & Authorization
Existing EduOS authentication reuse hogi.

Roles:
- ADMIN
- TEACHER
- STUDENT
- PARENT
- PUBLIC_USER
PUBLIC_USER ko automatically internal communication access nahi milega.
Permission examples
Conceptual permissions:
MESSAGE:CREATE
MESSAGE:READ
MESSAGE:SEND

COMPLAINT:CREATE
COMPLAINT:READ
COMPLAINT:ASSIGN
COMPLAINT:UPDATE_STATUS

LEAVE:CREATE
LEAVE:READ
LEAVE:REVIEW

ANNOUNCEMENT:CREATE
ANNOUNCEMENT:PUBLISH
ANNOUNCEMENT:READ


Ye examples hain; final permission identifiers existing EduOS permission constants ke mutabiq honge.

Important distinction:
- Authentication: User kaun hai?
- Authorization: User kya kar sakta hai?
- Ownership: Kya user is specific record ko access kar sakta hai?
In teenon ko mix nahi karna.

10. Group 17 Integration — Notifications
Group 16 aur Group 17 ki responsibilities separate rahengi.
Group 16 Event	Group 17 ka possible kaam
New Message	Message notification
Complaint Submitted	Admin notification
Complaint Status Updated	Relevant user notification
Leave Request Submitted	Reviewer notification
Leave Approved/Rejected	Parent notification
Announcement Published	Target audience notification

Architecture
Group 16 Service
       ↓
Business Event
       ↓
Group 17 Notification Workflow
       ↓
Email / In-App Notification / Other Channels


Important rules
1. Group 16 apna separate notification engine nahi banayega.
2. Notification failure se successfully saved message ya approved complaint fail nahi honi chahiye.
3. Event delivery duplicate-safe honi chahiye where applicable.
4. Existing event/job architecture inspect karke reuse karo.
5. BullMQ, Redis ya new event infrastructure automatically add mat karo.

11. SOLID Principles — Practical Implementation
Principle	Group 16 example
S — Single Responsibility	Message Service aur Complaint Service ki responsibilities separate
O — Open/Closed	New announcement audience behavior existing conventions ke through extend ho
L — Liskov Substitution	Sirf genuine interchangeable implementations hon to apply karo
I — Interface Segregation	Unnecessary large interfaces avoid karo
D — Dependency Inversion	High-level business logic ko unnecessary concrete infrastructure se tightly couple na karo

Senior advice: SOLID ka matlab har module mein 10 interfaces aur 20 classes banana nahi hai. SOLID ka purpose change ko manageable banana hai.

12. Security Requirements
Ye requirements mandatory review ka hissa hongi.
- Backend authorization on every protected operation.
- Parent–Student relationship verification.
- Teacher assignment/ownership verification.
- Conversation participant authorization.
- Complaint assignment and status transition authorization.
- Announcement audience access validation.
- Request body validation.
- Input sanitization and safe rendering.
- XSS prevention.
- Secure attachment validation if attachments are supported.
- No sensitive data in unnecessary API responses.
- Audit protection.
- Duplicate request handling.
- Rate limiting based on endpoint risk and actual traffic.
- No reliance on frontend-only permissions.
- No trusting client-provided user IDs for identity.
Important failure cases
Scenario	Expected behavior
Unauthorized message read	Reject
Parent accesses another student's leave request	Reject
Unassigned person resolves complaint	Reject
Invalid status transition	Reject
Duplicate message submission	Handle safely
Invalid announcement audience	Reject
Database failure	Return controlled error
Notification service failure	Preserve committed business operation
Unauthorized attachment access	Reject


13. Technology Decision Document
Technology	Decision	Reason
Next.js	Use existing	Frontend
Node.js	Use existing	Runtime
Express.js	Use existing	Backend APIs
MongoDB Atlas	Use existing	Database
Mongoose	Use existing	ODM
JWT	Use existing	Authentication
Socket.IO	Conditional	Real-time requirement
Cloudinary	Conditional	Secure attachment requirement
Redis	Not by default	Add only with justified requirement
BullMQ	Not by default	Reuse existing jobs/events
Kafka	Not used	Unnecessary complexity
Microservices	Not used	Modular monolith is existing architecture


14. Unresolved Business Policies — Agent must not invent
Bahi, ye bohat important hai. Software engineer khud se school ke business rules decide nahi karta.

Implementation se pehle ye questions clarify karne honge:

Messages
- Kaun kin roles ko message kar sakta hai?
- Group conversations allowed hain?
- Message edit/delete allowed hai?
- Attachments allowed hain?
- Read receipts required hain?
Complaints
- Kaun complaint submit kar sakta hai?
- Complaint categories kya hongi?
- Kaun assign aur resolve kar sakta hai?
- Reopen facility hogi?
- Complaint escalation policy kya hogi?
Leave Requests
- Parent ke ilawa kaun request submit kar sakta hai?
- Approval authority kaun hogi?
- Backdated requests allowed hain?
- Maximum leave duration kya hogi?
- Supporting document required hai?
- Request cancellation allowed hai?
Announcements
- Kaun announcement publish kar sakta hai?
- Audience targeting ki boundaries kya hain?
- Announcement edit/archive policy kya hogi?
- Expiration date required hai?
- Read acknowledgement required hai?
History & Retention
- Records kitne time tak preserve honge?
- Deleted/archived data ka behavior kya hoga?
- Audit access kin users ko milega?
Agar answer available nahi hai, agent question raise karega. Khud se policy create nahi karega.

15. Testing Strategy
Implementation complete hone par ye testing required hogi:
1. Unit tests — Business logic.
2. Integration tests — Express APIs + MongoDB.
3. Authentication tests — Invalid/expired tokens.
4. Authorization tests — Unauthorized role.
5. Ownership tests — Wrong student/participant access.
6. Validation tests — Invalid inputs and dates.
7. Workflow tests — Valid and invalid status transitions.
8. Duplicate submission tests.
9. Failure tests — Database and external service failures.
10. Integration tests — Group 17 notification events.
11. Regression tests — Existing modules should not break.
Completion condition
Sirf APIs chal jana Group 16 complete hone ka proof nahi. Security, business workflows, testing aur existing module compatibility bhi verify honi chahiye.
# EDUOS — GROUP 16: COMMUNICATION MANAGEMENT
## AI Agent Engineering Instructions

### 1. Your Role

Act as a Senior Backend Engineer, Software Architect, Security Engineer, and QA Engineer.

You are working on EduOS, an existing Education Management System.

Your task is to inspect, plan, implement, test, and verify Group 16 — Communication Management.

Do not behave like a code generator that immediately creates files. First understand the existing system, its architecture, business rules, security model, database relationships, and coding conventions.

Think like an experienced engineer responsible for maintaining a real production application.

---

### 2. Existing Project Architecture — Mandatory

The approved technology stack is:

- Frontend: Existing Next.js application.
- Backend: Existing Node.js + Express.js application.
- Database: Existing MongoDB Atlas.
- ODM: Existing Mongoose.
- Authentication: Existing JWT authentication.
- Authorization: Existing permission middleware.
- Ownership: Existing ownership middleware.
- File Storage: Existing Cloudinary, only if required and security-reviewed.

Architecture:

Client → Route → Middleware → Controller → Service → Policy/Repository (where existing architecture requires it) → Model → MongoDB Atlas.

Existing event/job workflow may be used for integrations.

Architecture type: Modular Monolith.

Do not introduce microservices.

### 3. Non-Negotiable Rules

1. Existing folder structure is the approved baseline.
2. Do not create new folders without identifying a real requirement and obtaining approval.
3. Do not change existing architecture just to make it look cleaner.
4. Do not introduce another backend framework.
5. Do not introduce another database.
6. Do not duplicate authentication or authorization.
7. Do not duplicate the notification system.
8. Do not introduce RAG or AI features without a separately approved business requirement.
9. Do not add unnecessary abstractions, interfaces, services, repositories, or design patterns.
10. Reuse existing project conventions.
11. Do not remove or modify unrelated features.
12. Do not claim production readiness without test and verification evidence.

If the repository conflicts with these instructions, stop and report the conflict before making architecture changes.

---

### 4. Group 16 Scope

Implement these conceptual modules:

1. Messages Management.
2. Complaints Management.
3. Leave Requests Management.
4. Announcements Management.
5. Communication History and Audit.

Keep their responsibilities separate even though they belong to one group.

Do not combine all business logic into one large service.

Do not assume that all modules require identical data structures or permissions.

---

### 5. Messages Management Requirements

Inspect existing user, profile, role, parent-student, and teacher-assignment relationships.

The conceptual model includes:

Conversation:
- Participants.
- Creator.
- Conversation status.
- Last activity timestamp.

Message:
- Conversation reference.
- Authenticated sender.
- Message content.
- Creation timestamp.
- Read information, if required.

Requirements:

- Only authorized participants can access a conversation.
- Conversation ID alone must never grant access.
- Sender identity must come from authenticated backend context.
- Never trust client-provided sender identity.
- Validate conversation membership on every protected operation.
- Prevent unauthorized message reads and writes.
- Handle duplicate submissions safely.
- Protect message history.
- Follow existing pagination conventions.

Start with REST APIs.

Socket.IO or another real-time technology must not be introduced unless real-time communication is confirmed as an actual requirement.

If real-time requirements exist, present the design and trade-offs before implementation.

---

### 6. Complaints Management Requirements

Conceptual workflow:

Submitted → Under Review → In Progress → Resolved.

These statuses are illustrative until the final business policy is approved.

Requirements:

- Authorized users can submit complaints.
- Users can access only complaints allowed by their permissions and ownership.
- Authorized Admin or assigned authorized staff can review and resolve complaints.
- Validate every status transition on the backend.
- Validate assignment and reassignment permissions.
- Maintain relevant status and assignment history.
- Protect sensitive complaint information.
- Handle duplicate submissions.
- Prevent unauthorized users from resolving complaints.

Do not allow a Parent to resolve their own complaint merely because they submitted it.

Do not invent escalation, reopening, or automatic assignment rules.

---

### 7. Leave Requests Management Requirements

Conceptual data may include:

- Student reference.
- Authenticated requester.
- Start date.
- End date.
- Reason.
- Request status.
- Reviewer.
- Review note.
- Relevant timestamps.

Requirements:

- Verify that the requester is authorized to submit a request for the specified student.
- Reuse existing Parent–Student relationships.
- Validate date ranges.
- Validate request status transitions.
- Validate approval/rejection permissions.
- Prevent unauthorized access to other students' leave requests.
- Handle duplicate requests safely.
- Preserve review history.

Important:

Group 16 manages leave requests.

Group 11 manages attendance.

Do not directly modify attendance records when approving leave unless a separately approved business rule and integration explicitly require it.

Do not invent leave duration, backdating, cancellation, or approval policies.

---

### 8. Announcements Management Requirements

Conceptual data may include:

- Title.
- Content.
- Creator.
- Target audience.
- Status.
- Publication timestamp.
- Expiration timestamp, if required.

Requirements:

- Only authorized users can create or publish announcements.
- Validate target audience on the backend.
- Reuse existing roles and academic relationships.
- Prevent unauthorized access to restricted announcements.
- Handle draft, published, and archived states according to approved policy.
- Preserve publication history where required.
- Avoid exposing announcements to unintended users.

Do not invent audience targeting or expiration policies.

---

### 9. Communication History and Audit

Inspect whether an existing audit/history mechanism already exists.

Reuse it whenever possible.

Relevant audit events may include:

- Complaint status changes.
- Complaint assignment changes.
- Leave request decisions.
- Announcement publication.
- Other important authorized communication actions.

Requirements:

- Track who performed an important action.
- Track when the action occurred.
- Preserve relevant previous and new values.
- Prevent ordinary users from modifying audit history.
- Restrict audit access.
- Avoid unnecessarily duplicating sensitive message content.

Do not create a second audit framework if one already exists.

---

### 10. Authentication, Authorization and Ownership

Reuse existing authentication and authorization.

Existing roles:

- ADMIN
- TEACHER
- STUDENT
- PARENT
- PUBLIC_USER

Do not create duplicate role systems.

Inspect the existing permission constants and permission middleware.

Possible permission concepts include:

- MESSAGE:CREATE
- MESSAGE:READ
- MESSAGE:SEND
- COMPLAINT:CREATE
- COMPLAINT:READ
- COMPLAINT:ASSIGN
- COMPLAINT:UPDATE_STATUS
- LEAVE:CREATE
- LEAVE:READ
- LEAVE:REVIEW
- ANNOUNCEMENT:CREATE
- ANNOUNCEMENT:PUBLISH
- ANNOUNCEMENT:READ

These are examples, not mandatory permission identifiers.

Use existing naming conventions and authorization architecture.

Important distinctions:

- Authentication verifies identity.
- Authorization verifies permitted actions.
- Ownership verifies access to a specific record.

Never depend on frontend permission checks alone.

---

### 11. Group 17 Notification Integration

Group 16 must not create a separate notification engine.

Inspect existing event, job, worker, and notification architecture.

Potential events:

- Message Created.
- Complaint Submitted.
- Complaint Status Updated.
- Leave Request Submitted.
- Leave Request Approved or Rejected.
- Announcement Published.

Group 17 owns notification delivery.

Requirements:

- Reuse existing integration patterns.
- Avoid duplicate notification implementations.
- Prevent notification failures from incorrectly reversing successfully committed business operations.
- Consider safe event delivery and duplicate handling.
- Do not introduce Redis, BullMQ, Kafka, or another messaging infrastructure without evidence and approval.

---

### 12. Technology Decisions

Use existing:

- Next.js.
- Node.js.
- Express.js.
- MongoDB Atlas.
- Mongoose.
- JWT authentication.
- Existing middleware and permission system.

Conditional technologies:

- Socket.IO: Only for approved real-time requirements.
- Cloudinary: Only for approved attachment requirements and after security review.
- Redis/BullMQ: Only if existing infrastructure or measurable requirements justify them.

Do not introduce:

- PostgreSQL.
- Firebase.
- GraphQL.
- Kafka.
- Microservices.
- A new authentication framework.
- A separate notification engine.

Every technology decision must explain:

Requirement → Problem → Technology → Why → Alternative → Why Not → Trade-off → Decision.

If a technology is not required, write:

Technology: Not Used.

---

### 13. Security Requirements

Inspect and plan protection against:

- Broken object-level authorization.
- Unauthorized conversation access.
- Unauthorized student record access.
- Parent–Student relationship violations.
- Unauthorized complaint assignment.
- Invalid status transitions.
- Unauthorized announcement audiences.
- XSS and unsafe content rendering.
- Invalid request bodies.
- Sensitive data exposure.
- Unauthorized attachment access.
- Duplicate submissions.
- Insecure audit access.

Validate all important business rules on the backend.

Do not trust IDs, roles, status values, amounts, or ownership claims supplied by the client without verification.

Rate limits must be based on endpoint risk, actual traffic, and existing infrastructure. Do not blindly add strict IP-only limits.

---

### 14. Database and Data Integrity

Before designing collections:

1. Inspect existing models.
2. Inspect existing User and role profiles.
3. Inspect Parent–Student relationships.
4. Inspect Teacher assignments.
5. Inspect academic relationships.
6. Inspect existing indexes.
7. Inspect existing audit/history conventions.
8. Inspect existing deletion and archival conventions.

Use Mongoose conventions already present.

Consider indexes based on actual query patterns.

Avoid unnecessary duplication.

Use MongoDB transactions only when multi-document atomicity is genuinely required and the deployment supports transactions.

Handle concurrent updates safely where relevant.

Do not invent retention or deletion policies.

---

### 15. SOLID and Code Quality

Apply SOLID principles where they improve maintainability.

- Single Responsibility: Keep unrelated business responsibilities separate.
- Open/Closed: Make genuine extension points without unnecessary abstraction.
- Liskov Substitution: Apply only when interchangeable implementations exist.
- Interface Segregation: Avoid unnecessary large interfaces.
- Dependency Inversion: Avoid unnecessary coupling between business rules and infrastructure.

Use clear naming, consistent error handling, validation, and existing coding conventions.

Do not create abstractions simply to demonstrate design patterns.

---

### 16. Testing Requirements

Plan and perform appropriate:

1. Unit tests.
2. API integration tests.
3. Authentication tests.
4. Permission tests.
5. Ownership tests.
6. Parent–Student relationship tests.
7. Conversation participant tests.
8. Complaint lifecycle tests.
9. Leave request validation tests.
10. Announcement audience tests.
11. Duplicate submission tests.
12. Database failure tests.
13. Group 17 integration tests.
14. Regression tests for existing EduOS modules.

Do not report tests as passed unless they were actually executed and their results inspected.

Do not silently skip failing tests.

---

### 17. Unresolved Business Policies

Do not invent business rules for:

Messages:
- Eligible sender/recipient combinations.
- Group conversations.
- Editing and deleting messages.
- Attachments.
- Read receipts.

Complaints:
- Eligible submitters.
- Categories.
- Assignment authority.
- Escalation.
- Reopening.
- Resolution rules.

Leave Requests:
- Eligible requesters.
- Approval authority.
- Maximum duration.
- Backdated requests.
- Attachments.
- Cancellation.
- Attendance impact.

Announcements:
- Publishing authority.
- Audience targeting.
- Expiration.
- Editing and archiving.
- Read acknowledgement.

History:
- Retention.
- Archival.
- Deletion.
- Audit access.

Record these as clarification questions and wait for approval where they affect implementation.

---

### 18. Mandatory Development Workflow

Follow this exact workflow:

Phase 1 — Repository Inspection.

Phase 2 — Inspection Report.

Phase 3 — Business Policy Clarification.

Phase 4 — Technical Implementation Plan.

Phase 5 — User Approval.

Phase 6 — Incremental Implementation.

Phase 7 — Testing.

Phase 8 — Verification.

Phase 9 — Bug Fixes.

Phase 10 — Documentation Update.

Phase 11 — Completion Report.

Do not skip phases.

---

### 19. Current Task: INSPECTION ONLY

For the first task, do not create, modify, delete, or rename any source code files.

Inspect the existing repository and report:

A. Project Structure
- Relevant frontend folders.
- Relevant backend folders.
- Existing module conventions.

B. Backend Architecture
- Route structure.
- Middleware.
- Controllers.
- Services.
- Policies/repositories, if present.
- Models.

C. Authentication and Authorization
- JWT implementation.
- Role constants.
- Permission middleware.
- Ownership middleware.

D. Existing Relationships
- User and profile architecture.
- Parent–Student relationship.
- Teacher assignments.
- Academic relationships.

E. Database
- Existing model conventions.
- Indexes.
- Validation.
- Audit/history mechanisms.

F. Integrations
- Group 17 notification system.
- Existing event/job/worker system.
- Existing Cloudinary implementation.
- Existing real-time infrastructure, if any.

G. Testing
- Existing testing framework.
- Test structure.
- Test commands.
- Existing coverage relevant to these modules.

H. Gap Analysis
- What already exists?
- What can be reused?
- What is missing?
- What conflicts with the approved architecture?
- What business policies require clarification?

I. Proposed Group 16 Plan
- Proposed modules.
- Proposed relationships.
- Proposed API responsibilities.
- Proposed permission requirements.
- Proposed integration points.
- Proposed testing plan.

For each finding, identify the actual relevant file paths.

Clearly distinguish verified facts from assumptions and recommendations.

Do not claim a file or feature exists unless you inspected it.

---

### 20. Stop and Approval Rule

After completing the inspection report:

STOP.

Do not implement Group 16 yet.

Present the findings, gaps, risks, unresolved policies, and recommended implementation sequence.

Wait for explicit approval before modifying source code.

If the existing repository conflicts with the approved architecture, explain the conflict and its trade-offs and request approval.

Your objective is not to generate the maximum amount of code.

Your objective is to deliver secure, maintainable, testable, and correctly integrated EduOS Communication Management functionality while preserving the existing architecture.