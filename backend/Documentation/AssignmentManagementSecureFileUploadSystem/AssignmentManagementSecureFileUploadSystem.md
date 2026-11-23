EduOS — Group 12
Assignment Management & Secure File Upload System
Document Type: Software Architecture & Technical Specification
Project: EduOS — Education Management System
Module: Assignment Management and Student Submissions
Architecture: Modular Monolith
Backend: Node.js + Express.js
Database: MongoDB Atlas + Mongoose
File Storage: Cloudinary
API Style: REST API
API Version: /api/v1
Security Model: Authentication + Permission-Based Authorization + Resource-Level Access Control
Document Status: Finalized Requirements and Design Decisions
Implementation Status: Initial backend implementation present; automated Group 12 tests pass. Cloudinary-backed live verification and deployment configuration remain outstanding.

Implementation boundary: The current backend uses authenticated Cloudinary assets, server-side downloads, PDF/PNG/JPEG signature checks, administrator-configurable byte limits capped at 50 MB, assignment/submission models, resource authorization, and centralized errors. DOCX and other formats are intentionally not accepted until their content validation is explicitly implemented. No public Cloudinary URLs are returned to clients.
1. Purpose of This Module
1.1 Problem Statement
Educational institutions need a secure and reliable assignment management system through which teachers can create assignments, students can submit their work, and authorized staff can manage assignments and review submissions.
The system must support:
- Assignment creation and publication.
- Assignment attachments.
- Student submissions.
- Submission deadlines.
- Late submissions.
- Deadline extensions.
- Submission replacement before the effective deadline.
- Configurable upload limits.
- Secure file storage and access.
- Role-based and resource-level authorization.
- Submission status management.
- Reliable handling of database and file-storage failures.
- Efficient retrieval of assignments and submissions.
A basic implementation that only uploads a file and saves its URL is insufficient because it does not address authorization, deadline changes, file privacy, duplicate submissions, storage failures, or academic data integrity.
1.2 Architectural Goal
The objective is to implement Assignment Management as a maintainable backend domain within the existing EduOS architecture.
The module must integrate with existing authentication, authorization, user profiles, academic sessions, classes, sections, subjects, teacher assignments, and student enrollments.
Design principle: The module must extend the existing architecture rather than introduce a parallel architecture.
2. Scope and Boundaries
2.1 Included in Group 12
This group covers:
1. Assignment creation and management.
2. Assignment publishing and closing.
3. Assignment attachment uploads.
4. Student assignment access.
5. Student submissions.
6. Late-submission handling.
7. Teacher-controlled deadline extensions.
8. Submission replacement.
9. Configurable upload limits.
10. Cloudinary integration.
11. Private file access.
12. Submission status calculation.
13. Authorization and ownership checks.
14. Database indexes and query efficiency.
15. Failure handling and cleanup.
16. Logging, auditing, and testing.
2.2 Explicitly Excluded
The following are not part of this group's implementation unless separately approved:
- Examination and result management — Group 13.
- Fee management — Group 14.
- Notifications and email workflows — Group 17.
- Redis integration — Group 18, only if justified.
- BullMQ and background job infrastructure — Group 19.
- Event-driven automation — Group 20.
- WebSockets and real-time communication — Group 21.
- AI-based assignment grading.
- AI-based plagiarism detection.
- RAG-based assignment assistance.
- Microservices architecture.
These boundaries prevent unnecessary complexity and keep the module focused.
3. Architecture and Technology Decisions
3.1 Existing Backend Architecture
The implementation must follow the existing EduOS request-processing architecture:
Client
  |
  v
Route
  |
  v
Authentication Middleware
  |
  v
Permission Middleware
  |
  v
Resource-Level Authorization
  |
  v
Validation
  |
  v
Controller
  |
  v
Service
  |
  v
Policy / Repository
  |
  v
Model
  |
  v
MongoDB Atlas

File upload processing integrates with the service layer and Cloudinary:
Authenticated Request
        |
        v
Authorization + Validation
        |
        v
Upload Limit Enforcement
        |
        v
Cloudinary Upload
        |
        v
MongoDB Metadata Persistence
        |
        v
Successful Response

The precise middleware order must respect the existing repository's conventions. File parsing and upload processing must not run before the required authentication, authorization, and request-size protections.
Architecture rules
- Routes define HTTP endpoints and middleware composition.
- Middleware performs authentication and shared request checks.
- Controllers handle HTTP input and output.
- Services implement business rules.
- Policies and repositories follow existing EduOS conventions.
- Models define persistence structure and database constraints.
- Cloudinary integration follows the existing service and dependency conventions.
- Centralized error handling remains responsible for consistent API errors.
Do not place the complete business workflow inside route handlers or controllers.
3.2 Technology Decision Record
Technology or pattern	Decision	Reason
Node.js + Express.js	Use	Existing EduOS backend stack
MongoDB Atlas	Use	Existing project database
Mongoose	Use	Existing MongoDB data-modeling approach
Cloudinary	Use	Planned assignment and submission file storage
REST API	Use	Consistent resource-based backend interface
Modular monolith	Use	Appropriate for the current project architecture
MongoDB transactions	Conditional	Use only when multi-document MongoDB consistency requires them
Background job queue	Not required initially	Cleanup and core workflows should not force additional infrastructure without need
Redis	Not required	No demonstrated requirement for caching or distributed coordination
Microservices	Not used	Unnecessary operational complexity
RAG	Not used	Outside the approved requirements
AI grading	Not used	Future feature, not part of Group 12


