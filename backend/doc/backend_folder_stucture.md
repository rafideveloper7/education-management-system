# Backend Folder Structure

## Education Management System

### Express.js + MongoDB Atlas REST API

---

# 1. SIMPLE STRUCTURE

Ye initial project setup ke liye hai. Sirf main folders aur root files.

```text
backend/
│
├── server.js
│
├── config/
│
├── middleware/
│
├── routes/
│
├── controllers/
│
├── models/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Is stage par folders empty ho sakte hain.

### Purpose

```text
server.js       → Application entry point
config/         → Database and external service configuration
middleware/     → Authentication, authorization, validation, errors
routes/         → API endpoints
controllers/    → Request/business handling
models/         → MongoDB schemas/models
.env            → Environment variables
```

---

# 2. STANDARD PRODUCTION STRUCTURE

Jab actual development start ho, project ko is level par organize karna hai.

```text
backend/
│
├── server.js
│
├── config/
│   ├── db.js
│   ├── cloudinary.js
│   └── env.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── validation.middleware.js
│   ├── upload.middleware.js
│   ├── rateLimit.middleware.js
│   ├── error.middleware.js
│   └── notFound.middleware.js
│
├── routes/
│   ├── public/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   └── parent/
│
├── controllers/
│   ├── public/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   └── parent/
│
├── models/
│
├── validators/
│
├── utils/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Main Architecture

```text
                    CLIENT
                      │
                      ↓
                    ROUTES
                      │
                      ↓
                  MIDDLEWARE
                      │
                      ↓
                 CONTROLLERS
                      │
                      ↓
                    MODELS
                      │
                      ↓
                 MONGODB ATLAS
```

---

# 3. COMPLETE DETAILED STRUCTURE

This is the structure to use when the complete system is being implemented.

