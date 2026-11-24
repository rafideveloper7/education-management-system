Group 20
EduOS: Timetable Management
Final Engineering Specification & AI Coding Agent Instructions
Project: EduOS, Education Management System
Module: Timetable Management
Backend: Node.js + Express.js
Database: MongoDB Atlas + Mongoose
Frontend: Next.js
Architecture: Modular Monolith
Scope: Single educational institute
1. AI Coding Agent ke liye sab se zaroori instructions
1.1 Tumhara role
Tum EduOS me Senior Backend Engineer, Software Architect, Security Reviewer aur QA Engineer ki tarah kaam karoge. Timetable me asli challenge conflicts hain (ek teacher do jagah, ek class do subjects), aur ye checks race conditions ke saath bhi sahi chalne chahiye.
1.2 Pehle existing project samjho
Abhi koi code create, delete ya modify nahi karna. Pehle sirf inspect karo.
Folder structure aur layer conventions
Academic structure models: session, class, section, subject
Teacher assignment model: kaun si teacher kis subject ko kis class/section ko padhati hai (timetable isi par based hoga)
Kya timetable, period, room ya schedule ka koi model/code pehle se maujood hai (Group 11 attendance, exams, calendar me bhi dekho)
Time slots/periods, working days aur weekends kahan define hain ya hardcoded hain
Auth, permission aur ownership middleware, permission constants
Parent-student aur teacher-class relationships
Module 1 (Audit) aur Module 2 (Settings) ki services
Group 17 notification integration
Error handling, response format, existing tests
1.3 Reuse-First rule: pehle dhundo, phir pooch lo
Step 1: Search karo. Dekho ki timetable ka koi hissa pehle se kisi module me to nahi. Naam se nahi, behavior se dhundo. Jaise attendance ya exam schedule me periods ya time slots pehle se bane ho sakte hain.
Step 2: Kuch mile to STOP.
Existing implementation mili hai:
- Kahan: <file paths>
- Ye kya karta hai: <summary>
- Kaun use karta hai: <dependent modules>
- Is document se overlap/farq: <details>

Options:
A) Reuse   B) Extend   C) Naya banao + existing migrate
D) Naya banao + existing chhod do (duplicate ka risk)

Meri recommendation: <option aur wajah>
Tumhara faisla chahiye. Intezar kar raha hoon.
Step 3: Faisle ke baghair aage mat badho.
Rules: existing module chupke se replace/delete nahi, dependent code break nahi, overlap clear na ho to bhi poochho.
1.4 Non-negotiable rules
Naya folder, database, framework ya duplicate auth nahi (bina approval).
Teacher-subject-class ka relation duplicate nahi. Timetable existing academic assignments se padhega, apni alag copy nahi banayega.
Existing modules (attendance, exams) ka behavior silently change nahi.
Business policy khud invent nahi karni.
Test evidence ke baghair "complete" ya "production ready" nahi.
Section 1.3 har naye model/service/route se pehle lagu hai.
2. Existing architecture
Client → Route → Middleware → Controller → Service
       → Policy / Repository → Model → MongoDB Atlas
