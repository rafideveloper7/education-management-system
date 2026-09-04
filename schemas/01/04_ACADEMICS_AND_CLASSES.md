# 04 - Classes, Sections, Subjects & Timetable Schedules

This document explains in simple, clear words how **Academic Years**, **Classes (Grades)**, **Sections**, **Subjects**, and **Daily Timetable Periods** are structured.

---

## 🌟 1. Visual Overview: The Academic Hierarchy

```
┌────────────────────────────────────────────────────────┐
│             📅 ACADEMIC YEAR 2025-2026                 │
│                 (Current Active Year)                  │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ School Grades                 │
            ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│     🏫 CLASS 10           │   │      🏫 CLASS 9           │
│     (Secondary Science)   │   │     (Secondary Science)   │
└─────────────┬─────────────┘   └─────────────┬─────────────┘
              │                               │
       ┌──────┴──────┐                 ┌──────┴──────┐
       ▼             ▼                 ▼             ▼
┌─────────────┐┌─────────────┐  ┌─────────────┐┌─────────────┐
│ 👥 SECTION A││ 👥 SECTION B│  │ 👥 SECTION A││ 👥 SECTION B│
│  (Room 201) ││  (Room 202) │  │  (Room 101) ││  (Room 102) │
└──────┬──────┘└─────────────┘  └─────────────┘└─────────────┘
       │
       ├─────────────────────────────┬─────────────────────────────┐
       ▼                             ▼                             ▼
┌─────────────┐               ┌─────────────┐               ┌─────────────┐
│ 📖 MATH     │               │ 🔬 PHYSICS  │               │ 🧪 CHEMISTRY│
│ (100 Marks) │               │  (75+25 M)  │               │  (75+25 M)  │
└──────┬──────┘               └─────────────┘               └─────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ ⏰ DAILY TIMETABLE PERIOD: Monday 08:30 - 09:15 AM     │
│ • Teacher: Mr. Asim Rauf | Room: Room 201              │
└────────────────────────────────────────────────────────┘
```

---

## 📅 2. Academic Sessions (`academic_sessions`)

Tracks the school calendar year (e.g., August 2025 to June 2026).

| Field Name | What is it? | Example Value | Description |
|---|---|---|---|
| **`sessionName`** | School Year Title | `"2025-2026 Academic Year"` | Name of the academic year |
| **`startDate`** | Session Start Date | `"2025-08-01"` | First day of school |
| **`endDate`** | Session End Date | `"2026-06-30"` | Final day before summer vacation |
| **`isCurrentSession`**| Is this the active session?| `true` (Yes) | Highlights current enrolled year |

---

## 🏫 3. Classes & Sections (`classes`, `sections`)

Every grade level (like Class 10) is divided into **Sections** (like Section A and Section B) with their own classrooms and capacities.

### Real-World Class Example:
```
Class Title:      Grade 10
Study Group:      Science Group (Pre-Medical & Pre-Engineering)
Section:          Section A
Room Number:      Room 204
Student Capacity: 40 Students (Max)
Class Teacher:    Prof. Sarah Ahmed (Mentor)
```

| Field Name | What is it? | Example Value | Description |
|---|---|---|---|
| **`className`** | Grade Name | `"Grade 10"`, `"Class 8"` | Display name |
| **`stream`** | Study Stream | `"Science"`, `"Commerce"` | Academic group |
| **`sectionName`** | Section Letter | `"Section A"`, `"Section B"` | Classroom section |
| **`maxCapacity`** | Maximum Seats | `40` | Prevents over-crowded classrooms |
| **`roomNumber`** | Homeroom | `"Room 204"` | Physical room location |
| **`classTeacher`**| Homeroom Mentor| `"Prof. Sarah Ahmed"` | Homeroom teacher who takes morning attendance |

---

## 📖 4. Master Subjects (`subjects`)

The official catalogue of all courses taught in the school.

| Field Name | What is it? | Example Value | Description |
|---|---|---|---|
| **`subjectName`** | Subject Title | `"Advanced Mathematics"` | Name of the course |
| **`subjectCode`** | Short Code | `"MATH-101"` | Official code for exams & report cards |
| **`subjectType`** | Course Format | `"Theory"`, `"Theory + Practical"` | Theory or Lab course |
| **`fullMarks`** | Total Max Marks | `100` | Total possible score in exams |
| **`passMarks`** | Passing Score | `40` | Minimum score required to pass |

---

## ⏰ 5. Daily Timetable Schedule (`timetables`)

Defines the weekly class routine so students and teachers know which room to go to every period.

### Daily Routine Row:
```
Day of Week:   Monday
Period Number: Period 1 (08:30 AM - 09:15 AM)
Class:         Class 10 - Section A
Subject:       Mathematics
Teacher:       Mr. Asim Rauf
Classroom:     Room 204
```

---

## 💡 Summary: Why this design makes decision-making easy

1. **No Double-Booking**: The schedule prevents two classes from using the same science lab or teacher at the same hour.
2. **Phone App Timetable**: Students and parents can check the timetable on their phone so they always pack the right books.
3. **One-Click Promotion**: At the end of the year, students can be promoted from Class 9 to Class 10 with a single button.
