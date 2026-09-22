# EMS — Parent Authentication

## 1. Parent Account Kaise Banega?

Parent ka account **public registration se automatically academic parent account nahi banega**.

Parent account authorized system/admin process ke through create/link hoga.

### Parent Account Kab Banega?

Normally admission process ke waqt:

**Parent Admission Form Submit Karta Hai**
↓
**Admin Application Review Karta Hai**
↓
**Admission Approve Hoti Hai**
↓
**Student Profile Create Hota Hai**
↓
**Parent Account Create/Link Hota Hai**
↓
**Parent Student ke Saath Link Hota Hai**
↓
**Parent Login Kar Sakta Hai**

### Parent Ki Basic Information

Parent account/profile mein required information:

* **Full Name** — Parent ka naam
* **Email Address** — Login aur important communication ke liye
* **Phone Number** — Contact/recovery ke liye
* **Password** — Account security ke liye
* **Profile Picture** — Agar required ho
* **Relation** — Father / Mother / Guardian
* **Address** — Residential/contact information
* **Occupation** — Agar institute ko required ho

Parent ka **role system khud assign karega**:

`PARENT`

Parent khud role select nahi karega.

---

# 2. Parent Login Kaise Karega?

Parent login page par sirf:

* **Email**
* **Password**

enter karega.

Parent ko login ke waqt ye select karne ki zaroorat nahi:

> "I am Parent"

Backend account ke andar stored role se khud identify karega ke ye user Parent hai.

### Login Flow

```text
Parent
   ↓
Email + Password
   ↓
Backend
   ↓
Email Check
   ↓
Password Verify
   ↓
Account Status Check
   ↓
Authentication Successful
   ↓
Access Token + Refresh Token
   ↓
Parent Panel
```

---

# 3. Password Kaise Verify Hoga?

Parent ka password database mein plain text mein store nahi hoga.

Password ko **Argon2id** ke through hash kiya jayega.

Simple example:

```text
Parent Password
      ↓
   Argon2id
      ↓
Password Hash
      ↓
   Database
```

Login ke waqt:

```text
Entered Password
      ↓
Argon2id Verification
      ↓
Match?
   ↙      ↘
 Yes       No
 ↓         ↓
Login    Reject
```

---

# 4. Login Ke Baad Parent Ko Kya Milega?

Successful login ke baad Parent ko **Parent Panel** milega.

Parent apne linked children ka data dekh sakega.

Example:

```text
Parent
 ├── Child 1 → Ali
 ├── Child 2 → Ahmed
 └── Child 3 → Sara
```

Agar ek parent ke 3 bachay hain, to parent ek hi account se teeno children ko manage/view kar sakega.

---

# 5. Parent Multiple Children Ko Kaise Manage Karega?

Ye EMS ka important requirement hai.

Ek parent ka:

```text
1 Parent Account
      ↓
Multiple Children
```

ho sakte hain.

Example:

```text
Parent Account
      │
      ├── Ali → Class 8-A
      │
      ├── Ahmed → Class 6-B
      │
      └── Sara → Class 4-A
```

Parent panel mein **Child Switcher** ho sakta hai:

```text
Current Child: Ali

[ Switch Child ▼ ]
```

Parent jab Ahmed select karega, backend sirf ye verify karega ke:

> Kya Ahmed waqai is parent ke account ke saath linked hai?

Agar linked hai → access allowed.

Agar linked nahi hai → access denied.

---

# 6. Parent Kya Dekh Sakta Hai?

Parent apne linked children ke relevant academic aur financial records dekh sakta hai.

### Student Information

* Child profile
* Class
* Section
* Roll Number
* Academic Session

### Attendance

* Daily attendance
* Present
* Absent
* Late
* Leave
* Attendance percentage

### Assignments

* Assignment
* Deadline
* Submission status
* Marks
* Teacher feedback

### Exams & Results

* Exam schedule
* Published marks
* Grades
* Percentage
* Performance

### Fees

* Fee invoices
* Paid amount
* Remaining amount
* Payment history
* Receipts

### Applications

