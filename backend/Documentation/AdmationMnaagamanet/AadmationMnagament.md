Group 15 — Admissions Management System
Final documentation
Backend engineering
Single institute

Admissions Management System
Public Applicant → Application → Admin Review → Approval / Rejection → Student Onboarding → Parent Linking → Academic Enrollment








akshaerp.com



1. Group 15 ka basic concept
Bahi, sab se pehle ek simple example samjho.

Suppose ek student Ali hai. Ali ke parents EduOS ki website open karte hain aur apne child ka admission apply karte hain.

Abhi Ali EduOS ka registered student nahi hai. Wo sirf ek Applicant hai.

School ka Admin application check karega:
1. Kya application complete hai?
2. Kya required documents available hain?
3. Kya information correct hai?
4. Kya admission criteria meet ho rahe hain?
Agar Admin approve kar deta hai, tab Ali ko EduOS ke existing user/profile system mein Student ke taur par onboard kiya ja sakta hai.

Yahan ek important difference samjho:
Term	Meaning
Applicant	Jo admission ke liye apply kar raha hai
Application	Admission ki request aur uska record
Admission Decision	Admin ka approve/reject decision
Student Account	EduOS ka authenticated student account
Student Profile	Student ki academic/personal profile
Enrollment	Student ka class, section aur academic session se connection

Ye sab ek hi cheez nahi hain. Inko mix karna future mein data aur authorization problems create kar sakta hai.
2. Group 15 ka main objective
Group 15 ka objective institute ke admission process ko digitally manage karna hai.

System mein:
- Public applicant admission application submit kar sake.
- Applicant required documents provide kar sake.
- Admin applications review kar sake.
- Admin application approve ya reject kar sake.
- Approved applicant ko Student ke taur par onboard kiya ja sake.
- Parent ko existing Parent–Student relationship system se link kiya ja sake.
- Student ko academic session, class aur section mein enroll kiya ja sake.
- Admission ki history maintain rahe.
Important: Admission approval ka matlab automatically student ko class mein enroll kar dena nahi hai. Onboarding aur enrollment separate steps hain.

3. Technology Stack — kya use hoga aur kyun?
Sab se important section. Bahi, har technology ka reason samajhna zaroori hai. Sirf technology ka naam yaad karna engineering nahi hoti.










1. Next.js — Frontend

Kyun? Public admission form, applicant interface aur Admin dashboard banane ke liye.

Iska kaam user ko interface dena hai. Form se data backend ko bhejna aur backend ke results display karna.

Alternative: React with Vite.

Hum Next.js kyun use kar rahe hain? EduOS ka existing frontend Next.js par hai. Ek aur frontend framework add karne ki zaroorat nahi.













2. Node.js — Backend Runtime

Kyun? Backend JavaScript code execute karne ke liye.

Admission application processing, business rules aur database operations Node.js environment mein run honge.

Alternative: Python runtime.

Hum Node.js kyun use kar rahe hain? EduOS ka approved backend already Node.js par hai. Python add karne se unnecessary second backend environment maintain karna padega.













3. Express.js — Backend Framework

Kyun? Admission ke API endpoints aur request handling ke liye.

Example: application submit karna, application review karna, approval dena aur enrollment initiate karna.

Alternative: NestJS, Fastify.

Hum Express kyun use kar rahe hain? EduOS ka approved backend Express hai. Group 15 mein NestJS introduce nahi karenge.













4. MongoDB Atlas — Database

Kyun? Admission applications, review records, document references aur admission history persist karne ke liye.

MongoDB documents mein related application data ko structured form mein store kar sakte hain.

Alternative: PostgreSQL, MySQL.

Hum MongoDB kyun use kar rahe hain? EduOS ka existing database MongoDB Atlas hai. Existing models aur data-access conventions reuse honge.













5. Mongoose — Database Modeling

