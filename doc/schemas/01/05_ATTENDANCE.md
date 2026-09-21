# 05 - Attendance Management & Leave Records

This document explains in simple, clear words how **Daily Student Attendance**, **Teacher Attendance**, **Excused Medical Leaves**, and **Monthly Attendance Summaries** work.

---

## 🌟 1. Visual Overview: Daily Roll Call & Leave Flow

```
┌────────────────────────────────────────────────────────┐
│             👨‍🏫 CLASS TEACHER MORNING ROLL CALL        │
│          Class 10 - Section A (40 Students)            │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┼───────────────┬───────────────┐
            ▼               ▼               ▼               ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐┌──────────────────┐
│  Roll 01: Ali    ││  Roll 02: Bilal  ││  Roll 03: Usman  ││ Roll 04: Zainab  │
│  ✅ PRESENT      ││  ❌ ABSENT       ││  ⏰ LATE (08:40) ││ 🏥 EXCUSED LEAVE │
│  (08:15 AM)      ││  (Unexcused)     ││  (Late mark)     ││ (Approved Note)  │
└──────────────────┘└─────────┬────────┘└──────────────────┘└──────────────────┘
                              │
                              ▼  Automatic Alert
┌────────────────────────────────────────────────────────┐
│ 📲 INSTANT SMS SENT TO PARENT'S PHONE:                 │
│ "Dear Parent, Bilal Ahmed was marked ABSENT today."    │
└────────────────────────────────────────────────────────┘
```

---

## 📋 2. Student Attendance Status Codes (`attendances`)

Every morning, the class teacher marks each student with one of the standard statuses:

| Status Code | What does it mean? | Description |
|:---:|---|---|
| **`PRESENT`** | Present in Class | Student attended school on time |
| **`ABSENT`** | Unexcused Absence | Student missed school without permission |
| **`LATE`** | Late Arrival | Student arrived after the morning bell |
| **`HALF_DAY`** | Half Day | Student left early (e.g., doctor visit at 12:00 PM) |
| **`EXCUSED_LEAVE`**| Approved Leave | Absence was officially approved by administration |

### Real-World Attendance Record:
```
Student Name:     Ali Khan (Roll # 15)
Class & Section:  Class 10 - Section A
Date:             03 September 2026
Status:           PRESENT (Clock-in: 08:15 AM)
Marked By:        Prof. Sarah Ahmed (Class Teacher)
```

---

## 📊 3. Monthly Attendance Summary (`attendance_summaries`)

Parents and students shouldn't have to count 180 individual days to see their attendance. The system calculates a **Monthly Summary Percentage**:

```
┌────────────────────────────────────────────────────────┐
│       📊 ALI KHAN — SEPTEMBER ATTENDANCE SUMMARY       │
├────────────────────────────────────────────────────────┤
│ • Total School Days:    22 Days                        │
│ • Days Present:         20 Days                        │
│ • Approved Leaves:       1 Day                         │
│ • Unexcused Absences:    1 Day                         │
├────────────────────────────────────────────────────────┤
│ 🌟 OVERALL ATTENDANCE:  95.4% (Eligible for Final Exam)│
└────────────────────────────────────────────────────────┘
```

---

## 💡 Summary: Why this design makes decision-making easy

1. **One Roll Call per Day**: The system prevents a student from being marked twice on the same day.
2. **Automated Parent Notification**: When a child is marked absent, an alert goes to the parent's phone, keeping children safe.
3. **Medical Leave Sync**: When a student's sick leave is approved by the Principal, their attendance register is automatically updated to "Excused".
