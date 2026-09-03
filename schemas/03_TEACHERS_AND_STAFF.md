# 03 - Teachers, Faculty & Teaching Duties

This document explains in simple, clear words how **Teacher Profiles**, **Qualifications**, and **Teaching Duties (which teacher teaches which subject to which class)** are organized.

---

## 🌟 1. Visual Overview: Teacher & Teaching Assignments

```
┌────────────────────────────────────────────────────────┐
│           👨‍🏫 TEACHER PROFILE: Prof. Sarah Ahmed        │
│       Department: Science | Designation: Senior Lecturer│
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ Active Teaching Duties        │
            ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ 📖 DUTY 1: Physics        │   │ 📖 DUTY 2: Physics        │
│ • Class: Grade 10 - Sec A │   │ • Class: Grade 9 - Sec B  │
│ • Weekly: 5 Periods/week  │   │ • Weekly: 4 Periods/week  │
│ • Room: Physics Lab (204) │   │ • Room: Room 102          │
└───────────────────────────┘   └───────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ ⭐ HOMEROOM MENTOR (Class Teacher) for Class 10-A       │
│ • Takes morning roll-call attendance                   │
│ • Handles student leave requests & parent inquiries    │
└────────────────────────────────────────────────────────┘
```

---

## 📋 2. Teacher Profile Information (`teachers`)

Stores personal, employment, and contact details for each teacher.

### Real-World Teacher Example:
```
Employee ID:      EMP-TCH-2026-015
Full Name:        Prof. Sarah Ahmed
Gender:           Female
Department:       Science & Physics
Designation:      Senior Physics Lecturer
Qualifications:   M.Sc Physics, B.Ed (7 Years Experience)
Joining Date:     15 August 2021
Mobile Number:    +92 300 9876543
Email:            sarah.ahmed@school.edu
Website Bio:      "Passionate physics educator preparing students for board exams."
Show on Website:  YES (Featured on Public Faculty Page)
```

### Teacher Data Fields:

| Field Name | What is it? | Example Value | Why do we need it? |
|---|---|---|---|
| **`employeeId`** | Staff ID Number | `"EMP-TCH-015"` | Unique employee code on letters & ID cards |
| **`firstName`** | First Name | `"Sarah"` | Teacher identification |
| **`lastName`** | Last Name | `"Ahmed"` | Family surname |
| **`department`** | Department | `"Science"`, `"Mathematics"` | Groups staff into departments |
| **`designation`** | Job Title | `"Senior Lecturer"` | Official job title displayed on website & ID card |
| **`qualification`**| Degrees | `"M.Sc Physics, B.Ed"` | Required for accreditation & parent trust |
| **`joiningDate`** | Date Hired | `"2021-08-15"` | Employment tenure records |
| **`primaryPhone`**| Mobile Number | `"+92 300 9876543"` | Direct contact for administrative coordination |
| **`email`** | School Email | `"sarah@school.edu"` | Official school communication |
| **`photo`** | Official Portrait | `"sarah_photo.jpg"` | Printed on Teacher ID card & shown on website |
| **`isPubliclyVisible`**| Show on Website?| `true` (Yes) | Highlights distinguished teachers on public site |
| **`status`** | Job Status | `"Active"`, `"On Leave"` | Distinguishes current staff from resigned staff |

---

## 📚 3. Teaching Duties (`teacher_assignments`)

In schools, teachers get assigned new classes every academic year. This tracks **which teacher teaches what subject to which class**.

### Real-World Example:
```
Academic Year:    2025-2026
Teacher:          Prof. Sarah Ahmed
Class & Section:  Class 10 - Section A
Subject Taught:   Physics (Theory & Lab)
Periods per week: 5 Periods
```

---

## 💡 Summary: Why this design makes decision-making easy

1. **Flexible Academic Years**: When a new school year starts, you don't delete teachers. You simply assign them their new classes.
2. **Assign Class In-Charge in One Click**: Any teacher can be designated as the Homeroom Mentor for a section to take morning attendance.
3. **Showcase Top Teachers on Website**: High-performing teachers can be automatically featured on the school's public website.
