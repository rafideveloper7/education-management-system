EduOS — Authorization

1. Authorization Kya Hai?

Authorization ka simple matlab hai:

«Login karne ke baad system decide karta hai ke user ko kya karne ki permission hai.»

Authentication aur Authorization ko confuse nahi karna.

Authentication

Authentication ka question:

«"Aap kaun hain?"»

Example:

User email + password deta hai
        ↓
System verify karta hai
        ↓
User authenticated hai

Authorization

Authorization ka question:

«"Aap kya kar sakte hain?"»

Example:

User authenticated hai
        ↓
Role = STUDENT
        ↓
System check karega:
Student ko attendance dekhne ki permission hai?

Agar permission hai:

ALLOW ✅

Agar permission nahi:

DENY ❌

---

2. EduOS Mein Authorization Kyun Zaroori Hai?

EduOS mein different types ke users hain:

ADMIN
TEACHER
STUDENT
PARENT
PUBLIC_USER

Har user ko same access nahi mil sakta.

Example:

Admin
→ Students manage kar sakta hai

Teacher
→ Assigned classes ki attendance manage kar sakta hai

Student
→ Apni attendance dekh sakta hai

Parent
→ Apne linked children ki attendance dekh sakta hai

Public User
→ Academic records access nahi kar sakta

Isliye backend ko har important request par decide karna hota hai:

«"Kya is user ko ye kaam karne ki permission hai?"»

---

3. Sabse Important Security Rule

«Frontend par button hide karna security nahi hai.»

Example:

Student ko frontend mein "Delete Student" button nazar nahi aa raha.

Iska matlab ye nahi ke student safe hai.

Student manually API request bhej sakta hai:

DELETE /api/v1/students/101

Isliye backend ko khud check karna hoga:

User authenticated?
        ↓
Role kya hai?
        ↓
Permission hai?
        ↓
Resource access allowed hai?
        ↓
Business rules allow karte hain?
        ↓
ALLOW / DENY

Backend actual security boundary hai.

---

4. Authorization Ke Main Levels

EduOS authorization ko hum multiple levels mein samjhenge:

Role
 ↓
Permission
 ↓
Resource Authorization
 ↓
Policy / Business Authorization

Har level ka apna question hai.

---

5. Roles

Role Kya Hai?

Role user ka type batata hai.

EduOS ke roles:

ADMIN
TEACHER
STUDENT
PARENT
PUBLIC_USER

Simple example:

Ahmed → TEACHER
Ali → STUDENT
Sara → PARENT

Role ka question:

«"Ye user kis type ka user hai?"»

---

6. "roles.constants.js"

Ye file system ke available roles ko ek central jagah define karegi.

Conceptually:

ADMIN
TEACHER
STUDENT
PARENT
PUBLIC_USER

Is file ka kaam:

«System mein kaunse roles exist karte hain?»

Iska kaam ye decide karna nahi hai ke role kya kar sakta hai.

For example:

roles.constants.js

ye sirf ye batayegi:

TEACHER exists
STUDENT exists

Ye directly ye decide nahi karegi:

Teacher attendance mark kar sakta hai

Wo permissions/authorization ka kaam hai.

---

7. Permissions

Role broad information deta hai.

Example:

TEACHER

Lekin humein detail mein pata hona chahiye:

«Teacher exactly kya kar sakta hai?»

Iske liye permissions hoti hain.

Examples:

STUDENT_VIEW
STUDENT_CREATE
STUDENT_UPDATE

ATTENDANCE_VIEW
ATTENDANCE_MARK

ASSIGNMENT_VIEW
ASSIGNMENT_CREATE

RESULT_VIEW
RESULT_ENTER
RESULT_PUBLISH

Permission ka simple matlab:

«"User ko kaunsa action karne ki ijazat hai?"»

---

8. "permissions.constants.js"

Ye file available permissions ke names ko centralize karegi.

Example:

ATTENDANCE_VIEW
ATTENDANCE_MARK
RESULT_VIEW
RESULT_ENTER
RESULT_PUBLISH

Important:

Ye file khud decide nahi karti ke:

Student ko ATTENDANCE_VIEW milegi

Ye sirf permission ke naam define karti hai.

Actual authorization configuration/policies decide karengi ke kaunse role ko kaunsi permission milegi.

---

9. RBAC — Role-Based Access Control

RBAC ka full form hai:

«Role-Based Access Control»

Baby-style:

«User ke role ki bunyaad par usko permissions dena.»

Example:

TEACHER
 ↓
ATTENDANCE_VIEW
ATTENDANCE_MARK
ASSIGNMENT_CREATE

Aur:

STUDENT
 ↓
ATTENDANCE_VIEW
RESULT_VIEW
ASSIGNMENT_VIEW

RBAC ka basic question:

«"Is user ke role ko ye permission milti hai?"»

---

10. Role Check Aur Permission Check Mein Difference

Role check:

«"Kya ye user Teacher hai?"»

Permission check:

«"Kya is Teacher ko attendance mark karne ki permission hai?"»

Example:

User
 ↓