Layer
Timetable me responsibility
Route
Timetable endpoints
Middleware
Auth, permission, validation
Controller
Request/response
Service
Conflict rules, validation, publish, audit call
Policy
Kaun kiski timetable dekh sakta hai
Model
Timetable entries schema aur unique indexes
Database
Permanent storage
Boundaries:
Frontend conflict check ka trusted source nahi. Backend aur database dono check karein.
Controller me conflict logic jama mat karo.
Calendar, holidays aur exam dates Module 5 ka kaam hain, yahan duplicate mat karo.
3. Module ka purpose
Institute ke haftawar class schedule ko manage karna: kis class ko kis din, kis period me, kaun teacher, kaun sa subject aur kaun sa room.
Analogy: Timetable ek railway schedule jaisa hai. Ek hi plateform par ek waqt me do trains nahi aa sakti, aur ek hi driver ek waqt me do trains nahi chala sakta. Yehi conflict checks hain.
Role
Kya dekhta hai
Admin
Poora institute (create, edit, publish)
Teacher
Sirf apni timetable
Student
Apni class/section ki timetable
Parent
Linked child ki timetable
4. Core engineering principles
4.1 SRP: Timetable service schedule ke rules manage kare. Attendance marking, exam scheduling aur holidays alag modules ke kaam hain.
4.2 DRY: Conflict check ka logic ek jagah. Create, update aur bulk import teeno wahi use karein.
4.3 KISS: Pehle simple weekly recurring timetable. Rotating schedules, multi-week cycles aur auto-generation abhi nahi.
4.4 YAGNI: AI/auto timetable generator, drag-and-drop optimizer, Redis cache abhi nahi. Auto-generation ek alag badi requirement hai, tab banayenge jab approve ho.
4.5 Security by Design: Har read/write par pucho: user authenticated hai? Permission hai? Ye timetable is user ki hai? Teacher ya class valid hai? Audit hoga?
4.6 Fail Safely: Conflict ho to save reject ho, adha schedule na bane. Concurrent requests me bhi double-booking na ho.
5. Timetable ke concepts
5.1 Period (time slot)
Din ke kaun se hisse hain: Period 1 (8:00-8:40), Period 2 (8:40-9:20), break, aur isi tarah.
Overlap warning: Periods ki definition Module 2 (Settings) me hogi ya yahan, ye Reuse-First se decide hoga. Alag alag copies nahi.
5.2 Timetable entry
TimetableEntry:
{
  academicSessionId: "...",
  classId: "...",
  sectionId: "...",
  subjectId: "...",
  teacherId: "...",
  roomId: "...",        // optional, jahan applicable
  day: "MONDAY",
  periodId: "...",
  status: "DRAFT",      // DRAFT / PUBLISHED
  createdBy: "...",
  updatedAt: "..."
}
Ye conceptual hai, final schema nahi. Existing model ho to Reuse-First (1.3) lagu hoga.
5.3 Room (agar applicable)
Class room, lab, hall. Room tab model banao jab institute ko room-conflict check chahiye. Warna pehle sirf text/optional reference.
6. Business rules
6.1 Teen conflict rules (sabse zaroori)
Ek hi session aur din aur period me:
Conflict
Rule
Teacher
Ek teacher ek waqt me do jagah nahi
Class/Section
Ek section ke ek period me sirf ek entry
Room
Ek room ek waqt me do classes ko nahi (jab room use ho)
Dry run:
Entry
Teacher
Class
Din/Period
Result
1
Ms. Sara
8-A
Mon P1
Save
2
Ms. Sara
8-B
Mon P1
Reject (teacher double-booked)
3
Mr. Ali
8-A
Mon P1
Reject (section double-booked)
4
Ms. Sara
8-B
Mon P2
Save
6.2 Teacher assignment validate karo
Teacher ko us subject aur class ko padhane ke liye pehle se assigned hona chahiye (spec sec 7). Agar nahi, timetable me nahi daal sakte. Ye relation academic assignments se aaye, yahan nayi copy nahi.
6.3 Race condition
Do Admins ek hi second me same teacher ko same slot par daalein to dono "conflict nahi" dekh sakte hain. Sirf code check kaafi nahi. Database level unique index bhi ho (teacher + session + din + period, section + session + din + period, aur room ke liye bhi). Duplicate-key error ko clear conflict message me convert karo.
6.4 Session-scoped
Timetable academic session ke saath bandhi hai. Session badalne par purani timetable archive/readable rahe, naye session ki alag.
6.5 Draft aur published
DRAFT: sirf Admin dekhta hai, kaam chal raha hai.
PUBLISHED: teacher/student/parent dekh sakte hain.
Published timetable me change ho to wo audit aur notification ka event hai.
6.6 Historical data silently na badle
Timetable badalne se purani attendance records aur purane reports ko dobara calculate nahi karna. Change sirf aage ke dino par lagu ho, jab tak explicit rule na ho.
6.7 Leave, holiday aur substitution
Holiday Module 5 (Calendar) ka kaam hai. Teacher ki leave par substitute lagana ek alag workflow hai. Dono yahan khud se mat banao, policy ka sawal hai (section 14).
7. Workflow
Admin Request
     ↓
Authentication & Permission
     ↓
Validation (session, class, subject, period valid)
     ↓
Teacher-assignment check
     ↓
Conflict check (teacher, section, room)
     ↓
Save (DB unique index backup)
     ↓
Audit record (Module 1)
     ↓
