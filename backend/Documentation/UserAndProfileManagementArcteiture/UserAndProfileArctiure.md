EduOS — Group 9: User & Profile Management Architecture

1. Purpose

Group 9 ka core objective hai:

- user identity lifecycle ko define karna
- user role ko model karna
- role-specific profile ko separate and safe tarah se manage karna
- account state aur profile state ko alag rakhna
- unauthorized profile mutation aur mass-assignment risks ko prevent karna

Senior backend perspective se yeh architecture system ka trust boundary hai.
Agar user account aur profile ek hi object mein fail ho jaayein, to hum inconsistent records, unauthorized updates, duplicate user identities, aur broken authorization paths create kar dete hain.

2. Architectural Principle: Account != Profile

Account aur profile dono separate concerns hain.

User Account = login/identity layer
Profile = role-specific institutional context layer

Example:

User {
  fullName,
  email,
  passwordHash,
  role,
  status,
  resetPasswordTokenHash,
  createdAt,
  updatedAt
}

TeacherProfile {
  userId,
  fullName,
  phone,
  employeeId,
  departmentId,
  designation,
  qualification,
  joiningDate
}

StudentProfile {
  userId,
  fullName,
  dateOfBirth,
  gender,
  rollNo,
  admissionNo,
  address,
  emergencyContact
}

ParentProfile {
  userId,
  fullName,
  phone,
  alternatePhone,
  address,
  occupation
}

PublicUserProfile {
  userId,
  fullName,
  phone,
  profilePicture
}

Important point:

- account decides who the user is
- profile decides what institutional information belongs to that user
- relationship records decide how users connect to one another and to academic entities

3. What We Solve in Group 9

Group 9 walon ko in problems ko address karna hota hai:

- orphan user without profile
- profile existing for wrong role
- multiple profile documents for same user
- role tampering through mass assignment
- profile update by invalid user
- disabled account still able to access own profile
- partial or invalid profile data
- missing required profile fields after create/update

Production environment mein ye sab sensitive bugs hote hain, aur unhe architecture se prevent karna hota hai.

4. Role Model in EduOS

Current backend role enum is defined in the user model and enforced by auth + authorization layers.

Supported roles:

- ADMIN
- TEACHER
- STUDENT
- PARENT
- PUBLIC_USER

Role rules:

- public registration creates PUBLIC_USER only
- role should not be client-controlled for privileged access
- profile schema is role-specific and must be tied to the authenticated user
- admin-only actions live outside generic profile mutation flows

5. Actual Backend Mapping

The actual backend aligns with this model:

- User account model: backend/models/user/User.js
- Profile models: backend/models/profile/*
- Auth routes: backend/routes/public/auth.routes.js
- Profile routes: backend/routes/profile/profile.routes.js
- Profile controller: backend/controllers/profile/profile.controller.js
- Profile service: backend/services/profile/profile.service.js
- Auth service: backend/services/auth/auth.service.js
- Validators: backend/validators/auth/auth.validator.js and backend/validators/profile/profile.validator.js
- Auth middleware: backend/middleware/auth.middleware.js

This means architecture is already close to production-ready, and Group 9 is about making the responsibility boundaries explicit rather than inventing new unrelated modules.

6. No Unnecessary New Folder

Abhi backend folder structure already sufficient hai:

backend/
├── app.js
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── tests/
├── utils/
├── validators/
├── Documentation/
└── authorization/

No new top-level folder required unless a new domain gets real business logic.

Reason:

- user and profile concerns already map cleanly under models, services, controllers, routes, validators
- auth and profile logic are already separated
- adding arbitrary new folders without real domain scope would increase complexity without value

Senior principle: avoid folder churn unless it solves a real architectural boundary.

7. User Account Lifecycle

User lifecycle should follow this sequence:

1. Input validation
2. unique email enforcement
3. password hashing
4. user creation
5. role assignment
6. status assignment
7. token issuance if login flow
8. account status checks in auth middleware/service

Main user contract in this backend:

- fullName required
- email unique and normalized to lowercase
- phone optional
- role enum restricted
- status enum restricted
- passwordHash never exposed
- resetPasswordTokenHash kept internal

This is already reflected in backend/models/user/User.js and backend/services/auth/auth.service.js.

8. Profile Lifecycle

Profile lifecycle follows a different domain boundary:

1. authenticated user identifies himself via JWT
2. request role is known from token
3. response is mapped to the proper profile model for that role
4. profile is upserted or replaced based on operation
5. validation ensures required role fields are present
6. write is bound to authenticated userId, never arbitrary client userId

This is exactly the correct production pattern.

9. Role-Specific Profile Design

9.1 ADMIN profile

Admin profile is role-specific but intentionally minimal.

Fields:

- userId
- fullName
- phone
- profilePicture
- designation
- departmentId

Use case:

- institutional admin identity
- not a generic user update surface
- not a place for arbitrary role mutation

9.2 TEACHER profile

Teacher profile is the richest profile surface.

Fields:

- userId
- fullName
- phone
- profilePicture
- employeeId
- departmentId
- designation
- qualification
- joiningDate

Important:

Teacher profile is not the same as teacher assignment. Assignment belongs to dynamic relationship architecture, not profile schema.

9.3 STUDENT profile

Student profile is academic and identity-heavy.

Fields:

- userId
- fullName
- dateOfBirth
- gender
- bloodGroup
- profilePicture
- admissionNo
- rollNo
- address
- emergencyContact

Important:

Current class/section/session should not be stored as permanent profile fields unless required by domain. They belong to enrollment/relationship data models.

9.4 PARENT profile

Parent profile represents family-facing identity.

Fields:

- userId
- fullName
- phone
- alternatePhone
- address
- occupation
- profilePicture

Important:

Parent-to-student relationship is not stored in the profile itself; it is a dynamic relationship record.

9.5 PUBLIC_USER profile

Public users may not require a rich profile immediately.

Fields:

- userId
- fullName
- phone
- profilePicture

Senior rule:

Do not create profile rows unless there is actual business value. But for an access-controlled system, a profile record should still exist when the app needs to edit or display personal data.

10. Profile Mutation Strategy

The backend currently uses two patterns:

- upsert for partial update (PATCH)
- replace for full replacement (PUT)

This is a good pattern because it separates:

- partial profile edits
- full profile resets

Production rule:

- PATCH should allow partial updates with validation
- PUT should require the full expected shape for that role
- both must bind to authenticated userId
- both must reject unknown fields

This design is already implemented in backend/services/profile/profile.service.js and backend/validators/profile/profile.validator.js.

11. Security Rules for User & Profile

This is where senior engineering matters.

11.1 Never trust client-provided userId

The service must resolve identity from JWT or authenticated session context.

Bad:

req.body.userId = someOtherUserId

Good:

userId = req.user.sub

This is exactly the correct pattern in profile controllers.

11.2 Strict validation before service layer

The request body must be validated at route boundary.

This prevents:

- unknown field injection
- mass assignment vulnerabilities
- invalid data reaching the database
- misleading Mongo validation error strings leaking to clients

This is implemented in backend/middleware/validateRequest.middleware.js.

11.3 Authenticated role determines profile schema

Profile schema should be selected based on token role, not arbitrarily client-provided role.

This is a major security rule.

11.4 Never expose passwordHash or internal token hashes

Sensitive user fields should never be returned via API response.

12. Current API Flow

Public registration flow:

POST /api/v1/auth/register
→ validateRequest
→ registerPublicUser
→ email uniqueness check
→ password hashed
→ user role set to PUBLIC_USER
→ user returned sanitized

Login flow:

POST /api/v1/auth/login
→ validate credentials
→ user lookup by email
→ verify password
→ active status check
→ issue access + refresh tokens
→ return sanitized user + tokens

Profile flow:

GET /api/v1/profile/me
→ authenticate JWT
→ fetch profile by userId + role
→ 404 if not found

PATCH /api/v1/profile/me
→ authenticate JWT
→ validate partial body for role schema
→ upsert to correct profile model
→ return saved profile

PUT /api/v1/profile/me
→ authenticate JWT
→ validate replacement body
→ replace full profile
→ return saved profile

This is a clean and production-safe separation.

13. Recommended Service Boundaries

We should keep the following boundaries clear:

- Auth service: authentication, token lifecycle, password reset
- User service: user creation, status management, identity checks
- Profile service: role-specific profile read/write
- Authorization layer: role and permission enforcement
- Relationship layer: dynamic links between users and domain objects

Do not mix profile logic with relationship logic.
Do not mix auth logic with profile update logic.
Do not store relationship data inside profile documents.

14. Data Integrity Considerations

In production, user and profile data should satisfy these rules:

- one user has one active profile per role
- profile updates must be scoped by userId
- same user cannot have duplicate profile documents for same role
- profile fields must obey schema constraints
- profile documents should be created only after valid user account exists
- user deactivation should reflect in profile access control

This is especially critical in educational systems where a teacher or student may be disabled, archived, or reactivated later.

15. Senior Engineering Observations

As a senior backend engineer, I would enforce the following rules in every user/profile change:

- keep user identity and profile as distinct domains
- never trust client-supplied role and userId
- validate at API boundary, not only in database
- fail closed, not open
- normalize email and phone early
- use upsert only with strict validation
- keep service functions single-purpose
- log operational failures, but never leak raw internals to clients
- keep response contract consistent

This system already follows the right direction: strong separation of auth, profile, and relationships; centralized validation; controlled error responses; role-bound profile logic.

16. Final Design Decision for This Project

No new backend folder is needed right now.

The current structure is already aligned with a sound architecture:

- models/user = account identity
- models/profile = role data
- services/auth = auth and token lifecycle
- services/profile = profile CRUD and ownership management
- routes/public = public auth endpoints
- routes/profile = authenticated profile endpoints
- validators = request boundary definitions
- middleware = auth + validation + error handling

This is the correct place to continue Group 9 work without unnecessary churn.

17. Practical Guidance for Future Development

When new user/profile workflows are introduced, follow this sequence:

1. decide whether it is account-level or profile-level concern
2. define role and schema
3. add validation rules
4. write service method with ownership enforcement
5. expose route with auth middleware
6. test invalid, partial, and valid states
7. confirm no mass assignment or unauthorized update is possible

This preserves clean engineering discipline and reduces the chance of hidden data bugs.

18. Final Senior Conclusion

Group 9 is not just a CRUD module.
It is the trust layer that ensures identity, role, profile ownership, authorization, and data integrity remain consistent.

The project already has the right foundation.
The key is to keep the boundary clean:

- user account = authentication and identity
- profile = institutional identity and role data
- relationship = dynamic connections and lifecycle history

When those boundaries stay clean, the system remains safe, explainable, and maintainable.

This is the senior standard expected in a stable backend architecture.

16. Isko Transaction Kyun Chahiye Ho Sakta Hai?

Example:

Create User ✅
Create Teacher Profile ❌

Ab database mein incomplete teacher hai.

Ye problem hai.

Agar database/architecture support karta ho, multi-document creation ke liye transaction consider ki ja sakti hai:

Start Transaction
 ↓
Create User
 ↓
Create Profile
 ↓
Commit

Agar failure:

Rollback

Exact MongoDB transaction usage Group 6/implementation stage mein project requirements ke according decide hoga.

17. Alternative: Eventual Creation

Another approach:

Create User
 ↓
Event
 ↓
Create Profile

Ye distributed/event-driven systems mein useful ho sakta hai.

Lekin EduOS ke simple profile creation workflow mein unnecessary complexity create kar sakta hai.

Decision

Critical account + profile creation ke liye initially synchronous service workflow prefer karenge, aur transaction jahan genuinely required ho wahan use karenge.

18. User ID Aur Profile ID

Ye Group 9 ka important concept hai.

Example:

User
_id = U-123

Teacher profile:

TeacherProfile
_id = T-789
userId = U-123

Matlab:

U-123
 ↓
T-789

Profile ka userId bridge hai.

19. User ID Ko Profile ID Kyun Nahi Bana Dete?

Technically different modeling approaches possible hain.

Lekin separate IDs rakhne se:

User Identity

aur:

Domain Profile

independent entities rehti hain.

Example:

User U-123
TeacherProfile T-789

Ye architecture ko explicit banata hai.

Important:

ID alag hona problem nahi hai. userId relationship bridge hai.

20. Profile Ownership

Profile ownership ka simple meaning:

"Ye profile kis User Account ki hai?"

Example:

TeacherProfile
userId = U-123

means:

U-123 owns this teacher profile

Ye ownership authorization mein bhi useful ho sakti hai.

21. Student Apni Profile Update Kar Sakta Hai?

Automatically nahi.

Authorization decide karegi:

Student
 ↓
Own Profile
 ↓
Allowed fields?
 ↓
ALLOW / DENY

Example:

Student apna:

phone
address
profilePicture

update kar sakta hai.

Lekin:

role
status
admissionNo

change karna allowed nahi hona chahiye unless policy explicitly permits it.

22. Field-Level Security

Ye senior-level important concept hai.

Suppose Student request bhejta hai:

{
  "fullName": "Ali",
  "role": "ADMIN",
  "status": "ACTIVE"
}

Sirf validation pass hona enough nahi.

Authorization/data mapping ensure karegi ke student:

role ❌
status ❌

modify na kar sake.

Isliye:

Validation
+
Authorization
+
Allowed-field mapping

teeno important hain.

23. Admin Profile Update

Admin ko potentially:

fullName
phone
designation
department

update karne ki permission ho sakti hai.

Lekin:

role

change karna highly privileged operation ho sakta hai.

Business rules ke according separate endpoint/policy bhi ban sakti hai.

24. Teacher Profile Update

Teacher:

phone
profilePicture
address

jaise fields update kar sakta hai, depending on requirements.

Lekin:

employeeId
designation
department

possibly admin-controlled fields ho sakte hain.

Yahan exact field ownership business requirements ke according document hogi.

25. Profile Fields Ko Categories Mein Divide Karna

Senior design mein useful approach:

Self-managed fields

User khud update kar sakta hai.

Admin-managed fields

Sirf authorized admin update kare.

System-managed fields

Application khud manage kare.

Example:

createdAt
updatedAt
status transitions

User ko directly modify nahi karne dena.

26. Account Status

Account status ka matlab:

"Kya ye account system mein active hai?"

Example:

ACTIVE
DEACTIVATED

Potential future states business requirements ke according add ho sakti hain.

27. Deactivated Account

Suppose teacher Ahmed ka account deactivate kar diya.

User
status = DEACTIVATED

Iska matlab:

Ahmed login nahi kar sakta

Lekin:

Ahmed ka historical data delete nahi hota.

Uske:

Teacher Profile
Teaching Assignments
Past Results
Past Records

preserve ho sakte hain.

28. Account Status ≠ Relationship Status

Ye pehle bhi important tha, Group 9 mein phir yaad rakho.

Example:

Bilal User
status = ACTIVE

Lekin:

Bilal → Ali
relationship = ENDED

Bilal ka account active hai.

Lekin Ali ke data ka access relationship ki wajah se nahi milna chahiye.

29. Profile Status

Profile ka status account status se different ho sakta hai.

Example institution mein:

Student Profile
status = ACTIVE

Ya historical context:

ALUMNI

Lekin exact statuses requirements ke according finalize honge.

Important principle:

Account Status
=
Login/system account state

Profile Status
=
Institutional/domain state
30. Soft Delete vs Hard Delete

Ye bohat important architectural decision hai.

Hard Delete

Record completely delete:

User ❌

Problem:

Historical relationships aur audit references break ho sakte hain.

Soft Delete / Deactivation

Record preserve:

User
status = DEACTIVATED

Most institutional records ke liye preservation generally safer approach hai.

31. Kya User Kabhi Delete Hoga?

Ye blindly decide nahi karenge.

Sensitive/authentication data aur historical institutional records ki retention requirements hoti hain.

EduOS mein default principle:

Important institutional history ko physical deletion se unnecessarily destroy nahi karna.

Actual deletion policy legal/business requirements ke according future mein define hogi.

32. Role Change

Suppose:

Teacher → Student

Kya simply:

user.role = STUDENT

kar dein?

❌ Itna simple nahi.

Kyun?

Teacher ke:

Teacher Profile
Teaching Assignments
Historical records

hain.

Role transition business operation hai.

Senior approach:

Role Change
 ↓
Check current role
 ↓
Check active relationships
 ↓
Close/end relevant assignments
 ↓
Create/update target profile if required
 ↓
Change role
 ↓
Preserve history

Exact workflow requirements ke according implement hoga.

33. Multiple Roles?

Current EduOS role architecture mein roles:

ADMIN
TEACHER
STUDENT
PARENT
PUBLIC_USER

aur authorization model role-based hai.

Agar future requirement aaye:

TEACHER + PARENT

to current single-role model ko blindly break nahi karenge.

Pehle business requirement evaluate hogi.

Ye important hai:

Architecture requirement ko follow karegi; requirement architecture ko force nahi karegi.

34. Duplicate Profile Problem

Suppose:

User U-123

ke liye do Student Profiles create ho gaye:

Student S-1 → U-123
Student S-2 → U-123

❌ inconsistent.

Isliye role profile relationship par uniqueness enforce karni hogi.

Concept:

One User
+
One Student Role
→
One active Student Profile

Exact database index Group 6 ke design ke according implement hoga.

35. Orphan Profile Problem

Another problem:

StudentProfile
userId = U-999

lekin:

User U-999 ❌

Profile orphan ho gayi.

Isliye:

User existence
+
Profile relationship

carefully maintain karni hogi.

36. Orphan User Problem

Reverse:

User
role = TEACHER

lekin:

TeacherProfile ❌

Ye bhi inconsistent state ho sakti hai, depending on whether profile is required for that role.

Isliye Group 9 workflow decide karega:

Profile required?
 ↓
YES
 ↓
Create account + profile as one workflow
37. User Listing API

Admin ko users list karne ki zarurat ho sakti hai.

Example:

GET /users

Lekin senior API design:

GET /users?page=1&pageSize=20&role=TEACHER&status=ACTIVE

Large dataset ke liye pagination/filtering important hai.

Group 7 API principles yahan apply honge.

38. User Detail API

Example:

GET /users/:userId

Response mein unnecessary sensitive information nahi deni.

Especially:

passwordHash ❌
tokens ❌
secrets ❌
39. Profile Detail API

Example concept:

GET /teachers/:teacherId

ya user-centric:

GET /users/:userId/profile

Exact resource design Group 7 ke API architecture ke according finalize hoga.

Important:

API URL sirf convenient nahi; resource ownership aur authorization ko reflect karna chahiye.

40. Create User API

Conceptually:

POST /users

Lekin role-specific creation ke liye:

POST /teachers
POST /students
POST /parents

jaise resource-oriented APIs bhi better ho sakti hain.

Exact choice requirements aur existing project routes ko dekh kar hogi.

41. Update User vs Update Profile

Do different responsibilities:

User Account
↓
email
status

vs:

Teacher Profile
↓
phone
qualification
designation

Inko blindly ek giant update endpoint mein mix nahi karna.

42. Password Management

Password ko profile management ka normal field nahi samajhna.

Password operations:

Change Password
Reset Password
Forgot Password

authentication/security domain se closely related hain.

Group 9 sirf profile CRUD mein password logic duplicate nahi karega.

43. Email Change

Email authentication identity ka part hai.

Isliye:

Change Email

simple profile update nahi hona chahiye.

Potential security requirements:

current authentication
+
verification
+
possibly re-authentication

Exact workflow authentication/security design ke according hoga.

44. Profile Picture

Profile picture domain data hai.

Lekin actual file storage architecture:

Cloud storage

ya other storage solution ho sakta hai.

Database mein usually:

image URL / file reference

rakhna better hota hai instead of giant binary data in normal document.

Exact storage decision project infrastructure ke stage par hoga.

45. Service Layer Responsibility

Group 9 mein service layer ka kaam:

Business Workflow

Example:

createTeacher()
updateStudentProfile()
deactivateUser()

Service decide karegi:

Kya operation allowed state mein hai?
Kya related profile exist karti hai?
Kya status transition valid hai?

Controller ko giant business logic nahi banana.

46. Controller Responsibility

Controller:

Request receive
↓
Validated input
↓
Service call
↓
Response

Controller mein:

❌ giant business rules

nahi.

47. Policy Responsibility

Policy:

Can this user perform this operation?

Example:

Can this student update this profile?
Can this admin deactivate this teacher?
Can this parent update this student?

Policy authorization decision karegi.

48. Middleware vs Policy vs Service

Simple difference:

Middleware

"Request ko next layer tak jaane dena hai?"

Policy

"Is user ko ye action/resource allowed hai?"

Service

"Allowed action ko business rules ke according actually perform kaise karna hai?"

Example:

Request
 ↓
Middleware
 ↓
Policy
 ↓
Service
 ↓
Database
49. Group 9 Security Rules

User/profile management highly sensitive hai.

Therefore:

Never trust client role

Client:

{
  "role": "ADMIN"
}

bhej sakta hai.

Backend authenticated identity se role determine karega.

Never trust userId from body for ownership

Student:

{
  "userId": "another-user"
}

bhej kar kisi aur ki profile manipulate na kar sake.

Ownership server-side verify hogi.

Never expose passwordHash

Response:

passwordHash ❌
Never return authentication tokens unnecessarily
refreshToken ❌

normal profile response mein.

50. Profile Update Security

Suppose:

Student A

request karta hai:

PATCH /students/student-B

Backend:

JWT
 ↓
User A
 ↓
Requested Student B
 ↓
Ownership/Policy
 ↓
DENY

Sirf URL mein ID hone se access nahi milta.

51. Admin Ka Special Case

Admin potentially:

Student A profile
Teacher B profile
Parent C profile

manage kar sakta hai.

Lekin:

ADMIN

hone ka matlab automatically har operation allowed nahi.

Permission model:

Role
 ↓
Permission
 ↓
Policy
 ↓
Resource

still apply hoga.

52. Profile Management Aur Relationships

Important:

Group 9 profile manage karega.

Group 5 relationship manage karega.

Example:

Student profile:

Name
DOB
Admission No

Group 9.

Student enrollment:

Student
+
Academic Session
+
Class
+
Section

Group 5.

Parent relationship:

Parent
+
Student
+
Relationship Type
+
Status

Group 5.

Isliye profile API ko relationships ke data ko blindly embed/update nahi karna.

53. Example: Student Update

Admin request:

Update Student

Allowed:

fullName
phone
address

But:

class
section

should go through enrollment workflow.

Similarly:

parent/guardian

relationship workflow ke through.

Ye separation data corruption prevent karti hai.

54. Profile Lifecycle

Profile lifecycle:

Create
  ↓
Active
  ↓
Updated
  ↓
Deactivated/Ended/Archived

Exact states profile type ke according different ho sakte hain.

55. Account Lifecycle

Account lifecycle:

Created
 ↓
ACTIVE
 ↓
DEACTIVATED

Potentially:

Reactivated

depending on business requirements.

Important:

Account lifecycle aur profile lifecycle independent concepts ho sakte hain.

56. Relationship Lifecycle

Relationship:

Created
 ↓
ACTIVE
 ↓
ENDED / DECEASED / historical state

Ye Group 5 ka domain hai.

Group 9 us relationship ko profile ke andar duplicate nahi karega.

57. Auditability

Institutional system mein important operations traceable hone chahiye.

Example:

Who changed teacher profile?
When?
What changed?

Ye future audit requirements ke liye useful hai.

Complete audit architecture later dedicated security/logging work mein expand ho sakti hai.

Group 9 ko aise design karna hai ke future audit system ke liye operations identifiable hon.

58. Why Not One Giant User Management Service?

Bad architecture:

UserService
 ├── student
 ├── teacher
 ├── parent
 ├── attendance
 ├── results
 ├── fees
 └── everything

Ye eventually giant service ban jayegi.

Better:

User Service
Profile Services
Relationship Services
Academic Services

Clear responsibilities.

59. Technology Decision

Group 9 existing architecture ke according:

Node.js
Express.js
MongoDB
Mongoose
Zod

use karega.

Node.js / Express

API/service runtime.

MongoDB

User/profile documents.

Mongoose

Schemas/models/database interaction.

Zod

Request validation.

Existing authorization layer

Permission + ownership + relationship policies.

60. Alternative Technologies

Potential alternatives:

PostgreSQL + Prisma

Strong relational modeling.

Lekin current EduOS architecture MongoDB + Mongoose par based hai, aur project continuity important hai.

NestJS

More structured backend framework.

Lekin current backend Express.js mein hai. Is stage par framework migration unnecessary scope increase karega.

Separate microservices

Theoretically possible.

Lekin EduOS current stage par modular monolith architecture ke liye zyada suitable hai.

61. Modular Monolith Thinking

Senior architecture ka matlab har cheez ko microservice banana nahi.

EduOS:

One Backend
│
├── Auth
├── Authorization
├── Users
├── Profiles
├── Relationships
├── Academic
├── Attendance
├── Results
└── Fees

Ye internally modules hain.

Lekin initial deployment:

One application

ho sakta hai.

Future scaling requirement aaye to boundaries already clear honi chahiye.

62. Group 9 API Design Principles

User/profile APIs:

authentication required where appropriate
authorization required
request validation
pagination for lists
filtering
safe fields only
consistent responses
predictable errors
no password/token leakage
ownership checks
idempotent update semantics where appropriate
concurrency considerations for critical updates
63. Update Method

For profile updates:

PATCH

generally partial update ke liye appropriate hai.

Example:

PATCH /students/:studentId

sirf:

{
  "phone": "..."
}

update kar sakta hai.

Har field dobara bhejna zaroori nahi.

64. Create vs Update

Create:

POST

Update:

PATCH

Delete/deactivate:

DELETE

ya domain-specific status endpoint, depending on retention requirements.

EduOS mein institutional history ki wajah se physical DELETE ko blindly use nahi karenge.

65. Deactivation Endpoint

Possible design:

PATCH /users/:userId/status

Body:

{
  "status": "DEACTIVATED"
}

Lekin status transition authorization aur business rules se protected hoga.

Alternative:

POST /users/:userId/deactivate

Dono possible hain.

Final choice API contract stage par consistency ke according hogi.

66. Search

Admin ko users search karne honge.

Example:

name
email
admissionNo
employeeId

Lekin search ko indexed fields ke saath design karna hoga.

Group 6 indexing strategy yahan apply hogi.

67. Large User List

Kabhi:

10 users

hon.

Kabhi:

100,000 users

ho sakte hain.

Isliye:

GET /users

ko infinite full collection response nahi banana.

Use:

pagination
filter
sort
search

as appropriate.

68. Sensitive Search

Search endpoint se:

passwordHash
security data
tokens

kabhi return nahi.

Response DTO/resource projection controlled hogi.

69. DTO / Response Mapping

Database document ko blindly response na banana:

return user;

avoid karna better hai.

Instead:

Database Model
 ↓
Safe Response Mapping
 ↓
API Response

Isse accidental sensitive fields expose hone ka risk kam hota hai.

70. Group 9 Testing Strategy

Group 9 complete hone se pehle test karna hoga:

User creation
valid
invalid
duplicate
unauthorized
Profile creation
valid
missing profile
duplicate profile
wrong user
Profile update
own profile
other profile
admin profile
forbidden fields
Status
active
deactivate
reactivate
invalid transition
Security
no token
wrong role
wrong permission
wrong owner
Data integrity
orphan profile
duplicate profile
invalid userId
71. Group 9 Completion Criteria

Group 9 ko complete tab kahenge jab:

User workflows
       +
Role profile workflows
       +
Authorization integration
       +
Validation
       +
Error handling
       +
Data integrity
       +
Security checks
       +
API tests
       +
Integration tests

verified hon.

Sirf models banane se:

❌ Group 9 complete nahi

Sirf CRUD APIs banane se:

❌ Complete nahi
72. Group 9 Ka Implementation Order

Hum actual code bhi isi order mein karenge:

Step 1
Existing User model/code inspect

        ↓

Step 2
Role/profile requirements verify

        ↓

Step 3
Profile schemas/models

        ↓

Step 4
Profile ↔ User relationship

        ↓

Step 5
User/profile service layer

        ↓

Step 6
Create workflows

        ↓

Step 7
Read/list/search workflows

        ↓

Step 8
Update workflows

        ↓

Step 9
Status/deactivation workflows

        ↓

Step 10
Authorization integration

        ↓

Step 11
Validation & error integration

        ↓

Step 12
Unit tests

        ↓

Step 13
API/integration tests

        ↓

Step 14
Security + edge-case verification
73. Group 9 Mein Kya Nahi Karna

Important boundary:

❌ Attendance

Group 9 ka kaam nahi.

❌ Results

Group 9 ka kaam nahi.

❌ Fees

Group 9 ka kaam nahi.

❌ Teaching Assignment

Group 5.

❌ Student Enrollment

Group 5.

❌ Parent–Student Relationship

Group 5.

❌ Complete logging/monitoring

Group 23.

❌ AI

Group 31 / later.

Is separation se project manageable rahega.

74. Group 9 Ka Relationship With Previous Groups

Complete picture:

GROUP 3
Authorization
     ↓
GROUP 4
User/Profile Architecture
     ↓
GROUP 5
Dynamic Relationships
     ↓
GROUP 6
Database Architecture
     ↓
GROUP 7
REST API Design
     ↓
GROUP 8
Validation & Error Handling
     ↓
GROUP 9
User/Profile Management

Group 9 in sab ka practical combination hai.

75. Senior-Level Example

Admin kehta hai:

"Mujhe new Biology teacher create karna hai."

System thinking:

Requirement
    ↓
Is requester authorized?
    ↓
Input valid?
    ↓
Email unique?
    ↓
Create User Account
    ↓
Create Teacher Profile
    ↓
Ensure data consistency
    ↓
Return safe response
    ↓
Log important operation

Phir:

"Is teacher ko Class 9 Biology assign karo."

Ye Group 5 Teaching Assignment

Ye distinction senior architecture ki jaan hai.

76. Final Architecture
                         USER MANAGEMENT
                               │
                 ┌─────────────┴─────────────┐
                 ↓                           ↓
            USER ACCOUNT                  PROFILE
                 │                           │
          ┌──────┼──────┐          ┌────────┼────────┐
          ↓      ↓      ↓          ↓        ↓        ↓
        Role   Status  Auth      Teacher  Student   Parent
                                     │
                                     ↓
                              Dynamic Relationships
                                     │
                    ┌────────────────┼────────────────┐
                    ↓                ↓                ↓
                Assignment       Enrollment       Guardian
                    │                │                │
                    └────────────────┼────────────────┘
                                     ↓
                                RESOURCES
                                     ↓
                                AUTHORIZATION
77. Group 9 Golden Rules

Rule 1:

Rule 2:

Rule 3:

Rule 4: Profile ko userId

Rule 5:

Rule 6: Student ki academic enrollment profile mein blindly embed nahi karenge.

Rule 7: Parent–Student relationship profile ka simple field nahi; dynamic relationship architecture ka part hai.

Rule 8: Account status aur relationship/profile status ko mix nahi karenge.

Rule 9: Historical institutional data ko unnecessarily delete nahi karenge.

Rule 10: Client ko role/status/ownership blindly define karne nahi denge.

Rule 11: Sensitive fields response mein expose nahi karenge.

Rule 12: User/profile operations authorization ke bina execute nahi honge.

Rule 13: Validation Group 8 ke contract ke according hogi.

Rule 14: Database integrity Group 6 ke rules ke according maintain hogi.

Rule 15: API design Group 7 ke standards follow karegi.

78. 10 Saal Baad Ka Simple Mental Model

Agar tum 10 saal baad ye Group 9 kholo, bas ye yaad rakhna:

USER
"System mein kaun?"

        ↓

ROLE
"Student? Teacher? Parent?"

        ↓

PROFILE
"Is role ki detailed information kya hai?"

        ↓

RELATIONSHIPS
"Ye kis se connected hai?"

        ↓

AUTHORIZATION
"Is user ko kya karne ki permission hai?"

        ↓

SERVICE
"Allowed operation ko safely kaise perform karna hai?"

        ↓

DATABASE
"Data ko consistently kaise save karna hai?"
Group 9 ka one-line principle

"User Account identity ko manage karta hai, Profile role-specific information ko manage karti hai, Relationships real-world connections ko manage karti hain, aur Authorization decide karti hai ke kaun kis data par kya operation kar sakta hai."