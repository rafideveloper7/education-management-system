# High School Fee Management & Direct Cash Treasury Schema

*Institutional Cash Fee Collection, Student Ledgers & Fine Regulations (Classes 0-1 to 10)*

```yaml
# ==========================================================
# KIMS High School Institutional Management System
# Path: schemas/02/fees.md
# Reference: schemas/02/student.md, schemas/02/admission.md
# Applicable Grades: Class 0-1 (Nursery/Playgroup) to Class 10 (Matriculation)
# Policy: STRICT DIRECT CASH PAYMENT AT ACCOUNTS COUNTER (NO ONLINE PAYMENTS)
# ==========================================================

# ==========================================================
# 1. INSTITUTIONAL FEE CATEGORIES & APPROVED RATES
# ==========================================================
FeeCategories:
  MonthlyTuitionFee:
    description: "Standard recurring monthly tuition fee billed on the 1st of each month"
    due_date_day_of_month: 10
    late_surcharge_rule: "Rs. 20 per day fine after 10th of each month"
    grade_brackets:
      - grades: ["Class 0-1 (Nursery / Playgroup)", "Class Prep / KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"]
        bracket_name: "Primary & Early Childhood Wing"
        standard_monthly_tuition_pkr: 3500
      - grades: ["Class 6", "Class 7", "Class 8"]
        bracket_name: "Middle School Wing"
        standard_monthly_tuition_pkr: 4500
      - grades: ["Class 9 (SSC-I Matric)", "Class 10 (SSC-II Matric)"]
        bracket_name: "Senior Matriculation Science / Computer Wing"
        standard_monthly_tuition_pkr: 5500

  AdmissionFee:
    description: "One-time non-refundable admission and registration fee charged upon enrollment"
    standard_amount_pkr: 8000
    includes:
      - Admission registration & enrollment file
      - Student ID card & official library card
      - High school badge & academic handbook
      - Science & computer lab establishment fund

  ExaminationFee:
    description: "Term assessment or BISE Board Send-Up examination fee"
    types:
      - exam_title: "Midterm Examination Fee"
        amount_pkr: 1500
      - exam_title: "Final Annual Examination Fee (Classes 0-1 to 8)"
        amount_pkr: 2000
      - exam_title: "Matric Board Send-Up & Mock Exam Fee (Classes 9 & 10)"
        amount_pkr: 2500

  DirectFinesAndPenalties:
    description: "Disciplinary, attendance, and administrative penalties imposed directly on students"
    policy: "May be charged to student ledger or paid immediately in cash at the cashier desk"
    standard_categories:
      - category: "Late Fee Surcharge"
        description: "Payment tendered after 10th of the billing month"
        rate_pkr: "Rs. 20 per day (Standard Rs. 200 - Rs. 500 flat)"
      - category: "Uniform & Grooming Violation"
        description: "Improper uniform, missing badge/shoes, or grooming non-compliance"
        rate_pkr: 200
      - category: "Consecutive Absence Without Leave"
        description: "Missing school without official written parent application"
        rate_pkr: "Rs. 50 per absent day"
      - category: "Discipline & Classroom Misconduct"
        description: "Disruptive behavior or institutional property damage"
        rate_pkr: 500
      - category: "Library Overdue Book or Loss"
        description: "Delayed return or damaged library textbook"
        rate_pkr: "Rs. 100 flat + book cost if lost"

# ==========================================================
# 2. STUDENT FEE LEDGER SCHEMA (PER STUDENT RECORD)
# ==========================================================
StudentFeeLedger:
  Ledger ID:
    type: string
    format: "FEE-YYYY-XXXXX"
    example: "FEE-2026-04851"

  Student Reference:
    student_id:
      type: string
      example: "KIMS-2026-04851"
    student_name:
      type: string
      example: "Muhammad Huzaifa Khan"
    roll_number:
      type: integer
      example: 14
    target_class:
      type: string
      example: "Class 10 (SSC-II Matric)"
    section:
      type: string
      example: "Section A (Science Group)"
    father_name:
      type: string
      example: "Tariq Mehmood"
    contact_phone:
      type: string
      example: "0333-9182341"

  Fee Concession Category:
    type: enum ["Regular (Full Fee)", "Sibling Discount (25% off)", "Staff Child (50% off)", "Orphan / Need-Based (100% Zakat Waiver)"]
    default: "Regular (Full Fee)"

  Summary Balances:
    total_billed_pkr:
      type: number
      example: 54000
    total_paid_cash_pkr:
      type: number
      example: 48500
    due_balance_pkr:
      type: number
      example: 5500
    total_fines_incurred_pkr:
      type: number
      example: 400
    current_status:
      type: enum ["Fully Paid", "Partial Balance", "Unpaid / Defaulter", "Exempted / Waiver"]
      example: "Partial Balance"

# ==========================================================
# 3. DIRECT CASH TRANSACTION / RECEIPT SCHEMA
# ==========================================================
CashFeeTransaction:
  Transaction / Receipt ID:
    type: string
    format: "RCP-YYYY-XXXX"
    example: "RCP-2026-0941"

  Payment Method:
    type: string
    const: "Direct Cash Counter Collection"
    description: "Physical currency received at school cashier desk"

  Payment Date & Time:
    date: "2026-09-07"
    time: "10:15 AM"

  Student:
    student_id: "KIMS-2026-04851"
    student_name: "Muhammad Huzaifa Khan"
    class: "Class 10 (SSC-II Matric)"
    section: "Section A"

  Fee Head Breakdown:
    - fee_type: "Monthly Tuition Fee"
      month_for: "September 2026"
      amount_pkr: 5500
    - fee_type: "Examination Fee"
      exam_name: "SSC-II Send-Up Exam"
      amount_pkr: 2500
    - fee_type: "Direct Fine"
      fine_reason: "Late Fee Surcharge"
      amount_pkr: 200

  Calculation:
    subtotal_pkr: 8200
    concession_pkr: 0
    total_net_payable_pkr: 8200
    cash_tendered_pkr: 10000
    change_returned_pkr: 1800
    net_cash_received_pkr: 8200

  Cashier Desk:
    received_by_staff_id: "EMP-2026-009"
    cashier_name: "Muhammad Arshad (Accounts Officer)"
    counter_stamp: "PAID IN CASH - KIMS ACCOUNTS DESK"
    remarks: "Received full September tuition and Send-Up exam fee in cash"
```
