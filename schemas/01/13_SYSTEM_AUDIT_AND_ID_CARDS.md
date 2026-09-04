# 13 - ID Card Generation, QR Verification & Security Audits

This document explains in simple, clear words how **Student & Teacher ID Cards**, **Instant QR Code Scanning**, and **Security Audit Logs** work.

---

## 🌟 1. Visual Overview: Automated ID Cards & QR Scan

```
┌────────────────────────────────────────────────────────┐
│           🎓 STUDENT PROFILE COMPLETE (Ali Khan)       │
│       Photo, Roll # 15, Class 10-A, Blood Group B+     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           🪪 AUTOMATIC ID CARD GENERATED               │
│   • Card Number:   IDC-STD-2026-0812                   │
│   • Student Photo: Verified Portrait Image             │
│   • QR Code:       Contains Signed Security Token      │
│   • Formats:       Digital on Portal + Printable PDF   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           📱 SECURITY GUARD SCANS QR CODE AT GATE      │
├────────────────────────────────────────────────────────┤
│ 🛡️ Verification Screen Displays:                       │
│ ✅ STATUS: VALID & ACTIVE STUDENT                      │
│ • Name: Ali Khan | Roll # 15 | Class: 10-A             │
│ • Emergency Contact: Father (0300-1234567)             │
└────────────────────────────────────────────────────────┘
```

---

## 🪪 2. ID Cards (`id_cards`)

Generated automatically from the student or teacher's profile.

### Real-World Student ID Card:
```
Card Number:      IDC-STD-2026-0812
Cardholder Name:  Ali Khan
Role:             STUDENT (Class 10 - Section A)
Roll Number:      15
Blood Group:      B+
Emergency Phone:  0300-1234567
Issue Date:       01 September 2026
Expiry Date:      31 August 2027
Status:           ACTIVE
```

---

## 🛡️ 3. Security Audit Logs (`audit_logs`)

Every important change (like changing a student's grade or waiving a fee) is recorded automatically so management knows **who did what and when**.

```
┌────────────────────────────────────────────────────────┐
│                 📋 SYSTEM AUDIT LOG ENTRY              │
├────────────────────────────────────────────────────────┤
│ • What Happened:  Physics Mark Changed from 78 to 88   │
│ • Performed By:   Prof. Sarah Ahmed (Teacher)          │
│ • Reason Given:   "Recounting correction on Page 4"    │
│ • Time & Date:    03 September 2026 at 11:20 AM        │
│ • IP Address:     182.185.12.4 (School Campus Wi-Fi)   │
└────────────────────────────────────────────────────────┘
```

---

## 💡 Summary: Why this design makes decision-making easy

1. **Zero Graphic Designer Fees**: ID cards with custom school logos, barcodes, and QR codes are generated automatically with one click.
2. **Instant Gate Security**: Campus guards can scan any student or teacher card using their smartphone camera to verify authenticity.
3. **Total Accountability**: The audit log ensures no marks, fees, or account statuses can be altered without a recorded digital trail.
