Group 11 — Daily Attendance Management
1. Group 11 ka Purpose

EduOS mein students ki daily school attendance accurately record karna.

Simple words mein:

“Aaj student school mein present tha ya absent?”

Example:

Student: Ali
Session: 2026–2027
Class: 9
Section: A
Date: 8 Oct 2026
Status: PRESENT
Important Decision

EduOS mein Group 11 ke andar subject-wise attendance nahi hogi.

Attendance:

Student + Academic Context + Date + Status

par based hogi.

2. Real-World Problem

School mein teacher/admin ko ye pata hona chahiye:

Aaj kaun present tha?
Aaj kaun absent tha?
Kisi student ki monthly attendance kitni hai?
Kisi student ki attendance percentage kya hai?
Kis class/section ki attendance kisi date par kya thi?
Kis teacher ne attendance mark ki?
Attendance baad mein change hui to kisne change ki?

Isliye Attendance sirf:

Student → Present/Absent

nahi hai.

Ye historical academic record hai.

3. Core Mental Model
Student Profile
      ↓
Student Enrollment
      ↓
Academic Session
      ↓
Class + Section
      ↓
Daily Attendance
      ↓
PRESENT / ABSENT / other justified status
Example
Ali
↓
Enrollment
↓
2026–2027
↓
Grade 9-A
↓
8 Oct 2026
↓
PRESENT
4. Attendance aur Student Profile Alag Kyun?

Student Profile:

“Student kaun hai?”

Attendance:

“Student kis din present/absent tha?”

Student profile mein:

currentAttendance = ...

rakhna poor design hoga.

Kyun?

Kyuki attendance:

daily change hoti hai
historical data hai
bohat zyada records generate karegi
reporting ke liye query hogi

Isliye Attendance separate domain entity/collection hogi.

5. Daily Attendance — Final Decision

EduOS mein:

✅ Daily Attendance
Ali
8 Oct
9-A
PRESENT
❌ Subject-wise Attendance
Ali
8 Oct
Math
PRESENT

nahi hogi.

Yani:

School attendance record hogi, individual subject attendance nahi.

Agar future mein institution ki requirement change ho aur subject-wise attendance genuinely required ho, tab separate enhancement ke taur par design extend kiya ja sakta hai.

6. Attendance Record — Conceptual Structure

Final schema implementation ke waqt query patterns ke according refine hoga, lekin conceptual model:

Attendance
├── studentId
├── enrollmentId
├── academicSessionId
├── classId
├── sectionId
├── date
├── status
├── markedBy
├── createdAt
└── updatedAt

Important:

subjectId nahi hoga, kyunki hum subject-wise attendance implement nahi kar rahe.

7. Enrollment ka Role

Group 10 mein Student Enrollment define hua:

Student
   ↓
Enrollment
   ↓
Academic Session
   ↓
Class
   ↓
Section

Attendance isi academic context ko use karegi.

Example:

2026–2027 → Grade 9-A

Ali ki attendance isi enrollment ke context mein record hogi.

Agle session:

2027–2028 → Grade 10-B

to purani attendance delete/overwrite nahi hogi.

8. Attendance Status

Basic requirement:

PRESENT
ABSENT

Future business requirement ke according:

LATE
LEAVE
EXCUSED

jaise statuses add kiye ja sakte hain.

Senior principle:

Jo status business requirement mein justified ho, sirf wahi add karenge.

Unnecessary statuses nahi banayenge.

9. Who Can Mark Attendance?
Teacher

Teacher authorized class/section ki attendance mark karega.

Teacher
   ↓
Assigned Class/Section
   ↓
Daily Attendance
Admin

Institution policy ke according attendance manage/correct kar sakta hai.

Student

Student:

View → Yes
Mark → No
Parent

Parent:

Apne linked child ki attendance → View
Attendance mark → No

Yahan Group 5 ke relationships aur authorization policies use hongi.

10. Authentication → Permission → Context

Attendance marking ke waqt:

Authentication

Tum kaun ho?

JWT se authenticated user.

Permission

Kya tum attendance mark kar sakte ho?

Example:

ATTENDANCE_MARK
Context / Ownership

Kya tum is specific class/section ki attendance mark kar sakte ho?

Ye sabse important hai.

Teacher A ko sirf isliye har class ki attendance nahi mil jati kyunki woh Teacher hai.

Uski actual assignment check hogi.

11. Attendance Marking Flow
Client
 ↓
Route
 ↓
