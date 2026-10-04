# EduOS — Group 7

# REST API Engineering & API Design

## 1. Group 7 Ka Main Purpose

EduOS mein REST API sirf ek URL nahi hai.

API woh bridge hai jo:

```text
Frontend / Client
       ↓
      API
       ↓
Backend
       ↓
Database
```

ko connect karta hai.

Lekin production system mein API banate waqt sirf ye nahi socha jata:

> "Mujhe ek endpoint banana hai."

Senior backend engineer ye sochta hai:

> "Client ko kya chahiye, kis resource ki zarurat hai, request mein kya aayega, user authorized hai ya nahi, data valid hai ya nahi, business rules kya hain, database efficiently kaise access hoga, response kya hoga, error kaise handle hoga, aur future mein API ko kaise maintain kiya jayega?"

Isliye Group 7 ka main goal hai:

**Secure + Consistent + Maintainable + Efficient + Testable REST APIs**

---

# 2. REST API Kya Hai?

Baby-style example:

Socho EduOS ek school hai.

Frontend student kehta hai:

> "Mujhe meri attendance chahiye."

Frontend directly database ko nahi bolega:

```text
Frontend → MongoDB
```

Instead:

```text
Frontend
   ↓
REST API
   ↓
Backend
   ↓
MongoDB
```

API beech ka controlled gate hai.

Frontend request karta hai:

```http
GET /api/v1/students/student-789/attendance
```

Backend request ko check karta hai:

```text
Authentication
      ↓
Authorization
      ↓
Validation
      ↓
Business Logic
      ↓
Database
      ↓
Response
```

---

# 3. API Ko Direct Database Access Kyun Nahi Dena?

Agar frontend directly database access kare:

```text
Frontend
   ↓
Database
```

to security aur business rules control karna difficult ho jayega.

Example:

Frontend directly kahe:

> "Student 789 ka result delete kar do."

Database ko kaise pata chalega:

* user kaun hai?
* role kya hai?
* permission hai?
* student uska apna hai?
* teacher assigned hai?
* result locked/published hai?
* deletion allowed hai?

Isliye:

```text
Frontend
   ↓
API
   ↓
Authentication
   ↓
Authorization
   ↓
Business Rules
   ↓
Database
```

API controlled entry point hoti hai.

---

# 4. EduOS API Architecture

EduOS mein basic flow:

```text
Client
  ↓
Route
  ↓
Authentication Middleware
  ↓
Permission Middleware
  ↓
Ownership / Relationship Check
  ↓
Validation
  ↓
Controller
  ↓
Service
  ↓
Repository / Data Access
  ↓
Model
  ↓
MongoDB
```

Response reverse direction mein:

```text
MongoDB
  ↓
Repository
  ↓
Service
  ↓
Controller
  ↓
Response
  ↓
Client
```

Har layer ka apna responsibility hoga.

---

# 5. Requirement Se API Tak

Senior API development directly coding se start nahi hoti.

Pehle requirement samjhi jati hai.

Example requirement:

> Student apni attendance dekh sakta hai.

Senior thinking:

```text
Requirement
    ↓
Resource
    ↓
Access Rules
    ↓
API Contract
    ↓
Validation
    ↓
Business Logic
    ↓
Database
    ↓
Response
    ↓
Testing
```

---

# 6. Resource Kya Hai?

REST mein hum actions ke bajaye resources ko represent karte hain.

Examples:

```text
users
students
teachers
parents
attendance
results
classes
sections
subjects
academic-sessions
```

Example:

```text
/students
```

Student resource ko represent karta hai.

---

# 7. URL Design

Good:

```http
GET /api/v1/students
GET /api/v1/students/:studentId
POST /api/v1/students
PATCH /api/v1/students/:studentId
```

Avoid:

```http
GET /getStudents
POST /createStudent
POST /deleteStudent
```

Reason:

HTTP method already action represent karta hai.

```text
GET
= read

POST
= create

PATCH
= partial update

DELETE
= delete
```

---

# 8. HTTP Methods

## GET

Data read karna.

Example:

```http
GET /api/v1/students/123
```

Meaning:

> Student 123 ki information do.

---

## POST

New resource create karna.

```http
POST /api/v1/students
```

---

## PATCH

Existing resource ka kuch part update karna.

```http
PATCH /api/v1/students/123
```

Example:

Sirf phone number change:

```json
{
  "phone": "03001234567"
}
```

---

## DELETE

Resource remove/end karna.

Lekin EduOS mein historical/domain data ko blindly delete nahi karenge.

