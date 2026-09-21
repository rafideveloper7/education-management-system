# Education Management System

## Complete Functional Requirements

The system is a complete digital platform for an educational institution with:

- Public Website
- Public Authentication
- Admin Panel
- Teacher Panel
- Student Panel
- Parent Panel
- Central Communication System
- Central Notification System
- Dynamic Public Website Management

The four academic panels remain completely independent in their UI, layout, components, navigation and user experience.

---

# 1. PUBLIC WEBSITE

The public website represents the institution publicly.

Everything visible on the public website should be manageable by Admin without requiring a developer.

## Public Content

Admin should be able to manage:

- Homepage
- About institute
- Programs / courses
- Departments
- Faculty
- Admissions
- Events
- Notices
- Gallery
- Facilities
- Achievements
- Contact information
- FAQs
- Important links
- Social media links
- Downloadable documents
- Admission information

---

# 2. DYNAMIC WEBSITE CONTROL

Admin should have complete control over the public website.

## Institute Identity

Admin can change:

- Institute name
- Logo
- Favicon
- Institute description
- Contact numbers
- Email addresses
- Address
- Social media links
- Website title
- Website description

## Website Appearance

Admin can control:

- Primary color
- Secondary color
- Accent color
- Background colors
- Text colors
- Button styles
- Border styles
- Theme mode
- Light / dark appearance where supported
- Fonts where supported
- Website branding

The system should use a centralized theme configuration instead of hardcoding the public website's colors and branding.

## Homepage Management

Admin can control:

- Hero section
- Hero title
- Hero description
- Hero images
- CTA buttons
- Featured programs
- Featured faculty
- Statistics
- Notices
- Events
- Gallery
- Testimonials
- Other homepage sections

Admin should be able to enable/disable supported sections.

## Navigation Management

Admin can manage:

- Menu items
- Menu labels
- Menu order
- Visibility
- Important links
- Footer links

## Content Management

Admin should be able to create, edit, publish, unpublish and remove public content.

The public website should therefore function as a basic CMS controlled through the Admin Panel.

---

# 3. PUBLIC USER

A public visitor can:

- Browse the website
- View institute information
- View programs
- View faculty
- View notices
- View events
- View gallery
- View admission information
- Submit admission application
- Submit contact message
- Register
- Login

Public registration does NOT create an academic account.

---

# 4. AUTHENTICATION

There is one common login system.

Users:

- Admin
- Teacher
- Student
- Parent
- Public User

After login, the system identifies the role and opens the correct area.

```text
Admin → Admin Panel
Teacher → Teacher Panel
Student → Student Panel
Parent → Parent Panel
Public User → Public User Area
```

Academic accounts are created and controlled by Admin.

Public users can register themselves.

---

# 5. ADMIN PANEL

Admin is responsible for the overall operation of the institution.

## Dashboard

Admin dashboard includes:

- Students
- Teachers
- Parents
- Classes
- Admissions
- Attendance
- Exams
- Results
- Fees
- Applications
- Complaints
- Notices
- Events
- Notifications
- Recent activity
- Important alerts

---

# 6. USER MANAGEMENT

Admin manages:

### Students

- Create
- View
- Edit
- Activate/deactivate
- Assign class
- Assign section
- Assign parent
- Manage account
- View academic information

### Teachers

- Create
- View
- Edit
- Activate/deactivate
- Assign classes
- Assign subjects
- Manage account

### Parents

- Create
- View
- Edit
- Link children
- Manage account
- Activate/deactivate

### Public Users

- View registered users
- Manage account status
- View relevant information

---

# 7. ACADEMIC MANAGEMENT

Admin manages:

- Academic sessions
- Classes
- Sections
- Subjects
- Class teachers
- Subject teachers
- Student enrollment
- Teacher assignments
- Timetable
- Academic calendar

The academic structure should define which teacher teaches which subject to which class.

---

# 8. STUDENT MANAGEMENT

Admin can access the complete student profile:

```text
Student
├── Personal Information
├── Parent Information
├── Class
├── Subjects
├── Attendance
├── Assignments
├── Exams
├── Results
├── Fees
├── Applications
├── Complaints
└── Documents
```

---

# 9. ATTENDANCE

Teachers record attendance.

Admin supervises the complete attendance system.

Admin can:

- View daily attendance
- View class attendance
- View student attendance
- Filter by date
- Filter by class
- View attendance percentage
- Correct attendance where authorized
- Generate reports

Students and parents can only view relevant attendance.

