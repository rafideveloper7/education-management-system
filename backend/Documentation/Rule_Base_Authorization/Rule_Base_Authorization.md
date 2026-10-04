EduOS — Phase 2

User, Profile & Dynamic Relationship Architecture

1. Phase 2 Ka Main Purpose

EduOS mein hum sirf users ke profiles nahi bana rahe.

Hum ye model kar rahe hain ke:

«Institution mein kaun hai, uska role kya hai, uski information kya hai, woh kis se connected hai, aur ye connection waqt ke saath kaise change hota hai.»

Isliye Phase 2 ka complete mental model hai:

User
  ↓
Role
  ↓
Profile
  ↓
Relationship
  ↓
Resource
  ↓
Authorization

Simple language mein:

User
= Ye person kaun hai?

Role
= Ye system mein kis category ka hai?

Profile
= Is person ki detailed information kya hai?

Relationship
= Ye person kis doosre person/entity se connected hai?

Resource
= Is person se related actual data kya hai?

Authorization
= Is person ko kya karne/access karne diya jayega?

---

2. Sab Se Important Architecture Principle

EduOS ko static system nahi samajhna.

Real institution mein relationships change hoti rehti hain.

Example:

2026
Teacher Ahmed → Class 9 Biology

2027
Teacher Ahmed → Class 10 Biology

Ya:

2026
Student Ali → Father Ahmed
Student Ali → Mother Sara

Later
Father Ahmed → Deceased

Later
Uncle Bilal → Guardian

Agar hamara database sirf simple fields par based ho:

student.parentId
teacher.classId
teacher.subjectId

to historical aur future information properly manage karna mushkil ho jayega.

Isliye:

«Static fields ke bajaye meaningful relationships ko model karna hai.»

---

3. Real-World Institution Ko Samjho

Ek real school mein:

- Student ka parent/guardian ho sakta hai.
- Ek student ke multiple guardians ho sakte hain.
- Ek parent ke multiple children ho sakte hain.
- Parent/guardian relationship change ho sakti hai.
- Teacher different academic years mein different classes ko teach kar sakta hai.
- Teacher ek se zyada subjects/classes ko teach kar sakta hai.
- Student har academic session mein class/section change kar sakta hai.
- Teacher ki assignment bhi change ho sakti hai.

EduOS ko in real-world changes ko support karna chahiye.

---

4. User Account Aur Profile

Sabse pehle account aur profile ko separate rakhenge.

User Account

User account ka kaam:

«Authentication aur common identity.»

Example:

User
├── userId
├── email
├── passwordHash
├── role
├── status
├── createdAt
└── updatedAt

---

5. Role

Possible roles:

ADMIN
TEACHER
STUDENT
PARENT
PUBLIC_USER

Role batata hai:

«Ye person system mein kis category ka hai?»

Example:

Ahmed
role = TEACHER

---

6. Profile

Profile role-specific information rakhegi.

User
 │
 ├── Admin Profile
 ├── Teacher Profile
 ├── Student Profile
 ├── Parent Profile
 └── Public User Profile

Profile batati hai:

«Institution ke context mein ye person kaun hai?»

---

7. Admin Profile

Possible information:

AdminProfile
├── userId
├── fullName
├── phone
├── profilePicture
├── designation
└── departmentId

Example:

Admin
 ↓
Principal
 ↓
Administration Department

Admin ki permissions alag authorization system se control hongi.

---

8. Teacher Profile

Teacher profile mein:

TeacherProfile
├── userId
├── fullName
├── phone
├── profilePicture
├── employeeId
├── departmentId
├── designation
├── qualification
└── joiningDate

Lekin yahan ek important point:

«Teacher profile mein permanent "classId" aur "subjectId" rakhna zaroori nahi.»

Kyun?

Because teacher ki assignment change hoti rehti hai.

---

9. Teacher Assignment Ko Dynamic Kyun Rakhna Hai?

Example:

Academic Session 2026–27

Ahmed
 ↓