Trade-off: A modular monolith is simpler to develop and deploy than a distributed system, but the module must maintain clear boundaries so it can evolve without spreading assignment-specific logic throughout the application.
4. Domain Model and Data Ownership
The system must distinguish an assignment from a student's submission.
4.1 Assignment
An assignment represents work created by an authorized teacher for a defined academic context.
Conceptual fields:
Field	Purpose
_id	Assignment identifier
title	Assignment title
description	Assignment instructions
academicSessionId	Associated academic session
classId	Associated class
sectionId	Associated section
subjectId	Associated subject
createdBy	Teacher or authorized creator's user identifier
attachments	Assignment attachment metadata
dueAt	Current effective deadline
status	Draft, published, or closed
publishedAt	Publication timestamp, when applicable
createdAt	Creation timestamp
updatedAt	Last update timestamp


This is a conceptual design, not a requirement to copy these fields blindly into an existing schema. Field names and relationships must follow existing EduOS conventions.
Academic context validation
Before an assignment is created or published, the backend must verify that:
- The academic session exists and is valid.
- The class and section belong to the correct academic context.
- The subject is valid for the applicable class or section.
- The teacher is authorized to manage the assignment for that context.
- The referenced entities are in an appropriate state.
A valid identifier alone does not establish authorization.
4.2 Submission
A submission represents a student's submitted work for a specific assignment.
Conceptual fields:
Field	Purpose
_id	Submission identifier
assignmentId	Associated assignment
studentId	Student profile identifier
enrollmentId	Applicable student enrollment
file	Current file metadata
submittedAt	Submission timestamp
status	Current calculated or persisted status
createdAt	Initial record creation
updatedAt	Latest update timestamp


The final model must distinguish the authenticated user's account ID from the student profile ID where required by the existing EduOS identity architecture.
For example:
User Account
    |
    v
Student Profile
    |
    v
Student Enrollment
    |
    v
Assignment Submission

Do not assume that a JWT's user ID and a student profile ID are interchangeable.
4.3 Why Assignment and Submission Must Be Separate
A single assignment may have many student submissions.
Embedding every student's complete submission data inside the assignment document would create unnecessary document growth and complicate independent submission queries.
Separate collections provide clearer ownership and support:
- Student-specific submission access.
- Teacher review workflows.
- Pagination.
- Independent submission queries.
- Duplicate prevention.
- More efficient indexing.
- Independent retention and lifecycle management.
Decision: Store assignments and submissions as separate domain entities.
5. Assignment Lifecycle
5.1 Assignment States
The initial assignment lifecycle is:
DRAFT
  |
  | Publish
  v
PUBLISHED
  |
  | Authorized closure
  v
CLOSED

DRAFT
- The assignment is not available to students as a published assignment.
- Authorized users can edit permitted fields.
- Student submissions are not accepted unless a separately approved rule explicitly permits them.
PUBLISHED
- Authorized students can view the assignment.
- Students may submit their work.
- The backend applies the effective deadline rules.
- Authorized teachers can manage permitted assignment fields and extend the deadline.
CLOSED
- The assignment is closed according to institutional policy.
- New submissions and replacements follow the explicit closure policy.
Important design distinction: A deadline passing and an assignment being closed are not automatically the same event.
The current requirements allow late first submissions. Therefore, the backend must not reject a first submission merely because the original deadline has passed.
An explicitly closed assignment may follow a different rule. The closure policy must be defined consistently before implementation rather than inferred from the deadline.
5.2 Deadline and Status Are Different Concepts
The deadline determines whether a submission is on time.
The assignment lifecycle status determines whether the assignment is in a state that permits the relevant operation.
For example:
Assignment Status: PUBLISHED
Effective Deadline: 20 October
Submission Time: 21 October
Submission Status: LATE

A submission can be accepted and still be late.
This separation prevents an incorrect implementation in which every submission after the deadline is rejected.
6. Final Business Rules: Deadline and Late Submission
This section contains the approved behavior for deadline handling.
6.1 Rule 1 — First Submission After the Deadline
A student's first submission must still be accepted after the deadline, provided the assignment is otherwise eligible to receive submissions.
The backend records the actual submission timestamp and evaluates the submission against the effective deadline.
Example:
Effective Deadline: 20 October
First Submission: 21 October
Result: Accepted
Status: LATE

The client must not decide the submission status.
The backend is the source of truth.
6.2 Rule 2 — Teacher Can Extend the Deadline
An authorized teacher may extend the deadline for an assignment they are permitted to manage.
The backend must:
1. Authenticate the requesting user.
2. Verify the relevant permission.
3. Verify that the teacher can manage the particular assignment.
4. Validate the new deadline.
5. Update the effective deadline.
6. Record an audit entry for the extension.
7. Re-evaluate existing submission statuses affected by the change.
A teacher must not be able to extend deadlines for unrelated assignments merely by knowing their IDs.
The new deadline and the user making the change must be recorded. Where institutional policy requires it, the reason for the extension must also be recorded.
6.3 Rule 3 — Recalculate Status After Deadline Extension
Final decision: Existing submissions must be evaluated against the current effective deadline.
Example A:
Original Deadline: 20 October
Student Submission: 21 October
Initial Status: LATE

Teacher Extends Deadline To: 25 October

New Evaluation:
21 October <= 25 October

Updated Status: ON_TIME

Example B:
Original Deadline: 20 October
Student Submission: 23 October
Initial Status: LATE

Teacher Extends Deadline To: 22 October

New Evaluation:
23 October > 22 October

Updated Status: LATE