Example:

Student enrollment ko physically delete karne ke bajaye lifecycle/status approach use ho sakti hai.

---

# 9. PUT vs PATCH

## PUT

Generally complete replacement semantics ke liye use hota hai.

## PATCH

Partial update ke liye.

EduOS mein profile updates ke liye `PATCH` useful hoga.

Example:

```http
PATCH /api/v1/students/123
```

```json
{
  "phone": "03001234567"
}
```

---

# 10. API Versioning

Hum APIs ko version karenge:

```text
/api/v1/...
```

Example:

```http
/api/v1/students
```

Future mein breaking change aaye:

```text
/api/v2/students
```

### Versioning kyun?

Suppose mobile app purani API use kar rahi hai.

Agar hum existing API ko breaking way mein change kar dein to old client break ho sakta hai.

Versioning backward compatibility maintain karne mein help karti hai.

---

# 11. API Contract Kya Hai?

API contract ek agreement hai:

```text
Client kya bhejega?
Backend kya accept karega?
Backend kya return karega?
Error kis format mein milega?
```

Example:

```http
POST /api/v1/students
```

Request:

```json
{
  "userId": "user-123",
  "admissionNo": "ADM-001",
  "rollNo": 25
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "student-789",
    "admissionNo": "ADM-001"
  }
}
```

Client ko contract pata hona chahiye.

---

# 12. Request Ke Parts

HTTP request mein different information different places par aa sakti hai.

## Path Parameter

```http
GET /students/student-789
```

Yahan:

```text
student-789
```

path parameter hai.

---

## Query Parameter

```http
GET /students?page=1&limit=20
```

Useful for:

* pagination
* filtering
* sorting
* searching

---

## Request Body

```http
POST /students
```

Body:

```json
{
  "admissionNo": "ADM-001",
  "rollNo": 25
}
```

---

## Headers

Example:

```http
Authorization: Bearer <access-token>
```

Headers metadata/context ke liye use hote hain.

---

# 13. Authentication API Se Pehle

Protected API par:

```text
Request
   ↓
Authentication
   ↓
User identify
```

Example:

JWT:

```text
userId = user-123
```

Backend samajhta hai:

> Request kis account se aa rahi hai?

---

# 14. Authentication Aur Authorization Difference

Authentication:

> "Tum kaun ho?"

Authorization:

> "Tum kya kar sakte ho?"

Example:

```text
JWT
 ↓
user-123
 ↓
Authentication
 ↓
STUDENT
 ↓
Permission
 ↓
Ownership / Relationship
 ↓
Allow / Deny
```

EduOS mein dono API security ka part hain.

---

# 15. Authorization Integration

Authorization ko sirf documentation mein nahi rehna.

Real API par attach karna hai.

Example:

```text
GET /api/v1/students/:studentId/attendance
```

Flow:

```text
JWT
 ↓
Authentication
 ↓
Role
 ↓
Permission
 ↓
Ownership / Relationship
 ↓
Policy
 ↓
Controller
```

Student apni attendance dekh sakta hai.

Dusre student ki attendance:

```text
Ownership check
      ↓
     FAIL
      ↓
    DENY
```

---

# 16. Validation

Client par trust nahi karna.

Client kuch bhi send kar sakta hai.

Example:

```json
{
  "rollNo": "hello"
}
```

Agar roll number numeric hona chahiye:

```text
Validation
   ↓
Invalid
   ↓
400 Bad Request
```

Validation API boundary par honi chahiye.

---

# 17. Validation Aur Business Rule Different Hain

### Validation

Data ka shape/type correct hai?

Example:

```text
email valid hai?
rollNo number hai?
required field present hai?
```

### Business Rule

Data institution ke rules ke according allowed hai?

Example:

```text
Student already enrolled hai?
Teacher assigned subject ko teach kar sakta hai?
Academic session active hai?
```

Dono same cheez nahi hain.

---

# 18. Zod Ka Role

EduOS mein request validation ke liye Zod use kiya ja sakta hai.

Example concept:

```text
Request
 ↓
Zod Schema
 ↓
Valid?
 ├── NO → Error
 └── YES → Controller
```

### Alternative

Joi / Yup / express-validator / custom validation.

### Zod Kyun?

* Type-safe ecosystem ke saath achha integration
* readable schemas
* reusable validation
* centralized validation approach

### Trade-off

Zod ek additional dependency hai aur schemas maintain karne padte hain.

Decision:

