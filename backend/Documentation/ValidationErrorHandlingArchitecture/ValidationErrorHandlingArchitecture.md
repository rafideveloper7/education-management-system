EduOS — Group 8: Validation & Error Handling Architecture
1. Group 8 for Main Purpose

Group 8 ka kaam sirf:

"Input check because"

oh hello.

Is group ka goal hai to EduOS ka backend:

input error ko accept na kare
invalid database data tak na jaane de
client ko predictable errors de
internal errors ko safely handle kare
sensitive information leak na kare
har API engine consistent validation aur error response de
developer ko debugging ke liye useful information mile
production mein application crash na ho
business rules aur input validation ko properly separate rakhe

Simple picture:

Client
   ↓
Request
   ↓
Validation
   ↓
Business Logic
   ↓
Database
   ↓
Response

Agar request error hi:

Client
   ↓
Request
   ↓
Validation ❌
   ↓
400 Validation Error
2. What's wrong with you?

Suppose student API hai:

POST /students

Client bhejta hai:

{
  "fullName": "",
  "email": "hello",
  "age": -5
}

Agar backend kuch check hi na kare:

Bad Input
   ↓
Controller
   ↓
Service
   ↓
Database

to database mein invalid data ja sakta hai.

Phir future mein:

Reports ❌
Attendance ❌
Results ❌
Authorization ❌

multiple places par problem aa sakti hai.

Isliye senior backend engineer ka principle:

Invalid data ko system to andar jitna early possible ho, reject karo.

3. Validation Kya Hoti Hai?

Baby style:

Validation in Matlab:

"Jo cheez user ne bheji hai, kya woh allowed format aur expected shape mein hai?"

Example:

Name
↓
Empty hai?
↓
❌

E-mail:

ali@gmail.com
↓
valid email format?
↓
✅

Age:

-5
↓
allowed?
↓
❌

Validation is basically a gatekeeper hi.

4. Validation Aur Authorization Same Nahi Hain

Ye distinction important hai.

Validation:

"Tumne jo data bheja hai woh sahi hai?"

Authorization:

"Tumhe ye kaam karne ki permission hai?"

Example:

Ali request bhejta hai:

{
  "classId": "class-9"
}

Validation check karegi:

classId valid format mein hai?

Authorization check karegi:

Ali ko class change karne ki permission hai?

Dono different problems hain.

5. Authentication, Authorization, Validation

Teenon ko mix nahi karna.

Authentication
↓
Tum kaun ho?

Authorization
↓
Tum kya kar sakte ho?

Validation
↓
Tumne jo data bheja hai woh valid hai?

Example:

Ali login karta hai
       ↓
Authentication
       ↓
Ali STUDENT hai
       ↓
Authorization
       ↓
Ali ko attendance dekhne ki permission hai?
       ↓
Validation
       ↓
Request mein studentId valid hai?
6. Validation to Types

EduOS mein validation ko different levels par samjhenge.

6.1 Request Shape Validation

Request mein required fields hain ya nahi?

Example:

{
  "fullName": "Ali"
}

So that:

email required

to request reject.

6.2 Type Validation

Example:

{
  "age": "twenty"
}

Expected:

number

Received:

string

Reject.

6.3 Format Validation

Example:

email
phone
date
MongoDB ObjectId

Example:

ali@gmail.com

valid format.

6.4 Range Validation

Example:

age = -5

Invalid.

Yes:

pageSize = 50000

to get maximum API:

100

rakhti hai to reject.

6.5 Enum Validation

Suppose role allowed values ​​hain:

ADMIN
TEACHER
STUDENT
PARENT
PUBLIC_USER

Client bhejta hai:

role = SUPER_ADMIN

Agar allowed nahi:

❌ Reject
7. Validation Kahan Hogi?

Senior architecture mein validation ko controller ke andar random ifstatements se nahi bharna.

Bad:

if (!email) ...
if (!name) ...
if (!phone) ...
if (!role) ...

har controller mein repeat because.

Better:

Route
 ↓