The extension does not mean that every submission automatically becomes on time. The system compares the actual submission timestamp against the new effective deadline.
Historical accountability
Although the current status may change, the system should retain the deadline-extension audit record.
The audit record should identify, as applicable:
- Assignment.
- Previous deadline.
- New deadline.
- User who made the change.
- Timestamp.
- Reason, if required by policy.
This allows authorized staff to understand why a submission's status changed.
The audit record is different from preserving old uploaded submission files.
6.4 Rule 4 — Submission Timestamp
The server must generate the authoritative submission timestamp.
Do not trust a timestamp supplied by the browser.
Deadline comparisons must use a consistent time-zone strategy, preferably UTC storage with institution-local display and interpretation.
The deadline's exact semantics must be defined consistently. For example, if the effective deadline is stored as a timestamp, a submission at or before that timestamp is on time; a submission after it is late.
Boundary conditions must be covered by automated tests.
7. Final Business Rules: Replacement and Resubmission
7.1 Replacement Policy
The approved policy is:
- First submission is allowed after the deadline.
- Replacement is allowed only while the current effective deadline has not passed.
- Replacement is blocked after the current effective deadline.
- Deadline extensions change the replacement eligibility window.
- A successful replacement becomes the current submission.
- The previous uploaded file does not have to be preserved.
- The previous physical file may be deleted after the replacement has been successfully committed.
7.2 Scenario A — Submission and Replacement Before the Deadline
Effective Deadline: 20 October

First Submission:
19 October, 10:00 AM

Replacement:
19 October, 2:00 PM

Expected behavior:
1. First submission is accepted.
2. Replacement is allowed.
3. The replacement file becomes the current submission file.
4. The previous file does not have to be retained.
5. The previous file may be deleted after the new file and database update succeed.
The submission record should continue to identify the student, assignment, current file and authoritative submission timestamp.
7.3 Scenario B — First Submission After the Deadline
Effective Deadline: 20 October

First Submission:
21 October

Result:
Accepted
Status: LATE

If the effective deadline remains 20 October, replacement must be rejected.
Example:
Current Effective Deadline: 20 October
First Submission: 21 October
Replacement Attempt: 22 October

Result: Replacement Rejected
Reason: Effective deadline has passed

7.4 Scenario C — Deadline Extended After a Late Submission
Original Deadline: 20 October
First Submission: 21 October
Initial Status: LATE

Teacher Extends Deadline To: 25 October

The submission is re-evaluated against the new deadline and becomes ON_TIME.
The student may replace the file until the extended effective deadline passes.
Replacement Attempt: 24 October
Result: Allowed

If the student attempts replacement after 25 October, the backend rejects it, assuming no further extension has occurred.
Key rule: Replacement eligibility is based on the current effective deadline, not permanently on the original deadline.
7.5 Why Old File History Is Not Required
Your decision not to retain every previous uploaded file is reasonable for this module.
Benefits include:
- Lower storage consumption.
- Less unnecessary file retention.
- Simpler student-facing submission behavior.
- Fewer obsolete files to manage.
However, file deletion must be handled safely.
Required replacement sequence
1. Authenticate and authorize the student.
2. Validate the assignment and enrollment context.
3. Check the current effective deadline.
4. Validate file type and size.
5. Upload the replacement file to Cloudinary.
6. Update the submission record in MongoDB.
7. Confirm that the database update succeeded.
8. Delete the previous Cloudinary file.

If the database update fails after the new upload succeeds, the backend should attempt to remove the uncommitted new file and record any cleanup failure.
If deletion of the old file fails after the database update succeeds, the new submission remains valid. The cleanup failure should be logged and handled through a retry or reconciliation process consistent with the existing infrastructure.
Important: MongoDB and Cloudinary do not share a single atomic transaction. Their operations must be coordinated through explicit failure handling.
8. File Upload and Storage Architecture
8.1 Storage Decision
Cloudinary will store the physical assignment and submission files.
MongoDB will store file metadata and the reference needed to manage the stored file.
The binary file itself must not be stored inside the assignment or submission document.
Conceptual file metadata:
Field	Purpose
provider	Storage provider identifier
publicId or equivalent storage identifier	Identifies the stored file
resourceType	Cloudinary resource type
format	Verified or provider-reported file format
originalName	Original filename, subject to safe handling
sizeBytes	File size
uploadedAt	Upload timestamp


The final fields must match the chosen Cloudinary upload configuration and existing EduOS conventions.
Do not expose private storage credentials or unrestricted storage-management capabilities to the frontend.
8.2 Assignment Attachments
Assignment attachments are files uploaded by an authorized assignment creator.
Examples may include:
- PDF instructions.
- Images.
- Approved document formats.
- Other explicitly supported educational file types.
The backend must validate the file type, size and assignment context before accepting an upload.
Assignment attachments must not become publicly accessible merely because they are stored by a cloud provider.
8.3 Student Submission Files
Student submissions are private academic data.
A file's URL being difficult to guess is not sufficient security.
Access must be controlled by the backend using authentication, permissions and the relevant assignment/student relationship.
Where supported and appropriate, use private storage access or short-lived signed delivery links.
The backend must not issue an access link to a user who is not authorized to access that particular file.
8.4 File Deletion
Deleting a database record does not automatically delete the associated Cloudinary file.
Likewise, deleting a Cloudinary file does not automatically update MongoDB.
The implementation must coordinate these operations and handle partial failures.
The system must avoid deleting a currently referenced file before a replacement has been committed successfully.
9. Dynamic File-Size Configuration
9.1 Requirement
The maximum upload size must be configurable by an authorized administrator, but it must never be unlimited.
The application must enforce both:
1. The administrator-configured limit.
2. The system's absolute safety limit.
The effective limit is the lower of these two values.
Conceptually:
Effective Upload Limit =
MIN(Admin Configured Limit, System Hard Limit)

The provider's supported limits and any infrastructure constraints must also be respected.
9.2 Initial Proposed Limits
Upload type	Initial proposed maximum
Single assignment attachment	10 MB
Single student submission file	20 MB


