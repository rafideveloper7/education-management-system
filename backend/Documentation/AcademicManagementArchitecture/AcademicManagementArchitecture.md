# EduOS — Group 10: Academic Management Architecture

## 1. Group 10 Ka Main Purpose

Group 10 ka purpose hai:

> **EduOS mein institution ka academic structure define aur manage karna.**

Simple words mein:

School/college mein:

* academic year/session hota hai
* classes hoti hain
* sections hote hain
* subjects hote hain
* class mein subjects offered hote hain
* teachers ko subjects/classes assign kiye jate hain
* students ko class/section mein enroll kiya jata hai

Ye sab Academic Management ka part hai.

Basic picture:

```text
Academic Session
       ↓
     Class
       ↓
    Section
       ↓
    Subjects
       ↓
Class + Subject
       ↓
Teacher Assignment
       ↓
Student Enrollment
```

Lekin important:

> In sab cheezon ko ek hi document/model mein daal dena bad architecture hoga.

Har concept ki apni responsibility hogi.

---

# 2. Real-World Problem

Suppose school mein:

```text
Academic Session = 2026–2027
```

Aur classes:

```text
Class 9
Class 10
Class 11
```

Class 9 ke sections:

```text
9-A
9-B
9-C
```

Subjects:

```text
Mathematics
Physics
Chemistry
English
Biology
```

Ab system ko pata hona chahiye:

* kaunsi academic session active hai?
* kaunsi classes exist karti hain?
* class ke kaunse sections hain?
* kaunse subjects offered hain?
* kaunsa subject kis class mein hai?
* kaunsa teacher kis subject ko kis section ko padhata hai?
* kaunsa student kis session mein kis section mein enrolled hai?

Ye Group 10 solve karega.

---

# 3. Sabse Important Principle

Academic system mein:

> **Permanent identity aur time-based academic assignment ko separate rakho.**

Example:

Ahmed ek teacher hai.

Ahmed ki permanent identity:

```text
Teacher
Employee ID = EMP-101
Name = Ahmed
```

Lekin 2026–27:

```text
Ahmed → Biology → Class 9-A
```

2027–28:

```text
Ahmed → Biology → Class 10-B
```

Ahmed same hai.

Assignment change hui hai.

Isliye:

```text
Teacher Profile
      ≠
Teacher Assignment
```

Isi principle ko students par bhi apply karenge.

---

# 4. Academic Session Kya Hai?

Baby style:

Academic Session basically:

> **School ka ek official academic period.**

Example:

```text
2026–2027
```

Iske andar:

```text
Classes
Sections
Enrollments
Subjects
Assignments
Attendance
Exams
Results
```

jaise academic records exist karte hain.

---

# 5. Academic Session Kyun Zaroori Hai?

Agar hum session na rakhein:

```text
Ali
Class 9-A
```

to future mein confusion hoga.

Ali 2026–27 mein:

```text
9-A
```

mein ho sakta hai.

2027–28 mein:

```text
10-B
```

mein ho sakta hai.

System ko history preserve karni hai.

Therefore:

```text
Student
 ↓
Enrollment
 ↓
Academic Session
 ↓
Class / Section
```

---

# 6. Academic Session Ko Student Profile Mein Directly Kyun Nahi Rakhenge?

Bad design:

```text
Student
currentClass = 10
currentSection = B
session = 2027
```

Problem:

Kal student promote ho gaya:

```text
9-A → 10-B
```

to purani information overwrite ho jayegi.

Phir system nahi bata payega:

> Ali 2026–27 mein kahan tha?

Isliye historical academic information separate enrollment records mein honi chahiye.

---

# 7. Academic Session Lifecycle

Session ke possible states business requirements ke according ho sakte hain:

```text
PLANNED
   ↓
ACTIVE
   ↓
COMPLETED
   ↓
ARCHIVED
```

Meaning:

### PLANNED

Session future mein start hogi.

### ACTIVE

Current academic session.

### COMPLETED

Session khatam ho gayi.

### ARCHIVED

Historical reference ke liye preserve ki gayi.

Exact status names implementation ke waqt existing `status.constants.js` ke according finalize honge.

---

# 8. Ek Time Par Kitni Active Sessions?

Normally institution-level business rule ho sakta hai:

```text
One Institution
      ↓
One Active Academic Session
```

Lekin system ko blindly assume nahi karna chahiye.

Agar future mein:

* multiple campuses
* different academic calendars
* different programs

ki requirement aaye to architecture adapt ho sake.

Current EduOS requirement ke liye single active session simple aur reasonable decision hai.

---

# 9. Class Kya Hai?

Class academic level/category hai.

Example:

```text
Class 9
Class 10
Class 11
```

Class:

> "Student kis academic level par hai?"

Ye actual student nahi hai.

---

# 10. Section Kya Hai?

Section same class ke andar ek subdivision hai.

Example:

```text
Class 9
 ├── 9-A
 ├── 9-B
 └── 9-C
```

Simple:

```text
Class = level
Section = us level ka specific group
```