Validation Middleware
 ↓
Controller
 ↓
Service

Example:

POST /students
      ↓
student.create.schema
      ↓
controller
      ↓
student.service
8. Technology Decision

EduOS mein request validation ke liye hum Zod use kar sakte hain.

Concept:

Request
   ↓
Zod Schema
   ↓
Valid?
 ┌───────┴───────┐
Yes              No
 ↓                ↓
Controller       Error
Zod kya karta hai?

Zod JavaScript/TypeScript ecosystem engine schema-based validation library hi.

Example concept:

studentSchema

kehta hai:

fullName → string
email → valid email
admissionNo → string
9. Zod Kyun?

Problem:

Har API mein manual validation likhna repetitive aur error-prone ho sakta hai.

Zod se:

Expected structure
+
Rules
=
Reusable validation schema

Benefits:

centralized rules
readable schemas
reusable validation
consistent errors
TypeScript support
API boundaries par clear contract
10. Alternative Kya Ho Sakta Tha?

Possible alternatives:

Joi

Popular JavaScript validation libraries.

Yup

Validation to liye commonly used.

express-validator

Express middleware-based validation approach.

Mongoose validation

Database/model level validation.

11. Sirf Mongoose Validation Kyun Enough Nahi?

Ye senior-level point hai.

Suppose request aayi:

Client
 ↓
Controller
 ↓
Service
 ↓
MongoDB

Order hum sirf Mongoose par validation because:

Invalid request
↓
Backend processing
↓
Database layer
↓
Reject

Validation relatively late ho gayi.

Better:

Request
 ↓
Request Validation
 ↓
Authorization
 ↓
Business Logic
 ↓
Database Validation

Different layers ka different purpose hai.

12. Final Validation Decision

EduOS mein:

Request Boundary
        ↓
Zod Validation
        ↓
Business Validation
        ↓
Mongoose/Database Constraints

Use karenge.

Matlab ek hi validation layer par blindly depend nahi karenge.

13. Request Validation vs Business Validation

Ye bohat important distinction hai.

Request validation:
email valid hai?
Business validation:
Kya ye student already isi academic session mein enrolled hai?

Pehli:

Input Validation

Doosri:

Business Rule
14. Example: Student Enrollment

Request:

{
  "studentId": "...",
  "academicSessionId": "...",
  "classId": "...",
  "sectionId": "..."
}

Validation check:

studentId present?
academicSessionId present?
classId present?
sectionId present?
IDs valid?

Lekin service/business layer check karegi:

Student exist karta hai?
Session active hai?
Student already enrolled hai?
Class exist karti hai?
Section us class ka hai?

Ye business logic hai.

15. Error Handling Kya Hai?

Validation batati hai:

"Problem kya hai?"

Error handling decide karti hai:

"Is the problem with the system consistently kaise handle karega?"

Example:

Invalid email

Backend ko:

500 Internal Server Error

nahi dena chahiye.

Ye client ki input problem hai.

Better:

400 Bad Request
16. HTTP Status Codes

EduOS machine status codes meaningfully use karenge.

400 — Bad Request

Request invalid hi.

Example:

Invalid JSON
Invalid input
401 — Unauthorized

Authentication missing/invalid.

Example:

JWT missing
JWT invalid
403 — Forbidden

User authenticated hai, lekin permission nahi.

Student trying to access admin resource
404 — Not Found

Resource nahi mila.

Student does not exist
409 — Conflict

Request current state se conflict karti hai.

Example:

Admission number already exists
422 — Unprocessable Entity

Project to final API convention to according semantic validation errors to liye use kiya ja sakta hai.

Important: hum 400 vs 422 ko project-wide convention ke taur par decide karenge; APIs mein random mix nahi karenge.

500 — Internal Server Error

Unexpected server-side problem.

Client ko internal details nahi deni.

17. Consistent Error Response

Har API apna different error format na bheje.

Bad:

{
  "error": "wrong"
}

Another API:

{
  "message": "Invalid"
}

Another:

{
  "problem": "bad request"
}

Ye frontend ke liye headache hai.

Better centralized structure:

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}

Exact response contract implementation to waqt finalize hoga.

18. Error Code Kyun?

Suppose frontend ko ye message mila:

"Email already exists"

Human ke liye useful hai.

Lekin frontend to liye stable machine-readable code better:

USER_EMAIL_ALREADY_EXISTS

Then frontend:

if code === "USER_EMAIL_ALREADY_EXISTS"

specific UI show kar sakta hai.

Isliye:

Human Message
+
Machine Error Code

useful combination hi.

19. Sensitive Error Information

Backend ko internal information client ko nahi deni.

Bad:

MongoServerError:
E11000 duplicate key collection users index email...

Client ko raw database error with:

❌ bad practice.

Instead:

{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Email is already registered"
  }
}

Developer ke liye actual technical error logs mein preserve ho sakta hai.

20. Error Handling Architecture

High-level:

Route
 ↓
Validation
 ↓
Controller
 ↓
Service
 ↓
Repository/Model
 ↓
Error
 ↓
Error Handler
 ↓
Standard Response

Unexpected error:

Service
 ↓
throw error
 ↓
Global Error Handler
 ↓
Log internally
 ↓
Safe response to client
21. Global Error Handler

Har controller mein:

try {
   ...
} catch {
   ...
}

likhna ideal architecture nahi hai.

In order to take care of manual error handling hogi:

Controller 1 → different format
Controller 2 → different format
Controller 3 → different format

Consistency kharab ho magic hai.

Better:

Controllers
     ↓
throw errors
     ↓
Global Error Middleware
     ↓
Standard Response
22. Custom Application Errors

Hum different error categories ko represent kar sakte hain.

Concept:

AppError
├── ValidationError
├── AuthenticationError
├── AuthorizationError
├── NotFoundError
└── ConflictError

Iska benefits:

System ko pata hota hai:

ye expected business error hai

vs:

ye unexpected programming/system error hai
23. Expected vs Unexpected Errors
Expected

User ne invalid email bheji.

EXPECTED

System normal response dega.

Unexpected

Database connection suddenly fails ho gayi.

UNEXPECTED

System:

log
+
safe 500 response

dega.

24. Error Handling Ka Golden Rule

My client:

useful + safe

information do.

Developer ko:

detailed diagnostic

information do.

Matlab:

Client
↓
Safe error

Server logs
↓
Detailed technical error
25. Validation Middleware

Request pipeline:

Client
  ↓
Route
  ↓
Authentication
  ↓
Authorization
  ↓
Validation
  ↓
Controller
  ↓
Service
  ↓
Database

Lekin exact middleware order har endpoint to requirement to according define hoga.

Important principle:

Authentication, authorization aur validation ko blindly ek fixed sequence samajhne to bajaye endpoint to security contract to according arrange karna hai.

For example, kuch invalid unauthenticated requests ko authentication se pehle reject because information leakage considerations against bhi ho sakta hai. Isliye final order route-by-route document hoga.

26. Validation Fail Hone Par Kya Hoga?

Example:

POST /students

Request:

{
  "fullName": "",
  "email": "abc"
}

Flow:

Request
 ↓
Zod
 ↓
❌ Invalid
 ↓
Error Middleware
 ↓
400/422
 ↓
Client

Controller execute nahi hona chahiye.

Service execute nahi honi chahiye.

Database operations nahi hona chahiye.

Ye important hai.

27. Partial Data Ka Problem

Suppose request:

{
  "fullName": "Ali"
}

In order for the API to:

fullName
email
admissionNo

required chahiye, to validation reject karegi.

Database ko incomplete object bhejne se pehle hi request stop.

28. Unknown Fields

Suppose API sirf:

fullName
email
phone

accept karti hai.

Client bhejta hai:

{
  "fullName": "Ali",
  "email": "ali@example.com",
  "isAdmin": true
}

Question:

Why is the backend unknown field accepted because it is rejected?

Ye project-wide scheme policy hogi.

