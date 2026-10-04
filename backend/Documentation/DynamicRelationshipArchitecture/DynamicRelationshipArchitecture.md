EduOS — Group 5: Dynamic Relationship Architecture
1. Group 5 ka Purpose

Group 4 mein humne ye decide kiya:

User
 ↓
Role
 ↓
Profile

Ab Group 5 mein hum ye decide karenge:

Profile ka doosre people/entities ke saath connection kaise represent hoga?

Real institution mein relationships permanent nahi hoti.

Example:

Student Ali
    ↓
2026–27
Class 8-A

Next year:

Student Ali
    ↓
2027–28
Class 9-B

Similarly:

Teacher Ahmed
    ↓
2026–27
Biology → Class 9-A

Next year:

Teacher Ahmed
    ↓
2027–28
Biology → Class 10-B

Aur:

Ali
├── Father Ahmed
├── Mother Sara
└── Guardian Bilal

Relationships change ho sakti hain.

Isliye Group 5 ka main principle hai:

Static profile + dynamic relationships + preserved history

2. Relationship Kya Hoti Hai?

Baby style mein:

Relationship = do cheezon ke darmiyan connection.

Example:

Parent
  ↓
  ❤️ Guardian relationship
  ↓
Student

Ya:

Teacher
  ↓
Teaching relationship
  ↓
Subject + Class + Section + Session

Ya:

Student
  ↓
Enrollment relationship
  ↓
Class + Section + Academic Session

Relationship sirf ID nahi hoti.

Ye batati hai:

kaun kis se connected hai?
kis purpose se connected hai?
kab se connected hai?
kab tak connected raha?
current hai ya historical?
relationship ka status kya hai?
3. Group 5 Mein Kaun Se Relationships Honge?

EduOS ke current architecture mein teen major dynamic relationships hain:

1. Parent ↔ Student
Parent
  ↕
Student
2. Student ↔ Academic Session/Class/Section

Isko hum Student Enrollment kahenge.

Student
   ↓
Enrollment
   ↓
Session + Class + Section
3. Teacher ↔ Subject/Class/Section/Session

Isko hum Teaching Assignment kahenge.

Teacher
   ↓
Teaching Assignment
   ↓
Subject + Class + Section + Session
4. Simple Parent ID Kyun Enough Nahi?

Suppose hum Student mein sirf:

parentId

rakh dein.

Problem:

Ali
 ↓
Ahmed

Ab agar Ali ki mother bhi system mein hai?

Ali
├── Father Ahmed
├── Mother Sara
└── Guardian Bilal

Ek parentId enough nahi.

Aur future mein relationship change bhi ho sakti hai.

Isliye hum Parent-Student Relationship ko independent concept samjhenge.

5. Parent-Student Relationship

Conceptually:

Parent/Guardian
      +
   Student
      +
Relationship Type
      +
Relationship Status
      +
Dates

Example:

Ahmed
  ↓
Ali
  ↓
Relationship = FATHER
  ↓
Status = ACTIVE

Sara:

Sara
  ↓
Ali
  ↓
Relationship = MOTHER
  ↓
Status = ACTIVE

Bilal:

Bilal
  ↓
Ali
  ↓
Relationship = GUARDIAN
  ↓
Status = ACTIVE
6. Relationship Type Kya Hai?

Relationship type batata hai:

"Ye person student ka kya lagta hai?"

Examples:

FATHER
MOTHER
GUARDIAN
UNCLE
AUNT
GRANDPARENT
OTHER

Exact values final business requirements ke according define hongi.

Important:

Type ≠ Status

For example:

Type:
FATHER

Status:
ACTIVE
7. Relationship Status Kya Hai?

Status batata hai:

"Ye relationship abhi valid hai ya nahi?"

Example:

Ahmed → Ali
Type = FATHER
Status = ACTIVE

Later relationship historical ho sakti hai:

Ahmed → Ali
Type = FATHER
Status = ENDED

Relationship ka historical record preserve kiya ja sakta hai.

8. Relationship Dates Kyun?

Sirf status kabhi kabhi enough nahi hota.