Kyun? MongoDB documents ke schemas, validation, relationships ke references aur database queries manage karne ke liye.

Alternative: MongoDB native driver.

Hum Mongoose kyun use kar rahe hain? Agar EduOS ke existing modules Mongoose use karte hain to same conventions maintain karna better hai. Naya data-access approach add nahi karna.













6. Cloudinary — Document/File Storage

Kyun? Admission documents ko database mein binary form mein store karne ke bajaye file storage service par rakhne ke liye.

MongoDB mein document ka reference, metadata aur ownership information store ki ja sakti hai.

Alternative: AWS S3 ya local server storage.

Hum Cloudinary kyun use kar rahe hain? EduOS ke previous file-upload workflow mein Cloudinary selected hai. Pehle existing integration inspect hogi; agar admission documents ke privacy requirements support hote hain tabhi reuse karenge.













7. Existing JWT Authentication

Kyun? Admin aur authenticated users ki identity verify karne ke liye.

Admin-only operations, jaise application approve/reject karna, protected rahenge.

Alternative: Server-side sessions, OAuth-based authentication.

Hum existing JWT kyun use karenge? EduOS mein authentication already defined hai. Group 15 apna separate login system create nahi karega.













8. JavaScript — Application Language

Kyun? Backend business logic, controllers, services aur integration code likhne ke liye.

Alternative: TypeScript.

Decision: Existing repository jis language convention ko use karti hai, usi ko follow karna hai. Group 15 ke liye language migration nahi karni.



Technology decision summary: Ye technologies EduOS ke existing approved stack ke mutabiq hain. Koi new infrastructure ya package add karne se pehle repository aur actual requirements inspect karna mandatory hai.

4. System Architecture — request kaise travel karegi?
EduOS ka approved backend architecture same rahega:
Client — Next.js

Public Application Form / Admin Dashboard

Route — Express

API endpoint receive karega

Middleware

Authentication / Permission / Ownership

Controller

Request aur response handle karega

Service

Admission business rules execute honge

Policy / Repository

Access rules aur data operations

Model → MongoDB Atlas

Admission records persist honge


Har layer ka reason
Layer	Responsibility
Route	API endpoint define karna
Middleware	Identity, permissions aur record access check
Controller	Request receive aur response return
Service	Actual admission business logic
Policy/Repository	Authorization policy aur data access
Model	Database structure aur validation
MongoDB	Data persist karna

Is architecture ka benefit: Agar future mein admission approval ka business rule change hota hai to uski logic service layer mein manage hogi. Controller mein har business rule mix nahi hoga.

5. Functional Modules — complete requirements
Module 1: Admission Configuration
Problem: Har academic session mein admission policy ya available classes different ho sakti hain.

System ko admission-related configuration manage karne ki capability deni hogi, subject to institute policy.

Potential configuration:
- Admission availability
- Applicable academic session
- Application submission window
- Applicable classes
- Required application information
- Required documents
- Admission eligibility criteria
Technology: Existing MongoDB/Mongoose models and services.

Why: Configuration ko code mein hardcode karne ke bajaye managed data banana future changes ko easier bana sakta hai.

Important: Actual eligibility rules, age limits, deadlines aur document requirements institute se confirm honge. AI agent khud se ye rules invent nahi karega.
Module 2: Public Admission Application








schoolites.com


Problem: Parents ko admission ke liye manually institute visit karna pad sakta hai.

Solution: Public website par admission application form provide karna.

Expected functionality:
- Application form display.
- Applicant information collect karna.
- Required information validate karna.
- Application submit karna.
- Submission confirmation provide karna.
- Application reference provide karna, if approved policy requires it.
Technology: Next.js frontend + Express API + Mongoose.

Why: Existing stack ke andar hi complete workflow implement ho sakta hai.

Security: Public applicant ko Admin, Teacher ya Student role select karne ki permission nahi hogi. Public application submit karne ka matlab Student account create karna nahi hai.
Module 3: Applicant Management
Problem: Admin ko multiple admission applications organize aur track karni hoti hain.