Security-sensitive endpoints mein unexpected fields ko silently accepted because dangerous ho sakta hai, especially jab mass-assignment style problems possible hon.

Isliye schemes ko carefully define karenge.

29. Mass Assignment Problem

Example:

Backend expects:

{
  "fullName": "Ali"
}

Attacker bhejta hai:

{
  "fullName": "Ali",
  "role": "ADMIN"
}

So that the backend blindly requests database objects to spread the card:

User.create(req.body)

to serious problem ho sakti hai.

Isliye:

Request validation
+
Allowed fields
+
Authorization
+
Explicit mapping

important hain.

30. Validation ≠ Security

Ye bhi yaad rakho.

Validation:

Data sahi hai?

Security:

User ko ye operation karne dena hai?

Example:

{
  "role": "ADMIN"
}

technically valid format ho sakta hai.

Lekin public user ko:

role = ADMIN

set karne dena:

❌ authorization/security problems.

31. Database Errors

Database bhi errors produce kar sakta hai.

Example:

Duplicate email

Backend raw MongoDB client error ko nahi dena.

Instead:

MongoDB error
 ↓
Error translator
 ↓
ConflictError
 ↓
409
 ↓
Safe response
32. Error Translation

Infrastructure error:

MongoDB duplicate key

Domain/API error:

EMAIL_ALREADY_EXISTS

Ye abstraction important hai.

Client ko database technology ka knowledge hona zaroori nahi.

33. Logging

Error handling aur logging connected hain.

Example:

Request
 ↓
Error
 ↓
Global Error Handler
 ├── Client → safe response
 └── Logger → technical details

Lekin sensitive information logs mein bhi blindly nahi daalni:

❌ password
❌ passwordHash
❌ access token
❌ refresh token
❌ secrets

34. Technology: Logger

Group 8 mein logging ka foundation error handling ke liye define hoga.

Detailed structured logging ka dedicated work Group 23 mein continue hoga.

Matlab:

Group 8
↓
Errors properly handle/log karne ka foundation

Group 23
↓
Complete Logging & Monitoring architecture
35. Error Handling Aur Group 23 Ka Difference

Group 8:

"Error aaye to system safely kya kare?"

Group 23:

"System mein kya hua, kab hua, kis request mein hua, aur production mein usko monitor kaise karein?"

Dono related hain, lekin same group nahi.

36. Validation Aur Database Architecture Ka Connection

Group 6 mein database architecture hi.

Ride:

Schema
Indexes
References
Constraints

define honge.

Group 8:

Request data
Business validation
Error behavior

define karega.

So:

Client Boundary
↓
Group 8 Validation
↓
Business Rules
↓
Group 6 Database Protection

Defense in depth.

37. API Contract To Saath Connection

Group 7 mein REST API contract define kiya.

Group 8 us contract ko enforce karega.

Example:

Group 7:

POST /students

expects:

{
  "fullName": "string",
  "email": "string"
}

Group 8:

Zod Schema

ensure karega ke request actual mein us contract ko follow kare.

38. Frontend Ko Kya Benefit Hoga?

Frontend developer ko predictable response milega.

Example:

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email"
      }
    ]
  }
}

Frontend easily:

email field
 ↓
show error

kar sakta hai.

39. Performance Consideration

Validation bhi efficient honi chahiye.

Hum:

simple input checks

request boundary par karenge.

Lekin expensive database checks ko unnecessarily validation middleware mein nahi daalenge.

Example:

email format

→ local validation.

But:

Is email already registered?

→ database/business layer.

Isse responsibilities clean rehti hain.

40. Error Response Mein Kya Avoid Karna Hai?

Avoid:

Stack trace
Database query
MongoDB collection details
File paths
Environment variables
Secrets
Internal service names

client response mein.

Ye information server-side logs mein controlled way se ho sakti hai.

41. Common Mistakes
Mistake 1

Har controller machine validation.

❌ duplication.

Mistake 2

Sirf frontend validation par trust.

❌ frontend bypass ho sakta hai.