```text
backend/
│
├── server.js
│
├── config/
│   ├── db.js
│   ├── cloudinary.js
│   └── env.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── validation.middleware.js
│   ├── upload.middleware.js
│   ├── rateLimit.middleware.js
│   ├── error.middleware.js
│   └── notFound.middleware.js
│
├── routes/
│   │
│   ├── public/
│   │   ├── auth.routes.js
│   │   ├── admission.routes.js
│   │   ├── program.routes.js
│   │   ├── faculty.routes.js
│   │   ├── notice.routes.js
│   │   ├── event.routes.js
│   │   ├── gallery.routes.js
│   │   ├── facility.routes.js
│   │   ├── achievement.routes.js
│   │   ├── contact.routes.js
│   │   ├── faq.routes.js
│   │   └── website.routes.js
│   │
│   ├── admin/
│   │   ├── dashboard.routes.js
│   │   ├── users.routes.js
│   │   ├── students.routes.js
│   │   ├── teachers.routes.js
│   │   ├── parents.routes.js
│   │   ├── classes.routes.js
│   │   ├── subjects.routes.js
│   │   ├── sessions.routes.js
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
│   │   ├── gallery.routes.js
│   │   ├── programs.routes.js
│   │   ├── facilities.routes.js
│   │   ├── achievements.routes.js
│   │   ├── notifications.routes.js
│   │   ├── idCards.routes.js
│   │   ├── reports.routes.js
│   │   ├── website.routes.js
│   │   ├── settings.routes.js
│   │   └── auditLogs.routes.js
│   │
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
│   │
│   ├── student/
│   │   ├── dashboard.routes.js
│   │   ├── profile.routes.js
│   │   ├── attendance.routes.js
│   │   ├── assignments.routes.js
│   │   ├── exams.routes.js
│   │   ├── results.routes.js
│   │   ├── fees.routes.js
│   │   ├── payments.routes.js
│   │   ├── timetable.routes.js
│   │   ├── applications.routes.js
│   │   ├── complaints.routes.js
│   │   ├── leave.routes.js
│   │   ├── notices.routes.js
│   │   ├── notifications.routes.js
│   │   └── idCards.routes.js
│   │
│   └── parent/
│       ├── dashboard.routes.js
│       ├── profile.routes.js
│       ├── children.routes.js
│       ├── attendance.routes.js
│       ├── assignments.routes.js
│       ├── exams.routes.js
│       ├── results.routes.js
│       ├── fees.routes.js
│       ├── payments.routes.js
│       ├── timetable.routes.js
│       ├── applications.routes.js
│       ├── complaints.routes.js
│       ├── leave.routes.js
│       ├── notices.routes.js
│       ├── notifications.routes.js
│       └── idCards.routes.js
│
├── controllers/
│   │
│   ├── public/
│   │   ├── auth.controller.js
│   │   ├── admission.controller.js
│   │   ├── program.controller.js
│   │   ├── faculty.controller.js
│   │   ├── notice.controller.js
│   │   ├── event.controller.js
│   │   ├── gallery.controller.js
│   │   ├── facility.controller.js
│   │   ├── achievement.controller.js
│   │   ├── contact.controller.js
│   │   ├── faq.controller.js
│   │   └── website.controller.js
│   │
│   ├── admin/
│   │   ├── dashboard.controller.js
│   │   ├── users.controller.js
│   │   ├── students.controller.js
│   │   ├── teachers.controller.js
│   │   ├── parents.controller.js
│   │   ├── classes.controller.js
│   │   ├── subjects.controller.js
│   │   ├── sessions.controller.js
│   │   ├── timetable.controller.js
│   │   ├── attendance.controller.js
│   │   ├── assignments.controller.js
│   │   ├── exams.controller.js
│   │   ├── results.controller.js
│   │   ├── fees.controller.js
│   │   ├── payments.controller.js
│   │   ├── admissions.controller.js
│   │   ├── applications.controller.js
│   │   ├── complaints.controller.js
│   │   ├── leave.controller.js
│   │   ├── notices.controller.js
│   │   ├── events.controller.js
│   │   ├── gallery.controller.js
│   │   ├── programs.controller.js
│   │   ├── facilities.controller.js
│   │   ├── achievements.controller.js
│   │   ├── notifications.controller.js
│   │   ├── idCards.controller.js
│   │   ├── reports.controller.js
│   │   ├── website.controller.js
│   │   ├── settings.controller.js
│   │   └── auditLogs.controller.js
│   │
│   ├── teacher/
│   │   ├── dashboard.controller.js
│   │   ├── profile.controller.js
│   │   ├── classes.controller.js
│   │   ├── students.controller.js
│   │   ├── attendance.controller.js
│   │   ├── assignments.controller.js
│   │   ├── exams.controller.js
│   │   ├── results.controller.js
│   │   ├── timetable.controller.js
│   │   ├── applications.controller.js
│   │   ├── complaints.controller.js
│   │   ├── leave.controller.js
│   │   ├── notices.controller.js
│   │   ├── notifications.controller.js
│   │   └── idCards.controller.js
│   │
│   ├── student/
│   │   ├── dashboard.controller.js
│   │   ├── profile.controller.js
│   │   ├── attendance.controller.js
│   │   ├── assignments.controller.js
│   │   ├── exams.controller.js
│   │   ├── results.controller.js
│   │   ├── fees.controller.js
│   │   ├── payments.controller.js
│   │   ├── timetable.controller.js
│   │   ├── applications.controller.js
│   │   ├── complaints.controller.js
│   │   ├── leave.controller.js
│   │   ├── notices.controller.js
│   │   ├── notifications.controller.js
│   │   └── idCards.controller.js
│   │
│   └── parent/
│       ├── dashboard.controller.js
│       ├── profile.controller.js
│       ├── children.controller.js
│       ├── attendance.controller.js
│       ├── assignments.controller.js
│       ├── exams.controller.js
│       ├── results.controller.js
│       ├── fees.controller.js
│       ├── payments.controller.js
│       ├── timetable.controller.js
│       ├── applications.controller.js
│       ├── complaints.controller.js
│       ├── leave.controller.js
│       ├── notices.controller.js
│       ├── notifications.controller.js
│       └── idCards.controller.js
│
├── models/
│   │
│   ├── user/
│   │   ├── User.js
│   │   ├── Role.js
│   │   └── UserSession.js
│   │
│   ├── student/
│   │   ├── Student.js
│   │   ├── StudentDocument.js
│   │   ├── StudentEnrollment.js
│   │   └── StudentGuardian.js
│   │
│   ├── teacher/
│   │   ├── Teacher.js
│   │   ├── TeacherDocument.js
│   │   └── TeacherAssignment.js
│   │
│   ├── parent/
│   │   ├── Parent.js
│   │   └── ParentStudent.js
│   │
│   ├── academic/
│   │   ├── AcademicSession.js
│   │   ├── Class.js
│   │   ├── Section.js
│   │   ├── Subject.js
│   │   ├── ClassSubject.js
│   │   └── ClassTeacher.js
│   │
│   ├── attendance/
│   │   ├── Attendance.js
│   │   └── AttendanceSummary.js
│   │
│   ├── assignment/
│   │   ├── Assignment.js
│   │   └── Submission.js
│   │
│   ├── examination/
│   │   ├── Exam.js
│   │   ├── ExamSchedule.js
│   │   ├── ExamSubject.js
│   │   ├── Mark.js
│   │   └── Result.js
│   │
│   ├── fee/
│   │   ├── FeeStructure.js
│   │   ├── StudentFee.js
│   │   ├── Payment.js
│   │   └── FeeReceipt.js
│   │
│   ├── admission/
│   │   ├── Admission.js
│   │   └── AdmissionDocument.js
│   │
│   ├── communication/
│   │   ├── Application.js
│   │   ├── ApplicationMessage.js
│   │   ├── Complaint.js
│   │   ├── ComplaintMessage.js
│   │   └── LeaveApplication.js
│   │
│   ├── notification/
│   │   ├── Notification.js
│   │   └── NotificationPreference.js
│   │
│   ├── notice/
│   │   └── Notice.js
│   │
│   ├── event/
│   │   └── Event.js
│   │
│   ├── website/
│   │   ├── WebsiteSettings.js
│   │   ├── Homepage.js
│   │   ├── WebsitePage.js
│   │   ├── Navigation.js
│   │   └── Footer.js
│   │
│   ├── program/
│   │   └── Program.js
│   │
│   ├── faculty/
│   │   └── Faculty.js
│   │
│   ├── gallery/
│   │   ├── Gallery.js
│   │   └── GalleryImage.js
│   │
│   ├── facility/
│   │   └── Facility.js
│   │
│   ├── achievement/
│   │   └── Achievement.js
│   │
│   ├── contact/
│   │   └── ContactMessage.js
│   │
│   ├── faq/
│   │   └── FAQ.js
│   │
│   ├── timetable/
│   │   ├── Timetable.js
│   │   └── TimeSlot.js
│   │
│   ├── idCard/
│   │   ├── IDCard.js
│   │   ├── IDCardTemplate.js
│   │   └── IDCardVerification.js
│   │
│   └── audit/
│       └── AuditLog.js
│
├── validators/
│   ├── auth/
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
│   └── idCard/
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
│   └── logger.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

# Folder Responsibility

## config/

External and application configuration.

```text
db.js
→ MongoDB Atlas connection

