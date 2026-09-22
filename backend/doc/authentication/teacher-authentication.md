# EMS — Teacher Authentication

## 1. Teacher Account Kaise Banega?

Teacher ka account **public registration se nahi banega**.

Teacher account **Admin ya authorized management** create karegi.

Teacher khud website par ja kar "Teacher Account" create nahi kar sakta.

### Teacher ki Basic Information

Teacher account banate waqt ye information li jayegi:

* **Full Name** — Teacher ka naam
* **Email Address** — Login aur important communication ke liye
* **Phone Number** — Contact/recovery ke liye
* **Password** — Account security ke liye
* **Profile Picture** — Teacher profile ke liye
* **Employee ID** — Teacher ki institutional identification
* **Department** — Teacher kis department se belong karta hai
* **Designation** — Teacher ka position
* **Qualification** — Teacher ki educational qualification
* **Joining Date** — Institution join karne ki date

**Role:** Teacher khud select nahi karega. Admin/system account ko `TEACHER` role dega.

### Simple Example

> School mein ek new teacher join karta hai.
> Admin uska teacher profile aur login account create karta hai.
> System us account ko Teacher role deta hai.
> Ab teacher apne email aur password se login kar sakta hai.

---

# 2. Teacher Login Kaise Karega?

Teacher ke liye login form simple hoga.

### Teacher ye enter karega:

* Email
* Password

Bas.

Teacher ko login karte waqt role select karne ki zaroorat nahi hogi.

System khud account dekh kar samajh lega:

> "Ye user Teacher hai."

---

# 3. Login Ke Baad Kya Hoga?

Teacher email aur password enter karega.

Phir system ye steps karega:

### Step 1 — Email Check

System dekhega ke teacher ka email registered hai ya nahi.

### Step 2 — Password Check

System entered password ko stored secure password ke saath verify karega.

### Step 3 — Account Check

System dekhega ke teacher ka account active hai ya disabled.

### Step 4 — Authentication

Agar sab kuch correct hai, system teacher ko authenticated user maan lega.

### Step 5 — Login Token

System Teacher ko:

* Access Token
* Refresh Token

dega.

### Step 6 — Teacher Panel

Teacher ko Teacher Panel mein bhej diya jayega.

### Simple Flow

```text
Teacher
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
Teacher Panel
```

---

# 4. Token Ka Simple Matlab Kya Hai?

Token ko **digital entry pass** samajh lo.

Teacher login karta hai aur system kehta hai:

> "Maine verify kar liya hai ke ye registered Teacher hai."

Ab jab teacher protected page/API use karega, token uski identity prove karne mein help karega.

### Example

```text
Teacher → Attendance Page
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

# 5. Teacher Har Request Mein Password Nahi Bhejega

Teacher ko har request par email aur password dobara enter nahi karna padega.

Login ke baad token use hota hai.

### Example

```text
Login
  ↓
Token mil gaya
  ↓
Attendance dekhna
  ↓
Token
  ↓
Assignment create karna
  ↓
Token
  ↓
Marks enter karna
  ↓
Token
```

Is tarah teacher baar baar login nahi karega.

---

# 6. Teacher Kya Kar Sakta Hai?

Login hone ka matlab sirf ye hai:

> "System ko pata hai ke ye Teacher hai."

Uske baad system Teacher ki permissions aur assigned academic data check karega.

Teacher apni responsibility ke according features use kar sakta hai, jaise:

* Apni assigned classes dekhna
* Apne assigned subjects dekhna
* Students ki attendance record karna
* Attendance dekhna
* Assignments create karna
* Students ki submissions dekhna
* Assignments check/mark karna
* Feedback dena
* Assigned exams dekhna
* Marks enter karna
* Applications dekhna
* Relevant applications ka response dena
* Notifications dekhna
* Relevant students/parents ke saath allowed communication karna

### Important Example

Agar Teacher **10-A** ko Mathematics parhata hai:

```text
Teacher
  ↓
10-A Mathematics
  ↓
Allowed
```

Lekin agar woh **9-B** ka assigned teacher nahi hai:

```text
Teacher
  ↓
9-B Students
  ↓
Not Assigned
  ↓
Access Denied
```

Yani sirf `TEACHER` role hona har student ka data dekhne ki permission nahi deta.

---

# 7. Agar Teacher Galat Password Enter Kare?

System login allow nahi karega.

```text
Email + Wrong Password
        ↓
Login Failed
        ↓