Mistake 3

Sirf database validation.

❌ request boundary par late rejection.

Mistake 4

Raw database errors client ko dena.

❌ information leakage.

Mistake 5

Har error ko 500 banana.

❌ client ko actual problem samajh nahi aayegi.

Mistake 6

Har API ka different format error.

❌ frontend complexity.

Mistake 7

Business rules ko Zod schema mein bhar dena.

❌ wrong responsibility.

Mistake 8

req.bodywhy blindly database mein save because.

❌ mass-assignment risk.

42. Senior Architecture

Final mental model:

                 CLIENT
                    ↓
                 REQUEST
                    ↓
          ┌──────────────────┐
          │ Request Validation│
          └────────┬─────────┘
                   ↓
          Authentication
                   ↓
          Authorization
                   ↓
              Controller
                   ↓
               Service
                   ↓
         Business Validation
                   ↓
              Repository
                   ↓
              MongoDB
                   ↓
               Response

Error kahin bhi:

Any Layer
   ↓
Error
   ↓
Global Error Handler
   ├───────────────┐
   ↓               ↓
Safe Client      Server Log
Response
43. Group 8 Ki Technology Decisions
Requirements	Technology/Approach	Reason
Request validation	Zod	Schema-based, readable, reusable
Database validation	Mongoose/schema rules	Database/domain boundary protection
Error handling	Central Error Middleware	Consistent API behavior
Application errors	Custom error classes / AppError patterns	Expected errors ko categorize because
Error codes	Stable application codes	Frontend/backend contract
Logging	Existing logging foundation + later Group 23	Error diagnostics
HTTP status	Standard HTTP semantics	Predictable API behavior
44. Alternatives & Trade-offs
Joi

Use kar sakte the.

Trade-off: strong option hai, lekin project to existing direction mein Zod zyada suitable hai.

express-validator

Express-specific middleware approach.

Trade-off: route validation ke liye useful, lekin reusable schema/domain contract ko hum Zod se cleaner rakh sakte hain.

Yup

Possible alternatives.

Trade-off: API/backend schema contract ke liye hum Zod ko prefer karenge.

Only Mongoose

Simple projects mein kaam kar sakta hai.

Trade-off: request boundary validation aur API contract enforcement to liye insufficient as the only layer.

Decision
Zod
+
Business Validation
+
Mongoose/Database Protection
+
Central Error Handling
45. Group 8 Mein Hum Kya Implement Karenge?

Implementation ko bhi random nahi kara.

Step 1

Validation architecture.

Step 2

Common validation utilities.

Step 3

Zod schemas.

Step 4

Validation middleware.

Step 5

Standard application errors.

Step 6

Global error handler.

Step 7

HTTP error mapping.

Step 8

Database error translation.

Step 9

Safe error responses.

Step 10

Existing APIs par integration.

Step 11

Unit tests.

Step 12

Integration/API tests.

Step 13

Negative testing.

46. ​​Testing Strategy

Sirf successful request test nahi karni.

Hum intentionally error requests bhi bhejenge.

Example:

Valid request
Invalid email
Missing field
Wrong data type
Empty string
Invalid enum
Invalid ID
Duplicate resource
Unauthorized request
Forbidden request
Resource not found
Database failure
Unexpected server error

Har test ka expected behavior documentation mein record hoga.

47. Group 8 Complete Kahenge District?

Sirf Zod install karne se:

❌ COMPLETE

Sirf error middleware banane se:

❌ COMPLETE

Complete tab:

Validation
   +
Business validation
   +
Error handling
   +
API integration
   +
Database error mapping
   +
Consistent responses
   +
Unit tests
   +
Integration tests

verified hon.

48. Group 8 Ka Relationship Previous Groups Se
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
        ↓
Group 8
Validation & Error Handling

Group 8 basically Group 7 ki APIs ko safe, predictable aur production-ready boundary details hai.

49. Golden Rules
Rule 1

Frontend validation par trust nahi karna.

Rule 2

Backend request ko independently validate karega.

