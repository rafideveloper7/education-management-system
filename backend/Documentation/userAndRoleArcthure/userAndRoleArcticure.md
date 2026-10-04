EduOS — Group 4
User & Role Profile Architecture

Document Type: Architecture + Implementation Specification
Project: EduOS — Education Management System
Group: 4
Status: Design Specification
Depends On: Authentication + Authorization
Next Groups: Dynamic Relationships → MongoDB/Data Architecture → REST API Engineering

1. Group 4 for Simple Purpose

EduOS mein har person ka ek User Account hoga.

Lekin User Account sirf login aur system identity ke liye hoga.

Us person ki institution-specific information ek Profile mein hogi.

Simple:

USER
 ↓
Login / Identity
 ↓
ROLE
 ↓
ROLE PROFILE
 ↓
Institution-specific information

Example:

Ali
 ↓
User Account
 ↓
Role = STUDENT
 ↓
Student Profile
 ↓
Admission No
Roll No
Personal Information
2. Non-Technical Person to Liye Explanation

Imagine karo ek school hai.

School to paas Ali ka ek login account hai:

Ali
Email: ali@gmail.com
Role: Student

Ye account sirf ye batata hai:

"Ali system mein kaun hai aur login kar sakta hai."

Lekin school ko Ali ke baare mein aur information bhi chahiye:

Admission No
Roll No
Date of Birth
Class
Section
Address

Ye sab Student Profile ka part hai.

Isliye:

User Account
=
System mein Ali ka account

Student Profile
=
School mein Ali ka student record
3. Ye Dono Separate Kyun Hain?

Hum User mein sab kuch nahi daalenge.

Agar hum aisa karein:

User
 ├── email
 ├── password
 ├── role
 ├── admissionNo
 ├── rollNo
 ├── employeeId
 ├── qualification
 ├── department
 ├── occupation
 └── ...

to problem hogi.

Student ko:

employeeId ❌
qualification ❌

ki zarurat nahi.

Teacher ko:

admissionNo ❌
rollNo ❌

ki zarurat nahi.

My parents:

employeeId ❌
classId ❌

ki zarurat nahi.

Isliye common account information aur role-specific information separate rakhenge.

4. Golden Rule

Is project ka main rule:

Authentication identity ko centralize karo, domain information ko role-specific profiles mein separate rakho.

Simple words:

User
=
System mein kaun?

Profile
=
Institution mein kya role/details?

Relationship
=
Kis se connected?

Authorization
=
Kya access allowed hai?
5. EduOS Ke User Roles

Current system mein roles:

ADMIN
TEACHER
STUDENT
PARENT
PUBLIC_USER

Role ka purpose sirf category identify karna hai.

Example:

Ahmed
Role = TEACHER

Iska matlab:

Ahmed system mein Teacher category ka user hai.

Role ye nahi batata ke Ahmed kis class ko padhata hai .

Wo information future Teaching Assignment mein hogi.

6. User Account

User Account common authentication aur identity information rakhega.

Conceptually:

User
├── id
├── email
├── passwordHash
├── role
├── status
├── createdAt
└── updatedAt
User Account and responsibility

User Account:

login identity maintain karega
authentication information rakhega
role identify karega
account status maintain karega
timestamps maintain karega

User Account mein unnecessary academic/domain information nahi rakhi jayegi.

7. User Account Mein Kya Nahi Hoga?

Normally ye fields User Account mein nahi hongi:

admissionNo
rollNo
employeeId
qualification
classId
sectionId
children
subjectId

Kyun?

Because ye role/domain-specific information hi.

8. Profile Architecture

Role according to profile ho sakti hai:

User
 │
 ├── Admin Profile
 ├── Teacher Profile
 ├── Student Profile
 ├── Parent Profile
 └── Public User Profile

Important:

Har role ke liye profile banana automatically mandatory nahi hai. Profile tab hogi jab us role ke liye additional domain information required ho.