**EduOS request validation ke liye Zod use karega, jahan project requirements ke according appropriate ho.**

---

# 19. Controller Ka Kaam

Controller ka kaam business logic ka giant container banna nahi hai.

Controller:

```text
Request receive
      ↓
Validated data
      ↓
Service call
      ↓
Response return
```

Bad design:

```text
Controller
 ├── validation
 ├── 20 business rules
 ├── database queries
 ├── authorization decisions
 └── response
```

Better:

```text
Controller
   ↓
Service
   ↓
Repository
```

---

# 20. Service Layer

Service business workflow handle karegi.

Example:

```text
createStudent()
```

Service check kar sakti hai:

```text
User exists?
 ↓
Role correct?
 ↓
Admission number duplicate?
 ↓
Profile create
 ↓
Return result
```

---

# 21. Repository / Data Access

Repository ka focus:

> Database se data lena/save karna.

Example:

```text
StudentRepository
```

responsible ho sakta hai:

```text
findById()
findByUserId()
create()
update()
```

Business rules repository mein nahi bharni.

---

# 22. Response Design

API responses consistent honi chahiye.

Example:

```json
{
  "success": true,
  "data": {
    "id": "student-789",
    "name": "Ali"
  }
}
```

Client ko predictable structure milega.

---

# 23. Error Response

Errors bhi consistent hon.

Example:

```json
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student not found"
  }
}
```

Different APIs ko different random formats nahi dene.

---

# 24. HTTP Status Codes

Common examples:

```text
200 OK
```

Successful read/update.

```text
201 Created
```

New resource successfully created.

```text
204 No Content
```

Successful operation with no response body.

```text
400 Bad Request
```

Invalid request.

```text
401 Unauthorized
```

Authentication missing/invalid.

```text
403 Forbidden
```

Authenticated but not allowed.

```text
404 Not Found
```

Resource doesn't exist.

```text
409 Conflict
```

Conflict, such as duplicate unique resource.

```text
422 Unprocessable Content
```

Request understood but semantically invalid, where the project's error conventions choose to use it.

```text
500 Internal Server Error
```

Unexpected server-side failure.

---

# 25. 401 vs 403

Ye interview aur production dono mein important hai.

### 401

Backend keh raha hai:

> "Mujhe nahi pata tum kaun ho."

Example:

```text
Missing/invalid token
```

### 403

Backend keh raha hai:

> "Mujhe pata hai tum kaun ho, lekin tumhein permission nahi."

Example:

```text
Student → Admin resource
```

---

# 26. Pagination

Large data ke liye:

```http
GET /api/v1/students?page=1&limit=20
```

Direct:

```text
GET /students
```

aur 100,000 students return karna bad design ho sakta hai.

Pagination:

```text
Database
100,000 records
       ↓
API
20 records
       ↓
Client
```

Isse response size aur unnecessary processing control hoti hai.

---

# 27. Pagination Response

Example:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

Exact pagination strategy resource size aur query requirements ke according decide hogi.

---

# 28. Offset vs Cursor Pagination

### Offset

```text
?page=10&limit=20
```

Simple aur easy.

### Cursor

```text
?cursor=abc123&limit=20
```

Large/changing datasets mein useful ho sakti hai.

### Decision

Har API par blindly cursor pagination nahi lagayenge.

Resource aur access pattern dekh kar decide karenge.

---

# 29. Filtering

Example:

```http
GET /students?status=ACTIVE
```

Meaning:

> Sirf active students.

---

# 30. Sorting

Example:

```http
GET /students?sort=createdAt&order=desc
```

Sorting database-supported aur indexed access patterns ke according design karni hogi.

---

# 31. Searching

Example:

```http
GET /students?search=Ali
```

Lekin search ko blindly:

```text
regex across every field
```

nahi karenge.

Large dataset mein performance issue aa sakta hai.

Search strategy requirement aur data size ke according choose hogi.

---

# 32. Database Performance

Senior API designer sirf API response nahi dekhta.

Ye bhi dekhta hai:

```text
API
 ↓
Service
 ↓
Database Query
 ↓
Index
 ↓
Response Time
```

Example:

Agar:

```text
GET /students/:id
```

`studentId` indexed/appropriate identifier ke through efficiently query hota hai, database ko unnecessary scanning nahi karni padti.

---

# 33. N+1 Query Problem

Example:

```text
Get 100 students
      ↓
Query students
      ↓
For each student:
   query parent
```

Result:

```text
1 + 100 queries
= 101 queries
```

Ye performance problem create kar sakta hai.