Parent apne child ke behalf par applications submit kar sakta hai:

* Leave
* Fee request
* Academic request
* Certificate request
* Teacher complaint
* Child concern
* Meeting request
* General request

### Notifications

Parent ko relevant notifications mil sakti hain:

* Child absent
* New assignment
* Assignment deadline
* Result published
* Fee reminder
* Application response
* Important notice
* School event

---

# 7. Parent Kya Modify Nahi Kar Sakta?

Parent protected institutional data ko directly modify nahi kar sakta.

Example:

Parent ye nahi kar sakta:

```text
Change Child Marks
Change Attendance
Change Exam Result
Change Fee Amount
Change Teacher Assignment
Change Class
Change School Records
```

Parent sirf woh actions perform karega jo system explicitly allow karega.

---

# 8. Parent Authorization Ka Important Example

Suppose:

```text
Parent A
 ├── Child 101
 └── Child 102
```

Aur database mein:

```text
Child 103
```

kisi doosre parent ka hai.

Agar Parent A manually request kare:

```http
GET /students/103/results
```

to valid JWT hone ke bawajood request **reject** hogi.

Kyun?

Because:

```text
Valid JWT
   +
PARENT Role
   +
Child 103 Parent A se linked?
   ↓
   NO
   ↓
Access Denied
```

Yani sirf role check enough nahi hai.

Backend ko **resource-level authorization** bhi karni hogi.

---

# 9. Wrong Password

Agar Parent wrong password enter kare:

```text
Email → Found
Password → Wrong
```

to backend login reject karega.

Simple response:

```text
Invalid email or password.
```

System unnecessarily ye reveal nahi karega ke:

> "Email correct hai lekin password wrong hai."

Isse account enumeration ka risk reduce hota hai.

---

# 10. Disabled Parent Account

Agar Parent ka account disabled/deactivated hai:

```text
Email → Correct
Password → Correct
Account Status → Disabled
```

to login phir bhi reject hoga.

```text
Login Denied
```

Example reasons:

* Account deactivated
* Parent no longer associated with institute
* Administrative action
* Security reason

---

# 11. Forgot Password

Agar Parent password bhool jaye:

```text
Forgot Password
      ↓
Email Enter
      ↓
Backend
      ↓
Secure Reset Token
      ↓
Email Reset Link
      ↓
Parent Opens Link
      ↓
New Password
      ↓
Argon2id Hash
      ↓
Password Updated
      ↓
Login
```

Reset token:

* Secure random hoga
* Short expiry hoga
* One-time use hoga
* Database mein preferably token ka hash store hoga

Admin ko Parent ka password manually dekhne ki zaroorat nahi hogi.

---

# 12. Parent Logout

Parent logout karega to application uski authentication state ko end/revoke karegi.

```text
Parent Panel
     ↓
Logout
     ↓
Refresh Token Revoke/Invalidate
     ↓
Login Page
```

Access Token short-lived hone ki wajah se woh eventually expire bhi ho jayega.

---

# 13. Access Token Expire Hone Par Kya Hoga?

Access Token ko short-lived rakha jayega.

Example:

```text
Access Token
     ↓
Expired
     ↓
Refresh Token
     ↓
Backend Verification
     ↓
New Access Token
     ↓
Parent Continue
```

Parent ko har thori der baad password dobara enter nahi karna padega.

Agar Refresh Token invalid/revoked/expired ho:

```text
Refresh Failed
     ↓
Login Required
```

Production system mein refresh-token rotation/revocation bhi properly handle ki jayegi.

---

# 14. Parent Authentication Ka Complete Flow

```text
Admission Process
       ↓
Admin Approval
       ↓
Parent Account Create/Link
       ↓
Child Link
       ↓
Parent
       ↓
Email + Password
       ↓
Email Check
       ↓
Argon2id Password Verification
       ↓
Account Status Check
       ↓
Authentication Successful
       ↓
Access Token + Refresh Token
       ↓
Parent Panel
       ↓
Protected API Request
       ↓
JWT Verification
       ↓
PARENT Role Check
       ↓
Linked Child Check
       ↓
Business Rules
       ↓
Allow / Deny
```