---

# 11. Class Aur Section Separate Kyun?

Agar hum:

```text
Class 9-A
Class 9-B
Class 9-C
```

ko completely separate classes samajh lein to duplication badhegi.

Better:

```text
Class 9
   ↓
Sections
 ├── A
 ├── B
 └── C
```

Isse class-level information reusable hoti hai.

---

# 12. Section Kis Class Ka Hai?

Section independent random entity nahi.

Example:

```text
Section A
```

alone meaningful nahi.

It should belong to:

```text
Class 9
```

Conceptually:

```text
Class
  ↓
Section
```

---

# 13. Section Same Name Problem

Possible:

```text
Class 9 → A
Class 10 → A
```

Dono valid hain.

Isliye section ka unique identity sirf:

```text
name = A
```

nahi hona chahiye.

Context bhi important hai:

```text
Class 9 + A
Class 10 + A
```

Ye do different sections hain.

Database uniqueness bhi isi business rule ko reflect karegi.

---

# 14. Subject Kya Hai?

Subject academic discipline hai.

Example:

```text
Mathematics
English
Physics
Biology
Chemistry
Computer Science
```

Subject apni independent identity rakhta hai.

---

# 15. Subject Aur Class Ka Relationship

Important:

> Har subject har class ka nahi hota.

Example:

```text
Class 9 → Biology
Class 9 → Physics
```

possible.

Lekin:

```text
Class 1 → Advanced Quantum Physics
```

normally nahi.

Isliye:

```text
Class
+
Subject
```

ka separate academic relationship useful hai.

---

# 16. ClassSubject Kya Hai?

EduOS structure mein:

```text
ClassSubject
```

ka purpose hai:

> **Ye define karna ke kisi class mein kaunsa subject officially offered hai.**

Example:

```text
Class 9
   ↓
ClassSubject
   ↓
Biology
```

Another:

```text
Class 9
   ↓
ClassSubject
   ↓
Mathematics
```

---

# 17. Subject Ko Directly Class Mein Array Kyun Nahi?

Simple design:

```json
{
  "class": "9",
  "subjects": ["Math", "Physics", "Biology"]
}
```

initially easy lag sakta hai.

Lekin future mein:

* subject teacher
* subject code
* credits
* marks
* exam configuration
* compulsory/elective
* ordering

jaise information chahiye ho sakti hai.

Isliye separate relationship model zyada scalable hai.

---

# 18. ClassSubject Ki Responsibility

ClassSubject ka kaam:

```text
Class
 +
Subject
 +
Academic configuration
```

ko represent karna.

Lekin:

```text
Teacher assignment
```

iska kaam nahi.

Aur:

```text
Student enrollment
```

iska kaam nahi.

Responsibilities separate rahengi.

---

# 19. Teacher Assignment

Ab actual teaching connection:

```text
Teacher
   ↓
Teacher Assignment
   ↓
Subject
   ↓
Class
   ↓
Section
   ↓
Academic Session
```

Example:

```text
Ahmed
 ↓
Biology
 ↓
Class 9
 ↓
Section A
 ↓
2026–2027
```

Ye batata hai:

> "2026–27 mein Ahmed Class 9-A ko Biology padha raha hai."

---

# 20. Teacher Assignment Ko Teacher Profile Mein Kyun Nahi Rakhenge?

Bad:

```text
Teacher
subject = Biology
class = 9
section = A
```

Next year:

```text
class = 10
```

update karna padega.

History lost.

Better:

```text
Teacher Profile
Ahmed

Assignment 1
2026–27 → Biology → 9-A

Assignment 2
2027–28 → Biology → 10-B
```

History preserve.

---

# 21. Teacher Ek Se Zyada Subjects Padhata Ho?

Possible:

```text
Ahmed
 ├── Biology → 9-A
 ├── Biology → 9-B
 └── Chemistry → 10-A
```

Therefore assignment separate records hone chahiye.

---

# 22. Ek Subject Multiple Teachers?

Possible:

```text
Biology
 ├── Teacher Ahmed → 9-A
 └── Teacher Bilal → 9-B
```

Again relationship model is appropriate.

---

# 23. Teacher Assignment Mein Academic Session Kyun?

Because:

```text
Ahmed → Biology → 9-A
```

without year ambiguous hai.

Better:

```text
Ahmed
→ Biology
→ 9-A
→ 2026–27
```

Now historical meaning clear hai.

---

# 24. Student Enrollment

Student ka academic connection:

```text
Student
 ↓
Enrollment
 ↓
Academic Session
 ↓
Class
 ↓
Section
```

Example:

```text
Ali
 ↓
Enrollment
 ↓
2026–27
 ↓
Class 9
 ↓
Section A
```

---

# 25. Enrollment Student Profile Mein Kyun Nahi?

Bad:

```text
Student
currentClass = 9
currentSection = A
```

Problem:

Student promote hoga.

History lost.

Better:

```text
Enrollment 2026–27
Ali → 9-A

Enrollment 2027–28
Ali → 10-B
```

