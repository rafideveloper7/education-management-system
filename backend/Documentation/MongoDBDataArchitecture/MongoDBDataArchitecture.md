# EduOS — Group 6: MongoDB Data Architecture

## 1. Objective

Group 4 ne authentication aur role model ko define kiya; Group 5 ne dynamic relationships ko define kiya. Group 6 ka core question hai:

- Ye data MongoDB mein kaise store hoga?
- Kis collection mein kon sa fact rakha jayega?
- Kaun si relationship reference hogi aur kaun si embedded?
- Business lifecycle ko history ke saath kaise represent karna hai?
- Query patterns, indexes, data integrity aur performance kaise maintain rakhi jayengi?

Yeh architecture project ke actual backend models, services aur folder structure ke saath aligned hai.

---

## 2. Design Principles

Senior backend architecture ke hisaab se humne following principles adopt kiye hain:

1. Identity aur domain data separate rakhenge.
   - `User` model authentication/account ka source of truth hai.
   - Academic/role-specific records alag collections mein honge.

2. Relationship ko historical fact ke taur par model karenge.
   - `status` + `validFrom` + `validTo` ke saath lifecycle manage hoga.
   - Hard delete avoid karna chahiye.

3. Reference-based modeling prefer karenge jab relationship dynamic ho.
   - Example: `ParentStudent`, `StudentEnrollment`, `TeacherAssignment`

4. Embedding sirf tabhi karenge jab data small, tightly coupled aur low-lifecycle ho.
   - Example: nested contact info, settings, profile summary

5. Query patterns ke hisaab se indexes define karenge.
   - Unique active record constraints important hain.

6. Data correctness aur maintainability priority rakhenge.
   - Business rules validation and uniqueness constraints project ke models mein implement hain.

---

## 3. Current Project Alignment

Current backend structure already reflects this architecture:

- `backend/models/user/User.js` for account data
- `backend/models/parent/ParentStudent.js` for parent/student relationships
- `backend/models/student/StudentEnrollment.js` for student-to-class/session enrollment
- `backend/models/teacher/TeacherAssignment.js` for teacher-to-subject/class assignment
- `backend/services/relationship.service.js` for relationship lifecycle operations

This means database design is not random; it is intentionally built around role-based identity and dynamic enrollment/relationship records.

---

## 4. High-Level Data Model

EduOS MongoDB database architecture conceptually is:

```text
MongoDB Atlas
  └── EduOS
      ├── users
      ├── parentStudents
      ├── studentEnrollments
      ├── teacherAssignments
      ├── academicSessions
      ├── classes
      ├── sections
      ├── subjects
      ├── attendance
      ├── assignments
      ├── exams
      ├── results
      ├── fees
      ├── notices
      ├── notifications
      ├── documents
      └── auditLogs
```

Important point:

- `users` is the account layer.
- Academic and relationship data use separate collections.
- Each collection stores a specific fact or entity, not mixed domain records.

---

## 5. Why One Big Collection is a Bad Design

Ek single `users` ya `records` collection mein sab kuch daal dena bad design hai because:

- data growth unbounded ho jayega
- queries expensive honge
- relationship records conflict kar sakte hain
- validation logic complex ho jayega
- audit/history maintain karna mushkil ho jayega
- different domains ka lifecycle different hota hai

Example of wrong model:

```json
{
  "_id": "...",
  "fullName": "Ali",
  "role": "STUDENT",
  "parentData": { ... },
  "enrollmentData": { ... },
  "attendance": [ ... ],
  "results": [ ... ],
  "fees": [ ... ],
  "notifications": [ ... ]
}
```

Yeh pattern scalable nahi hai. Institutional systems ke liye data should be decomposed by business fact.

---

## 6. Identity Layer: Users

### User model
`User` model is the single identity/account layer for all people in the system.

```js
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'PUBLIC_USER'],
    required: true,
    default: 'PUBLIC_USER',
    index: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'DISABLED'],
    required: true,
    default: 'ACTIVE',
    index: true,
  },
}, { timestamps: true });
```

### Why this is correct

- `User` is the login/authentication root.
- `role` decides app permission and access context.
- `status` decides active/inactive state.
- Different domain entities refer to the same user via `ObjectId`.

### Important rule

