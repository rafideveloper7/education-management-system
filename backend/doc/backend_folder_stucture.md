# Backend Folder Structure

## Education Management System

### Express.js + MongoDB Atlas REST API

---

# 1. Simple Initial Structure

Ye initial setup ke liye enough hai.

```text
backend/
├── server.js
├── app.js
├── config/
├── middleware/
├── routes/
├── controllers/
├── services/
├── models/
├── validators/
├── utils/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Purpose

```text
server.js       -> Server bootstrap
app.js          -> Express app setup
config/         -> Database, env, storage, mail configuration
middleware/     -> Auth, permission, validation, upload, errors
routes/         -> API endpoints
controllers/    -> HTTP request/response layer
services/       -> Business logic and workflows
models/         -> MongoDB schemas/models
validators/     -> Request validation schemas
utils/          -> Shared helpers
.env            -> Environment variables
```

---

# 2. Standard Production Structure

EduOS simple CRUD app nahi hai. Isme admissions, academic records, fee workflows, attendance, communication, notices, ID cards, reports, notifications aur audit history hain.

Production backend mein controllers ke andar business logic nahi hona chahiye. Controllers thin rahenge, actual rules services/policies mein honge.

```text
backend/
├── server.js
├── app.js
├── config/
│   ├── db.js
│   ├── env.js
│   ├── cloudinary.js
│   ├── mail.js
│   └── queue.js
├── constants/
│   ├── roles.constants.js
│   ├── permissions.constants.js
│   ├── status.constants.js
│   └── app.constants.js
├── middleware/
│   ├── auth.middleware.js
│   ├── permission.middleware.js
│   ├── validation.middleware.js
│   ├── upload.middleware.js
│   ├── rateLimit.middleware.js
│   ├── audit.middleware.js
│   ├── error.middleware.js
│   └── notFound.middleware.js
├── routes/
│   ├── public/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   └── parent/
├── controllers/
│   ├── public/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   └── parent/
├── services/
├── policies/
├── models/
├── validators/
├── jobs/
├── workers/
├── events/
├── sockets/
├── repositories/
├── utils/
├── tests/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Main Architecture

```text
Client
  ↓
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Policies + Repositories
  ↓
Models
  ↓
MongoDB Atlas
```

---

# 3. Complete Detailed Structure

Ye complete EduOS implementation ke liye recommended backend structure hai.