These are initial project decisions, not universal industry standards.
They must be verified against the Cloudinary plan, supported formats, deployment infrastructure and institutional requirements before production deployment.
9.3 Administrator Configuration
An authorized administrator may increase or decrease the configured limit within the system's hard safety constraints.
Example:
Initial Student Submission Limit: 20 MB
Administrator Changes Limit: 30 MB
System Hard Limit: 50 MB

Effective Limit: 30 MB

If the administrator configures 60 MB while the hard limit is 50 MB, the effective limit remains 50 MB or the invalid configuration is rejected.
Both behaviors are safer than allowing the configuration to bypass the system's maximum.
9.4 Required Validations
The backend must enforce:
- Maximum file size.
- Allowed file types.
- File content/signature checks where applicable.
- Maximum number of files per request.
- Aggregate request-size limits.
- Authentication and authorization.
- Appropriate upload timeouts and failure handling.
The frontend may provide early validation for usability, but frontend checks must never replace backend validation.
9.5 Configuration Security
Only users with the explicitly granted configuration-management permission may change upload limits.
Configuration changes must be validated and logged.
An administrator must not be able to enter a value that disables the safety limit or makes uploads unlimited.
10. File-Type Validation and Upload Security
The backend must not rely solely on the file extension or the client-provided MIME type.
For example, renaming an executable or another unsupported file to .pdf does not make it a valid PDF.
The upload pipeline must apply the appropriate checks:
1. Authentication.
2. Resource-level authorization.
3. File-count and request-size limits.
4. Allowed extension and MIME checks.
5. Content/signature validation where applicable.
6. Upload to the configured storage provider.
7. Metadata persistence.
8. Failure cleanup.
Additional controls should include:
- Safe filename handling.
- No trust in client-supplied file paths.
- Restricted upload permissions.
- No secrets in logs.
- No public file access by default.
- Appropriate request and upload timeouts.
- Provider response validation.
- Structured logging for failures.
Malware scanning may be added if the institution's requirements and infrastructure justify it; it is not silently assumed to exist in this group.
11. Authentication and Authorization
11.1 Authentication
All protected assignment and submission operations must use the existing EduOS authentication middleware.
The backend must identify the authenticated user from the verified authentication context, not from an arbitrary user ID in the request body.
11.2 Permission-Based Authorization
The following are proposed permission identifiers. They must be aligned with the existing permissions.constants.js and permission-management implementation.
Permission	Purpose
ASSIGNMENT_VIEW	View permitted assignments
ASSIGNMENT_CREATE	Create assignments
ASSIGNMENT_UPDATE	Update permitted assignments
ASSIGNMENT_PUBLISH	Publish assignments
ASSIGNMENT_DEADLINE_EXTEND	Extend assignment deadlines
SUBMISSION_VIEW	View authorized submissions
SUBMISSION_UPLOAD	Submit student work
SUBMISSION_REPLACE	Replace an existing submission
SUBMISSION_HISTORY_VIEW	View permitted submission history or audit information


A permission alone does not automatically grant access to every assignment or student.
The backend must validate both the permission and the user's relationship to the specific resource.
11.3 Teacher Authorization
A teacher may manage an assignment only if:
- The required permission is present.
- The teacher is authorized for the relevant academic context.
- The teacher has access to the particular assignment.
- The assignment's state permits the requested operation.
Knowing an assignment ID must not bypass these checks.
11.4 Student Authorization
A student may access assignments applicable to their valid academic enrollment.
A student must not be able to:
- Submit work as another student.
- Replace another student's submission.
- Read another student's private submission.
- Modify assignment deadlines.
- Change submission status directly.
- Upload files to an unrelated assignment.
The backend should derive the relevant student identity from the authenticated account and its verified profile relationship.
11.5 Parent Authorization
A parent may view an assignment or linked child's submission only if:
1. The relevant permission is granted by institutional policy.
2. The parent-child relationship is valid.
3. The relationship provides access to the particular student.
4. The assignment and file access policy permits the operation.
An ended or invalid guardian relationship must not grant access merely because an old relationship record exists.
11.6 Administrator and Principal Authorization
Administrators and principals must follow the institution's configured permission policy.
The title ADMIN or PRINCIPAL must not silently grant unlimited access to every file and operation unless that privilege is explicitly approved by the authorization design.
Sensitive actions, including deadline changes and upload-limit changes, should be auditable.
12. REST API Design
The following endpoints are the proposed API surface. Before implementation, inspect existing EduOS routes, naming conventions and permission middleware so that the final routes do not conflict with established APIs.
All endpoints should follow the existing versioning and response conventions.
12.1 Teacher APIs
Method	Endpoint	Purpose
POST	/api/v1/teacher/assignments	Create an assignment
GET	/api/v1/teacher/assignments	List permitted assignments
GET	/api/v1/teacher/assignments/:id	Retrieve one permitted assignment
PATCH	/api/v1/teacher/assignments/:id	Update permitted assignment fields
POST	/api/v1/teacher/assignments/:id/attachments	Upload an assignment attachment
POST	/api/v1/teacher/assignments/:id/publish	Publish an assignment
PATCH	/api/v1/teacher/assignments/:id/deadline	Extend or update the deadline under policy
GET	/api/v1/teacher/assignments/:id/submissions	List permitted student submissions
GET	/api/v1/teacher/submissions/:id	Retrieve an authorized submission


12.2 Student APIs
Method	Endpoint	Purpose
GET	/api/v1/student/assignments	List assignments available to the student
GET	/api/v1/student/assignments/:id	Retrieve an authorized assignment
POST	/api/v1/student/assignments/:id/submissions	Create the first submission
PUT	/api/v1/student/submissions/:id/file	Replace the current submission file
GET	/api/v1/student/submissions	List the student's own submissions
GET	/api/v1/student/submissions/:id	Retrieve the student's own submission


