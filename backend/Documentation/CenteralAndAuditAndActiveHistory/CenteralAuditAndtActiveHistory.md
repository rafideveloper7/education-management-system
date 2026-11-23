group 18
=====================================================
EduOS: Central Audit & Activity History

=====================================================
Final Engineering Specification & AI Coding Agent Instructions
Project: EduOS, Education Management System
Module: Central Audit & Activity History
Backend: Node.js + Express.js
Database: MongoDB Atlas + Mongoose
Frontend: Next.js
Architecture: Modular Monolith
Scope: Single educational institute
Purpose of documentation: Requirements, architecture decisions, security, testing aur long-term maintenance.
1. AI Coding Agent ke liye sab se zaroori instructions
1.1 Tumhara role
Tum EduOS me Senior Backend Engineer, Software Architect, Security Reviewer aur QA Engineer ki tarah kaam karoge. Tumhara maqsad sirf code generate karna nahi hai. Aisa code likhna hai jo:
Samajhne me asaan ho
Existing architecture ke saath consistent ho
Secure ho
Test karna asaan ho
Unnecessary complexity se door ho
Senior engineering ka matlab zyada files ya patterns nahi, balki sahi problem ke liye sahi level ka solution hai.
1.2 Pehle existing project samjho
Read-only inspection/report phase mein code, dependency ya script changes nahi hongi. Implementation ke liye owner ki explicit scope approval zaroori hai.
Implementation se pehle ye inspect karo:
Repository aur folder structure
Group 16 ka existing audit/history mechanism
Group 14 (payments), Group 13 (results), attendance aur user management me audit kahan already ho raha hai
Authentication, permission aur ownership middleware
Permission constants aur role definitions
Error handling aur API response format
Pagination aur filtering conventions
Existing models, indexes aur tests
Notification aur BullMQ integration (sirf dekhna hai, audit ke liye naya engine nahi banana)
Pehle se maujood implementation ko samjhe baghair duplicate system mat banao.
1.3 Conflict rule
Agar existing code is document se conflict kare:
Conflict identify karo
Affected files aur existing behavior report karo
Proposed solution aur trade-offs batao
Architecture change karne se pehle permission lo
Chupke se architecture change mat karna.
2. EduOS ki existing architecture
Client → Route → Middleware → Controller → Service
       → Policy / Repository → Model → MongoDB Atlas
Existing project conventions ke mutabiq layers use karo. Har operation me zabardasti har layer add karna zaroori nahi.
Layer
Responsibility (Audit ke context me)
Route
Audit read endpoints define karna
Middleware
Authentication, Admin permission, query validation
Controller
Request receive karna, response dena
Service
Audit record create karna aur query karna
Model
Audit schema aur indexes
Database
Permanent audit storage
2.1 Architecture boundaries
Audit ke liye alag microservice ya naya database mat banao.
Frontend audit ka trusted source nahi hai. Audit sirf backend banayega.
Client se performedBy ya action accept mat karo.
Audit ke liye alag authentication system mat banao.
Naya notification engine mat banao.
3. Is module ka purpose
Ye module EduOS ke important administrative aur business actions ka record rakhega taake accountability aur investigation possible ho.
Analogy: Audit ek CCTV camera hai. Wo kuch rokta nahi, bas record karta hai ki kisne, kab, kya badla.
Example: Student ka result 78 se 85 ho gaya. 3 mahine baad parent poochta hai ye kisne badla. Audit ho to jawab milega "Teacher X ne 14 March ko badla". Audit na ho to koi jawab nahi.
3.1 Audit aur Logging me farq