9. User aur Profile Ka Connection

Profile machine userIdto through User Account se relationship establish hogi.

Example:

USER
id = user-123
role = STUDENT

Student Profile:

id = student-789
userId = user-123

Relationship:

user-123
   │
   │ userId
   ↓
student-789

Matlab:

user-123wala account student-789Student Profile se connected hai.

10. Ye ID Same Kyun Nahi Hogi?

Ye bohat important concept hi.

User ID
=
User Account ki identity

Profile ID
=
Profile ki identity

Dono alag entities hain, isliye unki IDs alag ho sakti hain.

Example:

User
ID = user-123

Student
ID = student-789
userId = user-123

Ye mismatch nahi hai.

Ye relationship hai.

11. Login To Baad Kya Hoga?

Ali login karta hai.

JWT mein:

userId = user-123

Ali request karta hai:

GET /attendance/student-789

Backend ko ye nahi karna:

user-123 === student-789

because IDs different entities ki hain.

Backend relationship resolve because:

user-123
   ↓
StudentProfile.userId
   ↓
student-789

Phir backend samajh jayega:

Haan, student-789Ali to your user-123Student Profile account, hi.

Ye Group 4 ka extremely important concept hai.

12. Admin Profile

Admin institution to administrative work ko represent karega.

Possible information:

Admin Profile
├── userId
├── fullName
├── phone
├── profilePicture
├── designation
└── departmentId

Example:

User
role = ADMIN

        ↓

Admin Profile

fullName = Ahmed Khan
designation = Principal
department = Administration

Admin ki permissions profile mein hard-coded nahi karni.

Authorization system role/permission/policy to through access decide because.

13. Teacher Profile

Teacher Profile teacher ki permanent/professional identity represents karega.

Possible information:

Teacher Profile
├── userId
├── fullName
├── phone
├── profilePicture
├── employeeId
├── departmentId
├── designation
├── qualification
└── joiningDate

Example:

Ahmed
 ↓
Teacher Profile

Employee ID = EMP-101
Qualification = MS Biology
Designation = Lecturer
14. Important: Teacher Ki Class Profile Mein Nahi

Hum ye nahi karenge:

Teacher
 ├── classId
 └── subjectId

as permanent profile information.

Kyun?

Because teacher ki assignment change hoti hai.

Example:

2026–27
Ahmed → Biology → Class 9-A

2027–28
Ahmed → Biology → Class 10-B

Ahmed wahi teacher hai.

Sirf assignment change hui.

Isliye:

Teacher Profile
≠
Teaching Assignment

Teaching Assignment Group 5 mein handle hogi.

15. Student Profile

Student Profile student ki institutional/personal identity represent karega.

Possible information:

Student Profile
├── userId
├── fullName
├── dateOfBirth
├── gender
├── bloodGroup
├── profilePicture
├── admissionNo
├── rollNo
├── address
└── emergencyContact
16. Important: Student Ki Class Profile Mein Permanent Nahi

Hum ye assume nahi karenge:

Student
 ├── classId
 └── sectionId

as permanent academic identity.

Because student ki class change hoti hai.

Example:

2026–27
Ali → Class 8-A

2027–28
Ali → Class 9-B

Ali ka Student Profile same hai.

Academic placement change hui.

Isliye:

Student Profile
≠
Student Enrollment

Student Enrollment Group 5 mein handle hogi.

17. Parent Profile

Parent Profile parent/guardian ki information rakhegi.

Possible information:

Parent Profile
├── userId
├── fullName
├── phone
├── alternatePhone
├── address
├── occupation
└── profilePicture

Lekin children ko simple permanent:

children: [...]

ke through blindly model nahi karenge.

Parent aur Student ka connection relationship hai.

Ye Group 5 mein properly model hoga.

18. Parent–Student Relationship

Real school mein:

Student Ali
 ├── Father Ahmed
 ├── Mother Sara
 └── Guardian Bilal