Senior engineer query strategy, projection, batching, population/aggregation, indexing aur response requirements ko dekh kar solution choose karega.

---

# 34. Response Data Limit Karna

API ko unnecessary fields return nahi karni chahiye.

Student response mein:

```text
passwordHash ❌
refresh token ❌
internal security data ❌
```

Sirf required data:

```text
id
name
admissionNo
rollNo
...
```

return hona chahiye.

---

# 35. Sensitive Data Protection

API response mein kabhi accidentally:

```text
passwordHash
resetToken
refreshToken
internal secrets
```

return nahi hone chahiye.

Ye security review ka part hai.

---

# 36. Rate Limiting

Public/sensitive endpoints par abuse control important ho sakta hai.

Example:

```text
Login API
Forgot Password API
Public Registration API
```

Agar koi repeatedly request bhej raha hai:

```text
1000 requests
   ↓
Rate Limit
   ↓
Block / Slow Down
```

Exact limits deployment aur threat model ke according decide honge.

---

# 37. Idempotency

Senior API design mein ye question bhi important hai:

> Agar same request do baar aa jaye to kya hoga?

Example:

```text
Create payment
Create admission
Create important transaction
```

Network retry ki wajah se duplicate operation ho sakta hai.

Jahan operation sensitive/non-repeatable ho, idempotency strategy consider karni hogi.

Har POST API par blindly idempotency key required nahi.

---

# 38. API Security

API security mein:

```text
Authentication
Authorization
Validation
Input sanitization/normalization
Rate limiting
Sensitive data protection
Secure headers
CORS policy
Secret management
Logging
Error handling
```

sab relevant ho sakte hain.

Security sirf JWT lagane ka naam nahi.

---

# 39. CORS

CORS decide karta hai ke browser-based clients kin origins se API access kar sakte hain.

Example:

```text
EduOS Frontend
       ↓
EduOS Backend
```

Allowed origins explicitly configure kiye jayenge.

Development aur production configuration alag ho sakti hai.

---

# 40. Error Handling Centralized Kyun?

Har controller mein:

```text
try/catch
try/catch
try/catch
```

aur random responses banana maintainability ko hurt karta hai.

Better:

```text
Controller
   ↓
throw error
   ↓
Central Error Handler
   ↓
Standard Response
```

Isse errors consistent rehte hain.

---

# 41. Logging

Production mein agar API fail ho:

```text
POST /students
```

to developer ko understand karna chahiye:

```text
request
requestId
user/context where appropriate
endpoint
error
timestamp
duration
```

Lekin passwords, tokens aur sensitive personal information logs mein nahi daalni.

---

# 42. Request ID

Large systems mein request ko unique identifier dena useful hota hai:

```text
Request ID
   ↓
API
   ↓
Service
   ↓
Database/logs
```

Agar user kahe:

> "Meri request fail hui."

to logs mein request ko trace karna easy hota hai.

---

# 43. API Performance

Senior API design ka target sirf:

> "API kaam kar rahi hai."

nahi.

Questions:

```text
Kitni database queries?
Kitna data transfer?
Indexes?
Pagination?
Caching required?
Expensive computation?
N+1?
Repeated requests?
```

Performance optimization requirement ke according hogi.

**Premature optimization nahi karni.**

Pehle correct architecture, phir measurements/evidence ke basis par optimization.

---

# 44. Caching

Har API ko Redis cache dena zaroori nahi.

Example:

Frequently-read, relatively stable data:

```text
Academic session
Class
Section
Subject
```

future mein caching candidate ho sakte hain.

Lekin highly dynamic data ko blindly cache karna stale-data problems create kar sakta hai.

### Alternative

No cache.

### Why sometimes better?

Simple architecture.

### Trade-off

Repeated database reads.

Decision:

**Caching requirement aur measured bottleneck ke according introduce hogi.**

---

# 45. API Consistency

Agar ek API:

```json
{
  "data": {}
}
```

aur doosri:

```json
{
  "result": {}
}
```

aur teesri:

```json
{
  "response": {}
}
```

use kare to frontend development confusing ho sakti hai.

EduOS mein consistent API contract maintain karna hai.

---

# 46. API Naming

Consistent naming:

```text
/api/v1/users
/api/v1/students
/api/v1/teachers
/api/v1/parents
/api/v1/classes
/api/v1/sections
/api/v1/subjects
```

Naming project-wide consistent honi chahiye.

---

# 47. Nested Routes Carefully Use Karna

Example:

```http
GET /students/:studentId/attendance
```