---

# 10. ASSIGNMENTS

### Teacher

Can:

- Create assignment
- Select class
- Select subject
- Add instructions
- Add attachments
- Set deadline
- View submissions
- Review submissions
- Give marks
- Give feedback

### Student

Can:

- View assignments
- Download attachments
- Submit work
- View submission status
- View feedback
- View marks

### Parent

Can:

- View child's assignments
- View deadlines
- View submission status
- View marks/feedback

### Admin

Can:

- Monitor assignments
- View teacher activity
- View submissions
- Manage where required

---

# 11. EXAMS & RESULTS

## Admin

Admin controls:

- Exams
- Exam types
- Exam schedules
- Subjects
- Classes
- Marks structure
- Passing marks
- Grading system
- Result publication

## Teacher

Teacher can:

- View assigned exams
- Enter marks
- Edit marks before submission/finalization
- Submit marks

## Student

Student can:

- View exam schedule
- View published results
- View marks
- View grades
- View performance

## Parent

Parent can:

- View child's exam schedule
- View published results
- Monitor performance

---

# 12. FEES

Admin controls the complete fee system.

## Fee Structure

- Admission fee
- Monthly fee
- Exam fee
- Transport fee
- Other charges
- Discounts
- Scholarships

## Student Fee Management

- Generate fees
- Assign fees
- Due dates
- Paid amount
- Outstanding amount
- Partial payments
- Payment history
- Receipts
- Discounts

## Reports

- Daily collection
- Monthly collection
- Outstanding fees
- Paid fees
- Student-wise fees
- Class-wise fees

Students and parents can view permitted fee information.

---

# 13. ADMISSION SYSTEM

Public:

```text
Admission Form
      ↓
Application
      ↓
Admin Review
      ↓
Approve / Reject
      ↓
Student Creation
      ↓
Parent Linking
      ↓
Class Assignment
```

Admin can:

- View applications
- Search
- Filter
- Review
- Approve
- Reject
- Request additional information
- Create student
- Create/link parent
- Assign class

---

# 14. COMMUNICATION & APPLICATION SYSTEM

This is a major system-wide feature.

Users should be able to communicate with the appropriate institution members through structured **Applications / Requests / Complaints**.

This should NOT simply be an unrestricted chat system.

It should be a controlled communication workflow.

---

# 15. STUDENT APPLICATIONS & COMPLAINTS

Students can submit applications/requests to authorized staff.

Examples:

- Leave application
- Fee-related request
- Academic request
- Certificate request
- Document request
- Class-related issue
- Teacher-related complaint
- General complaint
- Personal request
- Other application

The student can:

- Create application
- Select category
- Select recipient where permitted
- Write details
- Attach documents
- Submit
- View status
- View responses
- Add information if requested
- Track history

Possible status:

```text
Submitted
↓
Under Review
↓
Need Information
↓
Approved / Rejected / Resolved
```

---

# 16. PARENT APPLICATIONS & COMPLAINTS

Parents can communicate with the institution through structured applications.

Parent can submit to:

- Specific teacher, where permitted
- Class teacher
- Relevant department
- Admin
- Principal / authorized authority

Examples:

- Child leave request
- Attendance concern
- Academic concern
- Fee request
- Fee issue
- Teacher-related complaint
- Child-related concern
- Certificate/document request
- Meeting request
- General complaint
- General application

Parent can:

- Submit application
- Select child
- Select category
- Select authorized recipient
- Add details
- Attach documents
- Track status
- View responses
- Continue communication on the application

---

# 17. TEACHER APPLICATIONS & COMPLAINTS

Teachers should also have a formal communication system.

Teacher can submit applications or complaints to:

- Admin
- Principal
- Authorized management staff

Examples:

- Leave application
- Schedule request
- Class-related issue
- Student-related concern
- Parent-related concern
- Resource request
- Salary/payroll-related request if the institution uses the system for it
- Technical issue
- General complaint
- General application

Teacher can:

- Submit
- Attach files
- Track status
- Receive response
- Respond when clarification is requested
- View application history

---

# 18. ADMIN / PRINCIPAL COMMUNICATION

Admin or Principal can receive applications from:

- Teachers
- Students
- Parents

They can:

- Review
- Assign to another authorized staff member
- Request information
- Respond
- Approve
- Reject
- Resolve
- Close
- Reopen where appropriate

The system should maintain a complete history of every application.

---

# 19. APPLICATION WORKFLOW

A typical request:

```text
Parent
   ↓
Creates Application
   ↓
Selects Child
   ↓
Selects Category
   ↓
Selects Authorized Recipient
   ↓
Submit
   ↓
Teacher / Admin / Principal
   ↓
Review
   ↓
Response
   ↓
Approved / Rejected / Resolved
   ↓
Parent receives notification
```

The same system works for Student and Teacher applications.

---

# 20. COMPLAINT MANAGEMENT

Complaints should have their own structured workflow.

Each complaint can contain:

- Complaint ID
- Category
- Submitted by
- Recipient
- Subject
- Description
- Attachments
- Priority
- Status
- Responses
- Resolution
- Created date
- Updated date
- Complete history

Possible statuses:

```text
Submitted
Under Review
Assigned
Need Information
In Progress
Resolved
Rejected
Closed
```

Only authorized users should see sensitive complaints.

---

# 21. LEAVE MANAGEMENT

A proper leave system should exist for:

### Students

Student/Parent submits leave request.

### Teachers

Teacher submits leave request to Admin/Principal.

### Admin

Admin/authorized management reviews and approves/rejects.

Leave status:

```text
Pending
Approved
Rejected
Cancelled
```

Approved leave can be connected with attendance where appropriate.

---

# 22. NOTIFICATION SYSTEM

Notifications should be generated from important system activities.

Examples:

- New admission application
- Admission approved
- New assignment
- Assignment deadline
- Assignment feedback
- Attendance alert
- Exam announcement
- Result published
- Fee reminder
- New application
- Application response
- Complaint update
- Notice published

Notifications can target:

- Individual user
- Parent
- Student
- Teacher
- Class
- Group
- Everyone

---

# 23. NOTICE & ANNOUNCEMENT SYSTEM

Admin can create:

- General notices
- Student notices
- Parent notices
- Teacher notices
- Class-specific notices

Notices can have:

- Title
- Description
- Attachment
- Publish date
- Expiry date
- Target audience
- Status

---

# 24. TIMETABLE

The system should support academic scheduling.

Admin can manage:

- Classes
- Subjects
- Teachers
- Rooms where applicable
- Days
- Time slots

Teachers can see their timetable.

Students can see their timetable.

Parents can see their child's timetable.

---

# 25. CALENDAR & EVENTS

System calendar can contain:

- Academic events
- Exams
- Holidays
- Parent meetings
- Events
- Important deadlines
- Admission dates

Different users should see relevant calendar information.

---

# 26. DOCUMENT MANAGEMENT

The system should support institutional documents where required.

Examples:

- Student documents
- Teacher documents
- Admission documents
- Certificates
- Notices
- Assignment attachments
- Result documents

Access must be permission-based.

---

# 27. REPORTING

Admin should have reports for:

- Students
- Teachers
- Attendance
- Admissions
- Fees
- Exams
- Results
- Assignments
- Applications
- Complaints
- Leave
- Activities

Reports should support filtering and useful export/print functionality where required.

---

# 28. AUDIT & ACTIVITY HISTORY

Important administrative actions should be recorded.

Examples:

- User created
- User updated
- Account disabled
- Fee created
- Payment recorded
- Result changed
- Result published
- Attendance modified
- Application approved
- Complaint resolved
- Website content changed

This provides accountability and helps investigate problems.

---

# 29. ADMIN SETTINGS

Admin should control system-level settings such as:

### Institute

- Name
- Logo
- Contact
- Address
- Academic information

### Academic

- Academic session
- Grading system
- Attendance rules
- Fee settings

### Communication

- Application categories
- Complaint categories
- Notification settings
- Authorized recipients

### Website

- Branding
- Colors
- Content
- Navigation
- Homepage
- Footer
- Public pages

### System

- User settings
- Permissions
- Security settings
- Notification settings
- Other supported configuration

---

# 30. TEACHER PANEL

Teacher's main responsibility:

```text
Teaching
+
Classes
+
Students
+
Attendance
+
Assignments
+
Exams
+
Results
+
Applications
+
Communication
+
Notifications
```

Teacher must only access assigned academic data.

---

# 31. STUDENT PANEL

Student's main responsibility:

```text
My Education
+
Attendance
+
Assignments
+
Exams
+
Results
+
Fees
+
Applications
+
Complaints
+
Notices
+
Notifications
```

Students cannot modify protected institutional records.

---

# 32. PARENT PANEL

Parent's main responsibility:

```text
My Children
+
Attendance
+
Academic Performance
+
Assignments
+
Exams
+
Results
+
Fees
+
Applications
+
Complaints
+
Communication
+
Notifications
```

If a parent has multiple children, the parent can switch between linked children.

---

# 33. CROSS-PANEL COMMUNICATION

The communication system connects the panels without merging the panels themselves.

```text
Student
   ↓
Application / Complaint
   ↓
Teacher / Admin / Principal
```

```text
Parent
   ↓
Application / Complaint
   ↓
Teacher / Admin / Principal
```

```text
Teacher
   ↓
Application / Complaint
   ↓
Admin / Principal
```

Every communication must follow permissions and institutional rules.

---

# 34. IMPORTANT PERMISSION PRINCIPLE

Frontend visibility is not security.

The backend must determine:

- Who can access
- Who can create
- Who can edit
- Who can approve
- Who can reject
- Who can respond
- Who can close
- Who can view sensitive information

For example:

A Student must not access another student's data simply by changing an ID in a URL.

A Parent must only access their linked children.

A Teacher must only access assigned classes/students.

An Admin can have broader institutional access according to permissions.

---

# 35. COMPLETE SYSTEM FLOW

```text
                         PUBLIC WEBSITE
                               │
             ┌─────────────────┼─────────────────┐
             ↓                 ↓                 ↓
        Information        Admission          Contact
             │                 │
             └─────────────────┘
                     ↓
                AUTHENTICATION
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
    PUBLIC         ACADEMIC      MANAGEMENT
    USER              │             │
                      │             ↓
              ┌───────┼───────┐   ADMIN
              ↓       ↓       ↓
           TEACHER STUDENT PARENT
              │       │       │
              └───────┼───────┘
                      ↓
              CENTRAL SYSTEM DATA
                      │
     ┌────────────────┼─────────────────┐
     ↓                ↓                 ↓
 Attendance       Academics          Finance
     ↓                ↓                 ↓
 Assignments       Exams             Fees
     ↓                ↓                 ↓
 Results          Applications      Notifications
                      │
                      ↓
                COMMUNICATION
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
     Teacher        Student        Parent
        │             │             │
        └─────────────┼─────────────┘
                      ↓
                ADMIN / PRINCIPAL
```

# 36. ID CARD MANAGEMENT

The system should include a complete **ID Card Generation and Management System** for students and teachers.

ID cards should be generated from the information already stored in the system instead of requiring the same information to be entered again manually.

---

## Student ID Card

After a student's admission is successfully approved and the student account is created, the system should make the student's ID card available.

### Student ID Card Information

The card can contain:

- Institute logo
- Institute name
- Student photo
- Student name
- Student ID
- Class
- Section
- Academic session
- Date of birth where required
- Parent/guardian name where required
- Contact information where required
- Issue date
- Expiry date
- QR code / verification code
- Institute contact information

The exact fields should be configurable by Admin.

### Student Flow

```
Admission Approved
        ↓
Student Account Created
        ↓
Student Profile Completed
        ↓
Student Photo Available
        ↓
ID Card Generated
        ↓
Student Can View / Download ID Card
```

The student should be able to access the ID card from the Student Panel.

The student can:

- View ID card
- Download ID card
- Print ID card

The system should only make the card available when the required information has been completed.

---

# Teacher ID Card

Teachers should also have official institute ID cards.

### Teacher ID Card Information

The card can contain:

- Institute logo
- Institute name
- Teacher photo
- Teacher name
- Teacher ID
- Designation
- Department
- Assigned subjects where required
- Contact information where required
- Issue date
- Expiry date
- QR code / verification code
- Institute contact information

The fields should be configurable by Admin.

---

# FINAL RESPONSIBILITY MODEL

## Public Website

**Institution's public presence + admissions + public information**

## Admin

**Runs and controls the institution**

## Teacher

**Teaches and manages assigned academic responsibilities**

## Student

**Uses and manages their own learning experience**

## Parent

**Monitors and communicates about their children**

## Communication System

**Connects users through controlled applications, requests and complaints**

## Notification System

**Keeps users informed about important system activities**

## Dynamic Website Management

**Allows Admin to control the public website's content, branding, theme, structure and institute information without developer intervention**

---

# Core Product Principle

The system should not be designed as:

**Website + Four Dashboards**

It should be designed as:

**One complete digital operating system for an educational institution.**

Every major real-world activity should have a clear owner, workflow, permission model and history.

Before development begins, each module should be converted into:

**Requirement → User → Permission → Workflow → Data → API → UI**