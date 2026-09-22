# Education Management System (EduOS) — Conceptual Schemas & Decision Maps

This directory contains the complete data architecture, conceptual entity models, relationship mappings, workflow lifecycles, and decision documentation for the Education Management System.

---

## 📑 Schema Directory Index

| # | Document Link | Scope & Focus Areas |
|---|---|---|
| **00** | [**00_SCHEMA_OVERVIEW.md**](./00_SCHEMA_OVERVIEW.md) | High-level system architecture, core domain boundaries, and master map |
| **01** | [**01_USERS_AND_AUTHENTICATION.md**](./01_USERS_AND_AUTHENTICATION.md) | Universal user logins, passwords, security sessions, and role permissions |
| **02** | [**02_STUDENTS_AND_PARENTS.md**](./02_STUDENTS_AND_PARENTS.md) | Student profiles, guardian links, multi-child families, and documents |
| **03** | [**03_TEACHERS_AND_STAFF.md**](./03_TEACHERS_AND_STAFF.md) | Faculty profiles, qualifications, and class/subject teaching allocations |
| **04** | [**04_ACADEMICS_AND_CLASSES.md**](./04_ACADEMICS_AND_CLASSES.md) | Academic years, grade levels, sections, subjects, and timetables |
| **05** | [**05_ATTENDANCE.md**](./05_ATTENDANCE.md) | Daily student & teacher roll calls, monthly rollups, and leave sync |
| **06** | [**06_ASSIGNMENTS_AND_SUBMISSIONS.md**](./06_ASSIGNMENTS_AND_SUBMISSIONS.md) | Homework creation, file uploads, student submissions, and grading |
| **07** | [**07_EXAMS_AND_RESULTS.md**](./07_EXAMS_AND_RESULTS.md) | Assessment terms, date-sheets, marks entry, GPAs, and report cards |
| **08** | [**08_FEES_AND_PAYMENTS.md**](./08_FEES_AND_PAYMENTS.md) | Fee structures, monthly invoicing, partial payments, and receipts |
| **09** | [**09_ADMISSIONS.md**](./09_ADMISSIONS.md) | Online applications, verification, interviews, and automated onboarding |
| **10** | [**10_COMMUNICATION_AND_COMPLAINTS.md**](./10_COMMUNICATION_AND_COMPLAINTS.md) | Governed requests, threaded messages, grievances, and leave workflows |
| **11** | [**11_NOTICES_EVENTS_AND_NOTIFICATIONS.md**](./11_NOTICES_EVENTS_AND_NOTIFICATIONS.md) | Targeted circulars, school calendar, and multi-channel notifications |
| **12** | [**12_CMS_AND_PUBLIC_WEBSITE.md**](./12_CMS_AND_PUBLIC_WEBSITE.md) | Dynamic theme styling (colors/fonts), homepage sections, and CMS |
| **13** | [**13_SYSTEM_AUDIT_AND_ID_CARDS.md**](./13_SYSTEM_AUDIT_AND_ID_CARDS.md) | Automated student/teacher ID cards, QR verification, and audit logs |
| **14** | [**14_COMPLETE_ENTITY_RELATIONSHIP_DIAGRAM.md**](./14_COMPLETE_ENTITY_RELATIONSHIP_DIAGRAM.md) | Master global system connection map and real-world lifecycles |

---

## 🎯 Key Architectural Decisions at a Glance

1. **One Unified Operating System**: All 4 portals (Admin, Teacher, Student, Parent) work on the same synchronized real-time data.
2. **Decoupled User Identity vs Academic Profiles**: Single authentication identity in `users` with specialized records in `students`, `teachers`, and `parents`.
3. **Multi-Child Parent Structure**: Parents with 2 or 3 children use ONE login to view and pay for all their children.
4. **Automated Onboarding & ID Card Generation**: When an admission is approved, the system automates student enrollment and provisions verifiable QR ID cards in one click.
5. **No Code Dynamic CMS**: School administrators can customize colors, logos, fonts, hero sections, and navigation menus without developer help.