Solution: Admin dashboard mein applicants aur unki applications manage karna.

Potential capabilities:
- Application list.
- Application details.
- Search and filtering.
- Application status.
- Submission date.
- Application history.
Technology: Existing Express services and MongoDB queries.

Why: Admin ko data organize karne ke liye structured interface milega.

Important: Search/filter ke liye query optimization aur pagination repository ke existing standards ke mutabiq hogi.
Module 4: Document Management








m.dailyhunt.in


Problem: Admission applications ke saath documents bhi required ho sakte hain.

Solution: Secure file-upload workflow.

Possible documents ki examples:
- Previous academic record.
- Birth-related document.
- Photograph.
- Other institute-required documents.
Ye sirf examples hain; final list institute approve karega.

Technology: Cloudinary, existing file-upload integration ke through.

Why Cloudinary?
- File storage ko application database se separate rakha ja sakta hai.
- Database mein file reference aur metadata save ki ja sakti hai.
- Existing upload integration reuse ho sakti hai.
Alternative: AWS S3.

Why not introduce S3 now? Existing system mein Cloudinary workflow available ho to unnecessary second storage provider maintain karna complexity create karega.
Document security requirements
- Allowed file types explicitly define hon.
- File size limit approved ho.
- Server-side validation mandatory ho.
- File ownership verify ho.
- Unauthorized users documents access na kar saken.
- Sensitive documents public URLs se accessible na hon.
- Secure/private delivery strategy repository aur provider capabilities ke mutabiq implement ho.
- File upload failure par application ko falsely complete na dikhaya jaye.
- File deletion/replacement ka behavior audit aur retention policy ke mutabiq ho.
Important: Cloudinary ka existing use hona automatically ye prove nahi karta ke har admission document private aur secure hai. Pehle current configuration inspect hogi.
Module 5: Application Review
Problem: Application submit hone ke baad institute ko verify karna hota hai ke information complete aur acceptable hai.

Solution: Authorized Admin application review karega.

Possible actions:
- Application details check.
- Documents inspect.
- Missing information identify.
- Review notes add, if policy permits.
- Further information request, if approved workflow supports it.
Technology: Express service layer + existing authorization middleware.

Why: Review rules backend mein enforce honge. Frontend button hide karna security nahi hoti.
Module 6: Admission Decision — Approve / Reject
Problem: Application ka final decision authorized person ne karna hota hai.

Solution: Admin approval ya rejection perform karega.

Decision ke waqt:
- Admin identity record ho.
- Decision timestamp record ho.
- Decision result record ho.
- Reason/notes policy ke mutabiq record hon.
- Previous decision history preserve ho.
Technology: Existing authentication, authorization and database architecture.

Why: Decision ka responsible person aur history traceable honi chahiye.

Senior rule: Application approve ya reject karne ka endpoint duplicate requests aur concurrent actions ke against safe hona chahiye. Ek hi application par do concurrent approvals se duplicate student profiles create nahi honi chahiye.
Module 7: Student Onboarding
Problem: Approved applicant ko actual EduOS Student system mein onboard karna hai.

Solution: Existing User Account + Student Profile architecture reuse hogi.

Example:
Before approval

Applicant = Ali

Admission application exists; no student profile is implied.

After approval and onboarding

User Account → Student Profile

Existing identity architecture ke through student onboarding.


Technology: Existing User Model, Student Profile Model, auth services aur approved onboarding workflow.

Why? Agar Group 15 apna separate student authentication system bana dega to duplicate users aur inconsistent permissions create ho sakti hain.