natural ho sakta hai.

Lekin bohat deep nesting:

```http
/sessions/:sessionId/classes/:classId/sections/:sectionId/students/:studentId/attendance
```

har jagah use karna URL ko unnecessarily complex bana sakta hai.

Resource relationships aur endpoint usability ke according depth decide karni hai.

---

# 48. API Contract Mein Security Bhi Part Hai

Contract sirf request/response nahi.

Ye bhi define karna hai:

```text
Who can call?
Required role?
Required permission?
Ownership?
Relationship?
Possible errors?
```

Example:

```text
GET /students/:id/attendance

Authentication: Required
Permission: ATTENDANCE_VIEW
Student: Own resource
Parent: Active child relationship
Teacher: Relevant teaching assignment
```

---

# 49. API + Authorization Example

Student:

```text
GET /attendance/student-789
```

Flow:

```text
JWT
 ↓
user-123
 ↓
Student Profile
 ↓
student-789
 ↓
Ownership check
 ↓
ALLOW
```

Agar:

```text
JWT = user-456
```

aur user-456 ka student profile:

```text
student-999
```

to:

```text
student-999 ≠ student-789
        ↓
DENY
```

---

# 50. API + Parent Relationship

Parent request:

```text
GET /students/student-789/attendance
```

Backend check:

```text
JWT
 ↓
Parent Profile
 ↓
ParentStudent Relationship
 ↓
Relationship status?
 ↓
ACTIVE?
 ↓
Permission?
 ↓
ALLOW / DENY
```

Isliye Group 5 ki relationships Group 7 APIs mein actual value deti hain.

---

# 51. API + Teacher Assignment

Teacher request:

```text
GET /students/student-789/results
```

Backend:

```text
JWT
 ↓
Teacher
 ↓
Permission
 ↓
Teaching Assignment
 ↓
Academic Session
 ↓
Class
 ↓
Subject
 ↓
Student relationship
 ↓
Policy
 ↓
ALLOW / DENY
```

Ye senior-level relationship-based authorization ka practical use hai.

---

# 52. API Documentation

Har important endpoint ki documentation honi chahiye.

Example:

```text
Endpoint:
GET /api/v1/students/:studentId/attendance

Purpose:
Student attendance retrieve karna.

Authentication:
Required

Authorization:
Permission + ownership/relationship

Path Parameters:
studentId

Query Parameters:
page
limit
sessionId

Success:
200

Possible Errors:
401
403
404
422
500
```

---

# 53. OpenAPI / Swagger

Future API documentation ke liye OpenAPI/Swagger use kiya ja sakta hai.

### Purpose

API ko machine-readable/documented contract dena.

### Alternative

Markdown documentation.

### Why OpenAPI?

* interactive API documentation
* standardized specification
* client/tooling support

### Trade-off

Documentation maintain karni padti hai.

Decision:

EduOS mein OpenAPI/Swagger ko API surface mature hone ke baad introduce kiya ja sakta hai, rather than prematurely documenting unstable endpoints.

---

# 54. API Testing

API code likhna completion nahi.

Testing required hai.

Testing levels:

```text
Unit Test
Integration Test
HTTP/API Test
Authorization Test
Validation Test
Error Test
```

Example:

```text
GET /students/123
```

test cases:

```text
Valid request
Unauthenticated request
Unauthorized user
Student own resource
Student other resource
Parent linked student
Parent unlinked student
Teacher assigned student
Teacher unassigned student
Student not found
Invalid ID
Database failure
```

---

# 55. Expected Result

Har test ke saath expected behavior define karna important hai.

Example:

```text
Test:
Student accesses own attendance.

Expected:
HTTP 200
Attendance data returned.
```

Another:

```text
Test:
Student accesses another student's attendance.

Expected:
HTTP 403
Access denied.
```

Isse testing objective clear hota hai.

---

# 56. API Development Lifecycle

EduOS mein ek API ko:

```text
Requirement
   ↓
Design
   ↓
Documentation
   ↓
Contract
   ↓
Validation
   ↓
Implementation
   ↓
Authorization
   ↓
Database Integration
   ↓
Testing
   ↓
Performance Review
   ↓
Security Review
   ↓
Documentation Update
   ↓
Verified
```

ke baad complete maana jayega.

---

# 57. API Ko "Done" Kab Kahenge?

Sirf:

```text
Route exists
```

ka matlab API complete nahi.

API tab complete/verified consider hogi jab:

```text
✓ Requirement clear
✓ Contract defined
✓ Route implemented
✓ Authentication integrated where required
✓ Authorization integrated where required
✓ Validation implemented
✓ Business rules implemented
✓ Service layer correct
✓ Data access correct
✓ Response consistent
✓ Errors handled
✓ Security reviewed
✓ Tests passed
✓ Relevant performance concerns reviewed
✓ Documentation updated
```

---

# 58. REST API Mein Common Mistakes

### Mistake 1

Controller mein saari business logic.

### Mistake 2

Client input par blind trust.

### Mistake 3

Authorization sirf frontend par.

### Mistake 4

Har API se unlimited records return karna.

### Mistake 5

Password/token response mein bhejna.

### Mistake 6

Random error formats.

### Mistake 7

Har jagah database queries directly controller mein.

### Mistake 8

Historical relationships delete kar dena.

### Mistake 9

Har problem ke liye Redis/cache introduce kar dena.

### Mistake 10

API ko test kiye bina "complete" keh dena.

---

# 59. Technology Decisions

## Node.js + Express.js

EduOS teacher-defined backend stack ke according:

```text
Node.js
+
Express.js
```

API layer ke liye use hoga.

### Alternative

NestJS.

### Why not immediately?

EduOS mein Express architecture already established hai aur current learning objective backend fundamentals/layered architecture ko deeply samajhna hai.

NestJS future mein separate architecture learning ke liye use ho sakta hai.

---

# 60. MongoDB + Mongoose

Current EduOS architecture:

```text
Express
 ↓
Service
 ↓
Repository/Data Access
 ↓
Mongoose
 ↓
MongoDB Atlas
```

### Alternative

PostgreSQL + Prisma.

### Why not now?

Current project requirements aur established project decision MongoDB Atlas par based hain.

Future project/system mein relational workload ke according PostgreSQL + Prisma evaluate kiya ja sakta hai.

---

# 61. REST vs GraphQL

REST:

```text
GET /students
GET /students/:id
```

GraphQL:

```text
query {
  student {
    ...
  }
}
```

GraphQL powerful hai, lekin har project ke liye required nahi.

EduOS ke current scope mein REST simpler, well-understood aur appropriate architecture hai.

---

# 62. API Layer Aur System Design

Senior API designer sirf endpoint nahi dekhta.

Woh complete system dekhta hai:

```text
Client
 ↓
Load Balancer / Reverse Proxy
 ↓
Node.js API
 ↓
Middleware
 ↓
Service
 ↓
Database
```

Future scale par:

```text
API
 ↓
Cache
 ↓
Queue
 ↓
Workers
 ↓
Database
```

jaisi architecture requirements ke according introduce ho sakti hai.

---

# 63. API Performance Ka Golden Principle

**Fast API ka matlab sirf fast Node.js code nahi.**

Usually performance chain:

```text
Request
 ↓
Middleware
 ↓
Business Logic
 ↓
Database
 ↓
Network
 ↓
Serialization
 ↓
Response
```

Agar database query 2 seconds le rahi hai to controller ko optimize karne se problem solve nahi hogi.

Isliye bottleneck identify karo, phir optimize karo.

---

# 64. API Security Ka Golden Principle

Security ko endpoint ke end mein add nahi karna.

Start se:

```text
Authentication
+
Authorization
+
Validation
+
Least Privilege
+
Data Protection
+
Secure Errors
+
Logging
```

design ka part hone chahiye.

---

# 65. API Design Ka Senior Formula

Is formula ko yaad rakhna:

```text
Requirement
      ↓
Resource
      ↓
API Contract
      ↓
Authentication
      ↓
Authorization
      ↓
Validation
      ↓
Business Logic
      ↓
Data Access
      ↓
Response
      ↓
Error Handling
      ↓
Security
      ↓
Performance
      ↓
Testing
      ↓
Documentation
```

---

# 66. EduOS Group 7 Ka Practical Scope

Group 7 mein hum pehle API architecture establish karenge.

### Phase A — API Foundation

```text
API structure
Routing
HTTP methods
Request/response conventions
Status codes
Error format
Versioning
```

### Phase B — Existing Domain APIs

```text
User
Profile
Relationship
```

APIs ko current Group 4–6 architecture ke according connect karenge.

### Phase C — Authorization Integration

Har protected endpoint par:

```text
Authentication
 ↓
Permission
 ↓
Ownership / Relationship
 ↓
Policy
```

### Phase D — Validation

```text
Zod
Request validation
Business validation
```

### Phase E — Query Features