The proposed PUT endpoint replaces the current file for a submission. If the existing EduOS API conventions favor a different method or route, follow the established convention while preserving the same business rules.
12.3 Administrative Configuration
An appropriate administrator-only endpoint may be introduced for upload-limit configuration, but its exact route must follow the existing EduOS configuration API design.
The operation must validate:
- The user's configuration permission.
- The requested limit.
- The system hard limit.
- The supported upload configuration.
- Audit requirements.
Do not expose Cloudinary credentials or storage configuration secrets through this endpoint.
12.4 API Requirements
Where applicable, the API must support:
- Pagination for large lists.
- Allowlisted sorting.
- Useful filtering.
- Server-side validation.
- Resource-level authorization.
- Consistent HTTP status codes.
- Consistent error responses.
- Upload limits.
- Appropriate retry behavior.
- Efficient database queries.
- Minimal data exposure.
Not every endpoint requires every feature. For example, pagination is especially relevant to assignment and submission lists, not necessarily to a single-resource update endpoint.
13. HTTP and Error-Handling Policy
The module must use the existing centralized error-handling system.
Suggested mappings include:
Situation	Expected HTTP status
Successful retrieval	200 OK
Successful creation	201 Created
Successful update	200 OK or 204 No Content
Invalid request data	400 Bad Request
Missing or invalid authentication	401 Unauthorized
Insufficient permission	403 Forbidden
Resource not found	404 Not Found
Duplicate or conflicting operation	409 Conflict
Request or file too large	413 Payload Too Large
Unsupported file type	415 Unsupported Media Type
Unexpected server failure	500 Internal Server Error
Temporary provider unavailability	Appropriate 5xx response


The exact status code should reflect the actual failure and existing EduOS API conventions.
A deadline rejection, for example, should use a documented and consistent error contract rather than returning an arbitrary server error.
Production responses must not expose:
- Stack traces.
- Internal file paths.
- Cloudinary credentials.
- Database credentials.
- JWTs or refresh tokens.
- Unnecessary internal implementation details.
Errors should be useful to clients while keeping internal details in secure server-side logs.
14. Database Integrity and Indexing
Indexes must be selected according to actual query patterns and verified with realistic data.
Possible index candidates include:
Query pattern	Potential index
Teacher's assignments ordered by creation date	Creator identifier + creation timestamp
Assignments for an academic context	Session + class + section, with additional fields as justified
Submissions for an assignment	Assignment identifier + submission timestamp
A student's submissions	Student identifier + submission timestamp
Current submission for a student and assignment	Assignment identifier + student identifier


These are candidates, not a requirement to create every index blindly.
14.1 Duplicate Submission Prevention
If the policy allows only one current submission record per student per assignment, a unique compound index on the relevant assignment and student identifiers may be appropriate.
This prevents concurrent requests from creating duplicate current-submission records.
If future requirements introduce multiple attempts, the uniqueness strategy must be revised explicitly.
Application-level checks alone may be insufficient under concurrent requests.
14.2 Data Integrity
The backend must verify that:
- The student is enrolled in the applicable academic context.
- The assignment belongs to that context.
- The teacher has the relevant assignment authority.
- A submission references an existing assignment.
- A submission's student and enrollment references are consistent.
- Unauthorized clients cannot change ownership fields.
- Submission status cannot be arbitrarily supplied by the client.
MongoDB transactions should be considered only where multiple MongoDB documents require atomic consistency. They are not a universal requirement for every assignment operation.
15. Reliability and Failure Handling
Cloudinary and MongoDB are separate systems. Their operations do not become atomic merely because the application invokes them in sequence.
The implementation must account for partial failure.
15.1 Upload Fails
If Cloudinary rejects the upload or becomes unavailable:
- Do not create a successful submission record.
- Return an appropriate error.
- Log the failure without exposing secrets.
- Do not claim that the submission succeeded.
15.2 Upload Succeeds but Database Save Fails
If the file is uploaded successfully but MongoDB persistence fails:
1. Attempt to remove the uncommitted Cloudinary file.
2. Log the database and cleanup outcomes.
3. Return an appropriate error.
4. Ensure that cleanup failures can be identified and reconciled.
The API must not report success if the submission record was not successfully committed.
15.3 Replacement Fails
When replacing an existing file:
- Upload the new file first.
- Update the database record.
- Confirm the database update succeeded.
- Delete the old file only after the new reference is committed.
If the database update fails, the existing committed submission must remain intact.
If old-file deletion fails after the update, the new submission remains valid. The obsolete file should be logged for cleanup or reconciliation.
15.4 Timeouts and Retries
Network timeouts can leave the client uncertain about whether an operation succeeded.
The backend should not blindly repeat uploads or create duplicate submission records.
Where appropriate, use an idempotency or deduplication strategy compatible with the existing API architecture.
The strategy must distinguish between:
- A request that definitely failed.
- A request that succeeded.
- A request whose outcome is unknown because of a timeout.
15.5 Deadline Concurrency
A deadline can be extended while a student is submitting or replacing a file.
The implementation must define and test the consistency behavior for this race condition.
The effective deadline must be checked on the server, not only when the assignment page initially loads.
Where a deadline extension and submission overlap, the backend must apply a consistent rule based on the authoritative deadline state at the operation's defined decision point.
16. Performance and Scalability
The initial implementation should use MongoDB indexes, appropriate query projections and pagination before introducing additional infrastructure.
Required considerations include:
- Pagination for large submission lists.
- Maximum page-size enforcement.
- Allowlisted sorting.
- Filtering by academic context, status and deadline where useful.
- Avoiding unnecessary full-document retrieval.
- Avoiding unbounded arrays of submissions inside assignments.
- Avoiding repeated database queries for the same relationships when a suitable query can retrieve the required information efficiently.
- Enforcing request and upload-size limits.
- Monitoring slow queries and provider latency.
Redis, distributed locks, background job queues and microservices are not automatically required.
They should be introduced only when measured performance, reliability requirements or a concrete workflow justifies them.
17. Security and Privacy Requirements
The module must follow the existing EduOS security model.
Authentication and authorization
- Protected routes require valid authentication.
- Permissions are enforced on the backend.
- Resource-level access checks are mandatory.
- Client-supplied ownership identifiers cannot override the authenticated identity.
- Students cannot access another student's private submission.
- Parents require a valid, authorized guardian relationship.
- Teachers must have the required academic assignment relationship.
File security
- Cloudinary credentials remain in secure server-side configuration.
- File-size limits are enforced by the backend.
- Allowed formats are explicitly configured.
- File extension and client MIME type are not treated as sufficient proof of content.
- Private academic files are not made public by default.
- Access links are issued only through an authorized flow.
- Replacement does not delete the current file before the new reference is safely committed.
- Upload and cleanup failures are handled explicitly.
Logging and auditing
Logs must not contain secrets, authentication tokens or unnecessary sensitive file-access data.
Audit records should cover sensitive operations such as deadline extensions and configuration changes.
Data retention
This group's approved replacement policy does not require retaining every previous file.
However, current submission records, necessary academic records and required deadline-extension audit information must be retained according to institutional policy.
18. Testing Strategy
Testing must verify both functional behavior and security boundaries.
18.1 Functional Tests
Test case	Expected result
Authorized teacher creates an assignment	Success
Unauthorized user creates an assignment	Rejected
Teacher publishes an assignment	Success if permitted
Student views an applicable assignment	Success
Student submits before deadline	Accepted and on time
Student submits after deadline	Accepted and marked late
Student replaces a submission before the effective deadline	Allowed
Student replaces a submission after the effective deadline	Rejected
Teacher extends the deadline	Allowed if authorized
Extension makes a previous late submission fall within the new deadline	Status recalculated to on time
Extension does not cover the submission timestamp	Submission remains late
Extension moves the deadline beyond a previously blocked replacement window	Replacement becomes eligible while the effective deadline remains open
Invalid academic context	Rejected
Duplicate current-submission creation	Prevented according to the chosen database constraint