Ab history safe hai.

---

# 26. Enrollment Aur Profile Ka Difference

Student Profile:

> "Ali kaun hai?"

Enrollment:

> "Ali kis academic session mein kahan enrolled tha?"

Ye distinction future system ke liye extremely important hai.

---

# 27. Enrollment History

Suppose:

```text
2026–27 → 9-A
2027–28 → 10-A
2028–29 → 11-B
```

System ko teeno records preserve karne chahiye.

Is history se future mein:

* reports
* transcripts
* result history
* attendance history
* academic analytics

possible hongi.

---

# 28. Current Enrollment

Agar student ki current class chahiye:

```text
Student
 ↓
Active Enrollment
 ↓
Current Session
 ↓
Class + Section
```

Profile mein permanently overwrite karne ki zaroorat nahi.

---

# 29. Academic Structure Ka Complete Picture

```text
Academic Session
        │
        ├──────── Class
        │           │
        │           └── Section
        │
        └──────── Subject
                    │
                    └── ClassSubject

Teacher
   │
   └── Teacher Assignment
            │
            ├── Academic Session
            ├── Class
            ├── Section
            └── Subject

Student
   │
   └── Enrollment
            │
            ├── Academic Session
            ├── Class
            └── Section
```

---

# 30. Academic Management Ka Golden Rule

> **Permanent identity ko historical/time-based academic state se separate rakho.**

Teacher:

```text
Teacher Profile
       ≠
Teacher Assignment
```

Student:

```text
Student Profile
       ≠
Student Enrollment
```

Subject:

```text
Subject
       ≠
ClassSubject
```

Class:

```text
Class
       ≠
Section
```

Ye separation system ko future changes ke against strong banati hai.

---

# 31. Academic Session Delete Karna?

Generally historical academic session ko hard delete karna dangerous ho sakta hai.

Example:

```text
2025–26
```

ke andar:

* students
* teachers
* attendance
* assignments
* exams
* results

already exist kar sakte hain.

Agar session delete kar di:

```text
Historical data broken
```

Therefore:

> Historical academic sessions ko preserve/archive karna safer approach hai.

---

# 32. Class Delete Karna?

Agar Class 9 ke historical records hain:

```text
Students
Attendance
Results
Assignments
```

to hard delete dangerous ho sakta hai.

Instead:

```text
ACTIVE
INACTIVE
ARCHIVED
```

jaisi lifecycle approach requirements ke according use ki ja sakti hai.

---

# 33. Subject Delete Karna?

Same principle.

Suppose:

```text
Computer Science
```

2026 mein use hua.

Future mein institution subject offer karna band kar de.

Historical results mein subject ka reference phir bhi chahiye.

Therefore:

```text
Subject ❌ physically destroy
```

karna generally inappropriate hoga.

Better:

```text
Subject = inactive
```

aur historical records preserve.

---

# 34. Class vs Academic Session

Ye dono confuse nahi karne.

```text
Class 9
```

academic level hai.

```text
2026–27
```

time period hai.

Together:

```text
2026–27
+
Class 9
```

context create karte hain.

---

# 35. Same Class Across Sessions

Class 9:

```text
2025–26
2026–27
2027–28
```

mein exist kar sakti hai.

Isliye Class ko session ke andar duplicate karna zaroori nahi agar institution ka class definition stable hai.

Session-specific information enrollment/assignment side par rahegi.

---

# 36. Alternative Architecture: Session-Specific Classes

Ek alternative ye hai:

```text
2026–27 Class 9
2027–28 Class 9
```

as separate records.

Ye kuch systems mein useful ho sakta hai.

Lekin current EduOS ke liye agar Class 9 ka identity stable hai, to:

```text
Class
+
Academic Session-specific enrollment/assignment
```

cleaner design hai.

---

# 37. Important Future Requirement

Agar future mein institution kahe:

> "2026–27 mein Class 9 ka name/configuration different tha."

to session-specific configuration model introduce kiya ja sakta hai.

Architecture ko is possibility ko completely block nahi karna chahiye.

---

# 38. Class + Section Capacity

Future requirement ho sakti hai:

```text
9-A
capacity = 40
```

Then system ko enforce karna hoga:

```text
Current Students < Capacity
```

before enrollment.

Lekin agar capacity current requirement mein nahi hai to unnecessary feature abhi implement nahi karenge.

Senior principle:

> **Future possibility ko architecture mein jagah do, lekin har future feature aaj implement mat karo.**

---

# 39. Teacher Assignment Validation

Teacher assignment create karte waqt:

```text
Teacher exists?
       ↓
Active?
       ↓
Subject exists?
       ↓
Class exists?
       ↓
Section belongs to class?
       ↓
Academic session valid?
       ↓
Subject offered in class?
       ↓
Assignment allowed?
```

Tab assignment create hogi.

Ye sirf:

```text
teacherId + subjectId
```

save karna nahi hai.

---

# 40. Student Enrollment Validation

Enrollment:

