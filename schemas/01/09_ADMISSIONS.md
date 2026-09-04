# 09 - Online Admissions & Student Onboarding

This document explains in simple, clear words how **Public Admission Applications**, **Admin Verification**, **Interviews**, and **Automatic Student Account Creation** work.

---

## 🌟 1. Visual Overview: The Complete Admission Flow

```
┌────────────────────────────────────────────────────────┐
│           🌐 PARENT VISITS SCHOOL WEBSITE              │
│       Fills Online Admission Form for their Child      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           📝 APPLICATION SUBMITTED (APP-2026-0412)     │
│       Status: SUBMITTED (Pending Document Check)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           👑 ADMIN CHECKS DOCUMENTS & MARKS            │
│       Checks Birth Certificate & Previous Report Cards │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           📅 ENTRANCE TEST & INTERVIEW SCHEDULED       │
│       Applicant sits for written assessment            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           ✅ ADMIN CLICKS "APPROVE ADMISSION"          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│       ⚡ ONE-CLICK AUTOMATIC ONBOARDING MAGIC:         │
│   1. Creates Student Profile (Hamza Tariq)             │
│   2. Creates Student Login Account                     │
│   3. Creates / Links Parent Account (Mr. Tariq)        │
│   4. Enrolls in Class 6-A                              │
│   5. Generates Official Student ID Card with QR        │
└────────────────────────────────────────────────────────┘
```

---

## 📝 2. Admission Application Data (`admissions`)

Stores the public application data before the student is officially enrolled.

### Real-World Admission Application:
```
Application No:   APP-2026-0412
Applicant Name:   Hamza Tariq
Applying For:     Grade 6
Date of Birth:    22 March 2014 (Age: 12)
Father's Name:    Tariq Mahmood
Father's Phone:   +92 300 1234567
Previous School:  Beaconhouse School System
Current Status:   APPROVED
Interview Date:   10 September 2026 at 10:00 AM
```

### Application Status Lifecycle:
- **`SUBMITTED`**: Parent just submitted the form online.
- **`UNDER_REVIEW`**: Admission team is reviewing paperwork.
- **`NEED_INFORMATION`**: Waiting for parent to upload clearer photos/files.
- **`INTERVIEW_SCHEDULED`**: Test / interview date assigned.
- **`APPROVED`**: Student passed admission criteria.
- **`ENROLLED`**: Student profile created and admitted into class!

---

## 💡 Summary: Why this design makes decision-making easy

1. **No Manual Double Data-Entry**: When an admission is approved, the system automatically creates the Student, Parent, and ID Card records without re-typing.
2. **Track Applicants Live**: Parents can check their application status online with their tracking number without calling the school office.
3. **Document Verification**: School staff can verify birth certificates and transfer letters before approving admissions.