18.2 File Upload Tests
Test at least:
- Valid supported file.
- Unsupported file type.
- Spoofed MIME type.
- Invalid file content where signature validation applies.
- File below the configured limit.
- File exactly at the configured limit.
- File above the configured limit.
- File above the system hard limit.
- Too many files in one request.
- Missing file.
- Cloudinary upload failure.
- MongoDB persistence failure after upload.
- Failed cleanup after database failure.
- Failed old-file deletion after successful replacement.
- Unauthorized file access.
- Expired or invalid temporary access link where applicable.
18.3 Authorization Tests
Verify that:
- A teacher cannot manage an unrelated assignment.
- A student cannot submit on behalf of another student.
- A student cannot view another student's private submission.
- A parent cannot access an unrelated student's submission.
- An ended guardian relationship does not grant access.
- A user without deadline-extension permission cannot change the deadline.
- A user without configuration permission cannot change upload limits.
- Revoked or changed permissions are respected by subsequent requests.
18.4 Concurrency Tests
Test concurrent requests involving:
- Duplicate first submissions.
- Simultaneous replacements.
- A deadline extension during submission.
- Two attempts to replace the same current file.
- A retry after an uncertain network timeout.
The purpose is to prevent inconsistent records, duplicate submissions and accidental deletion of the current file.
18.5 Regression Tests
Existing authentication, authorization, user/profile, academic session, enrollment and teacher-assignment behavior must continue to work.
Group 12 must not break previously completed EduOS modules.
19. Implementation Prerequisites
Before implementation, verify that the following are available and working.
Prerequisite	Why it is required
Authentication	Identifies the requesting user
Authorization	Enforces permissions and resource access
User and profile management	Connects accounts to student and teacher identities
Dynamic relationships	Supports parent-child and other relationship checks
MongoDB data architecture	Establishes schemas, references and indexing conventions
REST API conventions	Prevents conflicting endpoints and response formats
Validation and centralized error handling	Ensures safe and consistent failure behavior
Academic sessions	Defines the academic context
Classes and sections	Identifies the assignment's target students
Subjects	Validates the assignment's subject
Teacher assignments	Verifies teaching responsibility
Student enrollments	Verifies student eligibility
Cloudinary configuration	Enables controlled file storage
Upload policy	Defines supported file types and size limits
File access policy	Defines who may access each file
Cleanup strategy	Handles storage/database partial failures


