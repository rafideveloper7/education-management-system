# 14 - Master System Data Map & Flow Architecture

This document provides a **complete, high-level map** of how all parts of the Education Management System connect with each other.

---

## 🌟 1. Master System Connection Map

```
                          ┌───────────────────────────┐
                          │    🔑 CENTRAL USERS       │
                          │   (Login & Passwords)     │
                          └─────────────┬─────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│ 👨‍🏫 TEACHERS     │           │  🎓 STUDENTS     │           │  👨‍💼 PARENTS     │
│ • Profile & Bio  │           │ • Roll & Class   │           │ • Phone & Email  │
│ • Qualifications │           │ • Blood Group    │           │ • Multi-Children │
└────────┬─────────┘           └────────┬─────────┘           └────────┬─────────┘
         │                              │                              │
         │ Assigned To                  │ Studies In                   │ Linked To
         ▼                              ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                           🏫 ACADEMIC HIERARCHY                                │
│   Academic Year ──▶ Class (Grade 10) ──▶ Section A ──▶ Subjects (Math, Physics)│
└───────────────────────────────────────┬────────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                           ⚡ DAILY OPERATIONS                                  │
│   • 📋 Attendance:   Daily Morning Roll Call & Leaves                          │
│   • 📝 Homework:     Assignments, Uploads & Teacher Grading                    │
│   • 🏆 Examinations: Date-sheets, Marks Entry & Report Cards                   │
│   • 💰 Finance:      Monthly Fee Invoices, Bank Slips & Receipts               │
│   • ✉️ Requests:     Leave Applications & Structured Complaints                │
│   • 🪪 ID Cards:     Automatic QR Generation & Security Gate Scan              │
│   • 📢 Notices:      Targeted Circulars & Mobile Push Alerts                   │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 2. Real-World Lifecycles

### 1. The Student Journey:
```
🌐 Public Online Admission Form
         ↓
👑 Admin Document Review & Interview
         ↓
⚡ 1-Click Enrollment (Creates Student, Parent & QR ID Card)
         ↓
🏫 Attends Daily Classes & Marks Attendance
         ↓
📝 Submits Homework & Sits for Exams
         ↓
🏆 Receives Term Report Card & Promotion to Next Grade
```

### 2. The Monthly Fee Journey:
```
💰 Fee Structure Defined for Class (e.g. Rs. 11,700/mo)
         ↓
🧾 System generates Monthly Student Invoices on 1st of Month
         ↓
💳 Parent pays Online or submits Bank Deposit Slip
         ↓
📄 Official Digital Receipt generated with School Stamp
```

### 3. The Sick Leave Journey:
```
👨‍💼 Parent submits 3-Day Sick Leave with Doctor Slip
         ↓
👨‍🏫 Class Teacher reviews and clicks "Approve"
         ↓
⚡ Morning Attendance is automatically marked as EXCUSED LEAVE
         ↓
📲 Parent gets instant confirmation on their phone app
```

---

## 💡 Summary: Why this design makes decision-making easy

1. **One Connected System**: Everything talks to everything else. You never have to copy-paste data between different modules.
2. **Clear Ownership**: Admins manage school policy, Teachers handle classrooms, Students focus on learning, and Parents stay informed.
3. **Rock-Solid Security**: Each user only sees their own permitted records.