```text
Pagination
Filtering
Sorting
Search
```

### Phase F — Testing

```text
Unit
Integration
HTTP
Authorization
Validation
Error cases
```

### Phase G — Security & Performance Review

```text
Sensitive data
Rate limiting
Indexes
N+1
Query efficiency
Response size
Logging
```

---

# 67. Group 7 Ka Folder Responsibility

Existing EduOS architecture ko respect karte hue conceptual responsibility:

```text
routes/
    ↓
Request routing

middleware/
    ↓
Authentication
Authorization
Validation-related request gates

controllers/
    ↓
HTTP request/response handling

services/
    ↓
Business workflow

policies/
    ↓
Authorization decisions

repositories/
    ↓
Data access

models/
    ↓
Database schema/model

validators/
    ↓
Request validation

errors/
    ↓
Standard application errors
```

Exact folder/file names existing project structure ke according maintain honge.

**Group 7 ke liye existing folder architecture ko unnecessarily replace ya redesign nahi karna.**

---

# 68. Group 7 Aur Previous Groups Ka Connection

```text
Group 1
Backend Foundation
       ↓
Group 2
Authentication
       ↓
Group 3
Authorization
       ↓
Group 4
User/Profile
       ↓
Group 5
Dynamic Relationships
       ↓
Group 6
MongoDB/Data Architecture
       ↓
Group 7
REST API Engineering
```

Har group previous group ko use karega.

---

# 69. Group 7 Aur Future Attendance

Attendance ko directly random API se start nahi karenge.

Future flow:

```text
Group 4
Student/Teacher Profiles
        ↓
Group 5
Enrollment/Teaching Relationships
        ↓
Group 6
Database Model + Indexes
        ↓
Group 7
API Engineering
        ↓
Academic Module
        ↓
Attendance API
```

Isliye attendance API ka design incomplete foundation ke upar nahi banega.

---

# 70. Senior API Design Checklist

API banane se pehle:

```text
□ Requirement clear?
□ Resource identify?
□ Who can access?
□ Authentication required?
□ Permission required?
□ Ownership/relationship required?
□ HTTP method correct?
□ URL clear?
□ Request contract defined?
□ Response contract defined?
□ Validation defined?
□ Business rules defined?
□ Error cases defined?
□ Pagination needed?
□ Filtering needed?
□ Sorting needed?
□ Search needed?
□ Database query efficient?
□ Index available?
□ Sensitive data protected?
□ Rate limiting relevant?
□ Idempotency relevant?
□ Logging required?
□ Tests defined?
□ Documentation ready?
```

---

# 71. Final Architecture

EduOS API:

```text
                    CLIENT
                      │
                      ↓
                  REST API
                      │
                      ↓
                   ROUTE
                      │
                      ↓
              AUTHENTICATION
                      │
                      ↓
               AUTHORIZATION
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
      Permission          Relationship/Ownership
          │                       │
          └───────────┬───────────┘
                      ↓
                 VALIDATION
                      ↓
                  CONTROLLER
                      ↓
                   SERVICE
                      ↓
                  POLICY
             (when decision needed)
                      ↓
                REPOSITORY
                      ↓
                  MONGOOSE
                      ↓
                MONGODB ATLAS
                      ↓
                  RESPONSE
                      ↓
                   CLIENT
```

---

# 72. Final Senior Principle

EduOS mein hum API ko:

> **"URL + Controller"**

nahi samjhenge.

Hum API ko:

> **"A controlled, documented, secure contract between the client and the backend."**

samjhenge.

Aur har API ke liye senior thinking hogi:

```text
Client ko kya chahiye?
        ↓
Kya allowed hai?
        ↓
Kya valid hai?
        ↓
Business rule kya hai?
        ↓
Data efficiently kaise milega?
        ↓
Response kya hoga?
        ↓
Error kya hoga?
        ↓
Security kaise maintain hogi?
        ↓
Performance kaise maintain hogi?
        ↓
Test kaise prove karega ke API sahi hai?
```

## Group 7 Ka Golden Rule

**API tab complete nahi hoti jab endpoint chal jaye.**

API tab complete hoti hai jab:

```text
Correct
+
Secure
+
Authorized
+
Validated
+
Efficient
+
Consistent
+
Tested
+
Documented
```

ho.

Isi approach se EduOS ki APIs banengi.

---

# 73. Current EduOS API Contract

This section documents the API surface currently mounted by `backend/app.js`. It describes implemented routes only; it does not imply that future academic modules are already available.

Base path: `/api/v1`