Attendance from Group 11 is not a direct prerequisite for assignment management.
If a required prerequisite is incomplete, document the gap rather than inventing a parallel implementation inside Group 12.
20. AI Coding Agent Implementation Instructions
These instructions must accompany the technical specification whenever an AI coding agent is asked to implement Group 12.
20.1 Repository Inspection
Before changing code, inspect:
- The existing folder structure.
- Existing routes and controllers.
- Services and repositories or policies.
- Models and validation conventions.
- Authentication and permission middleware.
- Error-handling conventions.
- Existing upload utilities.
- Environment-variable conventions.
- Existing tests.
- Related user, profile, academic-context and enrollment models.
Understand the actual implementation before writing code.
20.2 Preserve the Existing Architecture
Do not redesign the project or modify the fixed folder structure without explicit approval.
The agent must not:
- Introduce unnecessary folders.
- Replace the established backend architecture.
- Switch the backend from Express to Python.
- Introduce PostgreSQL.
- Add microservices.
- Add Redis or BullMQ without a justified requirement.
- Add RAG or AI grading.
- Rewrite unrelated modules.
- Create duplicate versions of existing middleware or services.
Reuse existing utilities and conventions where appropriate.
20.3 Resolve Documentation/Code Conflicts
If the current code conflicts with the approved specification, the agent must:
1. Identify the conflicting file or behavior.
2. Explain the conflict.
3. Identify the impact on the implementation.
4. Propose a resolution.
5. Stop before making an architectural change that requires approval.
The agent must not silently alter approved requirements to make the implementation easier.
20.4 Implementation Order
Implement the module in logical stages:
1. Verify prerequisites and repository conventions.
2. Finalize the assignment and submission schemas.
3. Implement academic-context validation.
4. Implement assignment creation and management.
5. Implement assignment publishing.
6. Implement secure assignment attachment uploads.
7. Implement student assignment access.
8. Implement first submissions.
9. Implement effective-deadline and late-status logic.
10. Implement deadline extensions and status recalculation.
11. Implement replacement and safe cleanup.
12. Implement dynamic upload limits.
13. Add database indexes and concurrency protections.
14. Add authorization and security tests.
15. Add failure-handling tests.
16. Run regression tests.
17. Report results and outstanding risks.
This sequence is a logical implementation order, not permission to modify unrelated architecture.
20.5 Completion Report
After implementation, the agent must report:
- Files created.
- Files modified.
- Existing conventions reused.
- Business rules implemented.
- Authorization checks implemented.
- Database constraints and indexes added.
- Tests executed.
- Test results.
- Known limitations.
- Unresolved provider or infrastructure dependencies.
- Any deviations from the approved specification.
The agent must not claim that a feature is implemented merely because the corresponding code file exists.
Likewise, it must not claim production readiness without evidence from tests, configuration verification, security review and deployment checks.
21. Definition of Done
Group 12 is complete only when all applicable requirements below are implemented and verified.
Assignment management
- [ ] Assignment and submission are separate entities.
- [ ] Academic context is validated.
- [ ] Teacher permissions and assignment relationships are enforced.
- [ ] Assignment lifecycle behavior is consistent.
- [ ] Assignment attachments are uploaded securely.
Student submissions
- [ ] Students can submit work for authorized assignments.
- [ ] First submissions after the deadline are accepted when the assignment permits submissions.
- [ ] Late status is calculated on the backend.
- [ ] Replacement is allowed before the effective deadline.
- [ ] Replacement is rejected after the effective deadline.
- [ ] Deadline extensions update the effective deadline.
- [ ] Existing submission statuses are recalculated when necessary.
- [ ] Replacement eligibility follows the current effective deadline.
- [ ] The current submission record remains consistent.
File storage
- [ ] Cloudinary integration works with the configured file types.
- [ ] MongoDB stores metadata and file references rather than file bytes.
- [ ] Private files are protected.
- [ ] Configurable size limits are enforced.
- [ ] Hard system limits cannot be bypassed.
- [ ] Replacement and deletion are handled safely.
- [ ] Provider and database failures are handled.
- [ ] Failed cleanup can be logged and reconciled.
Data integrity and security
- [ ] Appropriate database constraints and indexes are implemented.
- [ ] Duplicate-submission behavior is enforced.
- [ ] Teacher, student and parent access checks are tested.
- [ ] Sensitive operations are audited.
- [ ] Sensitive values are excluded from inappropriate logs.
- [ ] Pagination and query efficiency are verified where applicable.
Quality and delivery
- [ ] Functional tests pass.
- [ ] Security and authorization tests pass.
- [ ] Failure-handling tests pass.
- [ ] Concurrency behavior is tested.
- [ ] Regression tests pass.
- [ ] Existing EduOS architecture is preserved.
- [ ] Documentation matches the implemented behavior.
- [ ] Remaining limitations are documented honestly.
22. Final Architecture Decisions
The following decisions are the authoritative Group 12 requirements.
Area	Final decision
Backend	Existing Node.js + Express.js
Database	MongoDB Atlas
File storage	Cloudinary
Assignment and submission models	Separate entities
First late submission	Allowed when assignment policy permits; status calculated against the effective deadline
Deadline extension	Authorized teacher may extend the deadline
Existing submission status after extension	Recalculate against the current effective deadline
Replacement before effective deadline	Allowed
Replacement after effective deadline	Blocked
Replacement after deadline extension	Allowed again if the new effective deadline has not passed
Previous file history	Not mandatory
Old file deletion	Allowed after successful replacement commit
Upload limits	Administrator-configurable within hard system limits
Initial assignment attachment limit	10 MB
Initial student submission limit	20 MB
File validation	Backend-enforced type, size and applicable content checks
Private file access	Authentication, authorization and resource-level checks
MongoDB transactions	Only where multi-document atomicity requires them
Cloudinary/MongoDB consistency	Explicit failure handling and cleanup
Redis, BullMQ and microservices	Not introduced without a justified requirement
RAG and AI grading	Excluded from this group
Existing EduOS structure	Must be preserved


Senior Backend Engineer's Final Assessment
Bahi, Group 12 ki sab se important engineering decisions sirf assignment create karna ya file upload karna nahi hain. Asal complexity in areas mein hai:
1. Deadline consistency: Extension ke baad status aur replacement eligibility dono correct rehne chahiye.
2. Authorization: User ke paas permission hone ke saath uska particular assignment ya student se valid relationship bhi hona chahiye.
3. File/database consistency: Cloudinary aur MongoDB mein partial failure se submission corrupt nahi honi chahiye.
4. Data integrity: Concurrent requests duplicate ya inconsistent submissions create na kar sakein.
5. Maintainability: Existing EduOS architecture aur conventions ke andar module implement ho.
Yeh specification in requirements ko define karti hai aur implementation ko objectively verify karne ka tareeqa bhi deti hai.