Rules:
- Student role backend assign karega.
- Public applicant khud ko Student role assign nahi kar sakta.
- Existing email/account ho to duplicate account blindly create nahi hoga.
- Applicant aur Student Profile ka relationship traceable hoga.
- Password aur credentials handling existing authentication policy follow karegi.
Important: Admission approval aur Student Account creation ke darmiyan failure ho sakta hai. Workflow retry-safe hona chahiye.
Module 8: Parent Linking
Problem: Student ko uske Parent account ke saath associate karna hai.

Solution: Existing Parent–Student relationship system reuse karna.

Potential cases:
1. Parent ka account already exist karta hai.
2. Parent ka account exist nahi karta.
3. Multiple guardians hain.
4. Parent ka email already kisi existing account se linked hai.
Technology: Existing User, Parent Profile aur Parent–Student relationship models.

Why? EduOS mein parent aur student relationships already designed hain. Group 15 ko duplicate relationship system nahi banana.

Security: Kisi bhi applicant ko kisi existing parent account ke saath sirf email ya name match hone par automatically link nahi karna. Relationship verification aur approved policy required hai.
Module 9: Academic Enrollment
Problem: Approved student ko actual academic class aur section se associate karna hai.

Solution: Existing enrollment workflow reuse karna.

Possible relationship:

Student → Academic Session → Class → Section

Technology: Existing Academic Session, Class, Section aur Enrollment models/services.

Why? Academic enrollment ka apna business logic hai. Admissions module ko duplicate enrollment logic nahi likhni chahiye.

Important distinction:
- Admission Approved = institute ne applicant ko accept kiya.
- Student Onboarded = Student account/profile create ya associate ho gaya.
- Academic Enrollment = Student academic session/class/section mein registered hai.
Ye teen separate milestones hain.
Module 10: Admission History and Audit
Problem: Future mein institute ko pata hona chahiye ke application par kab aur kisne action liya.

Solution: Important admission actions ki audit/history maintain karna.

Examples:
- Application submitted.
- Documents updated.
- Review performed.
- Decision made.
- Onboarding completed.
- Parent relationship linked.
- Enrollment completed.
Technology: Existing audit/history mechanism, if available.

Why? Financial aur academic systems ki tarah admission records bhi traceable hone chahiye.

Rule: Important history ko simply overwrite ya delete nahi karna. Existing retention and audit policy follow hogi.

6. Application Lifecycle — statuses kaise work karenge?
Bahi, status system important hai. Lekin yahan hum statuses ko final business policy samajh kar hardcode nahi karenge.

Illustrative lifecycle:
Submitted
Under Review
Approved

Student onboarding


Rejected

Decision history



Onboarded

Student account/profile

Enrolled

Academic session/class/section


Possible statuses sirf discussion ke liye hain. Final status names aur transitions repository conventions aur institute requirements inspect karne ke baad approve honge.

Status transition rule: Har status se har doosre status mein direct transition allowed nahi honi chahiye. Backend service validate karegi ke requested transition permitted hai ya nahi.

7. Data Design — database mein kya store hoga?
Bahi, ab ek important engineering decision.

Hum har cheez ko ek hi collection mein store nahi karenge. Lekin har choti cheez ki unnecessary collection bhi create nahi karenge.

Conceptual entities:
Entity	Purpose
Admission Configuration	Admission rules/configuration
Admission Application	Applicant ki admission request
Admission Document Reference	Uploaded documents ka reference/metadata
Admission Review / History	Review aur decision records
Student User/Profile	Existing identity and student records
Parent–Student Relationship	Existing relationship record
Academic Enrollment	Existing academic enrollment record

Ye conceptual design hai, final schema list nahi. Repository inspect karne ke baad decide hoga ke existing collection/model reuse karna hai ya new model genuinely required hai.
Relationships ka simple example
Admission Application

Approved Applicant

Existing User + Student Profile

Parent Link


Academic Enrollment




Important: Application ID, User ID, Student Profile ID aur Enrollment ID ko ek hi ID assume nahi karna. Existing EduOS relationship conventions follow hongi.