Role = TEACHER
 ↓
Permission = ATTENDANCE_MARK

Dono alag concepts hain.

Role:

WHO?

Permission:

WHAT ACTION?

---

11. "permission.middleware.js"

Ye middleware request ke beech mein permission check karega.

Example:

Teacher
 ↓
POST /api/v1/attendance
 ↓
Authentication check
 ↓
Permission check
 ↓
ATTENDANCE_MARK?

Agar permission hai:

ALLOW ✅

Agar permission nahi:

403 Forbidden ❌

Iska simple question:

«"Kya is user ke paas ye specific action karne ki permission hai?"»

---

12. Sirf Role Check Kyun Enough Nahi Hai?

Ye EduOS ka bohot important concept hai.

Suppose:

Student 101
Role = STUDENT

Aur student request karta hai:

GET /api/v1/students/103/attendance

Agar backend sirf ye check kare:

role === STUDENT

to request galti se allow ho sakti hai.

Lekin Student 101 ko Student 103 ka private attendance record nahi milna chahiye.

Isliye humein Resource-Level Authorization chahiye.

---

13. Resource-Level Authorization

Resource ka simple matlab:

«System ka koi specific data/record.»

Examples:

Student 101
Attendance record
Assignment 50
Result 200
Fee record
Admission application

Resource-level authorization ka question:

«"Kya ye particular user is particular resource ko access kar sakta hai?"»

---

14. Student Example

Student 101:

GET /students/101/attendance

Backend:

Logged-in student = 101
Requested student = 101

Access:

ALLOW ✅

Lekin:

GET /students/103/attendance

Backend:

Logged-in student = 101
Requested student = 103

Access:

DENY ❌

Student ka role valid hai.

Student ke paas attendance view permission bhi ho sakti hai.

Lekin specific resource uska nahi hai.

---

15. "ownership.middleware.js"

Is file ka purpose resource-level access check karna hai.

"Ownership" naam simple cases mein useful hai, lekin EduOS mein har resource technically user ki ownership mein nahi hoga.

Kabhi relationship hoga.

Examples:

Student → Own Record
Parent → Linked Child
Teacher → Assigned Class
Teacher → Assigned Subject

Isliye concept ko:

«Resource Access / Relationship Check»

samajhna zyada accurate hai.

---

16. Parent Example

Parent ke children:

101
102

Parent request:

GET /students/101/attendance

Check:

Parent authenticated?       YES
Parent role?                PARENT
Permission?                 YES
Child 101 linked?           YES

Result:

ALLOW ✅

Ab:

GET /students/103/attendance

Check:

Parent authenticated?       YES
Parent role?                PARENT
Permission?                 YES
Child 103 linked?           NO

Result:

DENY ❌

---

17. Teacher Example

Teacher Ahmed assigned hai:

Class 10-A
Subject Mathematics

Ahmed ke paas:

ATTENDANCE_MARK

permission hai.

Request:

POST /classes/10-A/attendance

Check:

Teacher?
YES

Permission?
YES

10-A assigned?
YES

Allow.

Ab:

POST /classes/9-B/attendance

Teacher role:

YES

Permission:

YES

Lekin:

9-B assigned?
NO

Deny.

---

18. Policies

Policy ka simple matlab:

«Kisi particular situation mein action allow ya deny karne ka detailed rule.»

Policy tab useful hoti hai jab simple role ya permission check enough na ho.

Example:

Teacher ke paas:

RESULT_ENTER

permission hai.

Lekin system ka rule hai:

«Teacher sirf apni assigned class aur assigned subject ka result enter kar sakta hai.»

Policy multiple cheezen check kar sakti hai:

Teacher assigned to class?
        ↓
Teacher assigned to subject?
        ↓
Result editable hai?
        ↓
Result already published to nahi?
        ↓
Academic session valid hai?
        ↓
ALLOW / DENY

---

19. Policy Example — Published Result

Teacher ke paas:

RESULT_ENTER

permission hai.

Lekin result:

PUBLISHED

hai.

Business rule:

«Published result normally modify nahi kiya ja sakta.»

Therefore:

Role              → TEACHER ✅
Permission        → RESULT_ENTER ✅
Result published  → YES ❌

FINAL DECISION → DENY

Yahan permission hone ke bawajood action allowed nahi hua.

Ye policy/business rule ka example hai.

---

20. "policies/" Folder

"policies/" mein complex authorization/business rules rakhe ja sakte hain.

Example conceptual policies:

policies/
├── attendance.policy.js
├── result.policy.js
├── student.policy.js
├── admission.policy.js
└── leave.policy.js

Ye exact final file list implementation ke waqt requirements ke according decide hogi.

Policy ka goal:

«Complex authorization rules ko centralized aur reusable rakhna.»

Business logic ko controllers mein random "if/else" ke andar spread nahi karna.

---

21. Permission vs Resource Authorization vs Policy

Ye difference yaad rakhna bohot important hai.

Permission

Question:

«"Kya tum ye type ka kaam kar sakte ho?"»

Example:

ATTENDANCE_MARK

