# EMS — Public User Authentication

## 1. Public User Account Kaise Banega?

Public User ko **self-registration** ki permission hogi.

Yani koi visitor EMS ki public website par aaye aur agar usay account ki zaroorat ho, to woh khud register kar sakta hai.

```text
Public Website
      ↓
Register
      ↓
Public User Account
      ↓
Login
      ↓
Public User Area
```

### Public User Ki Basic Information

Registration ke waqt:

* **Full Name** — User ka naam
* **Email Address** — Login aur account communication ke liye
* **Phone Number** — Agar required ho
* **Password** — Account security ke liye

Role system automatically assign karega:

`PUBLIC_USER`

User khud role select nahi karega.

---

# 2. Public User Aur Academic User Mein Difference

Ye difference important hai.

### Public User

Public user:

```text
Self Registration
      ↓
PUBLIC_USER
```

### Academic Users

Admin, Teacher, Student aur Parent:

```text
Authorized/Admin Process
      ↓
Academic Account
```

Public registration se koi person directly:

```text
ADMIN
TEACHER
STUDENT
PARENT
```

nahi ban sakta.

Example:

Agar koi public user register karta hai, woh registration mein:

> "I want to become Admin"

select karke Admin nahi ban sakta.

Backend khud role assign karega:

```text
role = PUBLIC_USER
```

---

# 3. Public User Login

Public User login page par:

* **Email**
* **Password**

enter karega.

Role select karne ki zaroorat nahi hogi.

```text
Public User
     ↓
Email + Password
     ↓
Backend
     ↓
Email Check
     ↓
Password Verify
     ↓
Account Status
     ↓
Authentication
     ↓
Access Token + Refresh Token
     ↓
Public User Area
```

---

# 4. Password Security

Public User ka password bhi database mein plain text mein store nahi hoga.

Same authentication security use hogi:

**Argon2id password hashing**

```text
Password
   ↓
Argon2id
   ↓
Password Hash
   ↓
Database
```

Login:

```text
Entered Password
       ↓
Argon2id Verification
       ↓
Match?
  ↙       ↘
Yes       No
 ↓         ↓
Login    Reject
```

---

# 5. Public User Login Ke Baad Kya Kar Sakta Hai?

Public User ko normal public website ki information access karne ke liye account ki zaroorat bhi nahi hoti.

Lekin authenticated Public User ke liye kuch additional functionality available ho sakti hai.

For example:

* Apni profile dekhna
* Apni profile information update karna
* Contact/inquiry history dekhna
* Admission application submit karna
* Apni admission application ka status track karna
* Relevant notifications dekhna
* Apni submitted requests ki history dekhna

---

# 6. Public User Academic Data Access Nahi Kar Sakta

Public User authenticated hone ke bawajood academic records access nahi kar sakta.

For example:

```text
Public User
    ❌ Student Marks
    ❌ Student Attendance
    ❌ Teacher Records
    ❌ Fee Records
    ❌ Exam Results
    ❌ Internal Applications
    ❌ Admin Panel
```

Agar Public User manually request kare:

```http
GET /students/101/results
```

backend request reject karega.

Valid JWT hone ka matlab ye nahi:

> "User har data access kar sakta hai."

JWT sirf identity prove karta hai.

Authorization decide karegi ke user ko kya access mil sakta hai.

---

# 7. Public User Admission Application

Public User ka important use-case **Admission** hai.

Example:

```text
Public Website
      ↓
Admissions
      ↓
Admission Form
      ↓
Submit Application
      ↓
Application ID / Tracking Number
      ↓
Admin Review
```

Public User apni admission application ka status track kar sakta hai.

Example statuses:

```text
SUBMITTED
     ↓
UNDER_REVIEW
     ↓
NEED_INFORMATION
     ↓
INTERVIEW_SCHEDULED
     ↓
APPROVED / REJECTED
```

Important:

Admission approve hone ke baad Public User automatically Student nahi ban jata.

Admin/system onboarding process:

```text
Admission Approved
       ↓
Student Profile Created
       ↓
Student Account Created
       ↓
Parent Linked
       ↓
Class Assigned
```

Yani **Public User role aur Student role separate hain**.

---

# 8. Wrong Password

Agar Public User wrong password enter kare:

```text
Email → Found
Password → Wrong
```

to login reject hoga.

Example response:

```text
Invalid email or password.
```

System unnecessarily ye reveal nahi karega ke email exist karta hai ya nahi.

---

# 9. Disabled Public User

Agar Public User ka account disabled hai:

```text
Email → Correct
Password → Correct
Account → Disabled
```

to login reject hoga.

```text
Login Denied
```

Account status backend check karega.

---

# 10. Forgot Password

Public User password bhool jaye to same secure reset process use hoga:

```text
Forgot Password
      ↓
Email
      ↓
Secure Reset Token
      ↓
Reset Link
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
* Short-lived hoga
* One-time use hoga
* Database mein token ka hash store kiya ja sakta hai

---

# 11. Logout

Public User logout karega:

```text
Public User Area
       ↓
Logout
       ↓
