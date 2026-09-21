# High School Examination & Date Sheet Schema (Classes 0-1 to 10)

*Pakistani Institutional Examination System, Term Sessions & Papers Timetable (Date Sheet) Specification*

```yaml
# ==========================================================
# KIMS Institutional Management System - High School Examinations
# Path: schemas/02/exam.md
# Applicable Grades: Class 0-1 (Nursery/Prep) to Class 10 (Matriculation)
# Academic Standard: Pakistani High School Curriculum & BISE Board Standards
# ==========================================================

Examination Grade Hierarchy:
  type: enum
  grades:
    - "Class 0-1 (Nursery / Playgroup)"
    - "Class Prep / KG"
    - "Class 1"
    - "Class 2"
    - "Class 3"
    - "Class 4"
    - "Class 5"
    - "Class 6"
    - "Class 7"
    - "Class 8"
    - "Class 9 (SSC-I Matric)"
    - "Class 10 (SSC-II Matric)"
  wings:
    - "Early Childhood (Class 0-1 & Prep)"
    - "Primary Wing (Class 1 to 5)"
    - "Middle Wing (Class 6 to 8)"
    - "Secondary Matric Wing (Class 9 & 10)"

Examination Term Types:
  type: enum
  values:
    - "First Term Examination"          # Held around Oct/Nov (Quarterly assessment)
    - "Mid-Term Examination"            # Half-Yearly Exam (Dec/Jan)
    - "Second Term Examination"         # Held around Jan/Feb
    - "Final Annual Examination"        # Promotion Examination (March/April)
    - "Send-Up / Pre-Board Examination" # Model exams for Class 9 & 10 before BISE Board
    - "Monthly Assessment Test Series"  # Monthly periodic test cycle

Examination Status:
  type: enum
  values:
    - "Draft / Planning"       # Timetable being arranged; not yet visible to students
    - "Scheduled / Announced"  # Date Sheet published; Roll No Slips generated
    - "Ongoing / In Progress"  # Papers currently being conducted in examination halls
    - "Completed / Evaluation" # Papers finished; marks entry active by teachers
    - "Results Ready"          # Marksheets finalized; ready for Gazette generation

# ==========================================================
# ENTITY 1: EXAMINATION SESSION / TERM
# ==========================================================
ExamSession:
  Exam ID:
    type: string
    format: "EXAM-YYYY-[TERM_CODE]"
    required: true
    example: "EXAM-2026-ANNUAL"

  Exam Title:
    type: string
    required: true
    example: "Annual Final Examination 2026-2027"

  Academic Session:
    type: string
    required: true
    example: "2026-2027"

  Exam Term:
    type: enum ["First Term Examination", "Mid-Term Examination", "Second Term Examination", "Final Annual Examination", "Send-Up / Pre-Board Examination", "Monthly Assessment Test Series"]
    required: true
    example: "Final Annual Examination"

  Start Date:
    type: date (YYYY-MM-DD)
    required: true
    example: "2026-10-15"

  End Date:
    type: date (YYYY-MM-DD)
    required: true
    example: "2026-10-28"

  Applicable Classes:
    type: array of string
    required: true
    example: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]

  Passing Percentage Standard:
    type: integer
    default: 33
    example: 33
    description: "Standard Pakistani Board Passing Threshold (33% minimum marks per paper)"

  Grading Scheme:
    type: enum ["BISE High School Scale (A+, A, B, C, D, E, F)", "Primary Competency Scale"]
    default: "BISE High School Scale (A+, A, B, C, D, E, F)"

  Examination Controller / In-Charge:
    type: string
    required: true
    example: "Prof. Muhammad Tariq (Controller of Examinations)"

  Examination Halls / Venues:
    type: array of string
    example: ["Main Auditorium Hall-A", "Senior Wing Hall-B", "Room 101-105", "Science Labs"]

  Conduct Instructions & General Rules:
    type: string
    example: "1. All candidates must bring official Roll Number Slips and institutional ID cards. 2. Morning shift assembly commences at 08:00 AM; paper timing is 08:30 AM to 11:30 AM. 3. Mobile phones and electronic smartwatches are strictly prohibited in the exam hall."

  Status:
    type: enum ["Draft / Planning", "Scheduled / Announced", "Ongoing / In Progress", "Completed / Evaluation", "Results Ready"]
    default: "Scheduled / Announced"

  Created At:
    type: string
    example: "2026-09-07T08:00:00Z"

# ==========================================================
# ENTITY 2: PAPERS TIMETABLE / DATE SHEET ENTRY
# ==========================================================
PaperTimetableEntry:
  Paper ID:
    type: string
    format: "PPR-[EXAM_CODE]-[CLASS]-[SUBJECT_CODE]"
    example: "PPR-ANN26-C10-MATH"

  Exam ID:
    type: string
    required: true
    example: "EXAM-2026-ANNUAL"

  Paper Date:
    type: date (YYYY-MM-DD)
    required: true
    example: "2026-10-15"

  Day of Week:
    type: string
    example: "Thursday"

  Shift & Timing:
    type: string
    required: true
    example: "Morning (08:30 AM - 11:30 AM)"

  Target Class:
    type: string
    required: true
    example: "Class 10 (SSC-II Matric)"

  Target Section:
    type: string
    required: true
    default: "All Sections"
    example: "Section A"
    options: ["All Sections", "Section A", "Section B", "Section C", "Section D"]
    description: "Class section for which this paper timetable entry is designated"

  Subject ID:
    type: string
    example: "SUB-10-MATH"

  Subject Name:
    type: string
    required: true
    example: "Mathematics (Science Group)"

  Paper Type:
    type: enum ["Theory / Written", "Objective / MCQs", "Practical / Lab Examination", "Oral / Viva Voce"]
    default: "Theory / Written"

  Total Marks:
    type: integer
    required: true
    example: 75
    description: "Standard Matric Board Max Marks (e.g., 75 for Math/Phy/Bio, 100 for English/Urdu, 50 for Islamiat/Pak Studies)"

  Passing Marks:
    type: integer
    required: true
    example: 25
    description: "33% passing threshold (e.g., 25/75, 33/100, 17/50)"

  Exam Hall / Room:
    type: string
    required: true
    example: "Main Examination Hall-A (Senior Block)"

  Assigned Invigilators (Duty Teachers):
    type: array of object
    properties:
      teacher_id:
        type: string
        example: "emp-2026-001"
      teacher_name:
        type: string
        example: "Dr. Tariq Mehmood"
      role:
        type: string
        example: "Chief Superintendent / Room Invigilator"

  Syllabus Coverage:
    type: string
    example: "Complete Book / Chapters 1 through 13"

  Roll Number Slips Dispatched:
    type: boolean
    default: true

# ==========================================================
# ENTITY 3: CLASS & SECTION DATE SHEET SPECIFICATION
# ==========================================================
ClassSectionDateSheet:
  Date Sheet ID:
    type: string
    format: "DS-[EXAM_ID]-[CLASS_CODE]-[SECTION_CODE]"
    example: "DS-ANN26-CLS10-SECA"

  Exam ID:
    type: string
    required: true
    example: "EXAM-2026-ANNUAL"

  Exam Session Title:
    type: string
    example: "Annual Final Examination 2026-2027"

  Target Class:
    type: string
    required: true
    example: "Class 10 (SSC-II Matric)"

  Target Section:
    type: string
    required: true
    example: "Section A (Science Group)"

  Form Master / Section In-Charge:
    type: string
    example: "Dr. Tariq Mehmood"

  Roll Number Range:
    type: string
    example: "10-A-01 to 10-A-42"

  Examination Hall / Seating Wing:
    type: string
    example: "Hall-A (Senior Wing, Desks 01-42)"

  Scheduled Papers:
    type: array of PaperTimetableEntry
    minItems: 1
    description: "Ordered sequence of paper timetable slots scheduled for this specific class section"
```