Hum future mein ye questions answer karna chahenge:

Bilal guardian kab bana?

Ahmed ka relationship kab end hua?

Isliye conceptually:

startDate
endDate

useful hain.

Example:

Bilal
Guardian of Ali

startDate = 2028-03-01
endDate = null
status = ACTIVE

endDate = null ka simple matlab:

Relationship abhi end nahi hui.

9. History Preserve Karna Kyun?

Suppose:

2026
Ahmed → Father → Ali

Later:

2028
Ahmed → Father → Ali
Status = DECEASED

Aur:

2028
Bilal → Guardian → Ali
Status = ACTIVE

Agar Ahmed ka relationship delete kar diya:

❌ Ahmed relationship deleted

to future mein system ko pata hi nahi chalega ke historically Ali ka father kaun tha.

Isliye important relationships ko unnecessarily delete nahi karna.

10. Current vs Historical Relationship

System mein dono concepts honge.

Current
Bilal
 ↓
Guardian
 ↓
Ali
 ↓
ACTIVE
Historical
Ahmed
 ↓
Father
 ↓
Ali
 ↓
ENDED / DECEASED

Isse system current aur past dono samajh sakta hai.

11. Student Enrollment

Ab second major relationship.

Student ki permanent identity:

Ali
Student Profile

Lekin Ali ki class permanently same nahi hoti.

Example:

2026–27
Ali
 ↓
Class 8
 ↓
Section A
2027–28
Ali
 ↓
Class 9
 ↓
Section B

Ali same student hai.

Academic placement change hui hai.

Isliye:

Student Profile
≠
Student Enrollment
12. Student Profile vs Enrollment
Student Profile

Ye Ali ke baare mein relatively stable information hai:

Name
Date of Birth
Admission Number
Profile Picture
Address
...
Enrollment

Ye batata hai:

"Is academic session mein Ali kis class/section mein enrolled tha?"

Student
+
Academic Session
+
Class
+
Section
13. Enrollment Example
Ali
 ↓
Enrollment
 ↓
2026–27
 ↓
Class 8
 ↓
Section A

Next year:

Ali
 ↓
Enrollment
 ↓
2027–28
 ↓
Class 9
 ↓
Section B

Purana enrollment delete nahi karna.

Dono history mein reh sakte hain.

14. Enrollment Se Kya Benefit?

Future mein system questions answer kar sakta hai:

Ali 2026–27 mein kis class mein tha?

Class 8-A

Ali 2027–28 mein kis class mein hai?

Class 9-B

Ye attendance, results, reports aur academic history ke liye important hai.

15. Teaching Assignment

Ab teacher.

Teacher profile:

Ahmed
Employee ID = EMP-101
Qualification = MS Biology
Designation = Teacher

Ye Ahmed ki professional identity hai.

Lekin:

Ahmed → Biology → Class 9-A

ye Ahmed ki permanent profile information nahi.

Ye Teaching Assignment hai.

16. Teaching Assignment Kya Batati Hai?

Simple:

"Is academic session mein ye teacher kis subject ko kis class/section ko padha raha hai?"

Conceptually:

Teacher
+
Subject
+
Class
+
Section
+
Academic Session

Example:

Ahmed
 ↓
Biology
 ↓
Class 9
 ↓
Section A
 ↓
2026–27
17. Next Academic Session

2027–28:

Ahmed
 ↓
Biology
 ↓
Class 10
 ↓
Section B
 ↓
2027–28

Ahmed ki profile change nahi hui.

Assignment change hui.

Isi liye classId ko Teacher Profile mein permanent field nahi banayenge.

18. Teacher Multiple Assignments

Ek teacher ek se zyada assignment rakh sakta hai.

Example:

Ahmed
 ├── Biology → Class 9-A
 ├── Biology → Class 10-A
 └── Chemistry → Class 10-B

Ye institution ke actual rules par depend karega.

Architecture ko unnecessary restriction nahi lagani chahiye.

19. Same Subject, Multiple Teachers

Example:

