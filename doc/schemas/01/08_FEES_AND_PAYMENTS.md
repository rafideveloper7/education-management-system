# 08 - School Fees, Invoices & Payment Processing

This document explains in simple, clear words how **Fee Structures**, **Monthly Student Invoices**, **Partial Payments**, and **Official Digital Receipts** work.

---

## 🌟 1. Visual Overview: The Fee Invoicing & Payment Flow

```
┌────────────────────────────────────────────────────────┐
│     💰 STANDARD MONTHLY FEE STRUCTURE (Class 10)       │
│     • Tuition: Rs. 10,000 | Lab: Rs. 2,000 | Exam: Rs. 1,000│
│     • Gross Total: Rs. 13,000 / month                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│     🧾 MONTHLY INVOICE GENERATED (Ali Khan)            │
│     • Base Fee:           Rs. 13,000                   │
│     • Concession (10%): - Rs.  1,300                   │
│     • Total Payable:      Rs. 11,700                   │
│     • Due Date:           10th September               │
└───────────────────────────┬────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
┌──────────────────┐                  ┌──────────────────┐
│ 📲 ONLINE CARD   │                  │ 💵 CASH AT BANK  │
│ (Instant Pay)    │                  │ (Deposit Slip)   │
└────────┬─────────┘                  └────────┬─────────┘
         │                                     │
         └──────────────────┬──────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│     📄 OFFICIAL DIGITAL RECEIPT (Downloadable PDF)     │
│     Receipt # REC-2026-09-0142 | Status: PAID IN FULL  │
└────────────────────────────────────────────────────────┘
```

---

## 💰 2. Fee Structure Pricing (`fee_structures`)

Standard price list configured per class for the academic year.

### Example Pricing Breakdown (Grade 10):
| Fee Head | Amount | Frequency | Description |
|---|---|---|---|
| **Tuition Fee** | Rs. 10,000 | Monthly | Main instructional teaching fee |
| **Science & IT Lab Fee** | Rs. 2,000 | Monthly | Lab equipment & computer usage |
| **Exam Fee** | Rs. 1,000 | Monthly | Paper and stationery fee |
| **Admission Fee** | Rs. 15,000 | One-Time | Charged only when first admitted |

---

## 🧾 3. Monthly Student Fee Invoices (`student_fees`)

Every month, the system generates an invoice for each student with discounts and late fines calculated.

### Real-World Student Invoice:
```
Invoice Number:   INV-2026-09-0142
Student Name:     Ali Khan (Class 10-A)
Billing Month:    September 2026
Base Fee Amount:  Rs. 13,000
Discount:         - Rs. 1,300 (Sibling / Merit 10%)
Late Penalty:     Rs. 0
Total Payable:    Rs. 11,700
Amount Paid:      Rs. 11,700
Remaining Due:    Rs. 0
Status:           PAID
```

---

## 💳 4. Payments & Digital Receipts (`payments`, `fee_receipts`)

Every payment is recorded with the payment method and generates a downloadable PDF receipt.

```
┌────────────────────────────────────────────────────────┐
│             📄 OFFICIAL SCHOOL FEE RECEIPT             │
├────────────────────────────────────────────────────────┤
│ Receipt Number:  REC-2026-09-0142                      │
│ Date Paid:       05 September 2026                     │
│ Student Name:    Ali Khan (Roll # 15)                  │
│ Class:           Class 10 - Section A                  │
│ Amount Paid:     Rs. 11,700                            │
│ Payment Method:  Bank Deposit (Slip # 89412)           │
│ Cashier / Admin: Admin User (Sarah)                    │
│ Status:          COMPLETED & VERIFIED                  │
└────────────────────────────────────────────────────────┘
```

---

## 💡 Summary: Why this design makes decision-making easy

1. **Partial Payments Supported**: If a parent pays Rs. 5,000 today and the rest next week, the system accurately tracks the remaining Rs. 6,700 balance.
2. **Sibling Concessions**: Automatic discounts can be applied for parents who have 2 or more children in the school.
3. **Downloadable Fee Vouchers**: Parents can print the fee voucher or pay directly from their mobile app without waiting in long queues.
