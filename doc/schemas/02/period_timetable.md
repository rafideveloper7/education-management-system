# High School Daily Periods, Seasonal Timetable & Urgent Class Assignment Schema

*Institutional Bell Schedule, Period Timetables & Emergency Arrangement Protocols (Classes 0-1 to 10)*

```yaml
# ==========================================================
# KIMS High School Institutional Management System
# Path: schemas/02/period_timetable.md
# Applicable Grades: Class 0-1 (Nursery/Playgroup) to Class 10 (Matriculation)
# ==========================================================

# ==========================================================
# 1. TIME SEASONS & BELL TIMINGS SPECIFICATION
# ==========================================================
Time Seasons:
  description: "Pakistani high schools operate dual seasonal bell timings based on seasonal daylight and temperature variations, plus a dedicated Friday prayer timetable."

  Summer Season:
    active_months: "May 1st to September 30th"
    morning_assembly: "07:30 AM – 07:45 AM (15 Minutes)"
    total_instructional_periods: 8
    period_duration: "40 Minutes (Period 8 is 35 Minutes)"
    recess_duration: "30 Minutes (10:25 AM – 10:55 AM)"
    dismissal_time: "01:30 PM"
    period_breakdown:
      - period: 1
        start: "07:45 AM"
        end: "08:25 AM"
        duration_minutes: 40
      - period: 2
        start: "08:25 AM"
        end: "09:05 AM"
        duration_minutes: 40
      - period: 3
        start: "09:05 AM"
        end: "09:45 AM"
        duration_minutes: 40
      - period: 4
        start: "09:45 AM"
        end: "10:25 AM"
        duration_minutes: 40
      - event: "Recess / Tiffin Break"
        start: "10:25 AM"
        end: "10:55 AM"
        duration_minutes: 30
      - period: 5
        start: "10:55 AM"
        end: "11:35 AM"
        duration_minutes: 40
      - period: 6
        start: "11:35 AM"
        end: "12:15 PM"
        duration_minutes: 40
      - period: 7
        start: "12:15 PM"
        end: "12:55 PM"
        duration_minutes: 40
      - period: 8
        start: "12:55 PM"
        end: "01:30 PM"
        duration_minutes: 35

  Winter Season:
    active_months: "October 1st to April 30th"
    morning_assembly: "08:15 AM – 08:30 AM (15 Minutes)"
    total_instructional_periods: 8
    period_duration: "40 Minutes (Period 8 is 35 Minutes)"
    recess_duration: "30 Minutes (11:10 AM – 11:40 AM)"
    dismissal_time: "02:15 PM"
    period_breakdown:
      - period: 1
        start: "08:30 AM"
        end: "09:10 AM"
        duration_minutes: 40
      - period: 2
        start: "09:10 AM"
        end: "09:50 AM"
        duration_minutes: 40
      - period: 3
        start: "09:50 AM"
        end: "10:30 AM"
        duration_minutes: 40
      - period: 4
        start: "10:30 AM"
        end: "11:10 AM"
        duration_minutes: 40
      - event: "Recess / Tiffin Break"
        start: "11:10 AM"
        end: "11:40 AM"
        duration_minutes: 30
      - period: 5
        start: "11:40 AM"
        end: "12:20 PM"
        duration_minutes: 40
      - period: 6
        start: "12:20 PM"
        end: "01:00 PM"
        duration_minutes: 40
      - period: 7
        start: "01:00 PM"
        end: "01:40 PM"
        duration_minutes: 40
      - period: 8
        start: "01:40 PM"
        end: "02:15 PM"
        duration_minutes: 35

  Friday Special:
    active_day: "Every Friday throughout the academic year"
    morning_assembly: "08:00 AM – 08:15 AM (15 Minutes)"
    total_instructional_periods: 5
    period_duration: "40 Minutes"
    recess_duration: "20 Minutes (10:15 AM – 10:35 AM)"
    dismissal_time: "12:00 PM (for Juma Congregational Prayers)"
    period_breakdown:
      - period: 1
        start: "08:15 AM"
        end: "08:55 AM"
        duration_minutes: 40
      - period: 2
        start: "08:55 AM"
        end: "09:35 AM"
        duration_minutes: 40
      - period: 3
        start: "09:35 AM"
        end: "10:15 AM"
        duration_minutes: 40
      - event: "Short Recess"
        start: "10:15 AM"
        end: "10:35 AM"
        duration_minutes: 20
      - period: 4
        start: "10:35 AM"
        end: "11:15 AM"
        duration_minutes: 40
      - period: 5
        start: "11:15 AM"
        end: "11:55 AM"
        duration_minutes: 40

# ==========================================================
# 2. TEACHER PERIOD ASSIGNMENT SCHEMA
# ==========================================================
TeacherPeriodAssignment:
  Assignment ID:
    type: string
    format: "PRD-[TEACHER_ID]-[PERIOD_NUM]"
    example: "PRD-EMP001-P2"

  Teacher:
    teacher_id:
      type: string
      example: "emp-2026-001"
    teacher_name:
      type: string
      example: "Dr. Tariq Mehmood"
    faculty_role:
      type: string
      example: "Senior Mathematics Master"

  Period Slot:
    period_number:
      type: integer (1 to 8)
      example: 2
    period_label:
      type: string
      example: "Period 2 (08:25 AM - 09:05 AM [Summer] / 09:10 AM - 09:50 AM [Winter])"

  Target Class & Section:
    grade:
      type: string
      example: "Class 10 (SSC-II Matric)"
    section:
      type: enum ["Section A (Pre-Medical)", "Section A (Computer/Science)", "Section B", "Section C"]
      example: "Section A"

  Subject / Course:
    subject_code:
      type: string
      example: "MATH-10"
    subject_name:
      type: string
      example: "Mathematics (Science Group)"

  Assigned Room / Venue:
    type: string
    example: "Room 102 (Senior Wing)"

  Scheduled Days:
    type: enum ["Daily (Mon-Sat)", "Mon to Fri", "Mon-Wed", "Thu-Sat", "Friday Special"]
    default: "Daily (Mon-Sat)"

  Period Type:
    type: enum ["Curriculum Instruction", "Lab Practical", "Revision Quiz", "Class Teacher Circle", "Library & Reading"]
    default: "Curriculum Instruction"

  Collision Status:
    type: boolean
    description: "True if teacher or classroom is double-booked for this slot"
    default: false

# ==========================================================
# 3. QUICK / URGENT CLASS ASSIGNMENT SCHEMA (ARRANGEMENT PERIODS)
# ==========================================================
UrgentArrangementAssignment:
  description: "Emergency relief protocol used each morning or during school hours when a teacher is absent, on medical leave, or attending institutional duties."

  Arrangement ID:
    type: string
    format: "ARR-YYYYMMDD-XXX"
    example: "ARR-20260907-001"

  Date:
    type: string (ISO 8601 YYYY-MM-DD)
    example: "2026-09-07"

  Urgent Reason / Trigger:
    type: enum
    options:
      - "Emergency Medical Leave"
      - "Unscheduled Teacher Absence"
      - "Official Examination / Board Duty"
      - "Parent-Teacher Conference Duty"
      - "Staff Meeting & Training Coverage"
      - "Pre-Board Revision & Extra Period"
    example: "Emergency Medical Leave"

  Absent / Relieved Teacher:
    teacher_id:
      type: string
      example: "emp-2026-008"
    teacher_name:
      type: string
      example: "Sir Naeem Khattak"
    original_subject:
      type: string
      example: "Physics"

  Assigned Substitute Teacher:
    teacher_id:
      type: string
      example: "emp-2026-001"
    teacher_name:
      type: string
      example: "Dr. Tariq Mehmood"
    free_period_verified:
      type: boolean
      example: true

  Target Class & Section:
    grade:
      type: string
      example: "Class 10 (SSC-II Matric)"
    section:
      type: string
      example: "Section A"

  Period Slot:
    period_number:
      type: integer (1 to 8)
      example: 3
    time_display:
      type: string
      example: "09:05 AM - 09:45 AM (Summer Timing)"

  Classroom / Location:
    type: string
    example: "Room 102 (Senior Wing)"

  Assigned Period Activity:
    type: string
    example: "Conduct Physics Formula Quiz & Exercise Problem Solving"

  Admin Handover Instructions:
    type: string
    example: "Collect yesterday's assigned assignment notebooks. Administer Chapter 3 revision worksheet placed on staffroom teacher's desk. Record student attendance."

  Notification Status:
    in_system_alert:
      type: boolean
      default: true
    substitute_acknowledged:
      type: boolean
      default: false

  Arrangement Status:
    type: enum ["Dispatched", "Covering Active", "Completed", "Cancelled"]
    default: "Covering Active"
```
