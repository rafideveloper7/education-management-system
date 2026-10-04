# EMS — Student Authentication

## 1. Student Account Kaise Banega?

Student ka account **public registration se nahi banega**.

Student khud website par ja kar Student Account create nahi karega.

Student ka account **Admin ke admission approval process ke through** create hoga.

### Simple Example

> Parent student ka admission form submit karta hai.
> Admin application ko check karta hai.
> Admission approve hone ke baad system student ka profile aur login account create karta hai.
> Ab student apne account se EMS mein login kar sakta hai.

---

# 2. Student Ki Basic Information

Student ka account/profile banate waqt system mein student ki basic information store hogi.

### Personal Information

* **First Name** — Student ka naam
* **Last Name** — Student ka surname
* **Date of Birth** — Student ki birth date
* **Gender** — Student ki gender information
* **Blood Group** — Agar institute ko required ho
* **Photo** — Student profile/ID card ke liye
* **Address** — Student ka address
* **Emergency Contact** — Emergency situation ke liye

### Academic Information

* **Admission Number** — Student ki unique institutional ID
* **Roll Number** — Class mein student ki identification
* **Class** — Student kis class mein hai
* **Section** — Student kis section mein hai
* **Academic Session** — Student kis academic year/session mein enrolled hai

### Parent Information

Student ke saath uske parent/guardian ka relationship bhi system mein linked hoga.

Example:

```text id="gr4nnp"
Student
  ↓
Parent/Guardian
  ↓
Father / Mother / Guardian
```

---

# 3. Student Login Kaise Karega?

Student ke liye login form simple hoga.

### Student ye enter karega:

* Email
* Password

Bas.

Student ko login karte waqt role select karne ki zaroorat nahi hogi.

System khud account dekh kar samajh lega:

> "Ye user Student hai."

---

# 4. Student Ka Login Flow

Student email aur password enter karega.

Phir system ye steps karega:

### Step 1 — Email Check

System dekhega ke student ka account registered hai ya nahi.

### Step 2 — Password Check

System entered password ko stored secure password ke saath verify karega.

### Step 3 — Account Status Check

System dekhega ke student account active hai ya disabled.

### Step 4 — Authentication

Agar information correct hai, system student ko authenticated user maan lega.

### Step 5 — Login Token

System Student ko:

* Access Token
* Refresh Token

dega.

### Step 6 — Student Panel

Student ko Student Panel mein bhej diya jayega.

### Simple Flow

```text id="m2x8bq"
Student
   ↓
Email + Password
   ↓
System verifies information
   ↓
Account active?
   ↓
Yes
   ↓
Access Token + Refresh Token
   ↓
Student Panel
```

---

# 5. Token Ka Simple Matlab Kya Hai?

Token ko **digital entry pass** samajh lo.

Student login karta hai aur system kehta hai:

> "Maine verify kar liya hai ke ye registered Student hai."

Ab student jab protected page/API use karega, token uski identity prove karne mein help karega.

### Example

```text id="3t7q3u"
Student → My Results
          ↓
      Backend ko request
          ↓
      Token ke through identity
          ↓
      Backend verifies
          ↓
      Permission check
          ↓
      Access allowed
```

---

# 6. Student Har Request Mein Password Nahi Bhejega

Student ko har request par email aur password dobara enter nahi karna padega.

Login ke baad token use hota hai.

### Example

```text id="5frv5f"
Login
  ↓
Token mil gaya
  ↓
My Attendance
  ↓
Token
  ↓
My Assignments
  ↓
Token
  ↓
My Results
  ↓
Token
  ↓
My Fees
  ↓
Token
```

Is tarah student ko baar baar login nahi karna padta.

---

# 7. Student Kya Dekh Aur Kar Sakta Hai?

Login hone ka matlab sirf ye hai:

> "System ko pata hai ke ye Student hai."

Uske baad system student ki permissions check karega.

Student apne account ke according:

* Apni profile dekh sakta hai
* Apni attendance dekh sakta hai
* Apne assignments dekh sakta hai
* Assignment submit kar sakta hai
* Teacher ka feedback dekh sakta hai
* Apne exam schedule dekh sakta hai
* Apne published results dekh sakta hai
* Apni academic performance dekh sakta hai
* Apni fees dekh sakta hai
* Allowed applications submit kar sakta hai
* Apni complaints/application ka status dekh sakta hai
* Relevant notices dekh sakta hai
* Notifications dekh sakta hai

### Important

Student **protected institutional information ko apni marzi se change nahi kar sakta**.

Example:

Student apni attendance ko:

```text id="2c0frv"
ABSENT → PRESENT
```

khud change nahi kar sakta.

Backend request reject karega.

---

# 8. Student Sirf Apna Data Dekh Sakta Hai

Ye student authentication ka **very important security rule** hai.

Example:

Student A ka ID:

```text id="aqe9v1"
studentId = 101
```

Student A request karta hai:

```text id="j5gyq8"
GET /students/101/results
```

Backend check karega:

```text id="7d9f3j"
Logged-in user = Student 101
        ↓
Requested student = 101
        ↓
Allowed
```

Lekin agar Student A request kare:

```text id="f9nqgk"
GET /students/102/results
```

to backend check karega:

```text id="7a3q7h"
Logged-in user = Student 101
        ↓
Requested student = 102
        ↓
Not allowed
        ↓
Access Denied
```

Sirf URL mein ID change kar dene se doosre student ka data access nahi hona chahiye.

---

# 9. Agar Student Galat Password Enter Kare?

System login allow nahi karega.

```text id="4eprp6"
Email + Wrong Password
        ↓
Login Failed
        ↓
Student Panel Access Nahi Milega
```

System simple message de sakta hai:

> "Invalid email or password."

---

# 10. Agar Student Account Disabled Ho?

Agar Admin student ka account disable kar de:

```text id="n7h9b5"
Email + Correct Password
        ↓
Account Status Check
        ↓
Account Disabled
        ↓
Login Denied
```

Yani correct password hone ke bawajood student login nahi kar sakta.

---

# 11. Agar Student Password Bhool Jaye?

Student **Forgot Password** option use karega.

### Flow

```text id="2c4v8k"
Forgot Password
      ↓
Email enter
      ↓
System reset request create karta hai
      ↓
Email par secure reset link
      ↓
Student new password set karta hai
      ↓
Password update
      ↓
Student dobara login karta hai
```

Password database mein readable form mein save nahi hoga.

---

# 12. Student Logout

Jab student Logout karega:

```text id="3ys7l8"
Student clicks Logout
       ↓
Authentication credentials revoke/clear
       ↓
Student logged out
       ↓
Login Page
```

Logout ke baad protected Student pages/API access nahi hone chahiye.

---

# 13. Access Token Expire Ho Jaye To?

Student ko normally dobara password enter karne ki zaroorat nahi hogi.

System Refresh Token ke through naya Access Token le sakta hai.

```text id="h5v0v4"
Access Token Expired
        ↓
Refresh Token
        ↓
System verifies it
        ↓
New Access Token
        ↓
Student continues working
```

Agar Refresh Token bhi valid nahi raha, to student ko dobara login karna padega.

---

# 14. Student Authentication Ka Complete Simple Flow

```text id="qv8n7p"
          ADMISSION
              ↓
       Admin Approval
              ↓
      Student Account
          Created
              ↓
       Email + Password
              ↓
            LOGIN
              ↓
       Information Verified
              ↓
       Account Status Check
              ↓
       Access + Refresh Token
              ↓
        STUDENT PANEL
              ↓
       Protected Request
              ↓
      Identity + Permission
            Checked
              ↓
       Student's Own Data
            Checked
              ↓
       ┌────────┴────────┐
       ↓                 ↓
    Allowed            Denied
```

---

# 15. Student Ke Forms

## Student Account Creation

Student normally khud ye form submit nahi karega.