Audit
Logging
Kya record hota hai
Business actions
Technical events
Example
Result changed
Server error, slow query
Kaun dekhta hai
Admin
Developer
Module
Ye module
Module 11
Dono ko mix mat karo.
4. Core engineering principles
4.1 SRP: Audit service sirf audit record banane aur query karne ka kaam kare. Business logic (fees, results) us ki responsibility nahi.
4.2 DRY: Har module apna alag audit code na likhe. Ek common audit service ho jise sab module call karein. Lekin Group 16 ka existing mechanism pehle inspect karo, shayad wahi reuse ho jaye.
4.3 KISS: Ek simple append-only collection kaafi hai. Event sourcing, message broker ya complicated framework ki zarorat nahi.
4.4 YAGNI: Elasticsearch, Kafka, Redis ya real-time audit stream abhi add mat karo.
4.5 Security by Design: Har audit read par pucho:
User authenticated hai?
Admin permission hai?
Response me sensitive data to nahi ja raha?
4.6 Fail Safely: Audit record na ban sake to silently ignore mat karo. Policy ke mutabiq controlled error ya reported failure do (section 12 dekho).
5. Audit kin events ka hoga
Original spec section 25 ke mutabiq:
Area
Events
Users
User created, updated, account disabled
Fees
Fee created, payment recorded, refund
Results
Result changed, result published
Attendance
Attendance modified
Applications
Application approved
Complaints
Complaint resolved
Website
Website content changed
Ye examples hain. Final event list existing modules inspect karne ke baad decide hogi.
Rule: Sirf important state changes audit karo. Har GET request ka audit mat karo, warna table kachre se bhar jayegi.
6. Conceptual data structure
{
  entityType: "RESULT",
  entityId: "...",
  action: "UPDATED",
  performedBy: "...",
  previousValue: "...",
  newValue: "...",
  createdAt: "..."
}
Ye conceptual example hai, final schema nahi. Existing audit model ho to usay extend karo.
6.1 Important rules
performedBy hamesha authenticated backend context se aaye.
Client kisi aur ki identity se audit record nahi bana sake.
Passwords, tokens aur secrets audit me kabhi store nahi honge.
Poora message content ya sensitive document content unnecessary duplicate nahi hoga.
previousValue aur newValue me sirf zaroori fields rakho.
Audit record create hone ke baad immutable ho.
7. Permissions
Role
Access
Admin
Audit logs read
Teacher
Koi general access nahi
Student
Koi access nahi
Parent
Koi access nahi
Public User
Koi access nahi
Audit collection ke liye update ya delete API banegi hi nahi.
Normal user ke API response me audit info automatically expose nahi hogi.
Central audit per-record history abhi Admin-only hai. Other role access is not implemented.
8. Workflow
Business Action (e.g. result update)
        ↓
Authentication & Permission
        ↓
Service: business data save in a transaction
        ↓
Audit record create in the same transaction
        ↓
Commit
        ↓
External notification/queue calls
        ↓
Response
Group 16 mein business write aur audit write atomic hain. Baqi modules ke liye yeh guarantee tab tak nahi hai jab tak unki pending transaction migration complete na ho.
9. API approach
GET /api/audit-logs                (filters: entityType, performedBy, action, date range)
GET /api/audit-logs/:id
GET /api/:entity/:id/history       (per-record history)
Koi public POST, PATCH ya DELETE endpoint nahi.
Audit sirf internal service ke through banega.
Pagination aur date filter mandatory.
Agent existing API naming conventions inspect karega. Ye mandatory final routes nahi hain.
10. Security requirements
Admin authorization har read par
Client-provided user ID par trust nahi
Audit records par update/delete ka koi path nahi
Sensitive fields masking
Query input validation (date, filters)
Pagination limit
Audit access ka khud bhi record (optional, policy ke mutabiq)
Scenario
Expected behavior
Non-admin audit logs maange
Reject (403)
Audit record edit karne ki koshish
Koi route nahi
Invalid date filter
Validation error
Audit write fail (Group 16)
Controlled error; business transaction rolls back
Bahut zyada records
Pagination, limit
Password audit me aa jaye
Bug, test se pakda jaye
11. Technology Decision Document
Technology
Decision
Reason
Express + MongoDB + Mongoose
Use existing
Approved stack
JWT & permission middleware
Use existing
Duplicate auth nahi
Existing audit mechanism
Reuse if possible
DRY
Redis / Kafka / Elasticsearch
Not used
Unnecessary complexity
New microservice
Not used
Modular monolith
12. Unresolved Business Policies. Agent must not invent
Bahi, ye bohat important hai. Ye rules agent khud decide nahi karega:
Kya audit read access ka bhi record rakha jaye?
Export (CSV/PDF) allowed hai?
Agar answer available nahi hai, agent question raise karega. Khud se policy create nahi karega.

