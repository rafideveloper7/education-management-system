# High School Daily Attendance Schema (Classes 0-1 to 10)

*Institutional Attendance Registry & Class Teacher Attribution Specification*

```yaml
# ==========================================================
# KIMS Institutional Management System - High School Attendance
# Path: schemas/02/attendence.md
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

Attendance Status Options:
  type: enum
  values:
    - "Present"   # Student is present in the morning roll call
    - "Absent"    # Student is absent without an approved leave application
    - "Late"      # Student arrived after the morning assembly / bell
    - "Leave"     # Student has an approved medical or family leave slip

# ==========================================================
# ENTITY 1: DAILY CLASS ATTENDANCE SUMMARY (ADMIN VIEW)
# ==========================================================
Daily Class Attendance Register:
  Register ID:
    type: string
    format: "ATT-YYYYMMDD-[CLASS_CODE]" (e.g., "ATT-20260907-CLS10")
    required: true
    example: "ATT-20260907-CLS10"

  Attendance Date:
    type: date (YYYY-MM-DD)
    required: true
    example: "2026-09-07"

  Target Class:
    type: string
    required: true
    example: "Class 10 (SSC-II Matric)"

  Academic Wing:
    type: enum ["Early Childhood (0-1 & Prep)", "Primary Wing (1 to 5)", "Middle Wing (6 to 8)", "Secondary Matric Wing (9 & 10)"]
    example: "Secondary Matric Wing (9 & 10)"

  Total Enrolled Students:
    type: integer
    required: true
    example: 42

  Present Count:
    type: integer
    required: true
    example: 38

  Absent Count:
    type: integer
    required: true
    example: 2

  Late Count:
    type: integer
    required: true
    example: 1

  Leave Count:
    type: integer
    required: true
    example: 1
    description: "Students with officially submitted medical/casual leave applications"

  Attendance Rate:
    type: string (percentage)
    example: "92.8%"
    calculation: "(Present + Late) / Total Enrolled * 100"

  Marked by Class Teacher:
    type: object
    required: true
    properties:
      teacher_id:
        type: string
        example: "emp-2026-001"
      teacher_name:
        type: string
        example: "Dr. Tariq Mehmood"
      teacher_role:
        type: string
        example: "Form Master (Class In-charge)"
      marked_at_time:
        type: string
        example: "08:12 AM"
      marked_date:
        type: string
        example: "07 Sep 2026"

  Submission Status:
    type: enum ["Marked & Submitted", "Pending / Not Taken", "Late Submission"]
    default: "Marked & Submitted"
    description: "Status of class register submission by the designated Form Master"

  Role Access & Permissions:
    Admin Panel (Current):
      access_level: "Strict Read-Only"
      can_view_all_classes: true
      can_filter_by_date: true
      can_view_student_roster: true
      can_post_insystem_alerts: true
      can_mark_attendance: false     # Admin CANNOT mark student attendance
      can_update_attendance: false   # Admin CANNOT update or edit records
      can_override_teacher: false    # Admin CANNOT override teacher markings
      note: "Attendance marking and modification is strictly restricted to teachers."
    Teacher Panel (Upcoming):
      access_level: "Class In-Charge / Form Master"
      can_view_assigned_class: true
      can_mark_daily_roster: true    # Attendance is marked exclusively by class teacher
      can_submit_morning_register: true
      can_record_late_time: true
      can_attach_leave_slips: true

  Admin Review & Inspection:
    type: object
    properties:
      inspected_by:
        type: string
        example: "Executive Admin / Vice Principal"
      inspected_at:
        type: string
        example: "08:45 AM"
      admin_notes:
        type: string
        example: "Reviewed class register. In-system portal notifications dispatched for 2 absentees."

# ==========================================================
# ENTITY 2: INDIVIDUAL STUDENT DAILY ATTENDANCE RECORD
# ==========================================================
Student Daily Attendance Log:
  Attendance Entry ID:
    type: string
    format: "ATT-LOG-YYYYMMDD-[STUDENT_ID]"
    example: "ATT-LOG-20260907-STD001"

  Student ID:
    type: string
    format: "STD-2026-XXX"
    required: true
    example: "STD-2026-001"

  Roll Number:
    type: string
    example: "10-A-01"

  Student Full Name:
    type: string
    required: true
    example: "Muhammad Huzaifa Khan"

  Father Name:
    type: string
    required: true
    example: "Tariq Jamil Khan"

  Father WhatsApp / Contact:
    type: string
    required: true
    example: "0333-9182300"

  Class:
    type: string
    required: true
    example: "Class 10 (SSC-II Matric)"

  Attendance Status:
    type: enum ["Present", "Absent", "Late", "Leave"]
    required: true
    example: "Present"

  Time In / Arrival Time:
    type: string
    required: false
    example: "07:45 AM" (or "—" for Absent / Leave)

  Reason / Remarks:
    type: string
    required: false
    examples:
      - "On time with complete uniform"
      - "Unexcused absence - System alert generated for parent/student panel"
      - "Late by 15 mins due to school bus delay"
      - "Sick leave slip submitted by father for fever (2 days)"

  System Alert / Notification Status:
    type: enum ["No Alert Needed", "Alert Posted to In-System Panel", "Acknowledged by Parent / Student", "Staff Follow-up Pending"]
    default: "No Alert Needed"

# ==========================================================
# ENTITY 3: IN-SYSTEM ATTENDANCE NOTIFICATION & ALERT PANEL
# ==========================================================
System Attendance Alert:
  Alert ID:
    type: string
    format: "ALT-YYYYMMDD-[SEQ]"
    example: "ALT-20260907-001"

  Alert Type:
    type: enum ["Absence Alert", "Late Arrival Notice", "Leave Slip Notice", "Staff Register Pending Alert"]
    required: true
    example: "Absence Alert"

  Severity:
    type: enum ["High (Absence)", "Warning (Late)", "Info (Leave)", "Administrative (Pending Register)"]
    example: "High (Absence)"

  Target Class:
    type: string
    example: "Class 10 (SSC-II Matric)"

  Student Name & Roll:
    type: string
    required: false
    example: "Farhan Ali Khattak (10-03)"

  Notification Message:
    type: string
    required: true
    example: "Student marked Absent in morning register. In-system notification posted to Parent Portal Panel and Admin Log."

  Dispatched To Panels:
    type: array of string
    example: ["Parent Portal Panel", "Admin Executive Panel", "Form Master Panel"]

  Created Timestamp:
    type: string
    example: "08:15 AM (07-Sep-2026)"

  Status:
    type: enum ["Active / Unread", "Acknowledged", "Dismissed"]
    default: "Active / Unread"
```