8. Security — sab se important engineering rules
Admissions mein personal information aur sensitive documents handle ho sakte hain. Is liye security optional nahi hai.
Risk	Required protection
Unauthorized approval	Existing permission middleware
Applicant data access	Ownership/access policy
Fake Student role	Backend-controlled role assignment
Duplicate applications	Approved duplicate-detection policy
Duplicate onboarding	Idempotent onboarding workflow
Document exposure	Private/authorized file access
Invalid input	Server-side validation
Unauthorized parent linking	Relationship verification
Concurrent decisions	Safe state transition and consistency
Sensitive information leakage	Safe logging and response filtering

Authentication vs Permission vs Ownership
Bahi, ye teen concepts yaad rakhna:
- Authentication: User kaun hai?
- Permission: Kya user ko admission approve karne ki authority hai?
- Ownership: Kya user ko is particular record tak access hai?
Example:

Admin authenticated hai. Lekin phir bhi system ko verify karna hai ke uske paas admission decision ki permission hai.

Public applicant apni application ka status dekh sakta hai, lekin doosre applicant ki application nahi.

Existing EduOS middleware ko reuse karna hai; duplicate authorization logic create nahi karni.

9. SOLID Principles — practical implementation
SOLID ka matlab unnecessary classes banana nahi. Iska matlab code ko understandable, maintainable aur change-friendly banana hai.
S — Single Responsibility Principle
Har component ka clear responsibility ho.

Example:
- Controller: HTTP request/response.
- Admission Service: Admission business rules.
- Document workflow: File operations.
- Onboarding workflow: Student onboarding.
Kyun? Agar document upload ka method change ho, to admission approval ki business logic unnecessarily change na karni pade.
O — Open/Closed Principle
Existing code ko har naye feature ke liye modify karte rehna avoid karna.

Example: Future mein admission application ke liye additional document type introduce karna ho, to existing document validation structure ko unnecessarily rewrite na karna pade.

Kyun? System future changes ke liye extensible rahe.
L — Liskov Substitution Principle
Agar inheritance use ki jaye to child implementation parent contract ko break na kare.

Decision: Sirf SOLID complete dikhane ke liye inheritance use nahi karni. Agar inheritance ki genuine need nahi, LSP ka separate implementation introduce nahi hoga.
I — Interface Segregation Principle
Components ko sirf woh methods expose karne chahiye jo unki responsibility ke liye required hon.

Example: Admission service ko file storage ke tamam provider-specific methods expose karne ki zaroorat nahi.

Kyun? Unnecessary dependencies aur tightly coupled code avoid hota hai.
D — Dependency Inversion Principle
High-level business logic ko unnecessary low-level implementation details par depend nahi karna chahiye.

Example: Admission business workflow ko Cloudinary ke internal API details ke saath tightly couple nahi karna.

Decision: Existing project patterns ke andar dependency separation apply hogi. Sirf abstraction dikhane ke liye extra interfaces ya folders create nahi honge.

10. Important failure scenarios — senior engineer kya sochega?
Bahi, real engineering sirf happy path nahi hoti. Humein ye bhi sochna hota hai ke jab system fail ho to kya hoga.
Scenario	Expected behavior
Applicant double-clicks Submit	Duplicate application prevent/detect according to policy
Same documents uploaded repeatedly	Existing upload and replacement policy follow
Admin approves twice	Duplicate onboarding nahi hona chahiye
Two Admins approve simultaneously	Only valid decision transition succeeds
Student profile creation fails	Approved application safe state mein rahe; retry/recovery possible ho
Parent linking fails	Student onboarding ko blindly repeat na karo
Enrollment fails	Existing student/profile duplicate create na ho
Database temporarily unavailable	Error handle ho; false success return na ho
File upload succeeds but application save fails	Orphaned file cleanup/reconciliation strategy ho
Application rejected accidentally	Reconsideration/reversal only if approved policy permits