Biology
 ↓
Class 9
 ↓
Section A

Next academic session:

Academic Session 2027–28

Ahmed
 ↓
Biology
 ↓
Class 10
 ↓
Section B

Ahmed wahi teacher hai.

Teacher profile change nahi hui.

Assignment change hui hai.

Isliye teacher profile aur teaching assignment ko separate concepts rakhenge.

---

10. Teacher Profile vs Teaching Assignment

Ye difference bohat important hai.

Teacher Profile

Ahmed
Employee ID = EMP-101
Qualification = MS Biology
Designation = Lecturer

Ye Ahmed ki identity/professional information hai.

Teaching Assignment

Ahmed
+
Biology
+
Class 9
+
Section A
+
Academic Session 2026–27

Ye ek particular academic period ki assignment hai.

---

11. Teaching Assignment Ka Real-Life Meaning

Teaching Assignment basically ye kehti hai:

«"Is academic session mein ye teacher, ye subject, is class/section ko teach karega."»

Conceptually:

TeachingAssignment

teacher
+
subject
+
class
+
section
+
academicSession

---

12. Teaching Assignment Diagram

                 TEACHER
                    │
                    ↓
          TEACHING ASSIGNMENT
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
    Subject        Class       Section
       │            │            │
       └────────────┼────────────┘
                    ↓
             Academic Session

Example:

Ahmed
 ↓
Biology
 ↓
Class 9
 ↓
Section A
 ↓
2026–27

---

13. Next Year Kya Hoga?

2027–28

new assignment:

Ahmed
 ↓
Biology
 ↓
Class 10
 ↓
Section B
 ↓
2027–28

Purani assignment delete nahi karni.

Woh historical record rahegi.

---

14. Iska Benefit

Ab hum system se easily pooch sakte hain:

Question:

«2026–27 mein Ahmed kis class ko Biology padhata tha?»

Answer:

Class 9-A

Question:

«2027–28 mein Ahmed kis class ko Biology padha raha hai?»

Answer:

Class 10-B

Question:

«Ahmed ne 2026–27 mein kya teach kiya tha?»

System historical assignments se answer de sakta hai.

---

15. Ye Historical Data Kyun Important Hai?

Suppose 2026 mein:

Ahmed → Class 9 Biology

Students ke results generate hue.

2027 mein:

Ahmed → Class 10 Biology

Agar hum purani assignment delete kar dein, future mein problem:

«"2026 ke result ka responsible teacher kaun tha?"»

System ko pata nahi chalega.

Isliye:

«Historical academic relationships preserve karni hain.»

---

16. Student Profile

Student profile:

StudentProfile
├── userId
├── fullName
├── dateOfBirth
├── gender
├── bloodGroup
├── profilePicture
├── admissionNo
├── rollNo
├── address
└── emergencyContact

Lekin:

classId
sectionId

ko bhi blindly permanent student profile fields samajhna zaroori nahi.

Student ki academic enrollment bhi session-dependent ho sakti hai.

---

17. Student Enrollment Ko Dynamic Kyun Rakhna Hai?

Example:

2026–27

Ali
 ↓
Class 8
 ↓
Section A

2027–28

Ali
 ↓
Class 9
 ↓
Section B

Ali ka student profile same hai.

Lekin academic enrollment change hui.

Isliye:

«Student Profile ≠ Academic Enrollment»

---

18. Student Enrollment

Conceptually:

StudentEnrollment

student
+
academicSession
+
class
+
section

Example:

Ali
+
2026–27
+
Class 8
+
Section A

Next year:

Ali
+
2027–28
+
Class 9
+
Section B

---

19. Student Enrollment Diagram

                    STUDENT
                       │
                       ↓
               ACADEMIC ENROLLMENT
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       Session        Class       Section

Isse student ka academic history preserve hota hai.

---

20. Parent/Guardian Relationship

Ab aate hain tumhare important point par.

Student ke saath sirf ek parent assume nahi karna.

Example:

Student = Ali

