# High School Academic Results & Gazette Schema (Classes 0-1 to 10)

*Pakistani Institutional Examination Results, Marksheets & BISE Grading Specification*

```yaml
# ==========================================================
# KIMS Institutional Management System - High School Results
# Path: schemas/02/results.md
# Applicable Grades: Class 0-1 (Nursery/Prep) to Class 10 (Matriculation)
# Standard: Pakistani High School Curriculum & BISE Board Grading Rules
# ==========================================================

BISE Grading Scale:
  "A+":
    percentage_range: "80.00% to 100.00%"
    remarks: "Exceptional / Outstanding Distinction"
    status: "Pass"
  "A":
    percentage_range: "70.00% to 79.99%"
    remarks: "Excellent"
    status: "Pass"
  "B":
    percentage_range: "60.00% to 69.99%"
    remarks: "Very Good"
    status: "Pass"
  "C":
    percentage_range: "50.00% to 59.99%"
    remarks: "Good"
    status: "Pass"
  "D":
    percentage_range: "40.00% to 49.99%"
    remarks: "Fair / Satisfactory"
    status: "Pass"
  "E":
    percentage_range: "33.00% to 39.99%"
    remarks: "Pass"
    status: "Pass"
  "F":
    percentage_range: "Below 33.00%"
    remarks: "Fail / Compartment"
    status: "Fail"

Passing Criteria:
  minimum_passing_percentage: 33  # Minimum 33% marks required in each individual subject
  grace_marks_policy: "Up to 5 grace marks maximum as per BISE High School Regulations"

# ==========================================================
# ENTITY 1: SINGLE SUBJECT RESULT ENTRY
# ==========================================================
SingleSubjectResult:
  Result ID:
    type: string
    format: "RES-YYYY-[EXAM_CODE]-[STUDENT_ID]-[SUB_CODE]"
    example: "RES-2026-ANN-STD001-MATH"

  Student ID:
    type: string
    example: "STD-2026-001"

  Exam ID:
    type: string
    example: "EXAM-2026-ANNUAL"

  Subject Name:
    type: string
    example: "Mathematics (Science Group)"

  Target Class & Section:
    type: string
    example: "Class 10 - Section A"

  Total Max Marks:
    type: integer
    example: 75

  Passing Marks (33%):
    type: integer
    example: 25

  Theory Marks Obtained:
    type: integer
    example: 68

  Practical Marks Obtained:
    type: integer
    example: 0 (or up to 15 for practical science subjects)

  Total Obtained Marks:
    type: integer
    example: 68

  Subject Percentage:
    type: number
    example: 90.6

  Subject Grade:
    type: enum ["A+", "A", "B", "C", "D", "E", "F"]
    example: "A+"

  Subject Status:
    type: enum ["Pass", "Fail / Compartment", "Absent"]
    example: "Pass"

  Evaluated By Teacher:
    type: object
    properties:
      teacher_id: "emp-2026-001"
      teacher_name: "Dr. Tariq Mehmood"
      verified_by_admin: true

# ==========================================================
# ENTITY 2: CONSOLIDATED STUDENT DMC (DETAILED MARKS CERTIFICATE)
# ==========================================================
StudentConsolidatedResult:
  DMC Number:
    type: string
    format: "KIMS/DMC-YYYY-[SEQ]"
    example: "KIMS/DMC-2026-0841"

  Student ID:
    type: string
    example: "STD-2026-001"

  Roll Number:
    type: string
    example: "10-A-01"

  Student Full Name:
    type: string
    example: "Muhammad Huzaifa Khan"

  Father Name:
    type: string
    example: "Tariq Jamil Khan"

  Exam ID:
    type: string
    example: "EXAM-2026-ANNUAL"

  Exam Session Title:
    type: string
    example: "Annual Final Examination 2026-2027"

  Class:
    type: string
    example: "Class 10 (SSC-II Matric)"

  Section:
    type: string
    example: "Section A (Science Group)"

  Academic Session:
    type: string
    example: "2026-2027"

  Subject Marks List:
    type: array of SingleSubjectResult

  Total Maximum Marks:
    type: integer
    example: 550

  Total Marks Obtained:
    type: integer
    example: 521

  Overall Percentage:
    type: number
    example: 94.7

  Overall Grade:
    type: enum ["A+", "A", "B", "C", "D", "E", "F"]
    example: "A+"

  Class Position:
    type: string
    example: "1st Position (Class 10-A Topper)"

  Overall Status:
    type: enum ["Passed", "Compartment", "Failed", "Withheld"]
    example: "Passed"

  Form Master Remarks:
    type: string
    example: "Outstanding academic performance. Consistently demonstrated high intellectual capability."

  Controller Verification:
    controller_name: "Prof. Muhammad Tariq"
    verified_date: "2026-09-07"
    is_published_to_portal: true
```