```text
Student exists?
       ↓
Student account/profile valid?
       ↓
Academic session valid?
       ↓
Class exists?
       ↓
Section belongs to class?
       ↓
Enrollment duplicate?
       ↓
Capacity/business rules?
       ↓
Create enrollment
```

---

# 41. Referential Integrity

MongoDB relational database nahi hai, lekin iska matlab ye nahi ke data relationships ko ignore karein.

Example:

```text
Enrollment
studentId = S-123
```

System ko ensure karna chahiye:

```text
Student S-123 exists
```

Similarly:

```text
TeacherAssignment
sectionId = SEC-99
```

to:

```text
Section SEC-99
```

valid honi chahiye.

Application/service layer referential integrity enforce karegi.

---

# 42. MongoDB Mein Ye Kaise Manage Hoga?

Current EduOS:

```text
MongoDB + Mongoose
```

use karta hai.

Models:

```text
AcademicSession
Class
Section
Subject
ClassSubject
ClassTeacher
StudentEnrollment
TeacherAssignment
```

Existing folder structure mein jo models already defined hain unko follow karenge.

**New folders/models blindly create nahi karenge.**

Agar existing architecture aur requirement conflict kare:

> implementation se pehle conflict identify hoga.

---

# 43. Embedding vs Referencing

MongoDB mein major decision:

### Embed

Data parent document ke andar.

Example:

```json
{
  "class": "9",
  "sections": ["A", "B"]
}
```

### Reference

Separate documents:

```text
Class
  ↓
Section
```

Academic system mein highly dynamic entities aur historical relationships ki wajah se **references** generally more suitable hain.

---

# 44. Why Not Embed Everything?

Agar Class document mein:

```text
students
teachers
subjects
sections
attendance
results
```

sab embed kar dein:

document huge ho sakta hai.

Aur frequent updates:

```text
Student enrollment
Teacher assignment
Attendance
Results
```

same document ko constantly modify karenge.

Concurrency aur document growth issues aa sakte hain.

Therefore:

> High-change, independently queried, historical entities ko separate collections mein rakhna generally better hai.

---

# 45. Why MongoDB Instead of PostgreSQL?

Current project decision:

```text
MongoDB Atlas
```

because existing EduOS architecture isi par built hai.

PostgreSQL strong alternative hai, especially relational academic systems ke liye.

Lekin ab database migrate karna:

* architecture change
* ORM/query changes
* migrations
* testing
* deployment changes

create karega.

Current project mein unnecessary migration avoid karenge.

---

# 46. Why Not Prisma?

Prisma PostgreSQL ke saath strong option hai.

Lekin current database:

```text
MongoDB
```

aur current backend architecture:

```text
Mongoose
```

par based hai.

Therefore:

> Existing technology ko unnecessary replace nahi karenge.

---

# 47. Academic Service Layer

Services:

```text
academicSession.service.js
class.service.js
section.service.js
subject.service.js
academicAssignment.service.js
```

ka purpose business workflows ko manage karna hai.

Example:

```text
createAcademicSession()
createClass()
createSection()
createSubject()
assignSubjectToClass()
```

---

# 48. Controller Ka Role

Controller:

```text
Request
 ↓
Validated input
 ↓
Service
 ↓
Response
```

Controller mein:

```text
20 business rules
```

nahi bharne.

Example:

```text
createSectionController()
```

sirf request receive kare aur service ko call kare.

---

# 49. Policy Ka Role

Policy decide karegi:

```text
Can this admin create a class?
Can this teacher access this academic resource?
Can this user modify this section?
```

Role:

```text
ADMIN
```

hona alone enough nahi agar permission/policy rules more specific hon.

---

# 50. Academic API Design

Group 7 ke REST principles apply honge.

Conceptually:

```http
GET    /academic-sessions
POST   /academic-sessions

GET    /classes
POST   /classes

GET    /classes/:classId
PATCH  /classes/:classId

GET    /sections
POST   /sections

GET    /subjects
POST   /subjects
```

Exact URLs existing route structure aur API contract ke according finalize honge.

---

# 51. Session API

Create:

```http
POST /academic-sessions
```

Request:

```json
{
  "name": "2026-2027",
  "startDate": "...",
  "endDate": "..."
}
```

Backend:

```text
Validate
 ↓
Authorize
 ↓
Business rules
 ↓
Create
 ↓
Return safe response
```

---

# 52. Active Session Rule

Suppose current active session:

```text
2026–27 = ACTIVE
```

Admin accidentally creates:

```text
2027–28 = ACTIVE
```

Agar business rule single active session hai:

```text
❌ reject
```

Ya controlled transition:

```text
2026–27
ACTIVE
 ↓
COMPLETED

2027–28
PLANNED
 ↓
ACTIVE
```

This is a business workflow, not simple CRUD.

---

# 53. Section Creation Rule

Suppose:

```text
Class 9
```

already has:

```text
A
B
```

Admin creates:

```text
A
```

again.

Backend should reject duplicate according to the defined uniqueness rule.