Father = Ahmed
Mother = Sara
Guardian = Uncle Bilal

Ye completely real-world scenario hai.

---

21. Simple "parentId" Problem

Agar hum sirf:

student.parentId

rakhein to problem:

Ali
 ↓
One Parent

System naturally sirf ek parent ko represent karega.

Lekin real world mein:

Ali
 ├── Father
 ├── Mother
 └── Guardian

ho sakte hain.

Isliye architecture ko flexible hona chahiye.

---

22. Parent/Guardian Relationship Ko Separate Relationship Samjho

Hum conceptually ek relationship ko represent karenge:

Parent/Guardian Relationship

Person
   +
Student
   +
Relationship Type
   +
Status
   +
Dates/History

---

23. Relationship Type

Relationship batayegi:

«Ye person student ka kya lagta hai?»

Examples:

FATHER
MOTHER
GUARDIAN
UNCLE
AUNT
GRANDPARENT
OTHER

Actual allowed values final business requirements ke according constants mein define honge.

---

24. Parent Deceased Example

Suppose:

Ali

ke:

Father = Ahmed
Mother = Sara

hain.

Later Ahmed ka inteqal ho jata hai.

Hum Ahmed ka historical relationship delete nahi karenge.

Instead relationship ki status/history preserve hogi.

Conceptually:

Ali
 │
 ├── Ahmed
 │    Relationship = FATHER
 │    Status = DECEASED
 │
 └── Sara
      Relationship = MOTHER
      Status = ACTIVE

---

25. Guardian Add Ho Sakta Hai

Later:

Uncle Bilal

student ka guardian ban jata hai.

Ab:

Ali
 ├── Ahmed
 │   └── Father / Deceased
 │
 ├── Sara
 │   └── Mother / Active
 │
 └── Bilal
     └── Guardian / Active

Ye real-world situation ko accurately represent karta hai.

---

26. Is Architecture Ka Benefit

Ab school easily dekh sakta hai:

«Student ke biological parents kaun hain?»

«Current guardian kaun hai?»

«Kis parent ka status active hai?»

«Kya koi parent deceased hai?»

«Guardian kab add hua?»

«Pehle ka guardian kaun tha?»

Ye information future workflows mein useful ho sakti hai.

---

27. Parent Relationship Diagram

                       STUDENT
                          │
             ┌────────────┼────────────┐
             ↓            ↓            ↓
          Father        Mother       Guardian
             │            │            │
          Ahmed          Sara        Bilal
             │            │            │
         Deceased       Active       Active

---

28. Parent Ke Multiple Children

Reverse relationship bhi important hai.

Example:

Ahmed
 ├── Ali
 ├── Sara
 └── Hamza

Matlab:

«Ek parent ke multiple children ho sakte hain.»

Parent dashboard mein:

My Children

[Ali]
[Sara]
[Hamza]

child switcher possible hoga.

---

29. Parent–Student Relationship Diagram

                 PARENT
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
     Student 1  Student 2  Student 3

Reverse:

                 STUDENT
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
      Father     Mother     Guardian

Isliye relationship potentially many-to-many nature rakh sakti hai.

---

30. Relationship History

Relationship ko delete kar dena har situation mein correct nahi.

Example:

2026
Father Ahmed → Active

Later:

2028
Father Ahmed → Deceased

Relationship ka historical record preserve rahe.

Similarly:

2028
Guardian = Bilal

add ho.

---

31. Relationship Lifecycle

Conceptually:

Created
   ↓
Active
   ↓
Changed / Inactive / Ended
   ↓
Historical Record

Example:

Mother
Active
   ↓
Relationship ended/changed
   ↓
Historical

Exact statuses business requirements ke according define honge.

---

32. Important Distinction: Account Status vs Relationship Status

In dono ko mix nahi karna.

User Account Status

ACTIVE
DEACTIVATED

Ye login/account ke baare mein hai.

Relationship Status

ACTIVE
ENDED
DECEASED

Ye relationship ke baare mein hai.

