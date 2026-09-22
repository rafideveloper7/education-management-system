# 07 - Exams, Subject Marks & Report Cards

This document explains in simple, clear words how **Exam Schedules**, **Marks Entry by Teachers**, and **Final Report Cards / GPAs** are managed.

---

## 🌟 1. Visual Overview: The Exam & Result Flow

```
┌────────────────────────────────────────────────────────┐
│           👑 ADMIN CREATES EXAM TERM                   │
│           "Midterm Examinations 2026"                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           📅 EXAM DATE-SHEET PUBLISHED                 │
│   • Mon: Mathematics   (09:00 AM - 12:00 PM)           │
│   • Wed: Physics       (09:00 AM - 12:00 PM)           │
│   • Fri: English       (09:00 AM - 12:00 PM)           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           ✍️ STUDENTS SIT FOR EXAMINATIONS             │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           👨‍🏫 TEACHERS ENTER MARKS ONLINE               │
│   • Math: 92/100 | Physics: 88/100 | English: 85/100   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           👑 ADMIN REVIEWS & LOCKS ALL MARKS           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           🏆 PUBLISHED REPORT CARD (Student/Parent)    │
├────────────────────────────────────────────────────────┤
│ • Total Marks:      265 / 300 (88.33%)                 │
│ • Overall Grade:    A+ (GPA: 3.85)                     │
│ • Class Position:   2nd in Class 10-A                  │
│ • Final Status:     PASSED WITH DISTINCTION            │
└────────────────────────────────────────────────────────┘
```

---

## 📅 2. Exam Terms & Date-Sheets (`exams`, `exam_subjects`)

Defines the overall exam period and date-sheet for each paper.

### Example Date-Sheet for Grade 10:
| Paper Date | Time Slot | Subject | Full Marks | Pass Marks | Exam Hall |
|---|---|---|:---:|:---:|---|
| **2026-10-12** | 09:00 AM – 12:00 PM | Mathematics | 100 | 40 | Hall A |
| **2026-10-14** | 09:00 AM – 12:00 PM | Physics (Theory) | 75 | 30 | Hall A |
| **2026-10-16** | 09:00 AM – 11:00 AM | Physics (Practical) | 25 | 10 | Physics Lab |

---

## ✍️ 3. Subject Marks Entry (`marks`)

Entered by the subject teacher and reviewed by school management.

### Real-World Subject Mark Entry:
```
Student:          Ali Khan (Roll # 15)
Exam Term:        Midterm Exams 2026
Subject:          Physics
Theory Score:     68 / 75
Practical Score:  22 / 25
Total Marks:      90 / 100 (Grade: A+)
Status:           LOCKED & VERIFIED
```

---

## 🏆 4. Consolidated Report Cards (`results`)

When all subject teachers submit their marks, the system calculates the student's **Full Report Card**:

```
┌────────────────────────────────────────────────────────┐
│          📜 ALI KHAN — MIDTERM REPORT CARD             │
├────────────────────────────────────────────────────────┤
│ • Total Maximum Marks:     600                         │
│ • Total Marks Obtained:    542                         │
│ • Percentage:              90.33%                      │
│ • Overall Letter Grade:    A+                          │
│ • Class Rank:              2nd Position                │
│ • Result Status:           PASSED                      │
└────────────────────────────────────────────────────────┘
```

| Field Name | What is it? | Example Value | Description |
|---|---|---|---|
| **`grandTotalMaxMarks`** | Max Possible Marks | `600` | Sum of all paper maximum marks |
| **`grandTotalObtained`** | Total Marks Scored | `542` | Sum of student scores |
| **`percentage`** | Percentage | `90.33%` | Final academic percentage |
| **`overallGrade`** | Letter Grade | `"A+"`, `"A"`, `"B"` | Grade based on grading scale |
| **`rankInSection`** | Class Position | `2nd` | Class ranking position |
| **`isPublished`** | Visible to Students? | `true` (Yes) | Protects marks until officially announced |

---

## 💡 Summary: Why this design makes decision-making easy

1. **No Accidental Leaks**: Results are kept strictly hidden until the Principal clicks "Publish Results".
2. **Prevent Score Tampering**: Once marks are submitted and locked by Admin, no one can change a student's marks without a recorded reason.
3. **Automated Rank Calculation**: The system automatically calculates 1st, 2nd, and 3rd positions without manual calculator errors.