Biology
 ├── Teacher Ahmed → Class 9
 ├── Teacher Bilal → Class 10
 └── Teacher Sara  → Class 11

Isliye:

Subject.teacherId

jaisi simplistic design restrictive ho sakti hai.

Better concept:

TeachingAssignment

Subject aur teacher ko contextual relationship mein connect karegi.

20. Academic Session Important Kyun Hai?

Because:

2026–27

aur:

2027–28

same institution hain, lekin academic context different hai.

Example:

Ahmed → Biology → Class 9-A → 2026–27

aur:

Ahmed → Biology → Class 10-B → 2027–28

Dono simultaneously database mein exist kar sakte hain.

21. Relationship Ko Separate Model/Collection Kyun?

Yahan senior architecture decision hai.

Agar hum relationship ko profile ke andar permanently bhar dein:

TeacherProfile
 ├── classId
 └── subjectId

to history aur multiple assignments difficult ho sakti hain.

Instead:

TeacherProfile
      │
      ↓
TeachingAssignment
      │
 ┌────┼────┬────┐
 ↓    ↓    ↓    ↓
Teacher Subject Class Section
             +
        Academic Session

Relationship apni independent lifecycle rakh sakti hai.

22. Relationship Lifecycle

Relationship bhi life cycle rakhti hai.

Simple model:

Created
   ↓
Active
   ↓
Ended
   ↓
Historical

Example:

Teacher Assignment

Created
 ↓
Active
 ↓
Session ends
 ↓
Historical

Hum old record ko delete karke history destroy nahi karenge.

23. Account Status, Profile Status Aur Relationship Status

Ye teen different cheezein hain.

Account Status
"User system mein active hai?"

Example:

ACTIVE
DEACTIVATED
Profile Status
"Role profile ki institutional state kya hai?"

Business requirements ke according values ho sakti hain.

Relationship Status
"Ye particular relationship active hai?"

Example:

ACTIVE
ENDED

In teenon ko mix nahi karna.

24. Authorization Ke Saath Connection

Group 3 mein authorization foundation bana tha.

Ab Group 5 us authorization ko real relationship data dega.

Example:

Teacher Ahmed request karta hai:

GET /students/123/results

System ko sirf ye check nahi karna:

Ahmed.role === TEACHER

Balki potentially:

Ahmed
 ↓
Teacher
 ↓
Permission = RESULT_VIEW
 ↓
Teaching Assignment?
 ↓
Is student ki class Ahmed ko assigned hai?
 ↓
YES
 ↓
ALLOW

Agar assignment nahi:

NO
 ↓
DENY

Yani:

Role permission batati hai teacher kya kar sakta hai; relationship batati hai kis resource par kar sakta hai.

25. Parent Authorization

Bilal:

Role = PARENT

Aur:

Bilal → Ali
Guardian
ACTIVE

Bilal Ali ki allowed resources access kar sakta hai.

Lekin:

Bilal → Hamza

koi active relationship nahi.

To:

Hamza attendance
↓
DENY

Relationship authorization ka important input ban jati hai.

26. Technology Decision

Ab technology side.

EduOS:

Node.js
Express.js
MongoDB
Mongoose

use kar raha hai.

Group 5 mein relationships ko MongoDB/Mongoose models ke through represent karenge.

Conceptually:

MongoDB
 ↓
Relationship Collections
 ↓
Documents

Examples:

parent_student_relationships
student_enrollments
teaching_assignments

Actual collection/model naming final folder structure aur existing project conventions verify karke fix hogi.

27. Why MongoDB?

MongoDB already EduOS ka selected database hai.

Benefits:

flexible document model
Mongoose validation
references support
indexes support
relationship documents independently maintain ho sakte hain

Lekin MongoDB ka matlab ye nahi ke relationships automatically easy ho gayi.

Data modeling phir bhi carefully karni hogi.

28. Alternative: Embedded Relationships

Ek alternative hai relationship ko directly profile ke andar embed karna.

Example:

Student
{
   name: "Ali",

   parents: [
      {...},
      {...}
   ]
}

Simple cases mein ye convenient ho sakta hai.