Publish → Notification event (Group 17, commit ke baad)
Notification fail hone se timetable save/publish fail nahi hoga.
8. Permissions
Role
Access
Admin
Create, edit, publish, view all (permission ke mutabiq)
Teacher
Sirf apni published timetable
Student
Sirf apni class/section ki published timetable
Parent
Sirf linked child ki published timetable
Public User
Koi access nahi
Backend identity authenticated token se le, client ke bheje teacherId ya studentId par trust nahi.
Dry run: Student A ne request me Student B ki class ka ID daala. Policy check fail, reject.
Draft timetable Admin ke ilawa kisi ko nahi dikhegi.
9. API approach
GET    /api/timetable/class/:classId/section/:sectionId   (Admin, published for students)
GET    /api/timetable/teacher/:teacherId                  (Admin, ya khud teacher)
GET    /api/timetable/me                                  (teacher/student ki apni)
GET    /api/timetable/child/:studentId                    (parent, linked child)
POST   /api/timetable/entries
PATCH  /api/timetable/entries/:id
DELETE /api/timetable/entries/:id                         (policy ke mutabiq)
PATCH  /api/timetable/publish
Existing naming conventions inspect karo. Ye final routes mandatory nahi.
10. SOLID Principles: Timetable me practical use
S: Single Responsibility. Conflict detection, entry CRUD aur view-building alag responsibilities hain. Conflict logic ek focused hissa ho, controller me nahi.
O: Open/Closed. Naya conflict rule add karna ho (jaise "lab period do din lagatar nahi") to existing rules edit kiye baghair add ho sake. Rules ki ek list ho, lambe if chain nahi. Ye tab banao jab 4-5 rules ho jayein, pehle din se nahi.
L: Liskov Substitution. Sab conflict rules ek jaisi shape rakhein (entry lo, conflict ya none do). Koi rule exception phenk kar contract na toray.
I: Interface Segregation. Teacher ko sirf "meri timetable" chahiye, Admin ko poora management. Group 11 ko agar timetable chahiye to sirf chhota read-only method, poora service nahi.
D: Dependency Inversion. Doosre modules timetable ke database format par nahi, timetable service ke method par depend karein. Kal storage badle to sirf timetable service badle.
Senior advice: SOLID ka matlab har cheez ke liye 10 interfaces nahi. Faida na ho to abstraction mat banao.
11. Security requirements
Backend authorization har read/write par
Ownership: teacher apni, student apni class, parent apna child
Draft vs published visibility
Request validation (valid IDs, din, period)
Concurrent conflict protection (DB unique index)
Timetable changes ka audit
Client-provided user ID par trust nahi
Scenario
Expected behavior
Teacher double-booked
Reject, clear message
Section double-booked
Reject
Teacher us subject/class ke liye assigned nahi
Reject
Student dusri class ki timetable maange
Reject
Parent kisi aur ke bachche ki timetable
Reject
Draft timetable teacher/student maange
Reject
Do Admins same slot ek saath
Ek save, ek conflict error
Invalid din/period
Validation error
DB failure
Controlled error
Notification fail
Timetable publish committed rahe
12. Technology Decision Document
Technology
Decision
Reason
Express, MongoDB, Mongoose, JWT
Use existing
Approved stack
Module 1 audit, Module 2 settings
Reuse
DRY
Group 17 notifications
Reuse
Naya engine nahi
MongoDB unique/compound indexes
Use
Race-condition protection
Auto timetable generator
Not now
Alag badi requirement
Redis cache
Not used
Data chhota hai, zarorat nahi
Microservice
Not used
Modular monolith
13. Reuse aur overlap ki khaas jagahen
Area
Khatra
Teacher assignment (class-subject-teacher)
Duplicate copy na banao, existing se padho
Periods/time slots
Settings aur timetable me do copies na ho
Attendance (Group 11)
Agar wo period-wise hai, to timetable se integration policy ka sawal hai, abhi koi change nahi
Exam schedule
Alag cheez hai, timetable me mat milao
Calendar/holidays
Module 5
14. Unresolved Business Policies. Agent must not invent
Structure
Hafte ke kitne din working hain, aur kaun se?
Periods ki tadaad aur timing (kya sab classes ke liye ek jaisi)?
Break aur assembly timetable me dikhane hain?
Rules
Teacher ke din me maximum periods?
Kya ek subject ke din me ek se zyada periods allowed hain?
Rooms track karne hain? Lab aur hall ke special rules?
Teacher ke bina subject-assignment ke koi exception?
Changes
Published timetable edit kaun kar sakta hai?
Teacher ki leave par substitute kaun lagayega, aur kaise?
Temporary change (ek din ke liye) ka process?
Published change par kinko notification jaye?
Lifecycle
Purani timetable kitni der preserve hogi (retention, abhi implement nahi)?
Kya teacher ya student timetable download/print kar sakta hai?
Agar answer nahi hai, agent question raise karega. Khud policy create nahi karega. Existing module mile to bhi pehle poochho (1.3).
15. Testing Strategy
Unit tests: conflict rules (teacher, section, room)
Integration tests: Express API + MongoDB
Authorization tests: har role ke allowed/denied cases
Ownership tests: wrong student, wrong child, wrong teacher
Assignment tests: unassigned teacher reject
Concurrency test: do requests ek saath same slot par, sirf ek success
Draft/publish visibility tests
Validation tests: invalid din, period, session
Audit tests: har change ka record
Notification tests: publish event, aur fail hone par save intact
Regression tests: attendance, exams, academic structure toote nahi
Conflict check: koi duplicate timetable/period model to nahi bana
Completion condition: API chal jana kaafi nahi. Conflict rules, concurrency safety, access control aur existing modules ki compatibility verify ho.
16. Agent ke liye pehla task (read-only)
Role: Senior Backend Engineer, Architect, Security Reviewer.
Abhi koi code create, delete ya modify nahi karna.
Package install ya script run nahi karni.