Example:

Parent Account
= ACTIVE

Lekin:

Parent → Student relationship
= ENDED

Dono simultaneously possible hain.

---

33. Example

Suppose Uncle Bilal ka parent account active hai:

Bilal User
Status = ACTIVE

Lekin Ali ke saath guardian relationship end ho gayi:

Bilal → Ali
Relationship Status = ENDED

Bilal system mein active ho sakta hai, lekin Ali ka data access nahi kar sakta.

Ye distinction authorization ke liye bohat important hai.

---

34. Authorization Parent Relationship Ko Kaise Use Karegi?

Suppose:

Bilal = PARENT

Aur:

Bilal → Ali
Relationship = GUARDIAN
Status = ACTIVE

Bilal Ali ki attendance dekh sakta hai, according to permission.

Lekin:

Bilal → Hamza

relationship nahi.

To:

Bilal → Hamza Attendance

deny.

---

35. Teacher Authorization Bhi Relationship-Based Hogi

Suppose:

Ahmed

teacher hai.

2026–27:

Ahmed
 ↓
Biology
 ↓
Class 9-A

Ahmed ko Class 9-A Biology students ke relevant academic resources access ho sakte hain.

Lekin:

Class 10-B
Physics

automatically accessible nahi.

---

36. 2027 Mein Assignment Change

Next academic session:

Ahmed
 ↓
Biology
 ↓
Class 10-B

Ab authorization automatically new assignment ko consider karegi.

Purani assignment:

Ahmed
 ↓
Biology
 ↓
Class 9-A
 ↓
2026–27

history mein rahegi.

---

37. Dynamic Teacher Diagram

                TEACHER AHMED
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
      2026–27                  2027–28
          │                       │
          ↓                       ↓
     Biology                   Biology
          │                       │
       Class 9                 Class 10
          │                       │
      Section A               Section B

Ye architecture future changes ko naturally handle karta hai.

---

38. Teacher Multiple Subjects Bhi Teach Kar Sakta Hai

Example:

Ahmed
 ├── Biology
 └── Chemistry

Lekin assignments session/class/section ke context mein honi chahiye.

Example:

2026–27

Ahmed
 ├── Biology → Class 9-A
 └── Chemistry → Class 10-B

---

39. Same Teacher, Different Classes

                    AHMED
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
       Class 8      Class 9     Class 10
          │           │           │
       Biology     Biology     Biology

Ye bhi possible ho sakta hai according to institution's assignment rules.

---

40. Same Subject, Different Teachers

                  BIOLOGY
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Teacher A  Teacher B  Teacher C
          │          │          │
       Class 8     Class 9    Class 10

Isliye "subject.teacherId" jaisa simplistic design bhi future mein restrictive ho sakta hai.

Teaching assignment ko independent relationship ke taur par sochna better hai.

---

41. Dynamic Relationship Architecture

Ab overall structure:

USER
 │
 ├── PROFILE
 │
 └── RELATIONSHIPS
       │
       ├── Parent/Guardian Relationship
       │
       ├── Student Enrollment
       │
       └── Teaching Assignment

---

42. Core Dynamic Relationships

EduOS Phase 2 mein major relationships:

1. Parent ↔️ Student

Parent/Guardian Relationship

2. Student ↔️ Academic Session

Student Enrollment

3. Teacher ↔️ Subject ↔️ Class ↔️ Section ↔️ Session

Teaching Assignment

Ye teen relationships future system ke bohat important foundations hain.

---

43. Complete Relationship Architecture

                         EDUOS
                           │
                         USERS
                           │
          ┌────────────────┼─────────────────┐
          ↓                ↓                 ↓
       STUDENT           TEACHER           PARENT
          │                │                 │
          │                │                 │
          ↓                ↓                 ↓
     ENROLLMENT      TEACHING ASSIGNMENT   CHILD LINKS
          │                │                 │
          ↓                ↓                 ↓
       Session        Session + Class      Students
       Class          + Section
       Section        + Subject