Lekin EduOS mein issue:

Relationship ki apni:

status
dates
history
authorization relevance
lifecycle

hai.

Isliye complex relationships ko independent model karna zyada suitable ho sakta hai.

29. Alternative: Relational Database

Another alternative:

PostgreSQL

with relational tables and foreign keys.

Ye complex relationships ke liye strong option hai.

Lekin current EduOS architecture mein MongoDB already selected hai.

Isliye sirf relationship ki wajah se database switch karna unnecessary architectural churn hoga.

Decision: MongoDB continue.

Trade-off:

MongoDB
+
Flexible modeling
+
Existing project consistency

BUT

Application-level relationship rules
aur indexes
carefully maintain karne honge.
30. References vs Embedding

Senior-level decision blindly:

"MongoDB hai, sab embed karo."

ya:

"Sab reference karo."

dono wrong approach ho sakti hain.

Decision relationship ke behavior par depend karega.

Embed useful ho sakta hai jab:
small
tightly-owned
rarely queried independently

data ho.

Reference/Separate relationship useful ho sakta hai jab:
relationship has lifecycle
relationship has history
relationship is queried independently
relationship connects multiple entities
relationship affects authorization

EduOS ke major dynamic relationships in characteristics ke close hain.

31. Indexing Strategy

Relationship collections large ho sakti hain.

Suppose:

10,000 students
20,000 parents
100,000 relationships

Har request par entire collection scan karna inefficient ho sakta hai.

Isliye frequently queried fields par indexes consider karenge.

Examples:

userId
studentId
parentId
teacherId
academicSessionId
status

Lekin har field par index nahi lagana.

Index bhi cost rakhta hai:

storage
write overhead
maintenance

Isliye indexes actual query patterns ke according finalize honge.

32. Duplicate Relationships

Ek important edge case:

Kahin accidentally:

Bilal → Ali → GUARDIAN → ACTIVE

do baar create na ho jaye.

System ko business rule define karna hoga:

Same relationship duplicate allowed hai ya nahi?

Agar nahi:

unique constraint/index

ya service-level check use ho sakta hai, depending on MongoDB model.

33. Overlapping Enrollment

Example:

Ali
2026–27 → Class 8-A

Aur accidentally:

Ali
2026–27 → Class 9-B

same time active kar diya.

Ye business problem hai.

System ko enrollment rules define karne honge.

For example:

Student ek academic session mein normally ek active class/section enrollment rakhega.

Exact rule institution requirements se finalize hoga.

34. Overlapping Teacher Assignment

Similarly:

Ahmed
Biology
Class 9-A
2026–27

aur:

Ahmed
Biology
Class 10-B
2026–27

allowed ho sakta hai.

Lekin agar institution ke timetable/business rules ke mutabiq impossible combination ho, to validation required hogi.

Important: Architecture ko unnecessarily business assumptions hard-code nahi karni.

35. Dates vs Status

Sirf:

status = ACTIVE

kabhi enough nahi.

Aur sirf:

startDate
endDate

bhi har case mein enough nahi.

Dono complementary ho sakte hain.

Example:

status = ACTIVE
startDate = 2028-01-01
endDate = null

Historical:

status = ENDED
startDate = 2026-01-01
endDate = 2027-12-31

Actual status values aur date semantics implementation se pehle finalize hongi.

36. Soft Delete vs Relationship End

Ye bhi important distinction hai.

Agar relationship end ho:

status = ENDED

Iska matlab:

relationship valid thi, ab active nahi hai.

Ye simple deletion nahi.

Example:

Ahmed → Ali
Father
ENDED

Historical information preserved.

37. Security Consideration

Relationship data sensitive domain information contain kar sakta hai.

Example:

Parent → Student
Guardian

Isliye API ko sirf authenticated user hone par trust nahi karna.

Request:

JWT
 ↓
Authentication
 ↓
Role/Permission
 ↓
Relationship Check
 ↓
Policy
 ↓
Allow/Deny

Relationship data ko directly expose nahi karna.

38. Service Layer Responsibility