---

Resource Authorization

Question:

«"Kya tum is specific record/resource par kaam kar sakte ho?"»

Example:

Student 101
→ Can access own attendance

Student 101
→ Cannot access Student 103

---

Policy

Question:

«"Kya current situation aur business rules ke according ye action allowed hai?"»

Example:

Teacher
+
RESULT_ENTER
+
Assigned Subject
+
Assigned Class
+
Result Not Published
        ↓
ALLOW

---

22. Complete Authorization Flow

EduOS mein conceptual flow:

Client Request
      ↓
Authentication
      ↓
Who is the user?
      ↓
Role
      ↓
What type of user?
      ↓
Permission
      ↓
Can they perform this action?
      ↓
Resource Authorization
      ↓
Can they access THIS specific resource?
      ↓
Policy / Business Rules
      ↓
Is the action allowed in the current situation?
      ↓
ALLOW
      ↓
Controller
      ↓
Service

Agar kisi stage par check fail ho:

DENY ❌

---

23. EduOS Authorization Examples

Admin

Admin generally broader access rakhta hai, lekin backend phir bhi permissions enforce karega.

Example:

ADMIN
 ↓
STUDENT_CREATE
STUDENT_UPDATE
ATTENDANCE_VIEW
RESULT_PUBLISH
FEE_MANAGE

Exact permissions system ke defined requirements ke according honi chahiye.

---

Teacher

TEACHER
 ↓
Assigned classes
 ↓
Assigned subjects
 ↓
Relevant permissions

Teacher ko automatically poore institution ka data access nahi milna chahiye.

---

Student

STUDENT
 ↓
Own profile
Own attendance
Own assignments
Own results
Own fees

Student doosre students ka private academic data access nahi kar sakta.

---

Parent

PARENT
 ↓
Linked children
 ↓
Child 101
Child 102

Parent sirf linked children ka permitted data access kar sakta hai.

---

Public User

PUBLIC_USER
 ↓
Public website
 ↓
Public information
 ↓
Own permitted public-user features

Public user ko internal academic records automatically access nahi milte.

---

24. Authorization Ka Golden Rule

EduOS mein kisi request ko allow karne se pehle backend ko situation ke according ye questions consider karne chahiye:

1. User authenticated hai?
2. User ka role kya hai?
3. Required permission hai?
4. Specific resource access allowed hai?
5. User-resource relationship valid hai?
6. Business rules allow karte hain?
7. Current resource/status operation allow karta hai?

Har endpoint ko necessarily har single check ki zaroorat nahi hogi.

Jo check genuinely relevant ho, wahi apply hoga.

---

25. Technology / Files

Authorization architecture mein main components:

roles.constants.js
        ↓
Available roles

permissions.constants.js
        ↓
Available permissions

auth.middleware.js
        ↓
Authenticated user identify

permission.middleware.js
        ↓
Permission check

ownership.middleware.js
        ↓
Specific resource/relationship check

policies/
        ↓
Complex authorization/business rules

---

26. Senior Engineering Principle

Authorization design ka rule:

«Simple problem ke liye simple solution. Complex problem ke liye policy.»

Har request ko unnecessarily complicated nahi banana.

Example:

Public endpoint
→ Authentication ki zaroorat nahi

Student own profile
→ Authentication + resource check

Teacher attendance
→ Authentication + permission + assigned-class check

Result publishing
→ Authentication + permission + resource/policy + business rules

---

27. Technology Baad Mein Kyun?

EduOS mein hum pehle ye decide nahi karenge:

«"Humein middleware banana hai."»

Pehle requirement dekhenge:

Requirement
    ↓
User
    ↓
Action
    ↓
Resource
    ↓
Rule
    ↓
Authorization problem
    ↓
Appropriate implementation

Isliye koi technology sirf resume ke liye add nahi hogi.

---

28. One-Page Memory Version

Agar 10 saal baad sirf ye section padhna ho, to:

AUTHENTICATION
"Main kaun hoon?"

AUTHORIZATION
"Main kya kar sakta hoon?"

ROLE
"Main kis type ka user hoon?"

PERMISSION
"Main kaunsa action kar sakta hoon?"

RESOURCE AUTHORIZATION
"Main kis specific data/resource par action kar sakta hoon?"

POLICY
"Kya current situation aur business rules ke according
ye action allowed hai?"

EduOS example:

Student 101
   ↓
STUDENT role
   ↓
ATTENDANCE_VIEW permission
   ↓
Own attendance?
   ↓
YES
   ↓
Business rules allow?
   ↓
YES
   ↓
ALLOW ✅

Doosre student ki attendance:

Student 101
   ↓
STUDENT role ✅
   ↓
ATTENDANCE_VIEW ✅
   ↓
Student 103 ka record
   ↓
Resource access ❌
   ↓
DENY

Final principle:

«Role batata hai user kaun hai. Permission batati hai user kya kar sakta hai. Resource authorization batata hai user kis specific data par kar sakta hai. Policy batati hai current situation mein woh action actually allowed hai ya nahi.»