Admission approval ke baad system/Admin process ke through account create hoga.

Student profile mein:

* First Name
* Last Name
* Date of Birth
* Gender
* Blood Group
* Photo
* Address
* Emergency Contact
* Admission Number
* Roll Number
* Class
* Section
* Academic Session
* Parent/Guardian Link

## Login

Student enter karega:

* Email
* Password

## Forgot Password

* Email

## Reset Password

* New Password
* Confirm Password

---

# 16. Security Ka Simple Rule

Student ke liye ek important rule:

> **Student ko sirf apna allowed data access karna hai.**

Student ke paas valid JWT hona enough nahi hai.

Backend ko check karna hoga:

```text id="0s4r2v"
JWT valid?
   ↓
Student kaun hai?
   ↓
Requested data kis student ka hai?
   ↓
Kya dono same/authorized hain?
   ↓
YES → Allow
NO  → Deny
```

Frontend par button hide kar dena security nahi hai.

Backend actual security boundary hai.

---

# 17. Technology Decision — Student Authentication

Student ke liye authentication technology Admin aur Teacher se **different nahi hogi**.

Ye important architecture decision hai.

### Requirement

Student ko securely login karna hai aur same EMS system ko future mein Web App, Mobile App aur other clients se use kiya ja sakta hai.

### Problem

Humein har role ke liye alag authentication system banane ki zaroorat nahi.

### Technology

**JWT-based Authentication**

Student ko:

* Access Token
* Refresh Token

milenge.

### Why?

Ek hi central authentication system multiple user types aur multiple clients ko support kar sakta hai.

```text id="q4a9cn"
Admin
Teacher
Student
Parent
   ↓
Central Authentication
   ↓
JWT
   ↓
EMS API
```

Isse architecture simple aur consistent rehta hai.

---

# 18. Password Security

### Requirement

Student ka password secure rakhna hai.

### Technology

**Argon2id**

Simple flow:

```text id="v75sl8"
Student Password
       ↓
    Argon2id
       ↓
Secure Password Hash
       ↓
Database
```

Password readable form mein database mein save nahi hoga.

### Alternative — bcrypt

bcrypt bhi strong aur widely used password-hashing option hai.

Hum Argon2id choose kar rahe hain because ye modern password-hashing choice hai.

### Trade-off

Argon2id hashing ke waqt additional memory/resources use karta hai.

Lekin password security ke liye ye cost acceptable hai.

---

# 19. Access Token + Refresh Token

### Requirement

Student ko baar baar password enter nahi karna chahiye.

### Technology

**Short-lived Access Token + Refresh Token**

### Simple Flow

```text id="q8w6dy"
Access Token
     ↓
Expires
     ↓
Refresh Token
     ↓
New Access Token
```

### Why?

Access Token ki lifetime short rakhi ja sakti hai.

Agar access token compromise ho jaye to uski validity limited hoti hai.

### Alternative — One Long-Lived Token

Sirf ek long-lived token use kiya ja sakta tha.

### Kyun nahi?

Agar woh token compromise ho jaye to attacker zyada time tak student account access kar sakta hai.

### Trade-off

Do token types manage karne padte hain, lekin security aur user experience better hota hai.

---

# 20. Axios Interceptor

### Requirement

Student ki protected API requests ke saath Access Token automatically bhejna hai.

### Technology

**Axios Request Interceptor**

```text id="0ud6tb"
Student API Request
        ↓
Axios Interceptor
        ↓
Access Token Attach
        ↓
EMS Backend
```

### Why?

Har API call mein manually token attach karne ki zaroorat nahi hogi.

### Alternative

Har request mein manually token attach karna.

### Kyun nahi?

Code repeat hoga aur kisi request mein token miss hone ka chance hoga.

### Trade-off

Interceptor ek additional layer hai aur token-refresh logic carefully handle karna padega.

JWT architecture mein ye justified hai.

---

# 21. Role-Based Authorization

### Requirement