Relationship business workflow:

Controller
 ↓
Service
 ↓
Repository/Data Access
 ↓
MongoDB

Service decide kar sakti hai:

relationship create allowed hai?
duplicate hai?
previous relationship ka status kya hai?
lifecycle transition valid hai?
enrollment conflict hai?
assignment conflict hai?

Controller mein ye business logic nahi bharna.

39. Policy Responsibility

Policy ka kaam:

"Is actor ko is particular resource/relationship context mein action allowed hai?"

Example:

Teacher
 ↓
Teaching Assignment
 ↓
Student
 ↓
Result

Policy relationship context evaluate kar sakti hai.

40. Middleware vs Policy

Simple difference:

Middleware
"Request andar aa sakti hai?"
Policy
"Is user ko ye specific action/resource allowed hai?"

Example:

Request
 ↓
Authentication Middleware
 ↓
Permission Middleware
 ↓
Controller/Service
 ↓
Policy
 ↓
ALLOW / DENY

Middleware = gatekeeper

Policy = decision maker

41. Group 5 Ka Expected Data Model

High-level architecture:

USER
 │
 ├── STUDENT PROFILE
 │       │
 │       ├── ENROLLMENT
 │       │      ├── Session
 │       │      ├── Class
 │       │      └── Section
 │       │
 │       └── PARENT/GUARDIAN RELATIONSHIPS
 │
 ├── TEACHER PROFILE
 │       │
 │       └── TEACHING ASSIGNMENTS
 │              ├── Session
 │              ├── Subject
 │              ├── Class
 │              └── Section
 │
 └── PARENT PROFILE
         │
         └── PARENT/STUDENT RELATIONSHIPS
42. Group 5 Mein Kya Implement Hoga?
Relationship 1

Parent/Guardian ↔ Student

Support:

relationship type
status
dates
history
multiple children
multiple guardians/parents
Relationship 2

Student ↔ Academic Session/Class/Section

Support:

enrollment
session history
class changes
section changes
lifecycle
Relationship 3

Teacher ↔ Subject/Class/Section/Academic Session

Support:

teaching assignments
multiple assignments
session-based changes
historical assignments
lifecycle
43. Group 5 Mein Kya Nahi Hoga?

Important scope control.

Group 5 ka focus relationship architecture hai.

Hum yahan automatically:

Attendance
Results
Fees
Exams
Notifications

implement nahi karenge.

Lekin un future modules ke liye relationship foundation ready karenge.

Example:

Attendance later pooch sake:

Student ki current enrollment kya hai?

Results later pooch sake:

Is session mein subject ka teacher kaun tha?

Parent dashboard later pooch sake:

Is parent ke active children kaun hain?
44. Group 5 Ka Implementation Flow

Hum directly code nahi likhenge.

Senior workflow:

Documentation
     ↓
Business Rules
     ↓
Entity/Relationship Design
     ↓
Data Model
     ↓
Validation Rules
     ↓
Indexes
     ↓
Mongoose Schemas/Models
     ↓
Repository
     ↓
Service
     ↓
API
     ↓
Authorization Integration
     ↓
Tests
     ↓
Verification
45. Group 5 Testing Strategy

Har relationship ke tests honge.

Parent/Student

Test cases:

Create valid relationship
Duplicate relationship
Invalid relationship type
End relationship
Current relationship lookup
Historical relationship lookup
Multiple children
Multiple guardians
Unauthorized access
Student Enrollment
Create enrollment
Duplicate enrollment
Session change
Section change
Historical enrollment
Invalid student
Invalid session
Teacher Assignment
Create assignment
Multiple assignments
Session change
Historical assignment
Invalid teacher
Invalid subject
Invalid class
Invalid section
46. Group 5 Completion Rule

Group 5 ko tab COMPLETE nahi kahenge jab sirf models ban jayein.

Complete ka matlab:

Documentation
      +
Business Rules
      +
Models
      +
Validation
      +
Indexes
      +
Services
      +
APIs
      +
Authorization integration
      +
Tests
      +
Tests passed

Tab:

GROUP 5
= COMPLETE
47. Group 5 Ka Senior Design Principle

Sabse important:

Relationship ko sirf foreign key/ID mat samjho.

Relationship bhi domain entity ho sakti hai.

Example:

Teacher
+
Subject
+
Class
+
Section
+
Academic Session

Ye sirf 5 IDs nahi.

Ye ek meaningful business fact hai:

"Ahmed ne 2026–27 mein Class 9-A ko Biology teach ki."

Similarly:

"Ali 2026–27 mein Class 8-A mein enrolled tha."

Aur:

"Bilal 2028 se Ali ka active guardian hai."

Ye statements hi actual domain relationships hain.

48. 10 Saal Baad Tumhe Kya Samajh Aana Chahiye?

Agar tum 2036 mein ye documentation kholo, tumhe instantly samajh aana chahiye:

Group 5
   ↓
Dynamic Relationships

Aur:

Parent ↔ Student
Student ↔ Enrollment
Teacher ↔ Teaching Assignment

Aur har relationship:

Type
Status
Dates
Lifecycle
History
Authorization Impact

rakhti hai.

49. Final Architecture
                     EDUOS
                       │
                     USERS
                       │
                 ┌─────┴─────┐
                 ↓           ↓
             PROFILES    AUTHENTICATION
                 │
                 ↓
          DYNAMIC RELATIONSHIPS
                 │
       ┌─────────┼───────────┐
       ↓         ↓           ↓
   PARENT/    STUDENT     TEACHER
   STUDENT    ENROLLMENT  ASSIGNMENT
       │         │           │
       ↓         ↓           ↓
    Student    Session     Session
    Parent     Class       Subject
    Guardian   Section     Class
    Status                 Section
    Dates                  Status
    History                History
       │         │           │
       └─────────┼───────────┘
                 ↓
              RESOURCES
                 ↓
           AUTHORIZATION
                 ↓
             ALLOW/DENY
Group 5 ka Golden Formula
PROFILE
   ↓
DYNAMIC RELATIONSHIP
   ↓
CURRENT STATE
   +
HISTORICAL STATE
   ↓
RESOURCE ACCESS
   ↓
AUTHORIZATION

Aur sabse important senior principle:

Person ki identity ko profile mein rakho; time ke saath change hone wale connections ko relationship mein rakho.

Isi wajah se Teacher ki class Teacher Profile mein nahi, Student ki current class Student Profile mein blindly nahi, aur Parent ko simple parentId se unnecessarily restrict nahi karenge.

## Implementation Ki Tafseel

Relationship APIs `/api/v1/admin/relationships` ke neeche hain. Inhein use karne ke liye admin ka authenticated access token aur us relationship ki manage permission zaroori hai.

| Relationship | Create aur list | ID se record dekhna | Relationship band karna |
| --- | --- | --- | --- |
| Parent-student | `POST/GET /parent-students` | `GET /parent-students/:relationshipId` | `PATCH /parent-students/:relationshipId/close` |
| Student enrollment | `POST/GET /student-enrollments` | `GET /student-enrollments/:relationshipId` | `PATCH /student-enrollments/:relationshipId/close` |
| Teacher assignment | `POST/GET /teacher-assignments` | `GET /teacher-assignments/:relationshipId` | `PATCH /teacher-assignments/:relationshipId/close` |

Naya relationship `ACTIVE` status se banta hai. Close karne par status aur `validTo` update hote hain; purana record delete nahi hota, is liye history rehti hai. Ek jaisa active relationship dobara banane ki request reject hoti hai. Linked user account active hona chahiye aur uska role relationship ke mutabiq hona chahiye.

Academic session, class, section aur subject ke IDs ka filhaal ObjectId format verify hota hai. In IDs ke peeche asal records maujood hain ya nahi, ye abhi verify nahi kiya ja sakta kyunki academic master-data models backend mein abhi nahi hain. Un models ke baad existence checks add karne honge.

Automated checks chalane ke commands:

```bash
node --test backend/tests/relationship.test.js
node --test backend/authorization/test/authorization.test.js
```