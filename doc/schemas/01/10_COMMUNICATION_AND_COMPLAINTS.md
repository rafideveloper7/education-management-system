# 10 - Formal Requests, Complaints & Leave Applications

This document explains in simple, clear words how **Formal Requests (Applications)**, **Student & Parent Complaints**, and **Leave Applications** are routed to the right school authorities.

---

## 🌟 1. Visual Overview: Formal Request & Leave Workflow

```
┌────────────────────────────────────────────────────────┐
│           👨‍👩‍👧 PARENT OR STUDENT CREATES REQUEST         │
│     (Sick Leave / Fee Concession / Certificate Request)│
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           🏢 SYSTEM ROUTES TO THE RIGHT PERSON:        │
├────────────────────────────────────────────────────────┤
│ • Sick Leave Request   ──▶  👨‍🏫 Class Teacher           │
│ • Fee Concession Query ──▶  💼 Accounts Officer        │
│ • Serious Complaint    ──▶  👑 School Principal       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           ✅ TEACHER APPROVES LEAVE (2 DAYS)           │
├────────────────────────────────────────────────────────┤
│ ⚡ Automatic Sync: Attendance for those 2 days is      │
│    automatically marked as EXCUSED LEAVE!              │
│ 📲 Instant Alert: Parent receives approval notification│
└────────────────────────────────────────────────────────┘
```

---

## 📋 2. What types of requests can be submitted?

### 1. General Applications (`applications`)
- **Leave Requests** (Sick leave, Family emergency, Wedding).
- **Certificate Requests** (Bonafide certificate, Character certificate, School leaving certificate).
- **Academic Requests** (Subject change, Extra tutoring request).
- **Transport / Bus Requests** (Bus route change).

### 2. Complaints & Grievances (`complaints`)
- **Teacher / Staff Conduct Concern**.
- **Bullying / Harassment Concern** (Marked as `Confidential` so only Principal sees it).
- **Facility Issues** (Broken AC, Dirty washrooms, Library books).
- **Billing / Fee Disputes**.

---

## 💬 3. Threaded Message Conversations (`application_messages`)

Instead of messy personal WhatsApp chats, all communication happens inside the official request ticket.

```
┌────────────────────────────────────────────────────────┐
│           💬 OFFICIAL REQUEST DISCUSSION               │
├────────────────────────────────────────────────────────┤
│ 👨‍💼 Parent: "My son has high fever, doctor advised 3   │
│             days bed rest."                            │
│ 📎 Attached: Doctor_Prescription.pdf                   │
├────────────────────────────────────────────────────────┤
│ 👨‍🏫 Teacher: "Prescription received. Get well soon!    │
│              Leave approved for 3 days."               │
└────────────────────────────────────────────────────────┘
```

---

## 💡 Summary: Why this design makes decision-making easy

1. **No Lost Messages**: Every request has a tracking number (e.g., `APP-REQ-2026-089`), so parents and teachers always know the exact status.
2. **Confidentiality & Safety**: Sensitive complaints (like bullying) are protected so only the Principal or Super Admin can view them.
3. **Attendance Integration**: Approved leaves automatically update the morning attendance register so students aren't falsely marked absent.