User is not the same as student profile, teacher profile, or parent profile. These are separate dynamically related business entities.

---

## 7. Relationship Layer: ParentStudent

Parent-student relationship dynamic hai. Isliye yeh ek separate collection mein model hota hai.

### Schema concept

```js
const parentStudentSchema = new mongoose.Schema({
  parentUserId: { type: ObjectId, ref: 'User', required: true },
  studentUserId: { type: ObjectId, ref: 'User', required: true },
  relationshipType: {
    type: String,
    enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER'],
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ENDED', 'DECEASED'],
    required: true,
    default: 'ACTIVE',
  },
  validFrom: { type: Date, required: true, default: Date.now },
  validTo: { type: Date, default: null },
  notes: { type: String, maxlength: 500 },
}, { timestamps: true });
```

### Example document

```json
{
  "_id": "64a2d1d8f5b7c9a1234567ab",
  "parentUserId": "64a2d1d8f5b7c9a123456700",
  "studentUserId": "64a2d1d8f5b7c9a123456701",
  "relationshipType": "FATHER",
  "status": "ACTIVE",
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validTo": null,
  "notes": "Primary guardian",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Why this is the right pattern

- Parent-child relationship ek stateful business fact hai.
- Same student may have multiple active relationships.
- Relationship may end in future, so `END` or `validTo` is needed.
- Unique active index prevents duplicates.

### Important indexes

```js
parentStudentSchema.index(
  { parentUserId: 1, studentUserId: 1, relationshipType: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
```

This ensures one active relationship type between same parent and student cannot be duplicated.

---

## 8. Academic Lifecycle: StudentEnrollment

Student enrollment defines that a student is enrolled in a class/section for an academic session.

### Schema concept

```js
const studentEnrollmentSchema = new mongoose.Schema({
  studentUserId: { type: ObjectId, ref: 'User', required: true },
  academicSessionId: { type: ObjectId, ref: 'AcademicSession', required: true },
  classId: { type: ObjectId, ref: 'Class', required: true },
  sectionId: { type: ObjectId, ref: 'Section', required: true },
  rollNumber: { type: String, maxlength: 30 },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'ENDED', 'SUSPENDED'],
    required: true,
    default: 'ACTIVE',
  },
  validFrom: { type: Date, required: true, default: Date.now },
  validTo: { type: Date, default: null },
}, { timestamps: true });
```

### Example document

```json
{
  "_id": "64a2d1d8f5b7c9a1234567ac",
  "studentUserId": "64a2d1d8f5b7c9a123456701",
  "academicSessionId": "64a2d1d8f5b7c9a123456710",
  "classId": "64a2d1d8f5b7c9a123456720",
  "sectionId": "64a2d1d8f5b7c9a123456730",
  "rollNumber": "07",
  "status": "ACTIVE",
  "validFrom": "2025-04-01T00:00:00.000Z",
  "validTo": null,
  "createdAt": "2025-04-01T00:00:00.000Z",
  "updatedAt": "2025-04-01T00:00:00.000Z"
}
```

### Why this is correct

A student can be in one active enrollment for a given academic session. Next year, a new enrollment record is created. This preserves historical academic records.

### Important constraints

```js
studentEnrollmentSchema.index(
  { studentUserId: 1, academicSessionId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
```

This ensures same student cannot have duplicate active enrollment in same session.

---

## 9. Teaching Assignment: TeacherAssignment

Teacher assignment is also a lifecycle record, not a static property.

### Schema concept

```js
const teacherAssignmentSchema = new mongoose.Schema({
  teacherUserId: { type: ObjectId, ref: 'User', required: true },
  academicSessionId: { type: ObjectId, ref: 'AcademicSession', required: true },
  subjectId: { type: ObjectId, ref: 'Subject', required: true },
  classId: { type: ObjectId, ref: 'Class', required: true },
  sectionId: { type: ObjectId, ref: 'Section', required: true },
  status: {
    type: String,
    enum: ['ACTIVE', 'ENDED', 'CANCELLED'],
    required: true,
    default: 'ACTIVE',
  },
  validFrom: { type: Date, required: true, default: Date.now },
  validTo: { type: Date, default: null },
}, { timestamps: true });
```

### Example document

```json
{
  "_id": "64a2d1d8f5b7c9a1234567ad",
  "teacherUserId": "64a2d1d8f5b7c9a123456702",
  "academicSessionId": "64a2d1d8f5b7c9a123456710",
  "subjectId": "64a2d1d8f5b7c9a123456740",
  "classId": "64a2d1d8f5b7c9a123456720",
  "sectionId": "64a2d1d8f5b7c9a123456730",
  "status": "ACTIVE",
  "validFrom": "2025-04-01T00:00:00.000Z",
  "validTo": null,
  "createdAt": "2025-04-01T00:00:00.000Z",
  "updatedAt": "2025-04-01T00:00:00.000Z"
}
```

### Why this is correct

Teacher assignment is not a permanent property of a teacher. It is a business fact that changes across sessions and classes. So it should be modeled as a separate queryable record with lifecycle dates.

---

## 10. Reference vs Embedded Data

### Embedded when appropriate

Embedded data should be small, read-mostly, and naturally attached to a single parent document.

Examples:

- `profileSettings`
- `emergencyContact` if small and mostly read together
- `address` inside a single profile record if not reused independently

### Reference when appropriate

Reference-based design is preferred for:

- dynamic relationships
- lifecycle-based records
- one-to-many or many-to-many facts
- data that changes independently
- records needing history or reporting

Examples:

- `studentUserId` in `StudentEnrollment`
- `teacherUserId` in `TeacherAssignment`
- `parentUserId` and `studentUserId` in `ParentStudent`

### Rule

If a record can have a start, end, status change, or multiple historical versions, it is not a good candidate for embedding inside a parent document.

---

## 11. Data Lifecycle Management

A strong senior design avoids hard deletes. Instead, it uses lifecycle metadata.

### Recommended fields

- `status`
- `validFrom`
- `validTo`
- `createdAt`
- `updatedAt`

### Example

```json
{
  "status": "ENDED",
  "validFrom": "2025-04-01T00:00:00.000Z",
  "validTo": "2025-11-30T00:00:00.000Z"
}
```

This lets us answer queries like:

- Who was active in this academic session?
- Which teacher assignment ended in Q4?
- Which student had guardian relationship active in 2024?

This is critical in educational systems because academic and relationship history must be preserved.

---

## 12. Indexing Strategy

Indexing is not optional in production MongoDB. We should define indexes according to actual query patterns.

### Core indexes to keep

- `users.email` unique
- `users.role` and `users.status` for filtering
- `ParentStudent.parentUserId` and `studentUserId`
- `StudentEnrollment.studentUserId` with session/class/section filters
- `TeacherAssignment.teacherUserId` and session/class/subject filters
- time-based indexes on lifecycle records (`validFrom`, `validTo`)

### Why important

These fields are used heavily in access queries, relationships, attendance reports, and admin dashboards.

---

## 13. Query Pattern Expectations

The system should support queries such as:

- Find all active students for a parent
- Find active enrollment for a student in session X
- Find teacher assigned to class Y in session Z
- Get all active assignments for a section
- Find historical records for a student across years
- Show attendance, results, and fees for a class + session

These patterns are exactly why relationship records are separate collections and not nested in one giant user doc.

---

## 14. Data Integrity Rules

Important validation rules already captured in the project:

- User cannot be their own parent/guardian
- Only one active parent-student relationship per pair and type
- Only one active enrollment per student per academic session
- Only one active teacher assignment per teacher/subject/class/section/session
- `validTo` cannot be before `validFrom`

These rules protect the business domain from duplicates and inconsistencies.

---

## 15. Schema Design Philosophy for EduOS

The project should follow this balanced pattern:

- `User` = authentication + identity
- `StudentEnrollment` = academic lifecycle fact
- `TeacherAssignment` = assignment lifecycle fact
- `ParentStudent` = guardian relationship fact
- Subject/class/section/session = reference master data
- Attendance/results/fees = domain operational collections

This is the right balance between normalization and operational simplicity.

---

## 16. Recommended Collection Naming Convention

Keep naming consistent and business-readable.

```text
users
parentStudents
studentEnrollments
teacherAssignments
academicSessions
classes
sections
subjects
attendance
assignments
exams
results
fees
notifications
notices
documents
auditLogs
```

Use PascalCase in Mongoose model names, but collection names should map to readable lower-case plural names such as:

- `User`
- `ParentStudent`
- `StudentEnrollment`
- `TeacherAssignment`

This is already aligned with the current backend implementation.

---

## 17. Final Architectural Recommendation

EduOS MongoDB architecture should be built on these principles:

1. Authentication and identity remain in `users`.
2. Academic and relationship lifecycle facts live in separate collections.
3. Dynamic relationships use `status`, `validFrom`, and `validTo` instead of deletion.
4. Unique indexes protect against duplicate active business facts.
5. Reference-based design is the default for ministry/education domain records.
6. Embedded data is only used for compact, low-risk, tightly-coupled sub-documents.
7. Every query pattern must be supported by a clear index and a realistic data access strategy.

This gives us a database design that is:

- scalable
- auditable
- query-friendly
- history-safe
- role-aware
- easy to maintain by senior engineers

---

## 18. Senior Summary

If a senior backend engineer reviews this design, the answer should be clear:

- It separates concerns correctly.
- It models business reality rather than forcing relational assumptions into MongoDB.
- It supports historical tracking and not just current state.
- It aligns with the actual backend project structure and Mongoose models.
- It is designed for real school/institution workflows, not just toy CRUD examples.

This is the correct MongoDB architecture for EduOS as a serious education management system.

   ↓
How data is queried?
   ↓
How often?
   ↓
How large?
   ↓
Does it change?
   ↓
Does it have lifecycle?
   ↓
Embed or Reference

Ye senior database thinking hai.

21. Index Kya Hai?

Baby style:

Suppose school library mein:

10,000 books

hain.

Agar tum har baar first book se last book tak search karo:

1 → 2 → 3 → ... → 10000

slow hoga.

Index ek shortcut/search catalog hai.

Database mein bhi index query ko efficiently locate karne mein help karta hai.

22. Example: User Email

Login:

email = "ali@example.com"

Ye query bohat frequently hoti hai.

Agar email indexed hai, database efficiently matching record find kar sakta hai.

Isliye authentication-related query patterns mein index important hai.

23. Har Field Par Index Kyun Nahi?

Important senior concept.

Agar 50 fields hain:

field1
field2
...
field50

to 50 indexes bana dena good engineering nahi.

Index ka cost hai:

Storage
+
Write overhead
+
Maintenance

Isliye:

Index query patterns ke basis par design hota hai.

24. Likely Important Indexes

Actual indexes Group 6 implementation ke waqt query analysis se finalize honge.

Candidates:

User.email
Student.userId
Student.admissionNo
Teacher.userId
Teacher.employeeId
Parent.userId
Enrollment.studentId
Enrollment.academicSessionId
TeachingAssignment.teacherId
TeachingAssignment.academicSessionId

Lekin final rule:

Candidate ≠ automatically create.

Existing queries ko inspect karke final indexes choose honge.

25. Compound Index

Kabhi query ek field nahi, multiple fields par hoti hai.

Example:

studentId
+
academicSessionId

Query:

Find Ali's enrollment for 2026–27

Yahan compound index useful ho sakta hai:

(studentId, academicSessionId)

Ye Group 6 ke important database-performance decisions mein se hai.

26. Unique Index

Kuch values duplicate nahi honi chahiye.

Example:

User.email

Agar business requirement hai ke email unique ho:

Ali@example.com

do accounts ke saath nahi hona chahiye.

To unique index useful hai.

Similarly:

admissionNo
employeeId

business rules ke according unique ho sakte hain.

27. Unique ≠ Validation

Important.

Validation keh sakti hai:

“Email valid format mein hona chahiye.”

Unique constraint keh sakta hai:

“Ye email already kisi aur record ke paas nahi hona chahiye.”

Dono different concerns hain.

Validation
= data shape/rules

Unique index
= duplicate prevention at database level
28. Data Integrity

Data integrity ka matlab:

Database mein invalid ya contradictory data na aaye.

Example:

Invalid:

Enrollment
studentId = student-999

jab student-999 exist hi nahi karta.

Ya:

TeacherAssignment
teacherId = student-123

jahan actual ID teacher ki honi chahiye.

Application-level validation aur database design dono milkar integrity protect karte hain.

29. MongoDB Foreign Key Jaisa Constraint?

Traditional relational DB mein foreign key constraint hota hai.

MongoDB mein relational databases jaisi traditional foreign-key enforcement nahi hoti.

Isliye application ko relationship validity carefully manage karni hoti hai.

Architecture:

Service
 ↓
Validate referenced entity
 ↓
Repository
 ↓
MongoDB

Aur critical operations mein transaction consider ki ja sakti hai.

30. Transactions Kya Hain?

Baby style:

Suppose admission process mein:

Student create
+
Enrollment create

dono operations logically ek unit hain.

Agar pehla successful ho:

Student created ✅

aur doosra fail:

Enrollment failed ❌

to system half-created state mein ja sakta hai.

Transaction ka concept kehta hai:

Ya required operations properly complete hon, ya operation rollback ho.

31. Har Operation Mein Transaction Kyun Nahi?

Transactions useful hain, lekin free nahi.

They can introduce:

complexity
operational overhead
longer-lived database operations
additional design constraints

Isliye:

Transaction only when atomicity/business consistency genuinely requires it.

Simple independent update ke liye unnecessarily transaction nahi.

32. Example: Enrollment

Suppose enrollment create karte waqt:

Student
+
Enrollment
+
some required related update

ek atomic business operation hai.

Agar requirements demand karti hain ke ye states together consistent rahen, transaction consider karenge.

Lekin sirf:

Student profile picture update

ke liye transaction ki zarurat nahi.

33. Soft Delete

Soft delete ka matlab:

Record physically delete nahi karte.

Instead:

status = DEACTIVATED

ya:

deletedAt = date

type approach use ki ja sakti hai.

34. Har Collection Mein Soft Delete?

No.

Ye bhi important senior decision hai.

Har model mein blindly:

deletedAt

add karna unnecessary complexity create kar sakta hai.

Question:

Kya is data ki historical/audit/business value hai?

Example:

Attendance
Results
Payments
Historical Enrollment
Audit Logs

mein deletion policies bohat carefully define hongi.

35. Hard Delete

Hard delete:

Database se actual record remove.

Ye tab use ho sakta hai jab:

data genuinely disposable ho
business/history requirement na ho
legal/compliance rules allow karein
references break na hon

EduOS mein important academic/financial history ko casually hard-delete nahi karna.

36. Status-Based Lifecycle

Kayi entities ko deletion ke bajaye lifecycle status chahiye.

Example:

ACTIVE
DEACTIVATED
ARCHIVED
ALUMNI

Lekin exact statuses domain-specific honge.

Important principle:

Status ka meaning documented hona chahiye.

ARCHIVED ka matlab developer-to-developer different nahi hona chahiye.

37. Data Lifecycle

Har major entity ke liye question:

Create
 ↓
Active
 ↓
Update
 ↓
Deactivate/End
 ↓
Archive

Example student:

Admission
 ↓
Active Student
 ↓
Graduated
 ↓
Alumni

Data architecture ko is lifecycle ko support karna chahiye.

38. Historical Data

EduOS mein history valuable hai.

Example:

Ali
2026 → Class 8-A
2027 → Class 9-B
2028 → Class 10-A

Agar hum sirf:

currentClass = 10-A

rakh dein aur old records delete kar dein:

❌ 2026 history lost
❌ 2027 history lost

Future reporting impossible/weak ho sakti hai.

Isliye dynamic relationships ko historical records preserve karne ke principle ke saath design kiya gaya hai.

39. Current State vs History

Important architecture:

Current State
+
Historical Records

Example:

Current Enrollment
      ↓
Class 10-A

History:

2026 → 8-A
2027 → 9-B
2028 → 10-A

System ko dono answer karne chahiye:

“Abhi kahan hai?”

aur:

“Pehle kahan tha?”

40. Data Consistency

Do major concepts:

Strong consistency

Immediately reliable state chahiye.

Example:

Payment
Fee balance
Critical financial state
Eventual consistency

Thori delay acceptable ho sakti hai.

Example:

Notification count
Report generation
Email delivery status

EduOS mein har feature ko same consistency model nahi dena.

41. Async Data

Group 5 mein architecture tha:

Service
 ↓
Event
 ↓
Job/Worker

Group 6 mein iska database implication bhi hai.

Example:

Result Published
 ↓
Event
 ↓
Notification Worker
 ↓
Notification document

Notification immediate same request ke andar create karna zaroori nahi ho sakta.

Ye later Groups 17–21 mein deeply implement hoga.

42. Repository Layer

Existing architecture:

Service
 ↓
Repository
 ↓
Model
 ↓
MongoDB

Repository ka purpose:

Database access ko business logic se separate rakhna.

Example:

studentRepository.findByUserId()

Service ko raw MongoDB query details se unnecessarily couple nahi karna.

43. Service vs Repository
Repository
"Data database se kaise lena hai?"
Service
"Business mein kya karna hai?"

Example:

Service:
"Check karo student active hai
aur phir enrollment create karo."

Repository:
"Student ko database se find karo."
"Enrollment database mein save karo."
44. Model Responsibility

Mongoose model/schema:

field structure
types
schema-level validation
indexes
model behavior where appropriate

Lekin business workflow ko pura model mein dump nahi karna.

Bad:

Model mein:
Enrollment + Authorization + Notification + Email + Payment

Better:

Service
 ↓
Repository
 ↓
Model

Clear responsibility.

45. Query Pattern First

Senior database design ka golden rule:

Schema sirf data dekh kar design mat karo; queries dekh kar bhi design karo.

Example:

Requirement:

Parent ko apne active children dikhao.

Likely query:

Find active relationships
where parentId = X

To relationship collection aur index query ko support karein.

46. Another Query

Requirement:

Teacher ko uski current teaching assignments dikhao.

Query concept:

teacherId
+
academicSessionId
+
status

Is query pattern ke according indexes evaluate honge.

47. Pagination

Suppose:

100,000 students

aur admin:

GET /students

kare.

Hum 100,000 records ek response mein nahi bhejenge.

Pagination:

Page 1 → 20
Page 2 → 20
Page 3 → 20

Database architecture ko pagination-friendly queries support karni hongi.

Later REST API Engineering mein pagination deeply implement hogi, lekin Group 6 mein database queries ko us requirement ke liye design karenge.

48. Offset vs Cursor

Do common approaches.

Offset
page=10
limit=20

Simple hai.

Lekin huge datasets mein deep offsets expensive ho sakte hain.

Cursor
after=someRecordId

Large/high-volume datasets ke liye efficient patterns provide kar sakta hai.

EduOS mein initial admin listings ke liye practical pagination approach query patterns ke according choose hogi.

49. Projection

Suppose user list screen ko sirf chahiye:

name
email
role
status

To unnecessarily:

passwordHash
documents
large profile data

fetch karna avoid karna chahiye.

Projection ka concept:

Sirf required fields retrieve karo.

Ye performance aur data exposure dono ke liye useful hai.

50. Sensitive Data

Database mein sensitive fields ho sakti hain:

passwordHash
documents
phone
address
financial information

Important:

Database mein hone ka matlab ye nahi ke API response mein bhi bhejni hain.

Example:

User Document
 ├── passwordHash
 ├── email
 ├── role
 └── status

Response:

{
   email,
   role,
   status
}

passwordHash response mein nahi.

51. Password Storage

Group 2 mein authentication decision already:

Argon2id

Password hashing ke liye.

Group 6 mein database rule:

Plain-text password database mein kabhi store nahi hoga.

Database mein:

passwordHash

store hoga.

52. MongoDB Atlas

Current infrastructure:

EduOS Backend
      ↓
MongoDB Atlas

Atlas managed MongoDB service hai.

Benefit:

managed database
cloud hosting
monitoring capabilities
backups/features depending on plan
less infrastructure management

Alternative:

Self-hosted MongoDB

ho sakta tha.

Lekin current project mein self-hosting operational burden unnecessarily increase karta.

53. Why Not PostgreSQL?

PostgreSQL strong relational database hai.

Especially:

relationships
constraints
transactions
complex relational queries

mein excellent option.

Lekin EduOS ke current constraints mein:

MongoDB already selected
MongoDB Atlas already planned
Current application architecture MongoDB-based

Isliye Group 6 mein PostgreSQL par switch nahi karenge.

Important:

PostgreSQL inferior nahi hai.

Ye project constraints ke basis par decision hai.

54. MongoDB Trade-off

MongoDB benefits:

Flexible document model
Easy Node.js/Mongoose integration
Good fit for document-oriented data
Existing project consistency

Trade-offs:

Relational constraints PostgreSQL-style nahi
Data integrity ka kuch burden application par
Complex relationships carefully model karne padte hain
Poor modeling performance issues create kar sakti hai

Senior engineer dono sides samajhta hai.

55. MongoDB Schema Flexibility ≠ No Schema

Ye bohat important hai.

MongoDB flexible hai.

Iska matlab:

"Jo marzi field daal do."

nahi.

EduOS mein Mongoose schema + validation + application rules honge.

Concept:

MongoDB flexibility
        +
Application discipline
        =
Controlled data architecture
56. Environment Separation

Database environments ideally separate:

Development
Testing
Production

Example:

Development DB
      ≠
Production DB

Developer testing accidentally production data destroy nahi kare.

Environment variables:

MONGODB_URI

.env mein.

Secrets Git mein commit nahi karne.

57. Database Credentials

Bad:

const uri = "mongodb+srv://username:password@..."

source code mein.

Better:

process.env.MONGODB_URI

Credentials environment/secrets management se.

58. Backup & Recovery

Senior database architecture mein ye question mandatory hai:

Agar database delete/corrupt ho jaye to data kaise recover hoga?

MongoDB Atlas ke available backup/recovery capabilities project deployment plan aur selected tier ke according configure hongi.

Documentation mein:

Backup Strategy
Recovery Strategy
Retention
Restore Testing

define karna important hai.

Backup hona aur backup restore kar paana do different cheezein hain.

59. Backup Testing

Sirf:

Backup enabled ✅

enough nahi.

Real question:

Can we restore?

Senior practice:

Backup
 ↓
Restore test
 ↓
Verify data
 ↓
Document result
60. Database Monitoring

Future production phase mein monitor karna hoga:

Query performance
Database CPU/resources
Connections
Storage
Slow queries
Errors

Goal:

Problem user complain karne se pehle detect ho.

Detailed observability later Group 23 mein aayegi.

61. Database Security

Minimum principles:

Least privilege
+
Strong credentials
+
Network/security controls
+
Encrypted connections
+
Secrets outside source code
+
No unnecessary data exposure

Application:

API
 ↓
Authorized operation
 ↓
Database

Client ko direct unrestricted database access nahi.

62. Client → MongoDB Direct?

No.

Architecture:

Frontend
   ↓
API
   ↓
Backend
   ↓
Service
   ↓
Repository
   ↓
MongoDB

Frontend ko MongoDB credentials dena dangerous aur architecturally wrong hoga.

63. Data Access Flow

Final conceptual flow:

Client
  ↓
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Policy
  ↓
Repository
  ↓
Model
  ↓
MongoDB Atlas

Ye tumhari fixed architecture ke saath consistent hai.

64. Group 6 Mein Technology Decisions
Concern	Decision	Alternative	Alternative kyun nahi
Database	MongoDB Atlas	PostgreSQL	Existing project constraints + selected architecture
ODM	Mongoose	Native MongoDB Driver	Mongoose schema/model discipline useful for current project
Relationships	References/separate relationship models where justified	Everything embedded	Dynamic/history-heavy relationships
Small tightly-owned data	Embedding where justified	Separate collection	Extra query/lifecycle unnecessary
Data validation	Mongoose + application validation	DB-only validation	Business rules application layer mein bhi required
IDs	MongoDB IDs / existing ID strategy	Custom IDs everywhere	Unnecessary complexity unless domain requires readable IDs
Transactions	Only where atomicity requires	Transaction everywhere	Complexity/overhead
Indexes	Query-driven	Index every field	Write/storage/maintenance cost
Deletion	Lifecycle/soft-delete where justified	Hard delete everywhere	Historical/business data
Hosting	MongoDB Atlas	Self-hosted MongoDB	More operational burden
65. Group 6 Ka Golden Architecture
                  DATABASE
                     │
              MongoDB Atlas
                     │
              ┌──────┴──────┐
              ↓             ↓
          Collections    Indexes
              │
              ↓
          Documents
              │
       ┌──────┴───────┐
       ↓              ↓
    Embedded       References
       │              │
       └──────┬───────┘
              ↓
       Data Integrity
              ↓
        Query Patterns
              ↓
        Performance
              ↓
          Security
              ↓
       Backup/Recovery
66. Group 6 Ka Implementation Scope

Group 6 mein hum primarily:

Database Foundation
MongoDB connection
Mongoose configuration
Environment configuration
Core Data Models

Group 4 + Group 5 ke models ko database level par properly finalize karna.

Relationships
User ↔ Profile
Parent ↔ Student
Student ↔ Enrollment
Teacher ↔ Assignment
Schema Rules
types
required
defaults
validation
references
Indexes

Query patterns ke basis par.

Lifecycle
active
ended
archived
etc.
Data access

Repositories ko database design ke saath align karna.

67. Group 6 Mein Kya Nahi Karna?

Scope control bohat important hai.

Yahan hum complete:

Attendance
Exams
Results
Fees
Notifications
Redis
BullMQ
WebSockets
Docker
CI/CD
AI

implement nahi karenge.

Database architecture un future modules ko support karne ke liye foundation provide karegi.

68. Group 6 Testing

Database tests sirf:

“MongoDB connect ho gaya.”

tak limited nahi honge.

Connection
DB connects
DB disconnects
Invalid URI handled
Schema
Required fields
Invalid values
Valid references
Index
Expected indexes exist
Unique constraint works
Query pattern supported
Relationships
Valid relationship
Invalid relationship
Duplicate relationship
Historical relationship
Lifecycle
Active
Ended
Archived
Data integrity
Invalid referenced entity
Duplicate domain identifier
Invalid state transition
69. Performance Testing

At least conceptually verify:

Query
 ↓
Index?
 ↓
Expected execution pattern?

Production-scale data ka approximation later staging/load tests mein kiya ja sakta hai.

Important:

“Query chal gayi” ≠ “Query production-ready hai.”

70. Security Verification

Check:

No plaintext password
No DB credentials in Git
No production URI in source
Sensitive fields not returned
Unauthorized DB operations blocked
Correct ownership/relationship checks
71. Group 6 Definition of Done

Group 6 tab complete hoga jab:

✅ MongoDB architecture documented
✅ Collection strategy documented
✅ Embed vs reference decisions documented
✅ Group 4 models database-ready
✅ Group 5 relationships database-ready
✅ Schema validation implemented
✅ Relevant indexes implemented
✅ Unique constraints verified
✅ Repository layer aligned
✅ Data lifecycle handled
✅ Integrity rules tested
✅ Security checked
✅ Query patterns verified
✅ Relevant tests passed
✅ Backup/recovery strategy documented
✅ No critical DB issue remains

Sirf:

mongoose.connect()

successful hona Group 6 complete nahi hai.

72. Group 6 ka Senior Mental Model

Bahi, is group ka ye formula yaad rakhna:

Requirement
    ↓
What data exists?
    ↓
How is data related?
    ↓
How does data change?
    ↓
How is data queried?
    ↓
Embed or Reference?
    ↓
What indexes are needed?
    ↓
What consistency is required?
    ↓
What happens if something fails?
    ↓
How is data secured?
    ↓
How is data recovered?

Yahi database engineering hai.

Sirf:

Schema bana diya

database engineering nahi.

73. Group 4 → 5 → 6 Connection

Ab tumhara architecture aur clear ho jata hai:

GROUP 4
User / Role / Profile
        ↓
"Ye banda kaun hai?"
        ↓
GROUP 5
Dynamic Relationships
        ↓
"Ye kis se / kis academic context mein connected hai?"
        ↓
GROUP 6
Data Architecture
        ↓
"Ye sab information database mein reliably kaise store/query/manage hogi?"

Aur phir:

GROUP 7
REST API Engineering
        ↓
"Client is data ko API ke through kaise use karega?"

Ye sequence random nahi hai. Identity → Relationships → Data → API hai.

Final Senior Principle

Good database design ka goal sirf data save karna nahi hota; goal ye hota hai ke system data ko correctly, consistently, securely, efficiently aur future requirements ke saath maintain kar sake.