23. Group 12 Implementation and Verification Snapshot
23.1 Implemented Backend Surface
The current implementation is mounted under `/api/v1` and follows the existing Express, permission middleware, Zod validation, service, Mongoose, and centralized error-handling conventions.

Teacher/admin assignment operations:
- `POST /teacher/assignments`
- `GET /teacher/assignments`
- `GET /teacher/assignments/:assignmentId`
- `PATCH /teacher/assignments/:assignmentId`
- `POST /teacher/assignments/:assignmentId/attachments`
- `POST /teacher/assignments/:assignmentId/publish`
- `POST /teacher/assignments/:assignmentId/close`
- `PATCH /teacher/assignments/:assignmentId/deadline`
- `GET /teacher/assignments/:assignmentId/submissions`
- `GET /teacher/submissions/:submissionId`

Student operations:
- `GET /student/assignments`
- `GET /student/assignments/:assignmentId`
- `POST /student/assignments/:assignmentId/submissions`
- `GET /student/submissions`
- `GET /student/submissions/:submissionId`
- `PUT /student/submissions/:submissionId/file`

Authorized private file access:
- `GET /files/assignments/:assignmentId/attachments/:fileId`
- `GET /files/submissions/:submissionId`

Administrator upload policy:
- `GET /api/v1/admin/assignment-config/upload-limits`
- `PATCH /api/v1/admin/assignment-config/upload-limits`

Assignment context is checked against the existing academic session, class, section, subject/class-subject offering, `TeacherAssignment`, and `StudentEnrollment` records. The current identity model uses authenticated `User._id` values directly for teacher and student relationships. Assignment attachments and submissions are separate from their parent documents' file bytes; only storage metadata is persisted.

23.2 Automated Group 12 Tests
Run only the Group 12 test file during focused development:

`node --test backend/tests/assignment.test.js`

The current Group 12 automated suite covers:
- Assignment and submission schema requirements, strict ownership fields, and the unique assignment/student submission index.
- Server-calculated late first submission.
- Teacher assignment authorization before storage upload.
- Teacher/student/admin permission separation and public-user denial.
- Real multipart boundary behavior for spoofed content, accepted PDF signature, and configured upload-size rejection.
- Deadline extension audit creation and existing submission status recalculation.
- Replacement ordering: new object upload, database update, then old object deletion.
- Replacement rejection after the effective deadline.
- Administrator upload hard-cap enforcement.
- MongoDB-write failure after upload and best-effort cleanup logging.

These automated checks use injected service models/storage and do not prove a live MongoDB transaction, unique index build, Cloudinary account configuration, or actual signed file delivery.

23.3 Manual Group 12 API Verification
Run these manually with actual status and response body, one request at a time. Do not begin administrator endpoints until a trusted ADMIN token exists, and do not use a `PUBLIC_USER` token as an administrator.

Prerequisites before business-flow requests:
- A trusted ADMIN token for assignment configuration and academic setup.
- An active academic session, active class, matching active section, active subject and class-subject offering.
- An active teacher assignment for the target session/class/section/subject.
- An active student enrollment for the same academic context.
- Valid TEACHER and STUDENT tokens for those records.
- Cloudinary credentials configured as backend-only environment variables for upload/download tests.

Recommended manual sequence:
1. Verify missing and invalid tokens are rejected on a Group 12 endpoint.
2. Verify a valid `PUBLIC_USER` is denied on teacher assignment creation and administrator upload-limit update.
3. As the assigned teacher, create a draft assignment; verify wrong academic context and unassigned teacher attempts are rejected.
4. Upload a valid PDF/PNG/JPEG attachment; verify unsupported signature, MIME/extension mismatch, missing file, and file over the configured limit are rejected.
5. Publish the draft and retrieve it as its enrolled student; verify a student from another enrollment cannot view it.
6. Submit once before the deadline and verify `ON_TIME`; submit after the deadline as a first submission and verify accepted `LATE`; attempt a duplicate first submission and verify conflict.
7. Replace before the effective deadline; verify the new file is current. Attempt replacement after the deadline and verify conflict without old-file loss.
8. As the assigned teacher, extend the deadline with a reason; verify audit-backed update, recalculated status, and replacement eligibility under the new deadline.
9. As an unrelated teacher, attempt assignment update, deadline extension, submission listing, and file access; verify denial.
10. Verify student A cannot retrieve student B's submission metadata or file. Verify a parent can access only an actively linked child's permitted resource and an unrelated/ended link is denied.
11. As ADMIN, read the upload policy, update limits within the hard cap, then attempt a value above 50 MB and verify validation rejection.
12. Close the assignment; verify new submissions and replacements are rejected.

Live API verification is pending until the trusted accounts, academic records, and Cloudinary environment are available. Tests requiring those live prerequisites must be reported as pending, not passed.

23.4 Current Limitations and Operational Requirements
- Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` only in the backend environment. Upload and file-download operations return `503 FILE_STORAGE_UNAVAILABLE` until all three are configured.
- MongoDB transactions are used for submission/deadline consistency and therefore require a transaction-capable MongoDB deployment (Atlas/replica set). In-memory unit tests do not prove this deployment requirement.
- Cloudinary cleanup failures are logged for reconciliation; this implementation does not add a background retry queue, which remains intentionally outside the approved initial scope.
- The first allowed file formats are PDF, PNG, and JPEG only. DOCX, malware scanning, and additional types require separately validated support.
- The initial automated suite does not replace live provider tests or a replica-set concurrency test. Those remain deployment/integration verification items.