```text
backend/
├── server.js
├── app.js
│
├── config/
│   ├── db.js
│   ├── env.js
│   ├── cloudinary.js
│   ├── mail.js
│   ├── queue.js
│   └── cors.js
│
├── constants/
│   ├── roles.constants.js
│   ├── permissions.constants.js
│   ├── status.constants.js
│   ├── notification.constants.js
│   └── app.constants.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── permission.middleware.js
│   ├── ownership.middleware.js
│   ├── validation.middleware.js
│   ├── upload.middleware.js
│   ├── rateLimit.middleware.js
│   ├── audit.middleware.js
│   ├── error.middleware.js
│   └── notFound.middleware.js
│
├── routes/
│   ├── public/
│   │   ├── auth.routes.js
│   │   ├── admission.routes.js
│   │   ├── website.routes.js
│   │   ├── program.routes.js
│   │   ├── department.routes.js
│   │   ├── faculty.routes.js
│   │   ├── notice.routes.js
│   │   ├── event.routes.js
│   │   ├── gallery.routes.js
│   │   ├── facility.routes.js
│   │   ├── achievement.routes.js
│   │   ├── contact.routes.js
│   │   └── faq.routes.js
│   ├── admin/
│   │   ├── dashboard.routes.js
│   │   ├── users.routes.js
│   │   ├── students.routes.js
│   │   ├── teachers.routes.js
│   │   ├── parents.routes.js
│   │   ├── publicUsers.routes.js
│   │   ├── academic.routes.js
│   │   ├── timetable.routes.js
│   │   ├── attendance.routes.js
│   │   ├── assignments.routes.js
│   │   ├── exams.routes.js
│   │   ├── results.routes.js
│   │   ├── fees.routes.js
│   │   ├── payments.routes.js
│   │   ├── admissions.routes.js
│   │   ├── applications.routes.js
│   │   ├── complaints.routes.js
│   │   ├── leave.routes.js
│   │   ├── notices.routes.js
│   │   ├── events.routes.js
│   │   ├── calendar.routes.js
│   │   ├── documents.routes.js
│   │   ├── notifications.routes.js
│   │   ├── reports.routes.js
│   │   ├── idCards.routes.js
│   │   ├── website.routes.js
│   │   ├── settings.routes.js
│   │   └── auditLogs.routes.js
│   ├── teacher/
│   │   ├── dashboard.routes.js
│   │   ├── profile.routes.js
│   │   ├── classes.routes.js
│   │   ├── students.routes.js
│   │   ├── attendance.routes.js
│   │   ├── assignments.routes.js
│   │   ├── exams.routes.js
│   │   ├── results.routes.js
│   │   ├── timetable.routes.js
│   │   ├── applications.routes.js
│   │   ├── complaints.routes.js
│   │   ├── leave.routes.js
│   │   ├── notices.routes.js
│   │   ├── notifications.routes.js
│   │   └── idCards.routes.js
│   ├── student/
│   │   ├── dashboard.routes.js
│   │   ├── profile.routes.js
│   │   ├── attendance.routes.js
│   │   ├── assignments.routes.js
│   │   ├── exams.routes.js
│   │   ├── results.routes.js
│   │   ├── fees.routes.js
│   │   ├── timetable.routes.js
│   │   ├── applications.routes.js
│   │   ├── complaints.routes.js
│   │   ├── leave.routes.js
│   │   ├── notices.routes.js
│   │   ├── notifications.routes.js
│   │   └── idCards.routes.js
│   └── parent/
│       ├── dashboard.routes.js
│       ├── profile.routes.js
│       ├── children.routes.js
│       ├── attendance.routes.js
│       ├── assignments.routes.js
│       ├── exams.routes.js
│       ├── results.routes.js
│       ├── fees.routes.js
│       ├── timetable.routes.js
│       ├── applications.routes.js
│       ├── complaints.routes.js
│       ├── leave.routes.js
│       ├── notices.routes.js
│       └── notifications.routes.js
│
├── controllers/
│   ├── public/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   └── parent/
│
├── services/
│   ├── auth/
│   │   ├── auth.service.js
│   │   ├── token.service.js
│   │   └── password.service.js
│   ├── user/
│   │   ├── user.service.js
│   │   ├── role.service.js
│   │   └── account.service.js
│   ├── admission/
│   │   ├── admission.service.js
│   │   └── admissionWorkflow.service.js
│   ├── student/
│   │   ├── student.service.js
│   │   ├── studentProfile.service.js
│   │   └── studentEnrollment.service.js
│   ├── teacher/
│   │   ├── teacher.service.js
│   │   └── teacherAssignment.service.js
│   ├── parent/
│   │   ├── parent.service.js
│   │   └── parentStudent.service.js
│   ├── academic/
│   │   ├── academicSession.service.js
│   │   ├── class.service.js
│   │   ├── section.service.js
│   │   ├── subject.service.js
│   │   └── academicAssignment.service.js
│   ├── attendance/
│   │   ├── attendance.service.js
│   │   └── attendanceReport.service.js
│   ├── assignment/
│   │   ├── assignment.service.js
│   │   └── submission.service.js
│   ├── examination/
│   │   ├── exam.service.js
│   │   ├── marks.service.js
│   │   ├── result.service.js
│   │   └── resultPublishing.service.js
│   ├── fee/
│   │   ├── feeStructure.service.js
│   │   ├── studentFee.service.js
│   │   ├── payment.service.js
│   │   └── receipt.service.js
│   ├── communication/
│   │   ├── application.service.js
│   │   ├── complaint.service.js
│   │   ├── leave.service.js
│   │   └── communicationWorkflow.service.js
│   ├── notification/
│   │   ├── notification.service.js
│   │   └── notificationTarget.service.js
│   ├── website/
│   │   ├── website.service.js
│   │   ├── websiteSettings.service.js
│   │   ├── content.service.js
│   │   └── navigation.service.js
│   ├── document/
│   │   ├── document.service.js
│   │   └── documentAccess.service.js
│   ├── calendar/
│   │   └── calendar.service.js
│   ├── report/
│   │   ├── report.service.js
│   │   └── export.service.js
│   ├── idCard/
│   │   ├── idCard.service.js
│   │   └── idCardTemplate.service.js
│   └── audit/
│       └── auditLog.service.js
│
├── policies/
│   ├── admin.policy.js
│   ├── teacher.policy.js
│   ├── student.policy.js
│   ├── parent.policy.js
│   ├── attendance.policy.js
│   ├── assignment.policy.js
│   ├── result.policy.js
│   ├── fee.policy.js
│   ├── application.policy.js
│   ├── complaint.policy.js
│   ├── document.policy.js
│   └── website.policy.js
│
├── repositories/
│   ├── user.repository.js
│   ├── student.repository.js
│   ├── teacher.repository.js
│   ├── parent.repository.js
│   ├── attendance.repository.js
│   ├── assignment.repository.js
│   ├── exam.repository.js
│   ├── fee.repository.js
│   ├── communication.repository.js
│   └── website.repository.js
│
├── models/
│   ├── user/
│   │   ├── User.js
│   │   ├── Role.js
│   │   ├── Permission.js
│   │   └── UserSession.js
│   ├── student/
│   │   ├── Student.js
│   │   ├── StudentDocument.js
│   │   ├── StudentEnrollment.js
│   │   └── StudentGuardian.js
│   ├── teacher/
│   │   ├── Teacher.js
│   │   ├── TeacherDocument.js
│   │   └── TeacherAssignment.js
│   ├── parent/
│   │   ├── Parent.js
│   │   └── ParentStudent.js
│   ├── academic/
│   │   ├── AcademicSession.js
│   │   ├── Class.js
│   │   ├── Section.js
│   │   ├── Subject.js
│   │   ├── Department.js
│   │   ├── Room.js
│   │   ├── ClassSubject.js
│   │   └── ClassTeacher.js
│   ├── attendance/
│   │   ├── Attendance.js
│   │   └── AttendanceSummary.js
│   ├── assignment/
│   │   ├── Assignment.js
│   │   └── Submission.js
│   ├── examination/
│   │   ├── Exam.js
│   │   ├── ExamSchedule.js
│   │   ├── ExamSubject.js
│   │   ├── Mark.js
│   │   ├── Result.js
│   │   ├── GradeScale.js
│   │   └── RollNumberSlip.js
│   ├── fee/
│   │   ├── FeeStructure.js
│   │   ├── FeeDiscount.js
│   │   ├── Scholarship.js
│   │   ├── StudentFee.js
│   │   ├── Payment.js
│   │   └── FeeReceipt.js
│   ├── admission/
│   │   ├── Admission.js
│   │   └── AdmissionDocument.js
│   ├── communication/
│   │   ├── Application.js
│   │   ├── ApplicationCategory.js
│   │   ├── ApplicationMessage.js
│   │   ├── Complaint.js
│   │   ├── ComplaintCategory.js
│   │   ├── ComplaintMessage.js
│   │   └── LeaveApplication.js
│   ├── notification/
│   │   ├── Notification.js
│   │   ├── NotificationPreference.js
│   │   └── NotificationDelivery.js
│   ├── website/
│   │   ├── WebsiteSettings.js
│   │   ├── Homepage.js
│   │   ├── WebsitePage.js
│   │   ├── Navigation.js
│   │   ├── Footer.js
│   │   ├── Program.js
│   │   ├── Faculty.js
│   │   ├── Facility.js
│   │   ├── Achievement.js
│   │   ├── Gallery.js
│   │   ├── GalleryImage.js
│   │   ├── ContactMessage.js
│   │   └── FAQ.js
│   ├── calendar/
│   │   ├── CalendarEvent.js
│   │   └── Holiday.js
│   ├── document/
│   │   ├── Document.js
│   │   └── DocumentAccessLog.js
│   ├── timetable/
│   │   ├── Timetable.js
│   │   └── TimeSlot.js
│   ├── report/
│   │   └── ReportExport.js
│   ├── idCard/
│   │   ├── IDCard.js
│   │   ├── IDCardTemplate.js
│   │   └── IDCardVerification.js
│   ├── settings/
│   │   ├── InstituteSettings.js
│   │   ├── AcademicSettings.js
│   │   ├── FeeSettings.js
│   │   ├── CommunicationSettings.js
│   │   └── SecuritySettings.js
│   └── audit/
│       └── AuditLog.js
│
├── validators/
│   ├── auth/
│   ├── user/
│   ├── student/
│   ├── teacher/
│   ├── parent/
│   ├── academic/
│   ├── attendance/
│   ├── assignment/
│   ├── examination/
│   ├── fee/
│   ├── admission/
│   ├── communication/
│   ├── website/
│   ├── document/
│   ├── calendar/
│   ├── report/
│   ├── settings/
│   └── idCard/
│
├── events/
│   ├── eventBus.js
│   ├── admission.events.js
│   ├── assignment.events.js
│   ├── attendance.events.js
│   ├── result.events.js
│   ├── fee.events.js
│   ├── communication.events.js
│   └── notice.events.js
│
├── jobs/
│   ├── assignmentDeadline.job.js
│   ├── feeReminder.job.js
│   ├── notificationDelivery.job.js
│   ├── reportExport.job.js
│   ├── idCardGeneration.job.js
│   └── attendanceSummary.job.js
│
├── workers/
│   ├── notification.worker.js
│   ├── report.worker.js
│   ├── idCard.worker.js
│   └── email.worker.js
│
├── sockets/
│   ├── socket.js
│   └── notification.socket.js
│
├── utils/
│   ├── asyncHandler.js
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── generateToken.js
│   ├── pagination.js
│   ├── generateId.js
│   ├── generateQRCode.js
│   ├── generateIDCard.js
│   ├── fileUpload.js
│   ├── date.js
│   └── logger.js
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# Folder Responsibility

## config/

Application-level setup.

```text
db.js          -> MongoDB Atlas connection
env.js         -> Environment variable validation/loading
cloudinary.js  -> Image/document storage
mail.js        -> Email provider configuration
queue.js       -> Background queue configuration
cors.js        -> Allowed frontend origins
```

---

## constants/

Shared fixed values.

```text
roles          -> Admin, Teacher, Student, Parent, Public User
permissions    -> Fine-grained backend permissions
status         -> Admission, leave, complaint, payment, result statuses
notification   -> Notification event types and channels
```

---

## middleware/

Request ke beech mein reusable checks.

```text
auth           -> User logged in hai ya nahi
permission     -> User ke paas required permission hai ya nahi
ownership      -> User requested record access kar sakta hai ya nahi
validation     -> Request body/query/params valid hain ya nahi
upload         -> Uploaded files handle karna
rateLimit      -> Abuse/spam protection
audit          -> Important actions ka audit context
error          -> Central error handler
notFound       -> Unknown endpoint handler
```

Important: `role.middleware.js` alone enough nahi hai. EduOS mein parent sirf linked children dekh sakta hai, teacher sirf assigned classes/students dekh sakta hai, student sirf apna data dekh sakta hai. Isliye permission + ownership dono required hain.

---

## routes/

Routes API entry points hain. Ye user area ke according split honge:

```text
public
admin
teacher
student
parent
```

Routes thin rahenge.

```text
Request
  ↓