---

44. Complete Student Picture

                         STUDENT
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
          Enrollment     Parent Links   Resources
              │             │             │
              ↓             ↓             ↓
       Session/Class/    Father/Mother   Attendance
         Section         Guardian        Assignment
                                           Exams
                                           Results
                                           Fees

---

45. Complete Teacher Picture

                         TEACHER
                            │
                     Teacher Profile
                            │
                            ↓
                 Teaching Assignments
                            │
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
       Session            Subject           Class
                                                │
                                             Section
                                                │
                                             Students

---

46. Complete Parent Picture

                         PARENT
                           │
                     Parent Profile
                           │
                           ↓
                  Parent Relationships
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
          Child 1       Child 2       Child 3
             │             │             │
             ↓             ↓             ↓
        Attendance     Results        Fees

---

47. Why This Architecture Is Better

Because real-world changes delete nahi hote.

Instead:

Old Relationship
       ↓
Historical Record

New Relationship
       ↓
Current Record

Example:

Father → Deceased
Guardian → Active

and:

2026–27
Teacher → Class 9

2027–28
Teacher → Class 10

Dono histories preserved.

---

48. Scholarship/Reports Mein Benefit

Ye architecture future reporting ke liye bhi useful hai.

Example:

«"Current guardian kaun hai?"»

System current active relationship dekhega.

«"Student ke parents/guardians ka historical record?"»

System relationship history dekhega.

«"2026–27 mein student kis class mein tha?"»

Enrollment history dekhega.

«"2026–27 mein Biology ka teacher kaun tha?"»

Teaching assignment history dekhega.

«"2027–28 mein Biology ka teacher kaun hai?"»

Current session ki assignment dekhega.

---

49. Important: Delete vs End Relationship

Senior architecture mein har relationship ko physically delete karna correct nahi.

Example:

Ahmed → Father → Ali

Agar Ahmed deceased ho gaya:

❌ Relationship ko completely delete karna

Better:

Ahmed → Father → Ali
Status = DECEASED

Agar guardian relationship end hui:

❌ Historical relationship delete

Better:

Status = ENDED

Isse audit/history preserve hoti hai.

---

50. Current vs Historical Data

System ko dono samajhne chahiye:

CURRENT

aur:

HISTORICAL

Example:

Current Guardian
= Uncle Bilal

Lekin:

Historical Parent
= Ahmed
Status = Deceased

Similarly:

Current Teacher Assignment
= Class 10-B

Historical Assignment
= Class 9-A

---

51. Phase 2 Ka Final Mental Model

Ab Phase 2 ko is tarah yaad karo:

                   USER
                     │
                     ↓
                    ROLE
                     │
                     ↓
                  PROFILE
                     │
                     ↓
              RELATIONSHIPS
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   Parent Links   Enrollment   Teaching
                              Assignments
        │            │            │
        ↓            ↓            ↓
    Students     Academic      Teacher +
                 Session       Subject +
                 Class +       Class +
                 Section       Section +
                               Session
                     │
                     ↓
                  RESOURCES
                     │
                     ↓
                AUTHORIZATION
                     │
                ┌────┴────┐
                ↓         ↓
              ALLOW      DENY

---

52. Phase 2 Ke Golden Rules

Rule 1

"User Account" aur "Profile" separate concepts hain.

Rule 2

Role ko profile ke andar duplicate nahi karna unnecessarily.

Rule 3

Teacher ki permanent profile mein current class ko hard-code nahi karna.

Rule 4

Student ki permanent identity aur academic enrollment separate concepts hain.

Rule 5

Parent ko sirf ek "parentId" tak unnecessarily restrict nahi karna.

Rule 6

Parent/guardian relationship ka type maintain karna.

Rule 7

Relationship ka status maintain karna.

Rule 8

Important relationships ki history preserve karna.

Rule 9

Teacher assignments academic session ke context mein maintain karna.

Rule 10

Student enrollment academic session ke context mein maintain karna