Rule 3

Validation aur authorization separate responsibilities hain.

Rule 4

Validation aur business rules ko unnecessarily mix nahi karna.

Rule 5

Raw database errors client ko nahi dene.

Rule 6

Har API ka consistent error contract hona chahiye.

Rule 7

Unexpected errors ko safely handle karna.

Rule 8

Sensitive information error response/logs mein leak nahi karni.

Rule 9

req.bodyko blindly persist nahi kara.

Rule 10

Negative testing mandatory hi.

50. 10 Saal Baad Ka Mental Models

Agar tum 10 saal baad Group 8 — Validation & Error Handlingkholo, to bas ye picture yaad rakhna:

                CLIENT
                   ↓
                REQUEST
                   ↓
              VALIDATION
             ↙          ↘
          VALID        INVALID
            ↓             ↓
         CONTINUE       ERROR
            ↓             ↓
        BUSINESS       STANDARD
         LOGIC          RESPONSE
            ↓
        DATABASE
            ↓
         RESPONSE

Aur error handling:

Any Layer
    ↓
  Error
    ↓
Global Error Handler
    ↓
 ┌───────────────┐
 ↓               ↓
Client          Logs
Safe            Detailed
Response        Diagnostics
Group 8 ka one-line principle

"Backend par har request ko trust nahi kara; input ko validate karo, business rules ko enforce karo, errors ko consistently handle karo, aur client ko sirf safe information do."

---

# 51. Implemented EduOS Contract

The current backend applies the Group 8 foundation to the API routes mounted by `backend/app.js`.

## Request Boundary

`validateRequest` runs Zod schemas before controllers. It stores parsed values in `req.validated`; controllers use those values rather than raw client input. Schemas are strict, so unknown fields are rejected. Profile schemas are selected after authentication using the authenticated role. Relationship create/list/close schemas are resource-specific. Business rules such as duplicate active relationships remain in services and database constraints.

## Error Response

Errors use the following stable shape. The top-level `message` remains temporarily for existing clients; new clients should read `error.code`, `error.message`, and `error.details`.

```json
{
  "success": false,
  "message": "Request validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "A valid email is required"
      }
    ],
    "requestId": "<request-id>"
  }
}
```

Every request receives an `X-Request-Id`; the same identifier is included in error responses. Successful response bodies are unchanged.

## Status and Error Mapping

| Condition | Status | Error code |
| --- | --- | --- |
| Invalid request shape/value or malformed JSON | 400 | `VALIDATION_ERROR` / `INVALID_JSON` |
| Missing or invalid access credentials | 401 | `UNAUTHENTICATED` |
| Authenticated caller lacks access | 403 | `FORBIDDEN` |
| Route or resource missing | 404 | `ROUTE_NOT_FOUND` / domain-specific not-found code |
| Duplicate key/resource conflict | 409 | `RESOURCE_CONFLICT` or domain-specific conflict code |
| Request body exceeds parser limit | 413 | `PAYLOAD_TOO_LARGE` |
| Rate limit exceeded | 429 | `RATE_LIMITED` |
| Unexpected internal failure | 500 | `INTERNAL_SERVER_ERROR` |

Zod issues return field-level details. Mongoose validation and cast errors are translated to safe client errors; MongoDB duplicate-key details are not exposed. Unexpected failures return a generic 500. Server-side diagnostics include the request ID, method, path, error class, and stack frames, but omit the raw exception message and request body to reduce accidental secret disclosure.

## Validation Coverage

- Auth registration, login, refresh, logout, forgot-password, and reset-password bodies
- Role-specific profile `PUT` and `PATCH` bodies
- Relationship create bodies, resource-specific list queries, relationship IDs, and close bodies
- Strict unknown-field rejection and validated-input-only controller access

## Verification

Run automated unit and HTTP tests with `npm test` from `backend/`. The suite covers expected application errors, malformed JSON, unknown routes, safe unexpected errors, Mongoose error translation, auth/profile/relationship request validation, and permission middleware.