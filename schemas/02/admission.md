# Admission Schema (Student Enrollment)

*Student Admission Schema Specification*

```yaml
# ==========================================================
# KIMS Institutional Management System - Student Admission
# Path: schemas/02/admission.md
# ==========================================================

Student ID:
  type: string
  format: "KIMS-YYYY-XXXXX" (e.g., KIMS-2026-04851)
  required: true
  description: "Auto-generated unique school-wide ID across entire school; editable/overridable by admin during admission"

Full Name:
  type: string
  required: true
  example: "Muhammad Huzaifa Khan"

Father Name:
  type: string
  required: true
  example: "Tariq Mehmood"

Photo:
  type: string (URI / base64 image / file path)
  required: false (optional)
  example: "/uploads/students/KIMS-2026-04851.jpg"

Father WhatsApp / Mobile No:
  type: string
  required: true
  format: "03XX-XXXXXXX"
  example: "0333-9182341"
  description: "Primary communication channel for fee challans, attendance alerts, and exam notices"

Student B-Form / CNIC No:
  type: string
  required: false (optional)
  format: "XXXXX-XXXXXXX-X"
  example: "14301-8923411-3"
  description: "NADRA B-Form for minors or CNIC for senior students"

Gender:
  type: enum ["Male", "Female"]
  required: true
  example: "Male"

Permanent Residential Address:
  type: string
  required: false (optional)
  example: "House #42, Street 7, Mohallah Umarzai, Kohat, KP"

Admit in Class:
  type: enum ["Class 0-1 (Nursery/Prep)", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]
  required: true
  example: "Class 8"

Previous School Attended:
  type: object
  required: false (optional)
  properties:
    admission_type:
      type: enum ["fresh", "other_school"]
      required: true
      default: "fresh"
      example: "other_school"
      description: "Options: Fresh New Admission (e.g. into Class 0-1) vs From Other School"
    previous_school_name:
      type: string
      required: false (active & required only when admission_type is 'other_school')
      example: "Govt High School No. 1, Kohat"

Note / Reference:
  type: string
  required: false (optional)
  example: "Admitted on principal recommendation. Elder brother Hamza graduated in 2024. Availing 15% sibling discount."

# Relational Links & Metadata
Admission Date:
  type: date
  example: "2026-09-07"
Parent ID:
  type: string
  example: "PAR-2026-0089"
Enrollment Status:
  type: enum ["Enrolled", "Active", "Pending Verification", "Inactive"]
  default: "Enrolled"
```