Refresh Token Revoke/Invalidate
       ↓
Logged Out
```

Access Token short-lived hone ki wajah se woh eventually expire bhi ho jayega.

---

# 12. Access Token Expire Hone Par

Access Token expire hone ke baad:

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
Continue
```

Agar Refresh Token invalid/revoked/expired ho:

```text
Refresh Failed
      ↓
Login Required
```

Production implementation mein refresh-token rotation/revocation properly handle ki jayegi.

---

# 13. Public User Security

Public User ke liye bhi same fundamental security rule apply hoga:

> **Frontend security boundary nahi hai. Backend actual security boundary hai.**

Example:

Public User browser mein URL change kare:

```text
/admin
```

to sirf frontend route check enough nahi hai.

Backend Admin APIs par verify karega:

```text
JWT Valid?
    ↓
User Identity
    ↓
Role = ADMIN?
    ↓
NO
    ↓
403 Forbidden
```

Isi tarah Public User kisi Student ka ID change karke protected data access nahi kar sakta.

---

# 14. Public User Authentication Complete Flow

```text
              Public Visitor
                    ↓
                Register
                    ↓
          Email + Password
                    ↓
             Account Created
                    ↓
            Role = PUBLIC_USER
                    ↓
                  Login
                    ↓
             Email Check
                    ↓
         Argon2id Verification
                    ↓
            Account Status
                    ↓
        Access + Refresh Token
                    ↓
          Public User Area
                    ↓
          Protected API Request
                    ↓
             JWT Verification
                    ↓
          PUBLIC_USER Role Check
                    ↓
          Resource Authorization
                    ↓
               Allow / Deny
```

---

# 15. Public User Forms

Public User ke authentication-related forms:

### 1. Registration

```text
Full Name
Email
Phone (if required)
Password
Confirm Password
```

### 2. Login

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

# 16. Technology Decision

## Requirement

Public users ko khud account create karne ki permission chahiye.

Saath hi EMS future mein:

* Web App
* Mobile App
* Other clients

support kar sakta hai.

## Problem

Public users ko securely authenticate karna hai aur protected APIs ke saath communicate karna hai.

## Technology

**JWT-based Authentication**

with:

* Access Token
* Refresh Token

## Why?

Same authentication architecture Public User ke liye bhi use ho sakti hai jo baaki EMS clients ke liye use ho rahi hai.

Isse authentication system consistent rehta hai.

## Alternative

**Session-based Authentication**

## Why Not?

Session authentication technically bilkul valid hai.

Lekin EMS ki final requirement multi-client architecture ki hai, isliye humne JWT-based authentication select ki hai.

## Trade-off

JWT ke saath:

* Token lifecycle manage karna hota hai
* Refresh token secure karna hota hai
* Rotation/revocation handle karni hoti hai

Lekin multiple clients ke liye API authentication flexible rehti hai.

## Final Decision

```text
Public User
     ↓
JWT Authentication
     +
Access Token
     +
Refresh Token
     +
Role-Based Authorization
     +
Resource-Level Authorization
```

---

# 17. Technology Summary

| Requirement              | Technology                   | Reason                                |
| ------------------------ | ---------------------------- | ------------------------------------- |
| Self registration        | Public Registration API      | User khud account bana sakta hai      |
| Password security        | Argon2id                     | Secure password hashing               |
| Authentication           | JWT                          | Multi-client API architecture         |
| Short-term access        | Access Token                 | Protected API requests                |
| Long-term authentication | Refresh Token                | New access tokens                     |
| Token attachment         | Axios Interceptor            | Automatically attach token            |
| Role control             | RBAC                         | Public User ko limited permissions    |
| Data protection          | Resource-level authorization | Protected records prevent karna       |
| Password recovery        | Secure reset token           | Safe password reset                   |
| Account control          | Account status               | Disabled account login nahi kar sakta |

---

# 18. Final EMS Authentication Architecture

Ab humare **5 roles** ka authentication architecture consistent hai:

```text
                    EMS AUTHENTICATION
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     ADMIN              TEACHER            STUDENT
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                     PARENT
                           │
                     PUBLIC_USER
                           │
                           ▼
                  Common JWT System
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
          Access Token          Refresh Token
                │
                ▼
        Authentication
                │
                ▼
        Role Authorization
                │
                ▼
      Resource Authorization
                │
                ▼
       Business Authorization
                │
          ┌─────┴─────┐
          ▼           ▼
        Allow        Deny
```

## Final Principle

EMS mein **authentication mechanism sab roles ke liye same** rahega.

Difference authentication ka nahi, **authorization ka hai**.

```text
Authentication
= Aap kaun hain?

Authorization
= Aap kya kar sakte hain?

Resource Authorization
= Aap kis specific data par kaam kar sakte hain?
```

Example:

```text
PUBLIC_USER
    ❌ Admin Panel

TEACHER
    ❌ Unassigned Class

STUDENT
    ❌ Another Student's Result

PARENT
    ❌ Unlinked Child's Result

ADMIN
    ✅ Authorized Administrative Operations
```

**Yahi EMS ka final authentication foundation hai.**