Aura:

Ahmed
 ├── Ali
 ├── Hamza
 └── Sara

Isliye relationship potentially many-to-many nature rakh sakti hai.

Hum sirf:

student.parentId

par architecture depend nahi karenge.

19. Relationship Ki Information

Future relationship model ko ye information support karni hogi:

Person
+
Student
+
Relationship Type
+
Status
+
Effective Dates
+
History

Examples:

FATHER
MOTHER
GUARDIAN
UNCLE
AUNT
GRANDPARENT
OTHER

Exact allowed values ​​business requirements to according finalize hongi.

20. Relationship History

Important relationships ko delete karke history destroy nahi karni.

Example:

2026
Ahmed → Father → Active

Later:

Ahmed → Father → Deceased

Later:

Bilal → Guardian → Active

System historical information preserve karega.

21. Account Status vs Profile/Relationship Status

Inko mix nahi karna.

Account Status
ACTIVE
DEACTIVATED

Ye login/account to baare mein hai.

Relationship Status
ACTIVE
ENDED
DECEASED

Ye relationship ke baare mein hai.

Example:

Bilal User Account
Status = ACTIVE

Lekin:

Bilal → Ali
Guardian Relationship
Status = ENDED

Bilal system mein active ho sakta hai, lekin Ali ka data access nahi kar sakta.

22. Public User Profile

Public user academic user nahi hai.

Example:

Visitor
 ↓
Register
 ↓
PUBLIC_USER

Possible profile:

Public User Profile
├── userId
├── fullName
├── phone
└── profilePicture

Public User ko automatically:

Student data ❌
Teacher data ❌
Parent data ❌
Admin data ❌

access nahi milega.

Authorization rules are access ko control karenge.

23. Profile vs Relationship

Ye difference yaad rakhna bohat important hai.

Profile
Ahmed
 ↓
Teacher Profile
 ↓
Employee ID
Qualification
Department

Ye Ahmed ke baare mein information hai.

Relationship
Ahmed
 ↓
Teaching Assignment
 ↓
Biology
 ↓
Class 9-A
 ↓
2026–27

Ye Ahmed aur academic entities ke darmiyan connection hai.

24. Profile vs Resource

Profile:

Student Profile

Resources:

Attendance
Result
Assignment
Fee

Student Profile batata hai student kaun hai .

Resource us student se related actual business data hai.

25. Authorization to Saath Connection

Group 4 Authorization ko replace nahi karega.

Ye Authorization ko required identity/profile data provided karega.

Overall flow:

Request
   ↓
Authentication
   ↓
User
   ↓
Role
   ↓
Profile
   ↓
Relationship
   ↓
Resource
   ↓
Authorization Policy
   ↓
ALLOW / DENY

Example:

Ali Login
 ↓
userId = user-123
 ↓
Student Profile = student-789
 ↓
Requested Attendance = student-789
 ↓
Ownership check
 ↓
ALLOW
26. Teacher Authorization Example
Ahmed
 ↓
Teacher User
 ↓
Teacher Profile
 ↓
Teaching Assignment
 ↓
Biology + Class 9-A + Session 2026–27
 ↓
Student Resource
 ↓
Authorization

Teacher ko sirf role TEACHERhone ki face se har student ka data automatically nahi milega.

Actual relationship/assignment bhi check hogi.

27. Parent Authorization Example
Bilal
 ↓
Parent Profile
 ↓
Active Guardian Relationship
 ↓
Ali
 ↓
Attendance
 ↓
Authorization
 ↓
ALLOW

So that Bilal ka Ali has an active relationship now:

Relationship?
NO
 ↓
DENY
28. Group 4 Ki Responsibility

Group 4 ka kaam:

Include
User Account/Profile separation
Role-specific profile architecture
Profile ownership viauserId
Admin Profile
Teacher Profile
Student Profile
Parent Profile
Public User Profile
Account/profile lifecycle concepts
Profile status concepts
Authorization to the current profile connection
Not Yet