---

# 54. Subject Assignment Rule

Suppose:

```text
Class 9
```

already has:

```text
Biology
```

Admin tries to assign Biology again.

System should prevent duplicate ClassSubject relationship.

---

# 55. Teacher Assignment Rule

Suppose:

```text
Ahmed
Biology
9-A
2026–27
```

already exists.

Same assignment dobara create karna:

```text
❌ Duplicate
```

should be prevented.

Database uniqueness + service validation both can contribute to integrity.

---

# 56. Student Enrollment Rule

Suppose:

```text
Ali
2026–27
9-A
```

already enrolled hai.

Same active enrollment dobara:

```text
❌ Duplicate
```

should not happen.

---

# 57. Student Transfer

Important real-world case.

Ali:

```text
2026–27
9-A
```

se:

```text
9-B
```

transfer hota hai.

Bad approach:

```text
section = B
```

simply overwrite.

Better:

```text
Enrollment Record
9-A
status = ENDED

New Enrollment / transfer record
9-B
status = ACTIVE
```

This preserves history.

Exact transfer model Group 10 implementation requirements ke waqt define hoga.

---

# 58. Teacher Reassignment

Ahmed:

```text
Biology → 9-A
```

se:

```text
Biology → 9-B
```

shift hota hai.

Old assignment:

```text
status = ENDED
```

New assignment:

```text
status = ACTIVE
```

Historical assignment preserve.

---

# 59. Effective Dates

Academic relationships ke liye useful fields:

```text
startDate
endDate
status
```

Example:

```text
Ahmed
Biology
9-A

startDate = 2026-08-01
endDate   = 2027-03-31
```

Ye future reporting mein bohat useful hoga.

Lekin dates sirf wahan add karenge jahan business requirement justify kare.

---

# 60. Time-Based Data Ka Benefit

Agar 10 saal baad admin pooche:

> "2027 mein Ali kis section mein tha?"

system historical enrollment se answer kar sakega.

Agar hum current field overwrite karte rehte:

```text
currentSection = B
```

to old information lost ho sakti thi.

---

# 61. Academic Data Aur Future Modules

Group 10 foundation later modules ko support karega:

```text
Academic
   ↓
Attendance
   ↓
Assignments
   ↓
Exams
   ↓
Results
   ↓
Fees
   ↓
Reports
   ↓
AI Analytics
```

Isliye Group 10 ka architecture bohat important hai.

---

# 62. Attendance Is Group 11

Group 10:

```text
Student → Enrollment → Section
```

establish karega.

Group 11:

```text
Attendance
```

is academic context ko use karegi.

Example:

```text
Ali
 ↓
Enrollment
 ↓
9-A
 ↓
Attendance
```

Attendance ko Student Profile mein permanently store nahi karenge.

---

# 63. Assignments Is Later Group

Teacher assignment:

```text
Ahmed → Biology → 9-A
```

Group 10.

Actual homework:

```text
"Chapter 5 Biology Homework"
```

later Assignment module.

Ye dono confuse nahi honge.

---

# 64. Examination Is Later Group

Academic structure:

```text
Class
Section
Subject
Student Enrollment
```

Group 10.

Exam:

```text
Midterm
Final
Quiz
```

later Examination module.

Results academic structure ko reference karenge.

---

# 65. Data Ownership

Har entity ka owner/responsibility clear:

```text
AcademicSession
→ academic calendar

Class
→ academic level

Section
→ class subdivision

Subject
→ academic subject

ClassSubject
→ subject offered to class

TeacherAssignment
→ teacher's academic responsibility

Enrollment
→ student's academic placement
```

Ye boundaries future bugs reduce karti hain.

---

# 66. Security

Academic data sensitive hai.

Student ko:

```text
all students
all classes
all teacher assignments
```

automatically access nahi milna chahiye.

Example:

```text
Student A
 ↓
Own academic data
```

Teacher:

```text
Teacher A
 ↓
Assigned classes/students
```

Admin:

```text
Authorized academic management
```

Exact access policies existing authorization architecture ke through define hongi.

---

# 67. Teacher Ko All Students Kyun Nahi?

Suppose teacher Biology 9-A mein assigned hai.

Iska matlab automatically:

```text
Teacher → every student in institution
```

nahi.

Access ideally contextual hoga:

```text
Teacher
 ↓
Assignment
 ↓
Class/Section
 ↓
Relevant Students
```

Ye Group 5 relationship + authorization policies ka strong use case hai.

---

# 68. Parent Ko Class Data Kaise Milega?

Parent:

```text
Parent
 ↓
Parent-Student Relationship
 ↓
Student
 ↓
Active Enrollment
 ↓
Class/Section
```

Parent ko directly:

```text
classId
```

profile mein permanently store karne ki zaroorat nahi.

---

# 69. Performance Thinking

Senior API/database design mein performance bhi consider karni hai.

Common queries:

```text
Current active session
Student's active enrollment
Students in section
Teachers assigned to section
Subjects of class
```