Student ko Teacher/Admin/Parent ki permissions nahi milni chahiye.

### Technology

**Role-Based Authorization**

Student ka role:

```text id="w8xw9x"
STUDENT
```

### Example

```text id="31h47p"
Student
   ↓
Change Exam Marks
   ↓
Admin/Teacher permission required
   ↓
Access Denied
```

### Alternative

Har authenticated user ko same permissions dena.

### Kyun nahi?

Isse student protected institutional operations perform kar sakta hai.

### Trade-off

Permissions ke rules maintain karne padenge.

Lekin EMS ke liye ye necessary security hai.

---

# 22. Resource-Level Authorization

### Requirement

Student sirf **apne records** access kare.

### Problem

Agar backend sirf:

```text id="y5jsi0"
role === "STUDENT"
```

check kare, to woh ye nahi jaanega ke requested record usi student ka hai ya kisi aur ka.

### Solution

Backend user identity aur requested resource ko compare karega.

```text id="tq1mjp"
Logged-in Student
       ↓
Student ID = 101
       ↓
Requested Record
       ↓
Student ID = 101
       ↓
Allowed
```

Agar:

```text id="m6ckro"
Logged-in Student = 101
Requested Record = 102
       ↓
Denied
```

### Alternative

Sirf role check karna.

### Kyun nahi?

Role sirf ye batata hai:

> "Ye Student hai."

Role ye nahi batata:

> "Ye kaunsa Student hai?"

### Trade-off

Backend mein additional ownership/access checks likhne padenge.

Lekin student academic data sensitive hai, isliye ye complexity necessary hai.

---

# 23. Password Reset

### Requirement

Student password bhool sakta hai.

### Technology

**Secure Password Reset Token + Expiry**

### Flow

```text id="f7b1z5"
Forgot Password
      ↓
Email
      ↓
Secure Reset Link
      ↓
New Password
```

### Why?

Student ko safely account recover karne ka method chahiye.

### Alternative

Admin manually student ka password set kare.

### Kyun nahi?

Admin ko student ka password pata nahi hona chahiye aur manual password handling security risk create kar sakti hai.

### Trade-off

Email aur reset-token flow implement karna padega.

Lekin account recovery ke liye ye necessary hai.

---

# 24. Student Authentication — Technology Summary

| Requirement       | Technology                   | Simple Reason                       |
| ----------------- | ---------------------------- | ----------------------------------- |
| Password security | Argon2id                     | Password ko secure rakhna           |
| Authentication    | JWT                          | Web + Mobile + future clients       |
| API access        | Access Token                 | Protected requests verify karna     |
| Long-term login   | Refresh Token                | Access token renew karna            |
| Token attachment  | Axios Interceptor            | Token automatically attach karna    |
| Role security     | Role-Based Authorization     | Student ko correct permissions dena |
| Data security     | Resource-Level Authorization | Sirf apna data access karna         |
| Password recovery | Secure Reset Token           | Password safely recover karna       |

---

# 25. Final Student Authentication Decision

Student ke liye **same central authentication architecture** use hogi jo Admin aur Teacher ke liye use ho rahi hai.

```text id="6o7q7j"
Student
   ↓
Email + Password
   ↓
Argon2id Password Verification
   ↓
Account Status Check
   ↓
Access Token + Refresh Token
   ↓
Student Panel
   ↓
Protected API Request
   ↓
JWT Verification
   ↓
Role Check
   ↓
Student's Own Data Check
   ↓
Allow / Deny
```

### Final Principle

> **Valid JWT ka matlab ye hai ke Student authenticated hai.**

Lekin:

> **Valid JWT ka matlab ye nahi ke Student kisi bhi student ka data dekh sakta hai.**

Backend ko **identity + role + resource access** check karna hi hoga.

EMS ka authentication system isi principle par chalega:

**Authentication → "Aap kaun hain?"**

**Authorization → "Aap ko kya karne ki permission hai?"**

**Resource Authorization → "Aap kis specific data par kaam kar sakte hain?"**