cloudinary.js
→ Image/document storage

env.js
→ Environment configuration
```

---

# middleware/

Middleware that runs between request and controller.

```text
auth
→ Is the user logged in?

role
→ Is the user allowed?

validation
→ Is the request data valid?

upload
→ Handle uploaded files

rateLimit
→ Protect API from excessive requests

error
→ Central error handling

notFound
→ Unknown endpoint handling
```

---

# routes/

Routes define the API entry points.

They are separated by user area:

```text
public
admin
teacher
student
parent
```

The route should remain thin.

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

# controllers/

Controllers contain the request handling logic.

The same separation used in routes is maintained:

```text
controllers/
├── public/
├── admin/
├── teacher/
├── student/
└── parent/
```

This makes it immediately clear which part of the system a controller belongs to.

---

# models/

Models are grouped by business domain instead of putting 40+ files directly inside one folder.

```text
models/
├── user/
├── student/
├── teacher/
├── parent/
├── academic/
├── attendance/
├── assignment/
├── examination/
├── fee/
├── admission/
├── communication/
├── notification/
├── website/
├── timetable/
├── idCard/
└── audit/
```

This is especially useful as the system grows.

---

# IMPORTANT MODEL RULE

The model folders represent **business domains**, not frontend panels.

For example:

```text
models/attendance/
```

is shared by:

```text
Admin
Teacher
Student
Parent
```

because attendance is one business domain.

The panels only receive the access they are authorized to have.

Similarly:

```text
models/communication/
```

can support:

```text
Student → Teacher/Admin
Parent → Teacher/Admin/Principal
Teacher → Admin/Principal
```

The backend permission system determines who can perform each action.

---

# FINAL ARCHITECTURE

```text
                         FRONTEND
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           PUBLIC         ADMIN       ACADEMIC
                                          │
                              ┌───────────┼───────────┐
                              │           │           │
                           TEACHER     STUDENT      PARENT
                              │           │           │
                              └───────────┼───────────┘
                                          ↓
                                   REST API
                                          ↓
                                      ROUTES
                                          ↓
                                    MIDDLEWARE
                                          ↓
                                    CONTROLLERS
                                          ↓
                                       MODELS
                                          ↓
                                   MONGODB ATLAS
```

## Core Principle

**Routes and Controllers are separated by user experience.**

**Models are separated by business domain.**

This distinction is important.

```text
USER AREA
    ↓
Public / Admin / Teacher / Student / Parent

BUSINESS DOMAIN
    ↓
Student / Attendance / Exam / Fee / Communication / ID Card / etc.
```

That gives us a clean production architecture without duplicating the same database models for every panel.