Route
  ↓
Middleware
  ↓
Controller
```

---

## controllers/

Controllers sirf HTTP layer handle karenge:

```text
req read karna
service call karna
response return karna
```

Controller ke andar complex workflow, database-heavy logic, permission rules ya notification logic nahi hona chahiye.

---

## services/

Services EduOS backend ka main business layer hain.

Examples:

```text
admissionWorkflow.service.js
-> Admission approve karte waqt student create, parent link, class assign, notification send, audit log create.

resultPublishing.service.js
-> Marks validate, result calculate, publish/unpublish, notification trigger.

communicationWorkflow.service.js
-> Application/complaint status flow, authorized recipient, responses, history.

studentProfile.service.js
-> 360-degree student profile ko multiple domains se assemble karna.
```

Ye layer duplicate controller logic ko avoid karti hai.

---

## policies/

Policies fine-grained authorization rules rakhti hain.

Examples:

```text
student.policy.js
-> Student apna profile dekh sakta hai, kisi aur ka nahi.

parent.policy.js
-> Parent sirf linked children ka data dekh sakta hai.

teacher.policy.js
-> Teacher sirf assigned class/subject/student data access kar sakta hai.

complaint.policy.js
-> Sensitive complaints sirf authorized users dekh sakte hain.
```

Backend security frontend visibility par depend nahi karegi.

---

## repositories/

Repositories database queries ko isolate karte hain.

Small project mein optional hai, lekin EduOS jaise large backend mein useful hai because reports, dashboards, filters aur cross-domain queries complex ho jayengi.

```text
Controller -> Service -> Repository -> Model
```

---

## models/

Models business domains ke according grouped hain, frontend panels ke according nahi.

```text
models/attendance/
```

Ye Admin, Teacher, Student aur Parent sab ke liye shared domain hai. Access difference policies/services handle karenge.

Important domains:

```text
user           -> Common authentication, roles, permissions
student        -> Student profile, enrollment, documents, guardian links
teacher        -> Teacher profile and assignments
parent         -> Parent profile and child links
academic       -> Sessions, classes, sections, subjects, rooms, departments
attendance     -> Daily/period attendance and summaries
assignment     -> Homework, attachments, submissions, marks, feedback
examination    -> Exams, schedules, marks, results, roll number slips
fee            -> Fee structures, discounts, scholarships, payments, receipts
admission      -> Public applications and documents
communication  -> Applications, complaints, leave, messages, categories
notification   -> Notifications, preferences, delivery tracking
website        -> CMS, public pages, homepage, navigation, content
calendar       -> Events, holidays, academic calendar
document       -> Central document vault and access logs
timetable      -> Class/teacher schedule and time slots
report         -> Report export history
idCard         -> Student/teacher ID cards and templates
settings       -> Institute, academic, fee, communication, security settings
audit          -> Important action history
```

---

## validators/

Request validation schemas domain-wise rahenge.

Examples:

```text
validators/admission/createAdmission.validator.js
validators/fee/recordPayment.validator.js
validators/communication/createComplaint.validator.js
validators/result/publishResult.validator.js
```

Validation controller ke andar manually nahi likhni chahiye.

---

## events/

Important system actions ko events mein convert karna useful hai.

Examples:

```text
admission.approved
assignment.created
result.published
fee.paymentRecorded
complaint.updated
notice.published
```

Events notification, audit, email aur background jobs ko clean trigger karne mein help karte hain.

---

## jobs/ and workers/

EduOS mein background processing zaroori hai.

Examples:

```text
feeReminder.job.js          -> Due fees ke reminders
assignmentDeadline.job.js   -> Deadline reminders
reportExport.job.js         -> Heavy report export
idCardGeneration.job.js     -> PDF/image ID card generation
notificationDelivery.job.js -> Email/push/in-app notification delivery
attendanceSummary.job.js    -> Attendance percentages/summaries
```

Long-running tasks request-response cycle ke andar nahi chalne chahiye.

---

## sockets/

Real-time notifications ke liye optional layer.

Use cases:

```text
New notice
New application response
Complaint update
Assignment notification
Result published
```

Initial version mein sockets skip kiye ja sakte hain, lekin structure mein space hona useful hai.

---

## utils/

Shared helper functions.

```text
asyncHandler       -> Async controller wrapper
ApiError           -> Standard API errors
ApiResponse        -> Standard API response
generateToken      -> JWT/helper token
pagination         -> Pagination metadata
generateId         -> Student ID, teacher ID, receipt ID
generateQRCode     -> ID card verification QR
generateIDCard     -> ID card file generation
fileUpload         -> Upload helper
date               -> Date formatting/range helpers
logger             -> App logging
```

---

# Important Backend Rules

## 1. Controllers stay thin

Controller ka kaam request lena aur service ko call karna hai.

```text
Bad:
Controller -> 200 lines of admission approval logic