Authentication Middleware
 ↓
Permission Middleware
 ↓
Validation
 ↓
Controller
 ↓
Attendance Service
 ↓
Policy / Relationship Check
 ↓
Repository
 ↓
MongoDB

Backend verify karega:

User authenticated hai?
Teacher/admin authorized hai?
Student exist karta hai?
Student valid enrollment mein hai?
Session correct hai?
Class/section correct hai?
Attendance duplicate to nahi?
Business rules valid hain?

Phir record save hoga.

12. Duplicate Attendance — Very Important

Suppose:

Ali
8 Oct
9-A
PRESENT

already exist karta hai.

Teacher dobara same attendance submit kare:

Ali
8 Oct
9-A
PRESENT

To duplicate record create nahi hona chahiye.

Senior Approach

Sirf application-level:

"pehle check karo record hai ya nahi"

par depend nahi karenge.

Race condition possible hai.

Isliye database-level uniqueness/index strategy bhi use karenge.

13. Indexing — Required ✅

Haan bahi, Attendance mein indexing zaroori hai.

Reason:

Attendance rapidly grow karegi.

Example:

1000 students
×
200 school days
=
200,000 records / year

Aur multiple academic sessions ke baad dataset aur bada hoga.

Without indexes:

Query
 ↓
Large collection scan
 ↓
Slow

With correct indexes:

Query
 ↓
Index
 ↓
Relevant records
 ↓
Faster lookup
Important Senior Rule

Random indexes nahi banayenge. Actual query patterns ke according indexes design karenge.

Likely queries:

Student + Session + Date
Section + Date
Class + Section + Date
Date Range + Student

Exact indexes implementation aur real query analysis ke baad finalize honge.

14. Attendance Percentage

Example:

Total school days = 20
Present = 18

Formula:

18 / 20 × 100
= 90%

Attendance percentage ko automatically har attendance write par permanently store karna required nahi.

Initially aggregation/query se calculate kar sakte hain.

Agar future mein performance issue aaye:

Aggregation
↓
Performance analysis
↓
Caching / summary optimization

consider ki ja sakti hai.

15. Attendance History

Attendance historical record hai.

Example:

2026–2027
Grade 9-A
↓
Attendance History

Next year:

2027–2028
Grade 10-B
↓
New Attendance Context

Purani attendance preserve rahegi.

Rule

Historical attendance ko casually hard-delete nahi karna.

16. Attendance Correction

Teacher se mistake ho sakti hai:

ABSENT

jab student actually present tha.

System requirement ke according correction allowed ho sakti hai.

Lekin:

Har user ko har purani attendance freely modify nahi karni.

Possible rules:

teacher limited correction
admin correction
correction window
old attendance lock
audit information

Ye actual institution requirement ke according finalize hoga.

17. Auditability

Attendance important academic data hai.

Agar record change hua:

ABSENT → PRESENT

to system ko at least ye pata hona useful hai:

updatedBy
updatedAt

Agar institution ko complete change history chahiye, detailed audit mechanism later add ho sakta hai.

18. MongoDB Design

Attendance ko Student document ke andar embed karna:

Student
 └── attendance[]

large system ke liye suitable nahi.

Better:

Student Collection
        +
Enrollment Collection
        +
Attendance Collection

Attendance independent collection hogi.

Reason:

high volume
independent queries
date filtering
reporting
pagination
indexing
historical data
19. Technology Decision
MongoDB + Mongoose

Current EduOS architecture ke saath consistent.

Decision: Use.

PostgreSQL

Strong relational alternative hai, lekin current project ko migrate karna unnecessary complexity create karega.

Decision: Not used.

Redis

Basic attendance CRUD ke liye required nahi.

Future high-read/caching requirement par consider hoga.

Decision: Not used initially.

BullMQ / Events

Basic attendance save ke liye required nahi.

Future:

Attendance Marked
      ↓
Event
      ↓
Notification

jaisi async requirement aaye to use hoga.

Decision: Later, requirement-driven.

20. API Design

Conceptually:

POST   /attendance
GET    /attendance
GET    /attendance/:id
PATCH  /attendance/:id

Student-specific:

GET /attendance/student/:studentId

Section/date based queries bhi API requirement ke according expose hongi.

Important:

API sirf CRUD nahi; actual use-cases, authorization aur query patterns ke according design hogi.

21. Validation

Attendance request validate hogi:

studentId
enrollmentId
date
status
session
class
section
required fields
valid references
duplicate context

Invalid status:

status: "HELLO"

reject.

Invalid student/session/section relationship bhi reject.

22. Business Rules

Group 11 ke important rules:

Student valid enrollment mein hona chahiye.
Attendance correct academic session se linked honi chahiye.
Class/section enrollment se consistent honi chahiye.
Same attendance context mein duplicate record nahi.
Teacher sirf authorized class/section ki attendance mark kare.
Student attendance mark nahi karega.
Parent apne authorized child ki attendance dekhega.
Historical attendance casually delete nahi hogi.
Attendance correction controlled hogi.
Database integrity ke liye appropriate unique/index strategy use hogi.
23. Performance

Large school mein attendance data huge ho sakta hai.

Isliye:

✓ Indexing
✓ Pagination
✓ Date filtering
✓ Session filtering
✓ Section filtering
✓ Efficient queries
✓ Aggregation for summaries

use honge.

Aur:

Ek API response mein thousands/millions of attendance records blindly return nahi karenge.

24. Testing
Functional
Mark Present
Mark Absent
View Attendance
Update Attendance
View Student Attendance
Attendance Summary
Authorization
Student cannot mark
Parent cannot mark
Unauthorized teacher cannot mark
Teacher cannot access unrelated section
Validation
Invalid student
Invalid enrollment
Invalid date
Invalid status
Missing fields
Integrity
Duplicate attendance rejected
Wrong section rejected
Wrong session rejected
Student without valid enrollment rejected
Edge Cases
Duplicate request
Correction
Old session
Student transfer
Large date range
25. Implementation Prerequisites

Group 11 implement karne se pehle:

✓ Authentication
✓ Authorization
✓ User/Profile
✓ Student
✓ Teacher
✓ Dynamic Relationships
✓ MongoDB Architecture
✓ Academic Session
✓ Class
✓ Section
✓ Student Enrollment
✓ Teacher Assignment
✓ REST API
✓ Validation
✓ Error Handling

ready hone chahiye.

Especially:

Enrollment + Teacher Assignment Group 11 ke liye critical dependencies hain.

26. Group 11 mein Kya Nahi Aayega

Abhi:

❌ Subject-wise Attendance
❌ Assignments
❌ Examination
❌ Results
❌ Fees
❌ Notifications
❌ Redis
❌ BullMQ
❌ WebSockets
❌ AI

nahi implement karenge.

27. Group 11 Output

Group complete hone ke baad:

Daily Attendance Domain
        ↓
Attendance Model
        ↓
Daily Attendance APIs
        ↓
Validation
        ↓
Authorization
        ↓
Teacher Attendance Marking
        ↓
Student/Parent Viewing
        ↓
Attendance History
        ↓
Duplicate Protection
        ↓
Database Indexing
        ↓
Attendance Summary Foundation
        ↓
Tests
Final Group 11 Mental Model

Student Profile = student kaun hai
Enrollment = student kis session/class/section mein hai
Teacher Assignment = teacher kis class/section ka responsible hai
Daily Attendance = kis date ko student PRESENT/ABSENT tha

Final decision:
Daily attendance ✅ | Subject-wise attendance ❌ | Indexing ✅ | Historical records ✅ | Context-based authorization ✅

---

# Group 11 Implementation Decisions

This section records the implementation in this backend and clarifies decisions that were previously left conceptual. The implementation remains limited to daily student attendance; it does not add subject attendance or a separate reporting platform.

## 28. Actual Backend Placement

No new top-level backend folder was necessary. The existing backend layout already defines `models/attendance/`, `services/attendance/`, role authorization, and admin attendance routes.

```text
backend/
├── models/attendance/Attendance.js
├── services/attendance/attendance.service.js
├── validators/attendance/attendance.validator.js
├── controllers/attendance.controller.js
├── routes/attendance.routes.js
├── routes/admin/attendance.routes.js
├── utils/attendanceDate.js
└── tests/attendance.test.js
```

The service uses the existing Group 10 `AcademicSession`, `Class`, `Section`, and Group 6 `StudentEnrollment` / `TeacherAssignment` models. Parent visibility uses the existing `ParentStudent` relationship. It does not create parallel enrollment or permission systems.

## 29. Persisted Attendance Record

Each record contains:

- `studentUserId`, derived from the referenced enrollment, never accepted from the client
- `enrollmentId`, `academicSessionId`, `classId`, and `sectionId`
- `attendanceDate` as an ISO calendar-date string (`YYYY-MM-DD`)
- `status`, limited to `PRESENT` or `ABSENT`
- `markedBy`, `updatedBy`, and the latest correction timestamp/reason