Teacher Panel Access Nahi Milega
```

System simple message de sakta hai:

> "Invalid email or password."

---

# 8. Agar Teacher Account Disabled Ho?

Agar Admin ne teacher ka account disabled kar diya:

```text
Email + Correct Password
        ↓
Account Status Check
        ↓
Account Disabled
        ↓
Login Denied
```

Teacher correct password ke bawajood system use nahi kar sakta.

---

# 9. Agar Teacher Password Bhool Jaye?

Teacher **Forgot Password** option use karega.

### Flow

```text
Forgot Password
      ↓
Email enter
      ↓
System reset request create karta hai
      ↓
Email par secure reset link
      ↓
Teacher new password set karta hai
      ↓
Password update
      ↓
Teacher dobara login karta hai
```

Password database mein readable form mein save nahi hoga.

---

# 10. Teacher Logout

Jab Teacher Logout karega:

```text
Teacher clicks Logout
       ↓
Authentication credentials revoke/clear
       ↓
Teacher logged out
       ↓
Login Page
```

Logout ke baad protected Teacher pages/API access nahi hone chahiye.

---

# 11. Access Token Expire Ho Jaye To?

Teacher ko normally dobara password enter karne ki zaroorat nahi hogi.

System Refresh Token ke through naya Access Token le sakta hai.

```text
Access Token Expired
        ↓
Refresh Token
        ↓
System verifies it
        ↓
New Access Token
        ↓
Teacher continues working
```

Agar Refresh Token bhi valid nahi raha, to Teacher ko dobara login karna padega.

---

# 12. Teacher Authentication Ka Complete Simple Flow

```text
          TEACHER ACCOUNT
                ↓
       Account Created by Admin
                ↓
       Email + Password
                ↓
             LOGIN
                ↓
       Email & Password
           Verified
                ↓
        Account Status
            Checked
                ↓
        Token Generated
                ↓
         TEACHER PANEL
                ↓
       Protected Requests
                ↓
     Identity + Permission
            Checked
                ↓
      Assigned Data Check
                ↓
       ┌────────┴────────┐
       ↓                 ↓
    Allowed            Denied
```

---

# 13. Teacher Ke Forms

## Account Creation

Admin/authorized person Teacher ka account create karega:

* Full Name
* Email
* Phone Number
* Password
* Profile Picture
* Employee ID
* Department
* Designation
* Qualification
* Joining Date

Role system assign karega.

## Login

Teacher enter karega:

* Email
* Password

## Forgot Password

* Email

## Reset Password

* New Password
* Confirm Password

---

# 14. Security Ka Simple Rule

Teacher ke liye sirf ye check karna enough nahi:

> "Kya ye user Teacher hai?"

Backend ko ye bhi check karna hoga:

> "Kya ye Teacher is particular class, subject ya student ke saath assigned hai?"

### Example

Teacher A:

```text
Assigned:
10-A Mathematics
10-B Mathematics
```

Teacher A request karta hai:

```text
10-A Students
```

**Allowed.**

Lekin:

```text
8-C Students
```

Agar Teacher A ko 8-C assign nahi kiya gaya:

**Access Denied.**

Frontend par page hide karna security nahi hai. Backend har important request par authorization check karega.

---

# 15. Technology Decision — Teacher Authentication

Teacher ke liye authentication technology Admin se **different nahi hogi**.

Ye important architecture decision hai.

### Requirement

Teacher ko securely login karna hai aur future mein Web App, Mobile App ya other clients se system use kiya ja sakta hai.

### Technology

**JWT-based Authentication**

Teacher ko:

* Access Token
* Refresh Token

milenge.

### Why?

EMS ka backend ek central API hai.

Web aur future mobile application dono same backend ko use kar sakte hain.

```text
Web App
    ↓
    ├────→ EMS API
    ↑
Mobile App
```

JWT dono clients ke saath use kiya ja sakta hai.

---

# 16. Password Security

### Requirement

Teacher ka password secure rakhna hai.

### Technology

**Argon2id**

Simple flow:

```text
Teacher Password
       ↓
    Argon2id
       ↓
Secure Password Hash
       ↓
Database
```

System password ko readable form mein save nahi karega.

### Alternative — bcrypt

bcrypt bhi ek strong aur widely used password hashing option hai.

Hum Argon2id choose kar rahe hain because ye modern password-hashing choice hai.

### Trade-off

Argon2id hashing ke waqt additional memory/resources use karta hai.

Lekin password security ke liye ye cost acceptable hai.

---

# 17. Access Token + Refresh Token

### Requirement

Teacher ko baar baar password enter nahi karna chahiye.

### Technology

**Short-lived Access Token + Refresh Token**

### Simple Example

```text
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