Database transaction kab use hogi?
MongoDB transaction tab use karni hai jab multiple database records ko ek atomic operation mein update karna genuinely required ho aur current MongoDB deployment support karta ho.

Har operation ke liye transaction use nahi karni.
Idempotency kya hai?
Simple example:

Admin approval button do baar press karta hai. Network retry bhi request ko dobara send kar deta hai.

System ko ensure karna hai ke second request se duplicate Student Profile ya duplicate Enrollment create na ho.

Yahi idempotency ka practical purpose hai.

11. Group 14 aur Group 15 ka connection
Bahi, ye boundary bohat important hai.
- Group 14 = Fees & Finance Management.
- Group 15 = Admissions Management.
Suppose admission ke waqt application fee ya admission fee required hai.

Group 15 ko apna separate payment system nahi banana.

Usko Group 14 ke approved financial workflow ke saath integrate karna hoga, lekin sirf jab institute ki approved admission policy bataye ke fee kis stage par required hai.

Example:

Admission Application → Approved Fee Requirement → Group 14 Invoice → Group 14 Payment Verification

Group 15 khud payment success declare nahi karega.

Similarly, admission notifications ko Group 16 ya existing communication workflow ke through handle karna hai. Group 15 mein duplicate notification engine create nahi karna.

12. Business decisions jo approval ke baghair invent nahi karne
Senior engineer ka kaam har missing requirement ka khud se jawab banana nahi. Kuch decisions institute ke business owners se confirm karne hote hain.
Question	Decision required
Same student multiple applications submit kar sakta hai?	Duplicate application policy
Rejected application dobara submit ho sakti hai?	Resubmission policy
Application deadline kya hogi?	Admission calendar
Required documents kya hain?	Document policy
Admission age/eligibility criteria?	Institute policy
Application approve kaun kar sakta hai?	Admin authorization policy
Approval ke baad Student Account kab create hoga?	Onboarding milestone
Parent linking ka verification process?	Guardian relationship policy
Multiple parents/guardians allowed hain?	Relationship policy
Class capacity full ho to kya hoga?	Seat/capacity policy
Admission fee kis stage par generate hogi?	Group 14 integration policy
Rejected decision reverse ho sakta hai?	Reconsideration policy
Application records kitne time preserve honge?	Retention policy

AI Agent instruction: In decisions ko assumptions bana kar implement nahi karna. Unresolved list mein report karna aur approval ka wait karna.

13. Testing Strategy
Implementation ke baad sirf ye check karna kaafi nahi ke application submit ho gayi.

Humein complete workflow test karna hai.
Functional testing
- Valid application submission.
- Invalid application validation.
- Application listing and details.
- Document upload and access.
- Admin review.
- Approval and rejection.
- Student onboarding.
- Parent linking.
- Academic enrollment.
- Admission history.
Security testing
- Unauthorized user approval attempt.
- Public user trying to access another application.
- Student role self-assignment attempt.
- Unauthorized document access.
- Invalid parent linking.
- Invalid status transition.
Failure and consistency testing
- Duplicate submission.
- Duplicate approval.
- Concurrent approval.
- Student onboarding failure.
- Parent-linking failure.
- Enrollment failure.
- Database failure.
- File upload/database failure.
Integration testing
- Group 14 fee workflow.
- Existing authentication.
- Existing Student Profile.
- Existing Parent–Student relationship.
- Existing academic enrollment.
- Existing notification/communication workflow.

14. Implementation Roadmap
Hum complete module ek hi baar implement nahi karenge. Step-by-step build karenge.
1. Requirements and policy confirmation
   
   Admission workflow aur unresolved business decisions identify karna.
2. Repository inspection
   
   Existing routes, middleware, services, models, file upload aur relationships inspect karna.
3. Data relationship planning
   
   Application, User, Student Profile, Parent aur Enrollment relationships verify karna.