Current approved behavior:
- Group 16 audit write fail ho to business transaction fail/rollback hoti hai.
- Central audit read access Admin-only hai. Teacher/actor/custom history access implement nahi karna.
- Retention/deletion/archive abhi implement nahi karna; approved future requirements section 14 mein hain.
13. Testing Strategy
Unit tests: audit record creation logic
Integration tests: Express API + MongoDB
Authorization tests: non-admin reject
Immutability tests: update/delete possible nahi
Validation tests: invalid filters aur dates
Coverage tests: har audited action par record bana
Data tests: previousValue aur newValue sahi, performedBy authenticated user
Sensitive data tests: password/token record me nahi
Failure tests: DB failure par controlled behavior
Regression tests: Group 13, 14, 16 toot to nahi gaye

14. Implementation Status, Planned Work, and Migration Boundaries

14.1 Current Group 18 implementation
- Central read APIs reuse Group 16 ke existing CommunicationAudit collection ko.
- `GET /api/v1/audit-logs` supports entity, actor, action, date filters, and cursor pagination.
- `GET /api/v1/audit-logs/:auditId` returns one audit record.
- `GET /api/v1/audit-logs/entities/:entityType/:entityId/history` returns paginated record history.
- Central list, detail, aur per-record history reads Admin-only hain.
- Audit records append-only hain: koi audit update/delete API ya service method nahi.
- Group 16 business changes aur unke audit records transaction mein commit/rollback hote hain. Notifications/queue calls transaction ke baad hoti hain.
- Audit atomicity abhi sirf Group 16 mein guaranteed hai.
- Central audit APIs ke current records Group 16 se aate hain; doosre module stores ki migration neeche pending hai.

14.2 Pending migration — separate owner-approved tasks
Existing audit/history storage ko abhi central APIs mein migrate ya duplicate-write nahi kiya gaya. In modules ko alag task aur owner approval chahiye:
- Fees/payments (Group 14)
- Results/exams (Group 13)
- Admissions
- Assignments

Un migrated module ki existing user-facing history jaisi hai waisi rahegi. Unki audit atomicity Group 18 ke is scope se guarantee nahi hoti.

14.3 Planned retention — no code in current scope
Retention policy Admin Settings se per data type configurable hogi, owner ke approved `X data type ko N saal rakho` decision ke baad. Har data type ke liye minimum retention floor hoga.
- Audit records par expiry date store nahi hogi. `retentionStartAt` closed/paid date hoga; expiry current setting se calculate hogi.
- Retention badhane se purane records bhi affect honge. Retention ghatane se pehle dry-run count, confirmation aur audit required honge.
- Optional `legalHold` record ko expiry se bachayega.
- Expiry se pehle Admin ko Group 17 ke through 30, 14, aur 3 din par batch reminders milenge; har stage sirf ek baar.
- Pehle soft delete; 30 din baad permanent delete.
- Reminder aur cleanup jobs existing BullMQ mein honge.
- Is scope mein retention settings, reminders, jobs, archive, ya delete code implement nahi hoga. `createdAt` index abhi rakha jayega.
Completion condition: Sirf API chal jana complete hone ka proof nahi. Security, immutability, testing aur existing modules ki compatibility verify honi chahiye