Group 4 mein hum detailed implementation of:

Parent-Student Relationship
Student Enrollment
Teacher Assignment

nahi karenge.

Ye Group 5 — Dynamic Relationships ka responsibility hai.

Similarly:

Attendance
Results
Fees
Exams

Group 4 ka part nahi hain.

29. Group 4 Ka Data Ownership Rule

Simple rule:

User
↓
Authentication + common identity
Profile
↓
Role-specific information
Relationship
↓
Entities ke darmiyan connection
Resource
↓
Business data
Authorization
↓
Access decision
30. Suggested Logical Architecture
                    USER
                     │
                     │ userId
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Student     Teacher     Parent
       Profile     Profile     Profile
          │          │          │
          └──────────┼──────────┘
                     ↓
              Relationships
                     ↓
                 Resources
                     ↓
              Authorization

Admin aur Public User bhi isi central User Account architecture ka part honge.

31. Responsibilities by Layer

Ye distinction future development mein maintain because hi.

Model

Data structure.

What does the data look like?
Service

Business workflow.

What should the system do?
Middleware

Request-level gatekeeping.

Can this request continue?
Policy

Authorization decision.

Is this action allowed?
Controller

HTTP request/response handling.

Request lo → service call karo → response do

Profile model to andar authorization logic nahi bharna.

32. Validation Principles

Profile creation/update to waqt:

required fields validate hon
email rules User Account level par hon
role valid ho
role-specific fields correct hon
duplicate identifiers prevent kiye jayen where required
invalid references reject hon
unauthorized users profile modify na kar saken

Exact validation rules implementation to waqt finalize/document ki jayengi.

33. Security Principles
Password

Password profile mein nahi hoga.

User
 ↓
passwordHash
Profile

Mein profile plain password now.

Student Profile
❌ password
❌ passwordHash
Authorization

Frontend par profile hide because security nahi hai.

Backend authorization enforcement karega.

Ownership

userIdrelationship ko resolve karke actual profile ownership verify ki jayegi.

34. Indexing Considerations

Final indexes Group 6 mein decide honge.

Likely important lookup fields:

User.email
Profile.userId
Student.admissionNo
Student.rollNo
Teacher.employeeId

Lekin index blindly nahi banayenge.

Har index ka reason documented hoga:

Field
↓
Query pattern
↓
Index reason
35. Lifecycle

Profile lifecycle account lifecycle completely same hona zaroori nahi.

Example:

User Account
ACTIVE

Student profile institution mein:

ACTIVE

Later student:

ALUMNI

Ko account immediately deleted because Zaroori nahi.

Historical institutional information preserve rehni chahiye.

Exact statuses requirements to according finalize honge.

36. Important Edge Cases

Implementation to waqt in cases ko consider because hi:

Case 1

User exists but profile missing.

User = STUDENT
Student Profile = missing

System ko inconsistent state handle karni hogi.

Case 2

Profile exists but User missing.

Ye normally invalid/orphan state hogi.

Case 3

Wrong role profile.

User.role = STUDENT

lekin Teacher Profile linked ho.

System ko is inconsistency ko allow nahi karna chahiye.

Case 4

Duplicate employee ID.

EMP-101

do teachers ko assign nahi hona chahiye if business rule says unique.

Case 5

Duplicate admission number.

Admission number uniqueness requirement enforce hogi.

37. Group 4 Testing Strategy

Hum sirf "code chal style" ko success nahi maanenge.

Testing layers:

Unit Tests
   ↓
Integration Tests
   ↓
Database Tests
   ↓
API Tests
   ↓
Authorization Tests

Examples:

User
valid user create
invalid role reject
duplicate email reject
Student Profile
valid profile create
valid userIdconnection
missing user reject
duplicate admission number rejected
Teacher Profile
valid teacher profile
duplicate employee ID handling
invalid user relationship reject
Parent Profile
valid parent profile
correct User ↔ Parent relationship
Authorization
user can access own profile
unauthorized user denied
wrong role denied
38. Definition of Done — Group 4

Group 4 ko tab COMPLETE kahenge jab:

✅ Documentation finalized
✅ User/Profile architecture implemented
✅ All required profile models implemented
✅ userId relationships working
✅ Validation implemented
✅ Relevant indexes defined
✅ Unit tests passed
✅ Integration tests passed
✅ Database behavior verified
✅ Authorization interaction verified
✅ Edge cases tested
✅ No critical issues remaining

Sirf:

"Models ban gaye"

ka matlab Group 4 complete nahi hoga.

39. Group 4 Ke Baad

Group 4 complete hone ke baad:

GROUP 5
Dynamic Relationships

start hoga.

Wahan hum properly design/implement because:

Parent ↔ Student
Student ↔ Academic Session ↔ Class ↔ Section
Teacher ↔ Subject ↔ Class ↔ Section ↔ Academic Session

Aura:

status
effective dates
history
lifecycle
40. Group 4 → Group 5 Connection

Example:

Group 4:

User
 ↓
Student Profile

Group 5:

Student Profile
 ↓
Student Enrollment
 ↓
Academic Session
 ↓
Class
 ↓
Section

Teacher:

User
 ↓
Teacher Profile
 ↓
Teaching Assignment
 ↓
Subject
 ↓
Class
 ↓
Section
 ↓
Academic Session

Parents:

User
 ↓
Parent Profile
 ↓
Parent-Student Relationship
 ↓
Student Profile
41. AI Coding Agent Ke Liye Important Rule

Is document ko implementation contract ki tarah treat kiya jayega.

AI ko:

Pehle existing project inspection karna hi.

Phir:

Existing architecture ko preserve karte hue Group 4 implement karna hai.

AI ko bina inspection:

❌ new architecture invent nahi karni
❌ existing files unnecessarily rewrite nahi karni
❌ unrelated groups implement nahi karne
❌ Group 5 relationships prematurely implement nahi karni
❌ Attendance/Results implement nahi karne
❌ existing authentication/authorization break nahi karni

So that existing code aur documentation mein conflict mile:

STOP
↓
Conflict report
↓
Explain
↓
Approval
↓
Implementation
42. 10 Saal Baad Is Document Ko Dekhne Par

Tumhe ye samajh aana chahiye:

EduOS mein User Account login aur common identity ke liye hai. Role Profile institution-specific information ke liye hai. Dono userIdrelationship to through connected hain. Dynamic relationships alag layer mein model hoti hain, aur authorization in relationships ko use karke resource access decide karti hai.

Bas ye architecture ka core hai.

43. One-Page Mental Model
                         EDUOS
                           │
                           ↓
                         USER
                           │
                    Login / Identity
                           │
                           ↓
                          ROLE
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
       STUDENT           TEACHER          PARENT
       PROFILE           PROFILE          PROFILE
          │                │                │
          │                │                │
          └────────────────┼────────────────┘
                           ↓
                    RELATIONSHIPS
                     [GROUP 5]
                           ↓
                       RESOURCES
                           ↓
                    AUTHORIZATION
                           ↓
                     ALLOW / DENY
Golden Formula Final
USER
=
System mein kaun?

PROFILE
=
Institution mein ye kaun hai?

RELATIONSHIP
=
Ye kis se connected hai?

RESOURCE
=
Is person/entity ka actual business data kya hai?

AUTHORIZATION
=
Is user ko is resource par kya karne diya jayega?

Group 4 ka main focus sirf USER → ROLE → PROFILEhai.
PROFILE → DYNAMIC RELATIONSHIPGroup 5 mein properly implement hoga.

Is tarah document future mein human-readable architecture record bhi rahega aur AI coding agent ke liye implementation specification bh