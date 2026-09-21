# High School Classes, Subjects & Educational Activities / Tests Schema

*Institutional Academic Catalog & Assessment Specification (Classes 0-1 to 10)*

```yaml
# ==========================================================
# KIMS Institutional Management System - High School Academics
# Path: schemas/02/course_and_subject.md
# Applicable Grades: Class 0-1 (Nursery/Playgroup) to Class 10 (Matriculation)
# ==========================================================

Grade Levels / Classes:
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
  description: "Standard 12-tier high school academic grade hierarchy"

# ==========================================================
# OPTION 1: CURRICULUM SUBJECT SCHEMA
# ==========================================================
Subject:
  Subject Code:
    type: string
    format: "SUB-[GRADE]-[CODE]" (e.g., "MATH-10", "ENG-08", "URD-05", "SCI-07", "BIO-09")
    required: true
    example: "MATH-10"
    description: "Unique identifier for the subject in the institutional curriculum"

  Subject Title:
    type: string
    required: true
    example: "Mathematics (Science Group)"
    standard_high_school_subjects:
      - "Mathematics"
      - "English Literature & Grammar"
      - "Urdu"
      - "General Science"
      - "Physics"
      - "Chemistry"
      - "Biology"
      - "Computer Science & IT"
      - "Islamiyat / Ethics"
      - "Pakistan Studies"
      - "Social Studies / History"
      - "Art, Drawing & Handwriting"
      - "Nazra Quran & Tajweed"

  Target Class:
    type: string
    required: true
    example: "Class 10 (SSC-II Matric)"
    description: "The school class/grade to which this subject belongs (0-1 to 10)"

  Subject Category:
    type: enum ["Core Science", "Humanities & Languages", "Islamic & Moral Studies", "Early Childhood Foundation", "Technical & Computer", "General"]
    required: true
    example: "Core Science"

  Weekly Periods / Load:
    type: integer (periods per week)
    required: true
    example: 6
    description: "Number of 40-45 minute instructional periods scheduled per week"

  Assigned Teacher(s):
    type: array of objects (One or more teachers)
    required: true
    description: "Admin selects one or more qualified faculty teachers responsible for teaching and preparing material for this subject"
    items:
      teacher_id:
        type: string
        example: "emp-2026-001"
      teacher_name:
        type: string
        example: "Dr. Tariq Mehmood"
      role_in_subject:
        type: enum ["Lead Subject Teacher", "Co-Teacher", "Paper Setter", "Lab Instructor"]
        default: "Lead Subject Teacher"

  Prescribed Textbooks & Syllabus:
    type: string
    required: false
    example: "KP Textbook Board Peshawar - Mathematics Grade 10 (Units 1 to 13)"

  Academic Status:
    type: enum ["Active", "Archived", "Elective"]
    default: "Active"

# ==========================================================
# OPTION 2: COURSE / EDUCATIONAL ACTIVITY / TEST SCHEMA
# ==========================================================
Educational Activity / Test / Course:
  Activity ID:
    type: string
    format: "ACT-YYYY-XXX" (e.g., "ACT-2026-042")
    required: true
    example: "ACT-2026-042"

  Activity / Test / Course Name:
    type: string
    required: true
    example: "Weekly Mathematics Quiz & Problem Solving"
    description: "Name of the periodic test, quiz, workshop, or short educational course"

  Activity Type / Frequency:
    type: enum
    options:
      - "Daily Test / Activity"
      - "Weekly Test"
      - "Monthly Assessment"
      - "Term Course / Periodic Activity"
    required: true
    example: "Weekly Test"
    description: "Cadence of the educational activity or test"

  Linked Subject:
    type: string
    required: true
    example: "Mathematics"
    description: "The parent subject under which this activity or test is conducted"

  Target Class:
    type: string
    required: true
    example: "Class 10 (SSC-II Matric)"
    description: "The grade/class being evaluated or participating (0-1 to 10)"

  Duration:
    type: string
    required: true
    example: "45 Minutes"
    standard_examples:
      - "30 Minutes" (Quick daily quiz / dictation)
      - "45 Minutes" (Standard period weekly test)
      - "1.5 Hours" (Monthly comprehensive assessment)
      - "2 Hours" (Pre-Board mock exam)
      - "1 Week" (Spelling bee / Science week)
      - "4 Weeks" (Summer vacation bridge course)

  Total Marks / Evaluation Criteria:
    type: string
    required: true
    example: "25 Marks"
    description: "Maximum marks allocated for the test or evaluation mode (e.g. '20 Marks', '50 Marks', '100 Marks', 'A-D Rubric')"

  Assigned Teacher(s):
    type: array of objects (One or more teachers)
    required: true
    description: "Admin selects one or more teachers responsible for conducting, proctoring, setting, or grading this activity/test"
    items:
      teacher_id:
        type: string
        example: "emp-2026-001"
      teacher_name:
        type: string
        example: "Dr. Tariq Mehmood"
      duty:
        type: enum ["Paper Setter & Evaluator", "Invigilator / Proctor", "Activity Coordinator", "Co-Evaluator"]
        default: "Paper Setter & Evaluator"

  Schedule / Recurrence:
    type: string
    required: false
    example: "Every Monday 2nd Period (09:15 AM - 10:00 AM)"

  Instructions / Learning Objectives:
    type: string
    required: false
    example: "Includes Objective MCQs (10 marks) and Short Solution Questions (15 marks) from Chapter 3: Quadratic Equations."

  Activity Status:
    type: enum ["Scheduled", "In Progress", "Completed", "Recurring Active"]
    default: "Recurring Active"
```

---

## Daily Periods & Timetables Integration
*For detailed specifications of the 8-period High School daily schedule, Seasonal Bell Timings (Summer vs Winter vs Friday), Teacher Period Allocations, and Emergency Arrangement / Quick Class Substitution Protocols, refer to [period_timetable.md](file:///c:/Users/rafideveloper7/Documents/education/v1/schemas/02/period_timetable.md).*