Good:
Controller -> admissionWorkflowService.approveAdmission()
```

---

## 2. Backend permission is mandatory

Frontend visibility security nahi hai.

Backend must check:

```text
Who can view
Who can create
Who can update
Who can approve
Who can reject
Who can respond
Who can close
Who can view sensitive data
```

---

## 3. Models are domains, routes are user areas

```text
routes/admin/attendance.routes.js
routes/teacher/attendance.routes.js
routes/student/attendance.routes.js
routes/parent/attendance.routes.js

all can use:
models/attendance/
services/attendance/
policies/attendance.policy.js
```

This avoids duplicate database design.

---

## 4. Workflows should be explicit

EduOS ke important workflows separate service files mein hone chahiye.

Examples:

```text
Admission approval workflow
Result publishing workflow
Fee payment workflow
Application/complaint workflow
Leave approval workflow
ID card generation workflow
```

---

## 5. Audit log is not optional

Important admin actions ka history maintain karna zaroori hai.

Examples:

```text
User created
Student updated
Attendance corrected
Fee payment recorded
Result changed
Result published
Admission approved
Complaint resolved
Website content changed
```

---

# Final Architecture

```text
Frontend / Client
  ↓
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Policies + Repositories
  ↓
Models
  ↓
MongoDB Atlas

Events
  ↓
Jobs / Workers
  ↓
Notifications / Email / Reports / ID Cards
```

## Core Principle

```text
User Area
-> Public / Admin / Teacher / Student / Parent

Business Domain
-> User / Academic / Attendance / Exam / Fee / Communication / Website / etc.

Security
-> Auth + Permission + Ownership + Audit

Workflow
-> Services + Events + Jobs
```

This structure is technically stronger for EduOS because it supports real institutional workflows, avoids duplicated logic, keeps controllers clean, and gives backend security proper ownership.