In queries ke according indexes Group 6 database architecture mein define honge.

Blindly 20 indexes banana bhi correct nahi.

---

# 70. Indexing Principle

Index:

> **Query pattern ki wajah se banta hai, sirf field ke existence ki wajah se nahi.**

Example:

Agar frequently query:

```text
studentId + academicSessionId
```

se hoti hai, compound index useful ho sakta hai.

Exact index design actual query patterns dekh kar finalize hoga.

---

# 71. Pagination

Large institution:

```text
50 students
```

se:

```text
50,000 students
```

tak ho sakta hai.

Therefore:

```text
GET /students
```

full dataset return nahi karega.

Pagination/filtering required hogi.

---

# 72. Search

Useful academic searches:

```text
student admission number
student name
teacher employee ID
subject name
class
section
```

Search implementation query patterns ke according optimize hogi.

---

# 73. Race Conditions

Senior-level issue.

Suppose 2 admins simultaneously same student ko:

```text
9-A
```

mein enroll karte hain.

Dono check karte hain:

```text
Enrollment doesn't exist
```

Then dono create kar dete hain.

Result:

```text
Duplicate enrollment
```

Isliye sirf application-level check enough nahi.

Database-level uniqueness/integrity constraints bhi important hain where possible.

---

# 74. Transaction Thinking

Example:

```text
Student Transfer
```

could involve:

```text
End old enrollment
+
Create new enrollment
```

Agar first successful aur second fail:

```text
Student has no active enrollment
```

Potentially inconsistent state.

Aise multi-step critical workflows mein transaction consider karna appropriate hai.

---

# 75. MongoDB Transaction

MongoDB transactions multiple documents/operations ko atomic workflow mein handle kar sakti hain when supported by deployment/configuration.

Example:

```text
START TRANSACTION
       ↓
End old enrollment
       ↓
Create new enrollment
       ↓
COMMIT
```

Failure:

```text
ROLLBACK
```

Lekin transaction ko har simple read/write par use nahi karna.

Trade-off:

* more complexity
* performance/operational considerations
* transaction boundaries carefully design karni hoti hain

Use only where business consistency requires it.

---

# 76. Event-Driven Architecture Kyun Nahi?

Academic management ke basic writes:

```text
Create Class
Create Subject
Create Section
```

ke liye event-driven architecture unnecessary ho sakta hai.

Events useful honge jab:

```text
Enrollment Created
   ↓
Notification
   ↓
Email
   ↓
Audit
   ↓
Analytics
```

jaise asynchronous side effects hon.

Core academic state ko unnecessarily asynchronous nahi karenge.

---

# 77. Redis Ki Zaroorat?

Group 10 ke core academic CRUD ke liye:

```text
Redis ❌
```

automatically required nahi.

Later:

* caching
* rate limiting
* sessions
* queues
* high-frequency reads

mein Redis justified ho sakta hai.

Technology requirement-driven hogi.

---

# 78. Why Not Microservices?

Academic module ko:

```text
academic-service
```

naam ka separate microservice banana abhi unnecessary.

Current architecture:

```text
Modular Monolith
```

suitable hai.

Future scale genuinely demand kare to boundaries already clear hain.

---

# 79. Documentation Is Part Of Architecture

Group 10 documentation mein future developer ko ye samajh aana chahiye:

```text
Why AcademicSession exists?
Why Enrollment is separate?
Why TeacherAssignment is separate?
Why ClassSubject exists?
Why history is preserved?
Why some records are not hard deleted?
```

Sirf schema list karna documentation nahi.

---

# 80. Group 10 Testing Strategy

### Academic Session

Test:

* valid creation
* invalid dates
* duplicate session
* invalid status transition
* active-session business rule

### Class

Test:

* create
* duplicate
* update
* deactivate/archive

### Section

Test:

* valid class reference
* invalid class
* duplicate section within class
* section belonging to wrong class

### Subject

Test:

* duplicate subject
* invalid data
* inactive subject behavior

### ClassSubject

Test:

* valid class + subject
* duplicate relationship
* inactive class
* inactive subject

### Teacher Assignment

Test:

* valid assignment
* duplicate assignment
* invalid teacher
* invalid section
* wrong class/section
* subject not offered in class
* inactive session

### Enrollment

Test:

* valid enrollment
* duplicate enrollment
* invalid student
* invalid section
* section/class mismatch
* inactive session
* transfer
* historical enrollment

---

# 81. Security Testing

Test:

```text
No authentication
      ↓
403/401 according to API contract
```

Wrong role:

```text
Student
 ↓
Create Class
 ↓
DENY
```

Wrong ownership/context:

```text
Teacher A
 ↓
Teacher B's assigned section
 ↓
DENY
```

Tampered IDs:

```text
Client changes studentId
 ↓
Backend verifies relationship
 ↓
DENY if unauthorized
```

---

# 82. Data Integrity Testing

Important tests:

```text
Class without valid session/context
Section without class
ClassSubject without class
ClassSubject without subject
TeacherAssignment with invalid teacher
TeacherAssignment with invalid section
Enrollment with invalid student
Enrollment with section from wrong class
Duplicate active enrollment
Duplicate assignment
```

System ko invalid graph create nahi karne dena.

---

# 83. Group 10 Definition of Done

Group 10 complete tab hoga jab:

```text
Documentation
      ↓
Models
      ↓
Relationships
      ↓
Business Rules
      ↓
Services
      ↓
Controllers
      ↓
Routes
      ↓
Validation
      ↓
Authorization
      ↓
Database Integrity
      ↓
Transactions where required
      ↓
Unit Tests
      ↓
Integration Tests
      ↓
Edge Cases
      ↓
Performance Review
      ↓
Group Verification
```

sab complete aur verified hon.

---

# 84. Group 10 Mein Kya Nahi Karna

Group 10 ke andar unnecessarily:

❌ Attendance

❌ Assignment submission

❌ Exams

❌ Results

❌ Fees

❌ Notifications

❌ AI prediction

❌ Redis caching

❌ BullMQ jobs

❌ WebSockets

implement nahi karenge.

Agar academic module ko in future modules ke liye reference dena hai, architecture mein clean boundaries rakhenge.

---

# 85. Group 10 → Group 11 Connection

Group 10 ke end par system ko pata hoga:

```text
Ali
 ↓
2026–27
 ↓
Class 9
 ↓
Section A
```

Teacher:

```text
Ahmed
 ↓
2026–27
 ↓
Biology
 ↓
Class 9
 ↓
Section A
```

Ab Group 11 Attendance naturally pooch sakta hai:

> "Ahmed ki assigned class 9-A mein Ali ki attendance kis date ko kya thi?"

Ye Group 10 ki correct foundation ki wajah se possible hoga.

---

# 86. Senior System Designer Ka Mental Model

Academic module banate waqt senior developer sirf ye nahi sochta:

> "Class ka CRUD kaise banau?"

Woh sochta hai:

```text
What is the real-world entity?
        ↓
Is it permanent or time-dependent?
        ↓
Is it an independent resource?
        ↓
What is its relationship with other entities?
        ↓
What history must survive?
        ↓
Who can create it?
        ↓
Who can modify it?
        ↓
What makes it invalid?
        ↓
What happens if operation partially fails?
        ↓
What queries will be common?
        ↓
What indexes will those queries need?
        ↓
What happens at 100 users?
        ↓
What happens at 100,000 users?
        ↓
How will future modules depend on it?
```

**Yehi difference hai CRUD developer aur system designer mein.**

---

# 87. Final Academic Architecture

```text
                    ACADEMIC MANAGEMENT
                            │
                            ↓
                    Academic Session
                            │
                 ┌──────────┴──────────┐
                 ↓                     ↓
               Class                Subject
                 │                     │
                 ↓                     │
              Section                  │
                 │                     │
                 └─────────┬───────────┘
                           ↓
                     ClassSubject
                           │
             ┌─────────────┴─────────────┐
             ↓                           ↓
       Teacher Assignment           Enrollment
             ↓                           ↓
          Teacher                     Student
             │                           │
             └───────────┬───────────────┘
                         ↓
                  Academic Context
                         ↓
              Attendance / Assignment
              Examination / Results
              Reports / Analytics
```

---

# 88. 10 Saal Baad Yaad Rakhne Wali Definition

Agar tum 10 saal baad Group 10 kholo, bas ye yaad rakhna:

> **Academic Session batati hai "kab", Class batati hai "kaunsa academic level", Section batata hai "kaunsa group", Subject batata hai "kya padhaya ja raha hai", ClassSubject batata hai "kis class mein kya subject hai", Teacher Assignment batati hai "kaun kis context mein padha raha hai", aur Enrollment batati hai "student kis academic context mein enrolled hai."**

Aur sabse important:

> **Teacher aur Student ki permanent identity ko unki time-based academic assignments/enrollments se separate rakha gaya hai taake history overwrite na ho aur future modules reliable academic context par build ho saken.**

## Group 10 Ka Final Senior Principle

```text
Permanent Identity
        ≠
Academic State
        ≠
Academic Relationship
        ≠
Historical Record
```

Aur isi separation ki wajah se future:

```text
Attendance
→ Assignments
→ Exams
→ Results
→ Fees
→ Reports
→ AI Analytics
```

ek clean academic foundation ke upar build kiye ja sakenge.

---

# Group 10 Implementation in This Backend

This section records the concrete Group 10 scope implemented in this repository. It takes precedence over earlier examples that describe future possibilities as if they already exist.

## 89. Ownership and Folder Placement

No new top-level backend folder was needed. The existing folder guide already reserves `models/academic/` and `services/academic/`; the implementation uses those boundaries and the existing admin route/controller and validator conventions.

```text
backend/
├── models/academic/
│   ├── AcademicSession.js
│   ├── Class.js
│   ├── Section.js
│   ├── Subject.js
│   └── ClassSubject.js
├── services/academic/academic.service.js
├── validators/academic/academic.validator.js
├── controllers/admin/academic.controller.js
├── routes/admin/academic.routes.js
└── tests/academic.test.js
```

