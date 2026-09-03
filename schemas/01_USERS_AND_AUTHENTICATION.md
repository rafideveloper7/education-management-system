# 01 - User Accounts, Roles & Login Security

This document explains in simple, clear words how **User Logins**, **Passwords**, **User Roles (Admin, Teacher, Student, Parent)**, and **Security Sessions** work across the whole system.

---

## 🌟 1. Visual Overview: One Central Login System

Everyone logs in through **ONE common login page**. The system automatically detects their role and redirects them to their own dedicated dashboard:

```
┌────────────────────────────────────────────────────────┐
│               🔐 SINGLE LOGIN SCREEN                   │
│         (Enter Username/Email + Password)              │
└───────────────────────────┬────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │ System checks    │ user's role      │
         ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  👑 ADMIN PANEL  │ │ 👨‍🏫 TEACHER PANEL│ │ 🎓 STUDENT PANEL │
│ • Full Control   │ │ • My Classes     │ │ • My Homework    │
│ • Manage Users   │ │ • Attendance     │ │ • My Results     │
│ • Manage Fees    │ │ • Enter Marks    │ │ • My Fee Bills   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                                     │
         ▼                                     ▼
┌──────────────────┐                  ┌──────────────────┐
│ 👨‍👩‍👧 PARENT PANEL │                  │ 🌐 PUBLIC VISITOR│
│ • View Children  │                  │ • Track Admission│
│ • Pay Fees       │                  │ • Contact School │
└──────────────────┘                  └──────────────────┘
```

---

## 🔑 2. User Account Information (`users`)

This stores the login credentials and security status for every person using the system.

### Real-World User Account Example:
```
Username:         tch.sarah
Email Address:    sarah.physics@school.edu
Mobile Phone:     +92 300 9876543
Assigned Role:    TEACHER (Physics Department)
Account Status:   ACTIVE
Password:         [ Encrypted & Salted Secret ]
Last Login:       Today at 08:15 AM
```

### User Data Fields:

| Field Name | What is it? | Example Value | Why do we need it? |
|---|---|---|---|
| **`username`** | Unique Login ID | `"tch.sarah"` or `"std.2026.042"` | Short, memorable name to log into the portal |
| **`email`** | Email Address | `"sarah@school.edu"` | Used for password recovery and notifications |
| **`phoneNumber`**| Mobile Number | `"+92 300 9876543"` | Used for SMS login codes and urgent alerts |
| **`password`** | Encrypted Password | `"[ Encrypted ]"` | Keeps the account safe from hackers |
| **`role`** | User Type | `"ADMIN"`, `"TEACHER"`, `"STUDENT"`, `"PARENT"` | Decides which dashboard and buttons appear |
| **`status`** | Account State | `"ACTIVE"`, `"SUSPENDED"`, `"INACTIVE"` | Allows admin to activate or lock accounts |
| **`profileImage`**| Profile Picture | `"sarah_avatar.png"` | Displayed in the top-right header menu |
| **`lastLoginAt`**| Last Login Time | `"2026-09-03 08:15 AM"` | Tracks account activity and security |

---

## 📱 3. Device Logins (`user_sessions`)

When a teacher or parent logs in on their phone or laptop, the system remembers that device so they stay logged in:

```
┌────────────────────────────────────────────────────────┐
│          👤 USER: Teacher Sarah Ahmed                  │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ Active Logged-In Devices      │
            ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ 💻 LAPTOP (Office)        │   │ 📱 MOBILE (School App)    │
│ • Chrome on Windows 11    │   │ • Android App             │
│ • Logged in: 3 hours ago  │   │ • Logged in: Yesterday    │
│ • Status: ACTIVE          │   │ • Status: ACTIVE          │
└───────────────────────────┘   └───────────────────────────┘
```

---

## 🛡️ 4. Who is Allowed to do What? (Permissions Matrix)

| School Feature | 👑 Admin | 👨‍🏫 Teacher | 🎓 Student | 👨‍👩‍👧 Parent | 🌐 Public Visitor |
|---|:---:|:---:|:---:|:---:|:---:|
| **Manage Website Colors & Content** | ✅ Full Control | ❌ No | ❌ No | ❌ No | 👁️ View Only |
| **Manage Students & Teachers** | ✅ Full Control | ❌ No | ❌ No | ❌ No | ❌ No |
| **Mark Daily Attendance** | ✅ Full Control | ✅ Assigned Classes | 👁️ View Own Only | 👁️ View Children | ❌ No |
| **Create Homework Tasks** | ✅ Full Control | ✅ Create & Grade | ✍️ Submit Work | 👁️ View Deadlines | ❌ No |
| **Exams & Report Cards** | ✅ Publish All | ✍️ Enter Marks | 👁️ View Report Card| 👁️ View Children | ❌ No |
| **Fee Invoices & Payments** | ✅ Create Invoices | ❌ No | 💳 Pay Own Fee | 💳 Pay Children Fee| ❌ No |
| **Admission Applications** | ✅ Approve/Reject | ❌ No | ❌ No | ❌ No | 📝 Submit & Track |
| **Download ID Cards** | ✅ Print All | 🪪 Download Own | 🪪 Download Own | 🪪 Download Children| 🔍 Scan QR Code |

---

## 💡 Summary: Why this design makes decision-making easy

1. **One Login for Everyone**: You don't have to build 4 different login websites. One login page handles students, parents, teachers, and admins.
2. **Ironclad Privacy**: A student can never see another student's marks or fee invoices.
3. **Stay Logged In on Mobile**: Parents can receive instant notifications on their phone without having to log in every time.