4. Admission configuration and application submission
   
   Approved application workflow implement karna.
5. Document management
   
   Secure upload, access aur metadata workflow.
6. Admin review and decision
   
   Review, approval, rejection aur audit history.
7. Student onboarding
   
   Existing User aur Student Profile system reuse.
8. Parent linking
   
   Existing Parent–Student relationship reuse.
9. Academic enrollment
   
   Existing academic enrollment workflow reuse.
10. Integration, testing and verification
    
    Group 14, Group 16 aur existing modules ke saath integration verify karna.

15. VS Code AI Agent ke liye final engineering instructions
Ye section directly VS Code AI Agent ko diya jayega. Ismein agent ko clear instructions hain ke wo pehle system samjhe, phir implementation plan banaye, aur approval ke baghair code change na kare.
GROUP 15 — ADMISSIONS MANAGEMENT SYSTEM
Engineering Specification and AI Agent Instructions
1. Project Context
You are working on EduOS, an Education Management System.

Approved technology stack:
- Frontend: Next.js
- Backend: Node.js + Express.js
- Database: MongoDB Atlas
- ODM: Mongoose
- File storage: Existing Cloudinary integration, subject to security and capability verification
- Authentication: Existing JWT-based authentication
- Architecture: Modular monolith
This is a single-institute system. Do not introduce multi-tenancy.
2. Primary Objective
Implement a secure and maintainable Admissions Management System.

Approved conceptual workflow:

Public Applicant → Application → Admin Review → Approval/Rejection → Student Onboarding → Parent Linking → Academic Enrollment.

An Applicant, Admission Application, User Account, Student Profile and Academic Enrollment are separate concepts.

Do not treat admission approval as automatic enrollment.
3. Architecture Rules
Follow the existing approved backend architecture:

Client → Route → Middleware → Controller → Service → Policy/Repository → Model → MongoDB Atlas.

Reuse existing:
- Authentication middleware
- Permission middleware
- Ownership middleware
- User model and authentication services
- Student Profile model
- Parent Profile and Parent–Student relationship
- Academic Session, Class, Section and Enrollment models
- File upload integration
- Audit/history conventions
- Notification and communication workflow
Do not duplicate existing functionality.
4. Technology Decisions
Use the existing approved stack.

Do not introduce:
- A second backend framework
- A second database
- A new authentication system
- A separate payment system
- A new file-storage provider without an approved requirement
- Microservices
- Unnecessary queues, Redis or additional infrastructure
- AI features without a justified requirement
Use Cloudinary only after inspecting its existing configuration and confirming it can meet admission-document privacy and access requirements.
5. Functional Requirements
The module must support the approved requirements for:
1. Admission Configuration
2. Public Admission Application
3. Applicant Management
4. Document Management
5. Application Review
6. Admission Approval/Rejection
7. Student Onboarding
8. Parent Linking
9. Academic Enrollment
10. Admission History and Audit
The detailed fields, document list, statuses and business rules must be based on approved requirements and repository conventions.

Do not invent missing business policies.
6. Identity and Authorization
Public application submission must not allow the applicant to select or assign ADMIN, TEACHER or STUDENT roles.

Student role assignment must happen through authorized backend onboarding.

Reuse existing User Account and role-profile architecture.

Authentication answers who the user is.

Permission checks whether the user may perform an operation.

Ownership checks whether the user may access a specific record.

Never rely only on frontend button visibility for security.
7. Document Security
Inspect the existing Cloudinary integration before reuse.

Implement only the approved document policy.

Verify:
- File type
- File size
- Server-side validation
- Ownership
- Authorized access
- Private/signed delivery where supported and required
- Safe error handling
- File cleanup or recovery for failed workflows
Do not expose sensitive admission documents through unrestricted public URLs.
8. Approval and Onboarding Consistency
Approval, Student onboarding, Parent linking and Academic enrollment are separate milestones.