`StudentEnrollment` and `TeacherAssignment` remain in their existing Group 6 relationship models and service. Group 10 does not duplicate those historical records; it supplies the referenced academic entities and the relationship service now verifies that the selected session, class, section, subject, and class-subject offering are valid before creating enrollment or teaching-assignment records.

## 90. Implemented Resources and API Boundary

All catalog endpoints are under `/api/v1/admin/academics` and require authentication plus the admin-only `ACADEMIC_MANAGE` permission.

| Resource | Endpoints | Main responsibility |
|---|---|---|
| Academic sessions | `GET/POST /sessions`, `GET/PATCH /sessions/:recordId`, `PATCH /sessions/:recordId/status` | Calendar period, date-range integrity, and explicit lifecycle transitions |
| Classes | `GET/POST /classes`, `GET/PATCH /classes/:recordId` | Institution's stable grade/class catalogue |
| Sections | `GET/POST /sections`, `GET/PATCH /sections/:recordId` | Section belongs to one class; optional room and capacity metadata |
| Subjects | `GET/POST /subjects`, `GET/PATCH /subjects/:recordId` | Reusable subject catalogue with a unique subject code |
| Class-subject offerings | `GET/POST /class-subjects`, `GET/PATCH /class-subjects/:recordId` | Which subjects a class offers, with elective and weekly-period metadata |

Collection responses are bounded to a maximum page size of 100 and use the same opaque keyset-cursor pattern as the existing relationship APIs. List responses use `{ success, data, pagination }`; create/read/update responses use `{ success, data }`. Academic records are not hard-deleted through these APIs; supported catalogue resources use `ACTIVE`/`INACTIVE` states so references and history are not silently destroyed.

## 91. Invariants Enforced

- Session start date must be earlier than end date; session date ranges may not overlap, including archived periods.
- Only one session may have `ACTIVE` status. The partial unique MongoDB index is the final concurrency guard for this invariant.
- Session status transitions are limited to `PLANNED -> ACTIVE -> COMPLETED -> ARCHIVED`; a planned session may also be archived. Only planned sessions may have their name or dates edited.
- A section can only be created under an active class, and its `(classId, sectionName)` pair is unique.
- A class-subject offering can only be created when both referenced class and subject are active; `(classId, subjectId)` is unique.
- New enrollment and teacher-assignment records require a `PLANNED` or `ACTIVE` session, active class, and active section belonging to that class. A teacher assignment additionally requires an active subject that is offered to that class.
- Request schemas reject unknown fields and malformed ObjectIds before service execution. Database unique indexes backstop duplicate checks under concurrent requests.

Session overlap is checked by the service because a date-range overlap cannot be represented by a normal MongoDB unique index. The single-active-session constraint, in contrast, is enforced by a database index as well as the service check.

## 92. Deliberate Group 10 Scope

This group establishes academic catalog and placement context only. It does not implement attendance, timetables, homework/submissions, examinations, results, fees, notifications, reporting, or promotion workflows. Those later groups should consume the academic IDs and historical relationships rather than adding their state to class, section, student-profile, or teacher-profile documents.

No repository, event bus, cache, queue, microservice, or generic CRUD framework was added. The service uses the existing Mongoose models and controller/route/middleware conventions; this keeps the change aligned with the current modular-monolith backend.

## 93. Automated Verification

The Group 10 automated suite is `backend/tests/academic.test.js`. It covers strict request validation, session date overlap and lifecycle rules, academic reference requirements, and admin-only access/validation through the HTTP middleware chain. `backend/tests/relationship.test.js` also verifies that enrollment and teacher assignment cannot point at mismatched or unoffered academic resources.

Before considering Group 10 complete, run the complete backend suite with `npm test` from `backend/`. Admin-authorized success workflows also need manual API verification against the configured MongoDB database because this repository does not provision an ADMIN account or a disposable database for the manual workflow.

## 94. Manual Admin API Verification Order

Use a real ADMIN access token in the `Authorization: Bearer <token>` header. Do not place the token in the JSON body. Verify one request and its actual HTTP status/response before moving to the next request.

Recommended dependency order:

1. Create and list an academic session; then verify an invalid date range and an overlapping range are rejected.
2. Create and list a class.
3. Create a section under that class; verify an unknown class and a duplicate section are rejected.
4. Create and list a subject.
5. Offer that subject to the class through a class-subject record; verify invalid references and duplicate offerings are rejected.
6. Change the planned session to active; verify a second active session and invalid status transitions are rejected.
7. Create an enrollment and teacher assignment through the existing Group 6 relationship APIs using these academic IDs; verify mismatched section/class and unoffered-subject cases are rejected.

The first successful manual request should be session creation. Later requests depend on IDs returned by earlier responses. Route-level denial for non-admin users and invalid-payload handling are automated; an ADMIN account is required to manually prove successful authorized writes.