---

# 15. Parent Authentication Forms

Parent authentication ke important forms:

### 1. Parent Account Creation

Parent account admin/admission process se create/link hoga.

### 2. Parent Login

```text
Email
Password
```

### 3. Forgot Password

```text
Email
```

### 4. Reset Password

```text
New Password
Confirm Password
```

---

# 16. Security Rule

Sabse important rule:

> **Frontend par jo cheez hidden hai, woh automatically secure nahi hoti.**

Example:

Parent panel mein sirf uske children show ho rahe hain.

Lekin attacker manually API call kar sakta hai:

```http
GET /students/999/results
```

Isliye backend ko check karna hoga:

```text
1. JWT valid hai?
        ↓
2. User kaun hai?
        ↓
3. Role PARENT hai?
        ↓
4. Requested child is parent se linked hai?
        ↓
5. Is action ki permission hai?
        ↓
6. Business rule satisfy hota hai?
        ↓
Allow / Deny
```

Ye EMS ke Parent Panel ki **real security** hai.

---

# 17. Technology Decision

## Requirement

EMS ko future mein:

* Web App
* Mobile App
* Potentially other clients

support karna hai.

## Problem

Different clients ko same backend APIs ke saath securely communicate karna hai.

## Technology

**JWT-based Authentication**

with:

* Access Token
* Refresh Token

## Why?

JWT-based API authentication multiple clients ke liye suitable hai.

Parent web app ho ya future mobile app, same authentication architecture use ho sakta hai.

## Alternative

**Session-based Authentication**

## Why Not?

Session authentication bhi technically valid option hai.

Lekin hamari requirement future multi-client architecture ki hai, isliye JWT-based API authentication ko final architecture ke liye select kiya gaya hai.

## Trade-off

JWT architecture mein:

* Access token lifecycle manage karna hota hai
* Refresh token secure rakhna hota hai
* Token rotation/revocation handle karni hoti hai

Lekin future web + mobile clients ke liye flexibility milti hai.

## Final Decision

```text
JWT Authentication
       +
Short-lived Access Token
       +
Long-lived Refresh Token
       +
Role-Based Authorization
       +
Resource-Level Authorization
```

---

# 18. Technology Summary

| Requirement           | Technology                   | Reason                           |
| --------------------- | ---------------------------- | -------------------------------- |
| Password security     | Argon2id                     | Secure password hashing          |
| Authentication        | JWT                          | Multi-client API architecture    |
| Short-term access     | Access Token                 | Protected API requests           |
| Long-term login       | Refresh Token                | New access tokens                |
| API token attachment  | Axios Interceptor            | Automatically attach token       |
| Role permission       | RBAC                         | Parent-specific permissions      |
| Child access security | Resource-level authorization | Parent only sees linked children |
| Password recovery     | Secure reset token           | Safe password reset              |
| Account control       | Account status               | Disabled users cannot login      |

---

# 19. Final Parent Authentication Architecture

Parent ke liye authentication ka final design:

```text
              PARENT
                 │
                 ▼
          Email + Password
                 │
                 ▼
        Argon2id Verification
                 │
                 ▼
          Account Status
                 │
                 ▼
          JWT Authentication
                 │
          ┌──────┴──────┐
          ▼             ▼
   Access Token    Refresh Token
          │
          ▼
      Parent Panel
          │
          ▼
    Protected API
          │
          ▼
    JWT Verification
          │
          ▼
      PARENT Role
          │
          ▼
    Linked Child Check
          │
          ▼
   Business Authorization
          │
       ┌──┴──┐
       ▼     ▼
     Allow  Deny
```

## Final Principle

Parent authentication mein sirf ye prove karna enough nahi hai ke:

> **"Ye user Parent hai."**

System ko ye bhi prove karna hai:

> **"Ye Parent kis child ka Parent hai, aur is specific data/action ki permission hai ya nahi."**

Yahi **resource-level authorization** EMS Parent Panel ka sabse important security concept hai.