Duplicate approval must not create duplicate Student Profiles.

Repeated or concurrent requests must be handled safely.

Onboarding and enrollment must be retry-safe.

If a step fails, preserve the existing valid state and provide a safe recovery path.

Use MongoDB transactions only when multiple database writes genuinely require atomicity and the deployment supports transactions.

Do not assume that a successful browser redirect proves an operation succeeded.
9. Group Integrations
Group 14 owns financial rules and payment processing.

If an admission fee is required, integrate with Group 14's existing invoice/payment workflow.

Do not create another payment system.

Group 16 or the existing communication workflow owns communication features.

Do not create a duplicate notification engine.

Reuse existing academic enrollment and Parent–Student relationship systems.
10. SOLID Principles
Apply SOLID practically:
- SRP: Keep HTTP handling, business logic, data access and file operations appropriately separated.
- OCP: Design existing workflows to accommodate justified future changes without unnecessary rewrites.
- LSP: Follow substitutability if inheritance is genuinely used.
- ISP: Avoid unnecessary large contracts and unused dependencies.
- DIP: Keep business logic appropriately separated from low-level provider details.
Do not create unnecessary classes, interfaces, folders or abstractions merely to demonstrate SOLID.
11. Business Decisions Requiring Approval
Do not invent:
- Duplicate application policy
- Resubmission policy
- Application deadlines
- Admission eligibility or age criteria
- Required document list
- Admission approval authority
- Parent/guardian verification policy
- Class capacity rules
- Admission fee timing
- Reconsideration/reversal policy
- Record retention policy
List unresolved decisions and request approval.
12. Mandatory Engineering Workflow
Follow this workflow:
1. Documentation Review
2. Repository Inspection
3. Existing Architecture Verification
4. Requirement and Gap Analysis
5. Implementation Plan
6. User Approval
7. Implementation
8. Automated and Manual Testing
9. Security and Integration Verification
10. Documentation Update
11. Completion Report
13. Initial Task — Inspection Only
For the first task, DO NOT modify any code.

Inspect the existing repository and report:

A. Existing folder structure relevant to admissions.

B. Existing routes, controllers, services, policies, repositories and models.

C. Existing User and role-profile architecture.

D. Existing Student Profile and onboarding workflow.

E. Existing Parent–Student relationship implementation.

F. Existing Academic Session, Class, Section and Enrollment implementation.

G. Existing authentication, permission and ownership middleware.

H. Existing Cloudinary/file-upload integration and its security configuration.

I. Existing audit/history and communication integrations.

J. Existing Group 14 financial integration points.

K. Missing requirements and architecture gaps.

L. Potential duplicate functionality that should be reused rather than recreated.
14. Inspection Report Format
For every relevant finding, provide:
- Existing file path
- Existing responsibility
- How it works
- Whether it can be reused
- Missing functionality
- Risk or dependency
- Recommended next step
Clearly separate verified repository facts from assumptions.

If a required component does not exist, report it. Do not silently create it.
15. Stop and Ask for Approval
After inspection, produce a detailed implementation plan.

Do not modify files, create folders, install packages, change schemas or implement endpoints until the user reviews and approves the plan.

If the existing repository conflicts with this specification, stop and explain:
- The conflict
- Affected files
- Available options
- Security and maintenance trade-offs
- Your recommendation
Wait for explicit approval before changing the approved architecture.
16. Quality Standard
Write clean, readable, maintainable and secure code.

A future engineer should understand the purpose of every important component without needing to guess.

Avoid:
- Duplicate business logic
- Fat controllers
- Unnecessary abstractions
- Unvalidated input
- Insecure document access
- Hardcoded business policies
- Uncontrolled status changes
- Duplicate onboarding
- Fake success responses
- Unnecessary dependencies
Do not claim that the module is production-ready without evidence from testing, security verification and integration checks.

First deliverable: Repository Inspection Report only. No code changes.