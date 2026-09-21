# Teacher & Staff Schema (Employee Management)

*Faculty and Staff Appointment Schema Specification*

```yaml
# ==========================================================
# KIMS Institutional Management System - Faculty & Staff
# Path: schemas/02/teacher.md
# ==========================================================

Employee ID:
  type: string
  format: "EMP-YYYY-XXX" or "EMP-TCH-YYYY-XXX"
  required: true
  example: "EMP-2026-015"
  description: "Unique institutional employee ID"

Full Name & Title:
  type: string
  required: true
  example: "Prof. Dr. Tariq Mehmood"
  prefixes: ["Mr.", "Ms.", "Mrs.", "Dr.", "Engr.", "Ustadh", "Qari"]

Staff Photo:
  type: string (URI / base64 / file path)
  required: false (optional)
  example: "/uploads/faculty/EMP-2026-015.jpg"

Role of Employee:
  type: enum ["Teacher", "Class 4 Staff", "Security Guard", "Administrative Staff", "Lab Assistant"]
  required: true
  example: "Teacher"
  description: "Determines employee duty profile, permissions, and academic responsibilities"

Contact / Mobile Number:
  type: string
  required: true
  format: "03XX-XXXXXXX"
  example: "0333-9182300"
  description: "Primary official contact for emergency, SMS, and WhatsApp alerts"

Email Address:
  type: string
  required: false (optional)
  example: "tariq.m@kims.edu.pk"

Gender:
  type: enum ["Male", "Female"]
  required: true
  example: "Male"

Assigned Subject:
  type: string
  required: true (for Teachers; 'N/A' for Security/Class 4)
  example: "Mathematics"
  description: "Assigned curriculum subject. Admin can select from standard dropdown or dynamically type and add new subject inline"
  standard_options:
    - "Mathematics"
    - "English Literature & Grammar"
    - "Urdu"
    - "General Science"
    - "Physics"
    - "Chemistry"
    - "Biology"
    - "Computer Science & IT"
    - "Pakistan Studies"
    - "Islamiyat / Ethics"
    - "Social Studies / History"
    - "Art & Drawing"
    - "Physical Education"
    - "N/A (General Duties)"

Assigned Class Form Master:
  type: string
  required: false
  default: "None"
  example: "Class 10"
  options:
    - "Class 0-1 (Nursery/Prep)"
    - "Class 1"
    - "Class 2"
    - "Class 3"
    - "Class 4"
    - "Class 5"
    - "Class 6"
    - "Class 7"
    - "Class 8"
    - "Class 9"
    - "Class 10"
    - "None / Subject Teacher Only"
    - "N/A (Support Staff)"

Education Degree Level & Specialization:
  type: object
  properties:
    degree_level:
      type: enum ["Primary / Middle Pass", "Matriculation (SSC)", "Intermediate (FA / FSc / ICS)", "Bachelor's (BS / BA / BSc / B.Ed)", "Master's (MS / M.Sc / MPhil / M.Ed)", "Doctorate (Ph.D.)", "Dars-e-Nizami / Shahadat-ul-Alimiya (Islamic)"]
      example: "Master's (MS / M.Sc / MPhil / M.Ed)"
    major_specialization:
      type: string
      example: "M.Sc Pure Mathematics, B.Ed"

Employee Notes & Remarks:
  type: string
  required: false (optional)
  example: "12 years secondary teaching experience at Cadet College. Assigned as In-charge of Science Fair."

# Operational & System Metadata
Joining Date:
  type: date
  example: "2026-08-15"
Duty Post / Office Location:
  type: string
  example: "Academic Block A, Room 204"
Employment Status:
  type: enum ["Active / On Duty", "On Leave", "Suspended", "Resigned"]
  default: "Active / On Duty"
Quick Duty:
  type: object
  description: "Dynamic tasks assigned on daily/weekly basis (class substitutions, gate duties, event supervision)"
```