The record intentionally has no `subjectId`. Academic context is copied from the validated enrollment/context to support attendance-by-section and student-history query patterns; those values are not client-authoritative.

## 30. Calendar Date and Time Zone

Requests use a calendar date (`YYYY-MM-DD`), not an arbitrary client timestamp. `ACADEMIC_TIME_ZONE` defines the institution’s IANA time zone and defaults to `UTC`; deployments should set it to the school’s actual zone. The backend converts that local day into its correct UTC interval when checking enrollment/teacher-assignment validity, including daylight-saving day-length changes.

The academic session still supplies the allowed date range. A separate school calendar/holiday model is not part of this group, so the API does not infer weekends, holidays, or school closure days. Those dates must be governed by a later calendar requirement rather than guessed here.

## 31. Marking Contract and Integrity

Marking is a section-level batch operation because attendance is normally taken for a roster. A request contains a session, class, date, section from the URL, and one or more `{ enrollmentId, status }` entries. The server checks that:

1. Session, class, and section exist, are active, and match; the date falls within the session.
2. Each enrollment belongs to the exact session/class/section and was valid on that date.
3. A teacher has a matching assignment for that section and date; an admin may manage the institution’s records.
4. No enrollment/date attendance already exists.

The batch is persisted in a MongoDB transaction, and a unique index on `(enrollmentId, attendanceDate)` is the concurrency-safe duplicate guard. This requires MongoDB Atlas or another replica-set deployment that supports transactions; a standalone MongoDB server cannot run this write path. If any entry is invalid or already recorded, the batch fails rather than recording only part of the submitted roster. Omitted enrollments are not silently marked absent; absence must be explicit in the request.

## 32. Corrections and Read Access

New marks require `ATTENDANCE_MARK` and the actor must be an admin or the teacher assigned to that academic section. Students cannot mark attendance. Corrections use a separate `ATTENDANCE_CORRECT` permission granted only to admins, and require a reason. `markedBy` remains the original marker while `updatedBy`, `correctedAt`, and `lastCorrectionReason` identify the latest correction.

This stores the latest correction metadata, not an unlimited event-by-event audit ledger. A full audit ledger should only be added if the institution’s audit requirement calls for it; it should use the project’s audit boundary rather than embedding an unbounded array in each attendance document.

Student history is restricted to the authenticated student. A parent must have an active ParentStudent link to view that child. Teachers can view a section/date only when their assignment covers that context. Admin access remains permission-gated.

## 33. Implemented HTTP Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/attendance/sections/:sectionId/mark` | Admin or assigned teacher with `ATTENDANCE_MARK` | Atomically record a section’s explicit daily statuses |
| `GET` | `/api/v1/attendance/sections/:sectionId?academicSessionId=...&classId=...&attendanceDate=YYYY-MM-DD` | Admin or assigned teacher with `ATTENDANCE_VIEW` | Read section attendance for one day |
| `GET` | `/api/v1/attendance/students/:studentUserId` | Admin, that student, or an actively linked parent with `ATTENDANCE_VIEW` | Paginated student history with optional session/date filters |
| `PATCH` | `/api/v1/admin/attendance/:recordId` | Admin with `ATTENDANCE_CORRECT` | Correct status with a required reason |

List endpoints are bounded to at most 100 records per page and use opaque keyset cursors. Error responses follow the existing Group 8 contract.

## 34. Group 11 Verification Boundary

Automated tests cover date/time-zone boundaries, strict validation, enrollment-to-academic-context matching, batch atomicity, duplicate prevention, teacher assignment checks, parent/student access, correction authorization/audit metadata, indexes, and HTTP middleware behavior. Run the complete suite with `npm test` from `backend/`.

Successful writes against the real database still require manual API verification using an ADMIN token and the previously created Group 10 session/class/section plus active enrollments. Run those API checks one at a time and confirm the returned status/body before moving to the next. Teacher success flows also require a valid teacher assignment. Tests using a synthetic token verify middleware only; they do not prove live database writes.

## 35. Explicitly Out of Scope

This group does not add attendance percentages/summary caches, leave approval, holidays, school-day calendars, notifications, subject attendance, timetable periods, promotion, or a full audit-event service. Attendance percentages can be computed from persisted daily records when a later reporting requirement defines the denominator (school days and exclusions); storing a precomputed percentage now would risk incorrect results.