## Authentication

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | `201`; creates a `PUBLIC_USER`, returns user data without tokens |
| POST | `/auth/login` | Public | `200`; returns user data and access/refresh tokens |
| POST | `/auth/refresh` | Public, refresh token required | `200`; returns a rotated token pair |
| POST | `/auth/logout` | Public, refresh token optional | `204`; revokes the supplied session when present |
| POST | `/auth/forgot-password` | Public | `200` |
| POST | `/auth/reset-password` | Public, reset token required | `200` |
| GET | `/auth/me` | Access token required | `200`; returns the authenticated account |

Registration does not issue a session. The client logs in after account creation to obtain tokens.

## Profile

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| GET | `/profile/me` | Access token required | `200`; returns the caller's role profile |
| PUT | `/profile/me` | Access token required | `200`; replaces the caller's role profile; required fields must be present |
| PATCH | `/profile/me` | Access token required | `200`; partially updates or creates the caller's role profile |

The authenticated identity is authoritative. A request body must not select another user's profile.

## Dynamic Relationships

All relationship routes require a valid access token and the matching ADMIN permission.

| Resource | Permission | Create | List | Get one | Close |
| --- | --- | --- | --- | --- | --- |
| Parent-student | `PARENT_STUDENT_MANAGE` | `POST /admin/relationships/parent-students` | `GET /admin/relationships/parent-students` | `GET /admin/relationships/parent-students/:relationshipId` | `PATCH /admin/relationships/parent-students/:relationshipId/close` |
| Student enrollment | `STUDENT_ENROLLMENT_MANAGE` | `POST /admin/relationships/student-enrollments` | `GET /admin/relationships/student-enrollments` | `GET /admin/relationships/student-enrollments/:relationshipId` | `PATCH /admin/relationships/student-enrollments/:relationshipId/close` |
| Teacher assignment | `TEACHER_ASSIGNMENT_MANAGE` | `POST /admin/relationships/teacher-assignments` | `GET /admin/relationships/teacher-assignments` | `GET /admin/relationships/teacher-assignments/:relationshipId` | `PATCH /admin/relationships/teacher-assignments/:relationshipId/close` |

Create returns `201`. Read and close operations return `200`. Missing records return `404`.

### Relationship List Pagination

List endpoints support only their own resource filters, plus `limit` and an opaque `cursor`:

- Parent-student: `parentUserId`, `studentUserId`, `relationshipType`, `status`
- Student enrollment: `studentUserId`, `academicSessionId`, `classId`, `sectionId`, `rollNumber`, `status`
- Teacher assignment: `teacherUserId`, `academicSessionId`, `classId`, `sectionId`, `subjectId`, `status`

```http
GET /api/v1/admin/relationships/student-enrollments?studentUserId=<id>&limit=50
GET /api/v1/admin/relationships/student-enrollments?studentUserId=<id>&limit=50&cursor=<nextCursor>
```

`limit` defaults to 50 and is capped at 100. Results are ordered by `validFrom` descending, then `_id` descending. Clients must treat `nextCursor` as opaque and send it unchanged to retrieve the next page.

```json
{
   "success": true,
   "data": [],
   "pagination": {
      "limit": 50,
      "hasMore": false,
      "nextCursor": null
   }
}
```

The cursor uses a stable keyset position rather than an offset, so later pages do not require skipping an ever-growing number of records. No total-count query is performed for each page.

These relationship records are identifier- and lifecycle-based, so the API does not expose a generic free-text search over referenced users. Search by person name belongs on a dedicated, indexed directory endpoint rather than an unbounded lookup across relationship collections.

## Browser Access and Abuse Limits

`CLIENT_ORIGINS` is a comma-separated list of allowed browser origins. Configure it for production; startup fails if production has no origin allowlist. In development, an empty list preserves local development access. Requests without an `Origin` header, such as Postman or server-to-server calls, are not blocked by CORS. CORS is a browser policy, not an authorization mechanism.

| Endpoint group | Limit per client IP |
| --- | --- |
| `POST /auth/login` | 10 requests per 15 minutes |
| `POST /auth/register` | 5 requests per hour |
| `POST /auth/forgot-password` and `/auth/reset-password` | 5 requests per hour |

Rate-limited responses return `429` with the existing `{ "success": false, "message": "..." }` shape. The default rate-limit store is process-local; deployments with multiple API instances need a shared store and correctly configured trusted-proxy settings.

## Verification Command

Run the backend's unit and HTTP/API tests with:

```bash
npm test
```
