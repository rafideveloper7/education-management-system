# Student Schema (Core Profile & Academic Records)

*Student Profile & 360° Record Schema*

```yaml
# ==========================================================
# KIMS Institutional Management System - Student Record
# Path: schemas/02/student.md
# Reference: schemas/02/admission.md
# ==========================================================

Student ID:
  type: string
  format: "KIMS-YYYY-XXXXX"
  example: "KIMS-2026-04851"
  description: "Primary school-wide unique identifier"

Admission Reference:
  schema: "schemas/02/admission.md"
  fields:
    - Full Name: "Muhammad Huzaifa Khan"
    - Father Name: "Tariq Mehmood"
    - Photo: "/uploads/students/KIMS-2026-04851.jpg"
    - Father WhatsApp / Mobile: "0333-9182341"
    - Student B-Form / CNIC: "14301-8923411-3"
    - Gender: "Male"
    - Residential Address: "House #42, Street 7, Mohallah Umarzai, Kohat"
    - Enrolled Class: "Class 8"
    - Previous School: "Govt High School No. 1, Kohat"
    - Admission Note: "Principal reference, sibling discount"

Academic Placement:
  Class: "Class 8"
  Section: "Section A"
  Roll Number: 14
  Form Master: "Prof. Dr. Tariq Mehmood (EMP-2026-015)"
  Academic Session: "2026-2027"

Relational Modules & Foreign Keys:
  Parent ID: "PAR-2026-0089" (references schemas/02/parent.md)
  Attendance Schema ID: "ATT-2026-04851" (references schemas/02/attendence.md)
  Results Schema ID: "RES-2026-04851" (references schemas/02/results.md)
  Fee Ledger ID: "FEE-2026-04851"

Enrollment Status:
  type: enum ["Active (Currently Enrolled)", "Suspended", "Struck Off", "Alumnus / Passed Out"]
  current: "Active (Currently Enrolled)"
```