Hum sirf ek long-lived token rakh sakte the.

### Kyun nahi?

Agar woh token compromise ho jaye to attacker zyada time tak access maintain kar sakta hai.

### Trade-off

Do token types manage karne padte hain, lekin security aur user experience better hota hai.

---

# 18. Axios Interceptor

### Requirement

Teacher ki protected API requests ke saath Access Token automatically bhejna hai.

### Technology

**Axios Request Interceptor**

```text
Teacher API Request
        ↓
Axios Interceptor
        ↓
Access Token Attach
        ↓
EMS Backend
```

### Why?

Har request mein manually token likhne ki zaroorat nahi hogi.

### Alternative

Har API call mein manually token attach karna.

### Kyun nahi?

Code repeat hoga aur kisi request mein token miss hone ka chance hoga.

### Trade-off

Interceptor ek additional layer hai aur token-refresh logic carefully handle karna hoga.

Lekin JWT architecture mein ye useful abstraction hai.

---

# 19. Role-Based Authorization

### Requirement

Teacher ko Student, Parent ya Admin ki permissions nahi milni chahiye.

### Technology

**Role-Based Authorization**

Teacher ka role:

```text
TEACHER
```

Backend is role ko check karega.

### Example

```text
Teacher
  ↓
Admin-only operation
  ↓
Access Denied
```

### Alternative

Sab authenticated users ko same permissions dena.

### Kyun nahi?

Isse teacher unauthorized administrative actions perform kar sakta hai.

### Trade-off

Permission rules maintain karne padenge, lekin EMS ke liye ye necessary security hai.

---

# 20. Resource-Level Authorization

Ye Teacher ke liye **bahut important** hai.

### Requirement

Teacher sirf apni assigned academic information access kare.

### Problem

Agar system sirf ye check kare:

```text
role === "TEACHER"
```

to koi bhi Teacher potentially doosre Teacher ki classes access kar sakta hai.

### Solution

Backend check karega:

> "Kya ye class/subject/student is Teacher ko actually assigned hai?"

### Example

```text
Teacher A
   ↓
10-A Mathematics
   ↓
Assigned?
   ↓
YES
   ↓
Allowed
```

Lekin:

```text
Teacher A
   ↓
9-B Physics
   ↓
Assigned?
   ↓
NO
   ↓
Denied
```

### Alternative

Sirf Teacher role check karna.

### Kyun nahi?

Role user ka type batata hai, **specific academic responsibility nahi**.

### Trade-off

Backend ko assignment relationships check karne padenge.

Lekin student information sensitive hai, isliye ye complexity justified hai.

---

# 21. Teacher Authentication — Technology Summary

| Requirement            | Technology                   | Simple Reason                       |
| ---------------------- | ---------------------------- | ----------------------------------- |
| Password security      | Argon2id                     | Password ko secure rakhna           |
| Authentication         | JWT                          | Web + Mobile + future clients       |
| API access             | Access Token                 | Protected requests verify karna     |
| Long-term login        | Refresh Token                | Access token renew karna            |
| Token attachment       | Axios Interceptor            | Token automatically attach karna    |
| Role security          | Role-Based Authorization     | Teacher ko correct permissions dena |
| Academic data security | Resource-Level Authorization | Sirf assigned data access karna     |
| Password recovery      | Secure Reset Token           | Password safely recover karna       |

---

# 22. Final Teacher Authentication Decision

Teacher ke liye **same authentication architecture** use hogi jo Admin ke liye use ho rahi hai.

```text
Teacher
   ↓
Email + Password
   ↓
Argon2id Password Verification
   ↓
Account Status Check
   ↓
Access Token + Refresh Token
   ↓
Teacher Panel
   ↓
Protected API Request
   ↓
JWT Verification
   ↓
Role Check
   ↓
Assigned Class/Subject/Student Check
   ↓
Allow / Deny
```

### Final Principle

Teacher ke case mein bhi technology randomly choose nahi ki gayi.

Decision:

**Requirement → Problem → Technology → Why → Alternative → Why Not → Trade-off → Final Decision**

Aur sabse important:

> **Teacher ka JWT valid hona ye prove karta hai ke user authenticated Teacher hai. Lekin JWT valid hone ka matlab ye nahi ke Teacher har student ya har class ka data dekh sakta hai.**

Backend ko **role + actual assignment + resource ownership/access** check karna hi hoga.