REUSE-FIRST RULE:
Naya kuch banane se pehle check karo ki ye kaam pehle se kisi module
me ho raha hai (naam aur behavior dono se). Mile to STOP, report karo
(kahan, kya karta hai, kaun use karta hai, overlap, options A/B/C/D,
recommendation) aur mera faisla maango. Chupke se replace/delete nahi.

Inspect karo:
1. Timetable, period, room ya schedule ka koi model/code pehle se hai?
   (attendance, exams, calendar me bhi dekho)
2. Academic structure: session, class, section, subject models.
3. Teacher assignment model (teacher-subject-class). File paths ke saath.
4. Periods, working days kahan define ya hardcoded hain?
5. Parent-student aur teacher-class relationships.
6. Admin permission middleware, constants, ownership middleware.
7. Module 1 audit, Module 2 settings, Group 17 notification reuse.
8. Existing tests.

Report format:
- Already exists (file paths ke saath)
- Overlaps / possible conflicts (A/B/C/D options ke saath)
- Missing
- Conflicts with this document
- Security risks
- Questions for owner

Evidence ke baghair "complete" mat likho.
Business policy khud invent mat karo.
Ab Module 5 (Academic Calendar & Events) isi style me banau?

17. Implementation Status and Blocked Policies

17.1 Reuse decision
- Existing TeacherAssignment, StudentEnrollment, ParentStudent, academic models, Module 1 audit, aur Group 17 notification infrastructure reuse hue.
- ExamSchedule ko TimetableEntry se merge/migrate nahi kiya; exam schedules separate rahenge.
- No Period, WorkingDay, Calendar, Room, or Settings model was created.

17.2 Implemented approved independent scope
- TimetableEntry: DRAFT -> PUBLISHED -> ARCHIVED; no permanent delete.
- Admin create/edit/publish/archive APIs.
- Teacher, Student, Parent read ownership checks.
- Teacher/section compound unique indexes exclude ARCHIVED entries.
- Published create/publish/update/archive audit events reuse Module 1.
- Published publish/update/archive notifications reuse Group 17 publishSafe.
- Notification failure never rolls back a committed timetable change.

17.3 Explicit blockers
- Working days, periods, breaks, and period timing require an approved source/policy.
- Room allocation and room conflict require a separate approved room policy; no room conflict implemented.
- Effective-date behavior for published edits requires separate approval.
- Retention and historical timetable deletion/archival retention remain pending.

17.4 Verification
- MongoDB was verified as a replica set with working transaction support.
- No existing timetableentries collection records were found during the read-only compatibility check.
- No write was performed during the database compatibility check.