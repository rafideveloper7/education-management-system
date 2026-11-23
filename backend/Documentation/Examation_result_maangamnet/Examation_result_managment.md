EduOS — Group 13
Examination & Results Management System
Imtehanaat aur Results Management System
Document Type: Software Architecture & Technical Specification
Project: EduOS — Education Management System
Module: Examination, Marks, Grading aur Results
Architecture: Modular Monolith
Backend: Node.js + Express.js
Database: MongoDB Atlas + Mongoose
API Style: REST API
API Version: /api/v1
Authentication: EduOS ka existing Authentication System
Authorization: Role-Based Permissions + Resource-Level Authorization
Document Status: Functional Design aur Technical Specification final
Implementation Status: Core backend workflow implemented hai. Automated unit/HTTP checks pass hue hain; complete database-backed API verification abhi baqi hai. Verification detail Section 24 mein hai.
1. Module ka Maqsad aur Business Objective
1.1 Problem Statement — Masla Kya Hai?
Educational institutions saal bhar examinations conduct karti hain. Unhein ek aise reliable system ki zaroorat hoti hai jahan examinations schedule kiye ja sakein, students ke marks record hon, results calculate hon, grading policies apply hon, results verify hon aur authorized users ke liye publish kiye ja sakein.
Ek basic examination module mein teacher database mein marks enter kar sakta hai. Lekin production-oriented Education Management System ko is se zyada cheezein handle karni hoti hain.
Misal ke taur par:
- Examination mein kaun se students eligible hain?
- Kis teacher ko marks enter karne ki permission hai?
- Examination schedule kaise create aur validate hoga?
- Obtained marks ko maximum marks ke against kaise validate kiya jayega?
- Grades kaise calculate honge?
- Overall result kaise calculate hoga?
- Kya result publish hone ke baad teacher marks change kar sakta hai?
- Result ko final aur publish karne ka authority kis ke paas hoga?
- Agar published result mein ghalti mil jaye to kya hoga?
- Kya student aur parent doosre students ke results access kar sakte hain?
- Historical examination records kaise preserve honge?
Agar in rules ko clearly define na kiya jaye, to application ke mukhtalif parts results ko mukhtalif tareeqon se calculate kar sakte hain. Is se unauthorized changes aur academic records mein inconsistency ka risk bhi hota hai.
1.2 Objective — Hum Kya Banana Chahte Hain?
Group 13 ka maqsad ek centralized, secure aur maintainable examination aur results workflow banana hai.
Is module mein ye features honge:
1. Examination creation aur management.
2. Examination scheduling.
3. Academic session, class, section aur subject validation.
4. Student examination eligibility.
5. Student examination records.
6. Marks entry aur validation.
7. Grade calculation.
8. Subject-wise aur overall results.
9. Result verification aur finalization.
10. Controlled result publication.
11. Student aur parent ke liye result access.
12. Historical result preservation.
13. Sensitive operations ka audit record.
14. Database integrity aur performance.
15. Automated testing aur regression protection.
Business objective: Har published result ko ek specific examination, eligible student, subject, marks record aur grading policy ke saath trace kiya ja sake.
Yani baad mein agar koi pooche ke student ka result kis basis par calculate hua tha, to system ke paas uska clear record hona chahiye.
2. Scope aur Boundaries
2.1 Group 13 Mein Kya Shamil Hai?
Is group mein ye features shamil hain:
- Examination definitions.
- Examination schedules.
- Subject-wise examination arrangements.
- Student examination records.
- Zaroorat ke mutabiq examination attendance records.
- Marks entry.
- Marks validation.
- Result calculation.
- Grade-scale configuration aur application.
- Subject-wise results.
- Overall examination results.
- Draft, finalized aur published result states.
- Controlled corrections.
- Student aur parent result access.
- Teacher authorization.
- Audit logging.
- Pagination, indexing aur query optimization.
- Error handling aur automated testing.
2.2 Group 13 Mein Kya Shamil Nahi Hai?
Neeche diye gaye features is group ka hissa nahi hain, jab tak unhein alag se approve na kiya jaye.
Feature	Group
Daily classroom attendance	Group 11
Assignment management	Group 12
Fee collection	Group 14
Admissions aur applications	Separate admissions module
Notifications aur email automation	Group 17
Redis	Group 18, sirf zaroorat par
Background job infrastructure	Group 19, sirf zaroorat par
Event-driven automation	Group 20
WebSockets aur real-time communication	Group 21
AI-based grading	Future feature
AI-based cheating detection	Future feature
AI-based performance prediction	Future feature
RAG-based educational assistance	Is group ka hissa nahi


Important: Examination ke waqt student ki attendance, daily classroom attendance se alag concept hai.
Agar examination attendance implement ki jati hai, to usay Group 11 ke daily attendance records ke saath confuse nahi karna chahiye.
3. Architecture aur Technology Decisions
3.1 Existing EduOS Backend Architecture
Group 13 ko EduOS ki existing backend architecture follow karni hogi.
                    Client
                      |
                      v
                     Route
                      |
                      v
             Authentication
                Middleware
                      |
                      v
             Permission Checks
                      |
                      v
          Resource-Level Authorization
                      |
                      v
                 Validation
                      |
                      v
                 Controller
                      |
                      v
                  Service
                      |
                      v
             Policy / Repository
                      |
                      v
                    Model
                      |
                      v
                MongoDB Atlas

Actual component names aur middleware order existing repository ke conventions ke mutabiq honge.
Har Component Ki Responsibility
Route
- API endpoint define karta hai.
- Required middleware apply karta hai.
Authentication Middleware
- Verify karta hai ke request bhejne wala user kaun hai.
Permission Middleware
- Check karta hai ke user ke paas required permission hai ya nahi.
Resource-Level Authorization
- Check karta hai ke user ko particular examination, class, section, subject ya student ke record tak access milna chahiye ya nahi.
Validation
- Request data aur business rules validate karta hai.
Controller
- HTTP request receive karta hai.
- Required service call karta hai.
- Appropriate HTTP response return karta hai.
Service
- Examination, marks, grading aur publication ki business logic implement karta hai.
Policy/Repository
- Existing EduOS conventions ke mutabiq authorization policies aur data access handle karta hai.
Model
- Database structure, persistence rules aur applicable database constraints define karta hai.
3.2 Architectural Decision — Modular Monolith
Examination system existing Express.js backend ka hi hissa rahega.
Sirf code ko organize karne ke liye examination system ko separate microservices mein divide nahi kiya jayega.
Modular monolith is liye munasib hai kyun ke examination module ka existing EduOS ke in entities par strong dependency hai:
- Users aur role profiles.
- Academic sessions.
- Classes aur sections.
- Subjects.
- Teacher assignments.
- Student enrollments.
Existing application ke andar rehne se authorization, data access aur deployment comparatively simple rahenge.
Lekin module ke andar examination management, marks entry, result calculation aur result publication ki responsibilities clear honi chahiye.
Decision: Existing architecture ke andar ek well-organized Examination & Results module implement kiya jayega.
Technology Decision Table
Technology ya Pattern	Faisla	Wajah
Node.js + Express.js	Use hoga	Existing EduOS backend
MongoDB Atlas	Use hoga	Existing database
Mongoose	Use hoga	Existing MongoDB modeling approach
REST API	Use hogi	Existing API architecture ke saath consistency
Modular monolith	Use hoga	Current project ke liye munasib
MongoDB transactions	Zaroorat ke mutabiq	Jab multiple documents ki atomic consistency required ho
Background job queue	Initially required nahi	Bina zaroorat extra infrastructure introduce nahi karna
Redis	Required nahi	Abhi koi confirmed requirement nahi
Microservices	Use nahi honge	Unnecessary operational complexity
RAG	Use nahi hoga	Approved scope se bahar
AI grading	Use nahi hogi	Future feature


Trade-off: Modular monolith develop aur deploy karna distributed system ke muqable mein simple hota hai. Lekin module ki boundaries clear honi chahiye taake future mein examination-specific logic poori application mein phail na jaye.
4. System Users aur Unki Responsibilities
System mein user ka role, assigned permissions aur kisi specific academic resource tak access ko alag samajhna zaroori hai.
Sirf role ka naam automatically unlimited access nahi deta.
4.1 Administrator
Administrator institution ki permission policy ke mutabiq examination-management operations perform kar sakta hai.
Possible responsibilities:
- Examinations create karna.
- Examination configuration manage karna.
- Authorized schedules manage karna.
- Grading policies manage karna, agar permission ho.
- Examination responsibilities manage karna.
- Result-publication workflow authorize karna.
- Controlled corrections handle karna.
- Audit records review karna.
Har administrator ko automatically har permission dena zaroori nahi. Existing EduOS authorization model final authority rahega.
4.2 Teacher
Authorized teacher ye operations kar sakta hai:
- Apne academic assignments se related examinations dekhna.
- Apni classes aur subjects ke examination schedules dekhna.
- Authorized students ke marks enter karna.
- Result editable hone tak permitted marks update karna.
- Marks verification ke liye submit karna.
- Apne authorized examination results dekhna.
Teacher sirf examination ID jaan kar kisi unrelated class ya subject ke marks enter nahi kar sakta.
4.3 Student
Authenticated student ye operations kar sakta hai:
- Apne applicable examination schedules dekhna.
- Permission ke mutabiq apne examination records dekhna.
- Apne published results dekhna.
- Published result mein available subject-wise marks aur grades dekhna.
Student ye kaam nahi kar sakta:
- Marks enter ya modify karna.
- Results publish karna.
- Kisi doosre student ke private results access karna.
- Grading policies modify karna.
- Examination schedules change karna.
4.4 Parent
Parent apne linked child ki permitted examination information aur published results dekh sakta hai.
Is ke liye ye checks zaroori hain:
1. Parent ka authenticated account valid ho.
2. Parent–student relationship valid ho.
3. Required permission available ho.
4. Parent ko particular student aur result tak access ho.
Agar guardian relationship end ho chuka hai, to sirf purana relationship record maujood hone ki wajah se access nahi milna chahiye.
4.5 Public User
Public users ko private student results access nahi honge.
Public-facing examination information existing EduOS public-access policy ke mutabiq hogi aur us mein student marks ya private academic records expose nahi hone chahiye.
5. Core Domain Model — Database Mein Kaun Se Concepts Honge?
Examination system mein examination, schedule, participating students, marks aur published results alag concepts hain.
Ye aapas mein related hain, lekin ek doosre ka replacement nahi hain.
5.1 Examination
Examination ek academic assessment event ko represent karta hai.
Examples:
- Midterm Examination.
- Final Examination.
- Monthly Examination.
- Annual Examination.
Ye sirf examples hain. Inhein hardcoded list banana zaroori nahi.
Conceptual Fields
Field	Maqsad
_id	Examination ki unique ID
name	Examination ka naam
examType	Configured examination category
academicSessionId	Related academic session
startDate	Examination period ki shuruaat
endDate	Examination period ka aakhri waqt
status	Examination lifecycle status
createdBy	Examination create karne wale user ki ID
createdAt	Creation timestamp
updatedAt	Last update timestamp


Existing academic models aur institutional requirements inspect karne ke baad additional fields ki zaroorat ho sakti hai.
Examination ki overall date range subject-specific schedules ka replacement nahi hai.
5.2 Examination Schedule
Examination schedule define karta hai ke kisi specific subject ka examination kis waqt aur kis academic group ke liye conduct hoga.
Conceptual Fields
Field	Maqsad
_id	Schedule ki unique ID
examId	Parent examination ki ID
academicSessionId	Academic session
classId	Class
sectionId	Section
subjectId	Subject
teacherId	Assigned ya responsible teacher, agar applicable ho
startAt	Examination start timestamp
endAt	Examination end timestamp
room	Examination room, agar required ho
createdAt	Creation timestamp
updatedAt	Last update timestamp


Final fields actual institutional requirements aur existing EduOS conventions ke mutabiq honge.
Schedule Validation
Backend ko verify karna hoga ke:
- Examination exist karta hai.
- Academic session valid hai.
- Class aur section correct academic context se belong karte hain.
- Subject us class ya section ke liye valid hai.
- Responsible teacher ke paas required assignment ya permission hai.
- End time, start time ke baad hai.
- Schedule institution ke applicable conflict rules violate nahi karta.
Schedule conflicts actual policy ke mutabiq check honge.
Misal ke taur par, ek hi section ke do examinations ek waqt par rakhna prohibited ho sakta hai. Room aur teacher conflicts ko institution ke scheduling rules ke mutabiq handle karna hoga.
5.3 Student Examination Record
Student examination record ek particular examination mein student ki eligibility ya participation ko represent karta hai.
Ye student ke permanent profile se alag record hai.
Conceptual information mein ye shamil ho sakta hai:
- Examination ID.
- Examination schedule ID.
- Student profile ID.
- Enrollment ID.
- Roll number ya examination identifier, agar required ho.
- Seat assignment, agar required ho.
- Examination attendance status, agar implement kiya jaye.
- Record timestamps.
System ko existing identity architecture ke mutabiq student profile aur enrollment relationships use karni hongi.
Authenticated account ID ko automatically student profile ID nahi samajhna chahiye.
Ye Record Kyun Zaroori Hai?
Examination schedule batata hai ke kisi class ya section ka examination kab hoga.
Student examination record batata hai ke particular student ka us examination ke saath kya relationship hai.
In concepts ko separate rakhne se eligibility, attendance aur individual examination records ko manage karna asaan hota hai.
5.4 Marks Record
Marks record kisi student ke particular subject examination mein hasil kiye gaye marks store karta hai.
Conceptual Fields
Field	Maqsad
_id	Marks record ki ID
examId	Examination ID
examScheduleId	Related subject schedule
studentId	Student profile ID
enrollmentId	Applicable enrollment
obtainedMarks	Student ke hasil kiye gaye marks
maximumMarks	Maximum possible marks
status	Marks-entry workflow status
enteredBy	Marks enter karne wale user ki ID
updatedBy	Marks update karne wale user ki ID
createdAt	Creation timestamp
updatedAt	Last update timestamp


Final model existing schema ko dekh kar decide hoga.
Marks record aur subject-result record ko combine ya separate kiya ja sakta hai, agar existing design aur requirements is ki ijazat dein.
Lekin entered marks aur published result ke darmiyan clear distinction rehna zaroori hai.
5.5 Result
Result student ke calculated academic outcome ko represent karta hai.
Is mein ye information ho sakti hai:
- Student ID.
- Examination ID.
- Academic session.
- Subject-wise marks.
- Subject-wise percentage aur grade.
- Total obtained marks.
- Total maximum marks.
- Overall percentage.
- Overall grade, agar grading policy support karti ho.
- Result status.
- Publication metadata.
Subject-level results aur overall examination results validated marks aur applicable grading rules se consistently calculate hone chahiye.
Ek hi academic value ki contradictory copies store nahi karni chahiye, jab tak unhein synchronize karne ka clear mechanism na ho.
6. Examination Lifecycle — Examination Kin Stages Se Guzrega?
Examination scheduling aur result publication ko alag concepts samajhna zaroori hai.
Proposed examination lifecycle:
DRAFT
  |
  | Schedule aur confirm
  v
SCHEDULED
  |
  | Examination shuru
  v
IN_PROGRESS
  |
  | Examination period complete
  v
COMPLETED
  |
  | Marks entry aur verification
  v
RESULTS_READY

Actual status names existing EduOS conventions ke mutabiq honge.
Har possible business event ke liye alag status banana zaroori nahi, agar existing model required information already represent karta ho.
6.1 DRAFT
- Examination configure ho raha hota hai.
- Authorized users permitted details update kar sakte hain.
- Examination abhi confirmed nahi hota.
6.2 SCHEDULED
- Examination schedule confirm ho chuka hota hai.
- Relevant authorized users schedule access kar sakte hain.
- Schedule changes permission aur conflict rules ke mutabiq honge.
6.3 IN_PROGRESS
- Examination period shuru ho chuka hota hai.
- Schedule changes institutional policy ke mutabiq honge.
- Marks entry sirf applicable authorized workflow mein allow hogi.
6.4 COMPLETED
- Examination conduct ho chuka hota hai.
- Marks entry aur verification institutional policy ke mutabiq proceed kar sakte hain.
Examination complete hone ka matlab ye nahi ke tamam students ke marks enter ho chuke hain.
6.5 RESULTS_READY
- Required marks enter ho chuke hote hain.
- Required validations pass ho chuki hoti hain.
- Result set verification aur finalization ke liye ready hota hai.
Important: Examination lifecycle aur result lifecycle logically separate rahenge.
Examination complete ho sakta hai, lekin us ke results abhi incomplete ho sakte hain.
7. Marks Entry aur Validation
7.1 Marks Entry
Authorized teacher un students ke marks enter kar sakta hai jinhein manage karne ki usay permission hai.
Marks save karne se pehle backend ko examination context verify karna hoga.
Frontend ko ye decide karne ka authority nahi di jayegi ke teacher kis student ke marks enter kar sakta hai.
7.2 Marks Validation Rules
Backend ko ye validations perform karni hongi:
1. Examination exist karta ho.
2. Related subject schedule exist karta ho.
3. Student examination ke liye eligible ho.
4. Student enrollment academic context se match karta ho.
5. User ke paas required permission ho.
6. Obtained marks valid numeric value hon.
7. Obtained marks negative na hon.
8. Maximum marks valid aur positive hon.
9. Obtained marks maximum marks se zyada na hon.
10. Result aisi state mein ho jahan marks update karne ki permission ho.
Example 1 — Valid Marks
Maximum Marks: 100
Obtained Marks: 85

Result: Valid

Example 2 — Maximum Se Zyada Marks
Maximum Marks: 100
Obtained Marks: 115

Result: Rejected

Reason:
Obtained marks maximum marks se zyada hain.

Example 3 — Negative Marks
Maximum Marks: 100
Obtained Marks: -5

Result: Rejected

Reason:
Obtained marks negative nahi ho sakte.

Institution ki marks policy ke mutabiq decimal precision bhi validate karni hogi.
Misal ke taur par, agar sirf whole marks allowed hain to fractional values reject hongi.
Agar decimal marks allowed hain to maximum decimal precision define karni hogi.
7.3 Missing Marks aur Absent Students
Marks record missing hone ka matlab automatically zero marks nahi hai.
Ye mukhtalif situations hain:
- Marks abhi enter nahi hue.
- Student examination mein absent tha.
- Student present tha lekin marks pending hain.
- Student ka valid marks record available hai.
- Student ka koi approved exceptional examination status hai.
Institution ki policy define karegi ke examination participation ke kaun se statuses allowed hain aur unka result calculation par kya effect hoga.
Backend ko absent student ke liye khud se marks create nahi karne chahiye.
Isi tarah incomplete marks ko silently zero mein convert nahi karna chahiye.
7.4 Marks Modification
Jab relevant workflow editable ho, tab authorized users marks modify kar sakte hain.
Agar result aisi state mein hai jahan editing prohibited hai, to backend ko modification reject karni hogi.
Finalization ya publication ke baad corrections ke liye is document mein define kiya gaya controlled correction workflow use hoga.
8. Grade Scale aur Result Calculation
8.1 Grade Scale
System ko explicit grading policy support karni hogi.
Grading scale mein ye information ho sakti hai:
- Grade ka naam ya label.
- Minimum percentage.
- Maximum percentage.
- Applicable academic context.
- Effective period ya version, agar required ho.
- Grade passing hai ya nahi, agar institution ki policy define karti ho.
Ye conceptual properties hain. Final configuration model actual EduOS requirements ke mutabiq banega.
Important Rule
Grade scale ko result-calculation service ke andar hardcode nahi karna.
Mukhtalif institutions aur academic programs ki grading policies alag ho sakti hain.
Calculation service ko applicable configured grading policy use karni chahiye.
8.2 Example Grading Scale
Neeche diye gaye grades sirf example hain. Ye EduOS ki approved grading policy nahi hai.
Percentage Range	Example Grade
90–100%	A+
80–89.99%	A
70–79.99%	B
60–69.99%	C
50–59.99%	D
50% se kam	F


Actual percentage ranges, grade labels aur passing criteria institution ki policy ke mutabiq finalize honge.
System ko configured ranges validate karni hongi taake unintended gaps ya overlapping ranges na hon.
8.3 Subject Percentage
Valid marks record ke liye formula:
\[
\text{Subject Percentage}
=
\frac{\text{Obtained Marks}}{\text{Maximum Marks}}
\times 100
\]
Example:
Obtained Marks: 75
Maximum Marks: 100

Percentage: 75%

Calculation se pehle backend ko verify karna hoga ke maximum marks valid hain aur missing nahi hain.
8.4 Overall Percentage
Agar institution total marks ki basis par overall percentage calculate karti hai, to formula ye hoga:
\[
\text{Overall Percentage}
=
\frac{\sum \text{Obtained Marks}}
{\sum \text{Maximum Marks}}
\times 100
\]
Example:
Subject	Obtained Marks	Maximum Marks
Mathematics	80	100
English	70	100
Science	90	100
Total	240	300


Calculation:
\[
\frac{240}{300}\times100=80\%
\]
Is example mein overall percentage 80% hai.
Important Distinction
Total marks ki basis par overall percentage aur subject percentages ka simple average hamesha same nahi hota.
Agar subjects ke maximum marks different hon, to dono methods different results de sakte hain.
System ko institution ki approved calculation policy follow karni hogi.
8.5 Overall Grade
Agar institution ki grading policy allow karti hai, to overall percentage ki basis par overall grade calculate kiya ja sakta hai.
Lekin system ko ye assume nahi karna chahiye ke har institution mein overall grade zaroor hota hai.
Mukhtalif institutions ko ye chahiye ho sakta hai:
- Sirf subject-wise grades.
- Overall grade.
- GPA ya CGPA.
- Pass/fail status.
- In cheezon ka combination.
GPA/CGPA calculation percentage grading se automatically imply nahi hoti.
Agar GPA/CGPA required ho, to uska formula aur credit-weighting policy separately define karni hogi.
8.6 Calculation Authority
Backend official taur par in values ka source of truth hoga:
- Subject percentages.
- Grades.
- Total obtained marks.
- Total maximum marks.
- Overall percentage.
- Overall grade.
- Pass/fail status, agar applicable ho.
Frontend calculated results display kar sakta hai, lekin official academic outcome calculate karne ke liye us par trust nahi kiya jayega.
9. Result Lifecycle — Draft, Finalized aur Published
Result processing mein ordinary editable records ke muqable mein zyada strict controls zaroori hain.
Proposed result lifecycle:
DRAFT
  |
  | Validate aur finalize
  v
FINALIZED
  |
  | Authorized publication
  v
PUBLISHED

9.1 DRAFT
- Marks enter ya correct kiye ja rahe hote hain.
- Authorized staff result preview kar sakta hai.
- Result abhi official published result nahi hota.
- Students aur parents ko public-facing APIs se unpublished result nahi milna chahiye.
9.2 FINALIZED
- Required marks aur calculations validate ho chuke hote hain.
- Result required finalization workflow pass kar chuka hota hai.
- Ordinary marks editing restrict ho jati hai.
- Configured permissions ke mutabiq result publication proceed kar sakti hai.
Finalization aur publication do alag operations hain.
Finalization ka matlab hai result publication ke liye approve ho chuka hai.
Publication ka matlab hai official result authorized recipients ke liye available ho gaya hai.
9.3 PUBLISHED
- Result officially authorized students aur parents ke liye available hota hai.
- Published result approved marks aur grading policy ke mutabiq consistent hona chahiye.
- Ordinary marks editing block hoti hai.
- Corrections ke liye controlled correction workflow use hota hai.
9.4 Publication Se Pehle Validation
Result finalize ya publish karne se pehle backend ko verify karna hoga ke:
- Examination valid state mein hai.
- Required subject schedules exist karte hain.
- Eligible students ke appropriate result records available hain.
- Required marks enter ho chuke hain.
- Invalid marks maujood nahi hain.
- Missing marks policy ke mutabiq handle kiye gaye hain.
- Grade calculation successful hai.
- Required result validations pass hain.
- User ke paas required permission hai.
Institution ko define karna hoga ke publication se pehle har eligible student ke marks complete hona zaroori hai ya partial publication allow hai.
Recommended initial policy: Jab tak required student marks incomplete ya unresolved hon, examination results publish na kiye jayein.
Is se incomplete academic outcomes official result ke taur par expose nahi honge.
Agar future mein partial publication required ho, to usay explicit policy ke taur par implement karna hoga, accidental behavior ke taur par nahi.
10. Published Results Ki Controlled Correction
10.1 Published Results Ko Protect Karna Kyun Zaroori Hai?
Published marks official academic records hote hain.
Agar teacher bina authorization ya record ke published result directly change kar sake, to system reliably explain nahi kar sakega ke student ka grade kyun change hua.
Is liye ordinary marks-entry workflow se published results edit nahi hone chahiye.
10.2 Correction Workflow
Controlled correction process kuch is tarah hoga:
Published Result
       |
       v
Authorized Correction Request
       |
       v
Permission + Reason Validation
       |
       v
Correction Approval, Agar Required Ho
       |
       v
Marks Update aur Recalculation
       |
       v
Audit Information Record
       |
       v
Dobara Finalize aur Republish

Exact approval requirements institution ki policy ke mutabiq hongi.
Correction ke waqt official record ko silently overwrite nahi karna chahiye.
10.3 Correction Audit
System ko correction samajhne ke liye relevant information record karni chahiye, jaise:
- Affected examination aur student.
- Affected subject ya marks record.
- Purani value.
- New value.
- Change karne wale user ki ID.
- Timestamp.
- Correction ki wajah.
- Approval details, agar required hon.
- Result recalculation ka outcome.
- Republish information, agar applicable ho.
Audit records ko ordinary unauthorized modification se protect karna zaroori hai.
Purani value audit record mein preserve ki ja sakti hai. Is ka matlab ye nahi ke system ko har purani uploaded file bhi preserve karni hogi. Dono alag data-retention concerns hain.
10.4 Republished Results
Agar published result correct kiya jata hai, to backend ko affected result values dobara calculate karni hongi.
Us ke baad required finalization aur publication workflow apply hoga.
System ko aisi situation allow nahi karni chahiye jahan subject marks ek value show kar rahe hon lekin overall total ya grade kisi doosri value par based ho.
Agar institution ko affected students ya parents ko notify karna ho, to notification existing communication workflow ke mutabiq Group 17 ke saath integrate ki ja sakti hai.
11. Examination aur Result Permissions
Neeche diye gaye permission identifiers proposed examples hain.
Inhein existing EduOS permissions.constants.js aur permission-management architecture ke saath align karna zaroori hai.
Permission	Maqsad
EXAM_VIEW	Authorized examinations dekhna
EXAM_CREATE	Examination create karna
EXAM_UPDATE	Permitted examination details update karna
EXAM_SCHEDULE_MANAGE	Examination schedules manage karna
EXAM_CANDIDATE_VIEW	Eligible student examination records dekhna
EXAM_MARKS_VIEW	Authorized marks dekhna
EXAM_MARKS_ENTER	Marks enter karna
EXAM_MARKS_UPDATE	Editing allowed hone par marks update karna
EXAM_RESULTS_CALCULATE	Results calculate karna
EXAM_RESULTS_FINALIZE	Results finalize karna
EXAM_RESULTS_PUBLISH	Finalized results publish karna
EXAM_RESULTS_CORRECT	Authorized result correction request ya operation
EXAM_GRADE_SCALE_MANAGE	Grading configuration manage karna


Ye permission concepts hain. Inka matlab ye nahi ke existing permissions ko duplicate karke naya permission system bana diya jaye.
11.1 Resource-Level Authorization
Teacher ke paas marks-entry permission hone ka matlab ye nahi ke woh har student ke marks enter kar sakta hai.
Backend ko ye bhi verify karna hoga:
- Relevant examination.
- Relevant subject schedule.
- Class aur section.
- Teacher ka assignment relationship.
- Student ka enrollment.
- Current result lifecycle state.
11.2 Student Result Authorization
Student result endpoints ko existing identity architecture ke zariye authenticated student ka apna profile identify karna hoga.
Client-supplied studentId ko ownership ka proof nahi samajhna chahiye.
11.3 Parent Result Authorization
Backend ko private result return karne se pehle parent ka student ke saath current authorized relationship verify karna hoga.
Valid parent account hone ka matlab ye nahi ke usay har student ke results access karne ki permission hai.
11.4 Administrator aur Principal Authorization
Administrators aur principals explicitly configured institutional permissions follow karenge.
Sirf ADMIN ya PRINCIPAL title ki wajah se resource-level checks, result publication restrictions ya audit requirements bypass nahi hone chahiye.
12. REST API Design
Neeche Group 13 ke liye proposed API endpoints diye gaye hain.
Implementation se pehle existing EduOS routes aur conventions inspect karna zaroori hai.
Existing patterns reuse karein aur conflicting routes ya duplicate functionality create na karein.
12.1 Examination Management APIs
Method	Endpoint	Maqsad
POST	/api/v1/admin/exams	Examination create karna
GET	/api/v1/admin/exams	Authorized examinations ki list
GET	/api/v1/admin/exams/:id	Ek examination retrieve karna
PATCH	/api/v1/admin/exams/:id	Permitted examination details update karna
POST	/api/v1/admin/exams/:id/schedules	Subject examination schedule create karna
GET	/api/v1/admin/exams/:id/schedules	Examination schedules retrieve karna
PATCH	/api/v1/admin/exam-schedules/:id	Authorized schedule update karna


Final route prefix existing EduOS routing conventions ke mutabiq hoga.
/admin prefix sirf example hai. Is ka matlab ye nahi ke sirf administrator hi har operation perform kar sakta hai.
12.2 Teacher APIs
Method	Endpoint	Maqsad
GET	/api/v1/teacher/exams	Relevant examinations ki list
GET	/api/v1/teacher/exams/:id/schedules	Authorized schedules dekhna
GET	/api/v1/teacher/exam-schedules/:id/students	Eligible students retrieve karna
GET	/api/v1/teacher/exam-schedules/:id/marks	Authorized marks retrieve karna
PUT	/api/v1/teacher/exam-schedules/:id/marks	Authorized marks enter ya update karna
GET	/api/v1/teacher/exams/:id/results	Authorized examination results retrieve karna


Agar existing EduOS API individual marks updates ya batch updates ke liye koi doosra pattern use karti hai, to wohi pattern follow karein, magar business rules same rahenge.
12.3 Result Management APIs
Method	Endpoint	Maqsad
POST	/api/v1/exams/:id/results/calculate	Results calculate karna
POST	/api/v1/exams/:id/results/finalize	Results finalize karna
POST	/api/v1/exams/:id/results/publish	Finalized results publish karna
GET	/api/v1/exams/:id/results	Authorized results retrieve karna
GET	/api/v1/results/:id	Ek authorized result retrieve karna
POST	/api/v1/results/:id/correction-requests	Zaroorat ke mutabiq correction request submit karna


Ye conceptual routes hain.
Har operation par correct permissions aur resource-level checks apply honge.
Result calculation endpoint ko results publish ya modify karne ka unrestricted tareeqa nahi banna chahiye.
12.4 Student APIs
Method	Endpoint	Maqsad
GET	/api/v1/student/exams	Applicable examination schedules dekhna
GET	/api/v1/student/results	Apne published results dekhna
GET	/api/v1/student/results/:id	Apna authorized result dekhna


Student-facing endpoints ko draft ya unpublished results return nahi karne chahiye.
12.5 Parent APIs
Method	Endpoint	Maqsad
GET	/api/v1/parent/children/:studentId/results	Authorized linked child ke published results
GET	/api/v1/parent/children/:studentId/exams	Linked child ki permitted examination information


Backend ko data return karne se pehle parent-child relationship verify karna hoga.
URL mein child ID hone ka matlab ye nahi ke requester us child ko access karne ka authorized user hai.
13. API Validation aur Error Handling
Group 13 ko existing EduOS validation aur centralized error-handling conventions follow karni hongi.
13.1 Validation Requirements
Backend ko ye cheezein validate karni hongi:
- Examination name aur type.
- Academic session.
- Class, section aur subject relationships.
- Examination dates.
- Schedule start aur end times.
- Student eligibility.
- Teacher assignment.
- Obtained marks.
- Maximum marks.
- Decimal precision.
- Grading policy.
- Result lifecycle transitions.
- Publication permissions.
- Correction permissions.
- Pagination aur sorting parameters.
Client-provided status values server-controlled workflow ko bypass nahi kar sakti.
Misal ke taur par, request body mein:
{
  "status": "PUBLISHED"
}

bhejne se user result ko directly published state mein nahi le ja sakega.
Result publish karne ke liye authorized publication workflow follow karna hoga.
13.2 Suggested HTTP Status Codes
Situation	HTTP Status
Successful retrieval	200 OK
Successful creation	201 Created
Successful update	200 OK ya 204 No Content
Invalid request data	400 Bad Request
Missing ya invalid authentication	401 Unauthorized
Insufficient permission	403 Forbidden
Resource not found	404 Not Found
Duplicate ya conflicting operation	409 Conflict
Unexpected server failure	500 Internal Server Error


Final status code actual error aur existing EduOS API conventions ke mutabiq hona chahiye.
13.3 Safe Error Responses
Production responses mein ye information expose nahi honi chahiye:
- Stack traces.
- Internal database details.
- Secret configuration.
- Authentication tokens.
- Unnecessary personal academic data.
- Internal implementation details.
Server ko appropriate diagnostic information secure logs mein retain karni chahiye.
14. Database Integrity aur Indexing
Indexes actual access patterns ki basis par design honge aur realistic queries ke saath verify kiye jayenge.
14.1 Potential Indexes
Query Pattern	Potential Index
Academic session ke examinations	academicSessionId ke saath applicable date/status fields
Ek examination ke schedules	examId
Class aur section ke schedules	Academic context identifiers
Ek schedule ke marks	examScheduleId
Student ke examination records	studentId ke saath relevant examination identifiers
Student ke published results	studentId ke saath publication ya examination identifiers
Ek examination ke results	examId ke saath student identifier


Ye possible indexes hain. Har index ko bina analysis ke create karna zaroori nahi.
Final index design actual schema, sorting requirements, query filters aur expected data volume ko dekh kar tayyar hoga.
14.2 Duplicate Prevention
System ko marks records ke liye uniqueness rules define karne honge.
Misal ke taur par, agar har student ka ek examination schedule ke liye sirf ek current marks record allowed hai, to relevant schedule aur student identifiers par unique compound index munasib ho sakta hai.
Is se concurrent requests ki wajah se duplicate records create hone ka risk kam hoga.
Agar future mein multiple attempts, components ya retakes support kiye jayein, to uniqueness rule ko relevant attempt ya component identifiers ke saath update karna hoga.
14.3 Historical Records
Student graduate ho jaye, institution chhor de ya archived status mein chala jaye, to academic records ko routine mein delete nahi karna chahiye.
Historical examination aur result records ko correct student aur academic context ke saath linked rehna chahiye.
System ko archived aur alumni records ke liye EduOS ki existing lifecycle policy follow karni hogi.
Historical academic records ka permanent deletion exceptional hona chahiye aur institutional retention policy ke mutabiq hona chahiye.
15. Result Calculation aur Data Consistency
Result calculation ko same validated input data aur grading policy ke liye consistent outcome produce karna chahiye.
15.1 Calculation Workflow
Validated Marks
      |
      v
Completeness Check
      |
      v
Applicable Grading Policy Load
      |
      v
Subject Results Calculate
      |
      v
Overall Result Calculate, Agar Required Ho
      |
      v
Result Set Validate
      |
      v
Calculated Results Save
      |
      v
Finalization Ke Liye Ready

Calculation service ko incomplete marks aur valid results ko mix nahi karna chahiye, jab tak institutional policy explicitly is behavior ko allow na kare.
15.2 Recalculation
Publication se pehle marks change hon, to affected results dobara calculate hone chahiye.
Publication ke baad authorized correction ki surat mein affected subject result aur us se related overall values ko controlled correction workflow ke mutabiq dobara calculate karna hoga.
System ko aisi situation prevent karni chahiye jahan subject marks ek value show kar rahe hon aur overall grade kisi doosri value par based ho.
15.3 Transactions
MongoDB transactions us waqt munasib ho sakti hain jab workflow mein multiple MongoDB documents ko atomically update karna zaroori ho.
Lekin:
- Single-document update ke liye automatically transaction required nahi.
- Har operation mein transaction add nahi karni.
- Transaction support aur deployment configuration verify karni hogi.
- External notifications automatically MongoDB transaction ka hissa nahi hoti.
Implementation mein identify karna hoga ke kaun se operations ko atomic multi-document consistency chahiye.
Us ke baad simplest correct solution choose kiya jayega.
15.4 Idempotency aur Retries
Repeated calculation requests se duplicate official results create nahi hone chahiye.
Service ko define karna hoga ke calculation:
- Existing result set ko update karegi, ya
- Ek naya calculation version create karegi.
Agar timeout ke baad same request dobara bheji jaye, to accidentally result do baar publish nahi hona chahiye aur duplicate marks records create nahi hone chahiye.
Final strategy existing EduOS conventions aur result lifecycle ke mutabiq hogi.
16. Security aur Academic Data Protection
Examination results sensitive academic information hain.
Is module ko neeche diye gaye security controls enforce karne honge.
16.1 Access Control
- Protected operations ke liye authentication required hai.
- Permissions backend par check hongi.
- Teachers sirf authorized academic contexts access karenge.
- Students sirf apne private results access karenge.
- Parents sirf valid linked children ke permitted results access karenge.
- Draft results sirf authorized staff ke liye available honge.
- Publication aur correction operations ke liye explicit permissions required hongi.
16.2 Data Integrity
- Client official grades determine nahi kar sakta.
- Client marks validation bypass nahi kar sakta.
- Client request field change karke result publish nahi kar sakta.
- Unauthorized users academic ownership identifiers change nahi kar sakte.
- Published results ordinary marks-entry flow se edit nahi ho sakte.
- Duplicate marks records chosen uniqueness rules ke mutabiq prevent honge.
16.3 Auditability
Sensitive operations ke audit records hone chahiye, jaise:
- Examination creation aur important updates.
- Schedule changes.
- Marks entry aur modification.
- Result finalization.
- Result publication.
- Authorized corrections.
- Grading-policy changes.
Audit details aur retention period institutional policy ke mutabiq honge.
Audit records mein relevant user, affected record, operation aur timestamp identify hona chahiye.
Sensitive corrections ke liye before-and-after values preserve karna munasib hai.
16.4 Privacy
Logs aur error responses mein unnecessary student information expose nahi honi chahiye.
Student result sirf is liye return nahi karna chahiye ke requester ko result ID pata hai.
Har relevant request par backend ko actual resource ka access verify karna hoga.
17. Performance aur Scalability
Initial implementation mein sound data modeling, appropriate indexes aur efficient queries par focus kiya jayega.
Required considerations:
- Bari examination aur result lists ke liye pagination.
- Maximum page-size limits.
- Allowlisted sorting.
- Student results ke liye efficient queries.
- Ek schedule ke marks retrieve karne ke liye efficient queries.
- Unnecessary fields retrieve na karna.
- Examination document ke andar tamam students ke marks ki unbounded arrays avoid karna.
- Duplicate result calculations prevent karna.
- Appropriate uniqueness constraints.
- Realistic data volumes ke saath performance testing.
Redis, BullMQ aur microservices automatically required nahi hain.
Inhein tabhi introduce kiya jayega jab koi specific performance, reliability ya workflow requirement justify kare.
18. Testing Strategy
Sirf endpoints ka successful response dena module ko complete nahi banata.
Tests ko business rules, authorization, consistency aur failure scenarios verify karne honge.
18.1 Examination Management Tests
Test Case	Expected Result
Authorized user examination create kare	Success
Unauthorized user examination create kare	Rejected
Invalid academic session	Rejected
Invalid class ya section relationship	Rejected
Invalid subject assignment	Rejected
Schedule end time start time se pehle ho	Rejected
Schedule prohibited existing schedule se conflict kare	Policy ke mutabiq rejected
Teacher unrelated examination access kare	Rejected


18.2 Marks Entry Tests
Test Case	Expected Result
Authorized teacher valid marks enter kare	Success
Obtained marks negative hon	Rejected
Obtained marks maximum marks se zyada hon	Rejected
Marks mein invalid decimal precision ho	Policy ke mutabiq rejected
Student examination ke liye eligible na ho	Rejected
Teacher unauthorized subject ke marks enter kare	Rejected
Concurrent requests duplicate marks records create karein	Uniqueness rule ke mutabiq prevented
Published marks ordinary workflow se change kiye jayein	Rejected


18.3 Grading Tests
In scenarios ko test karna hoga:
- Percentage calculation.
- Maximum-mark validation.
- Grade-range boundaries.
- Passing aur failing thresholds.
- Missing marks.
- Absent students.
- Different subjects ke different maximum marks.
- Overall percentage calculation.
- Grade-scale configuration validation.
- Marks changes ke baad recalculation.
- Decimal precision ka correct handling.
18.4 Result Lifecycle Tests
Test Case	Expected Result
Incomplete marks ke saath finalization request	Configured completeness policy ke mutabiq rejected
Valid result set finalize kiya jaye	Success
Unauthorized user result finalize kare	Rejected
Unfinalized result publish kiya jaye	Rejected
Authorized finalized result publish kiya jaye	Success
Student doosre student ka result request kare	Rejected
Parent unrelated student ka result request kare	Rejected
Parent-child relationship end ho chuka ho	Policy ke mutabiq access rejected
Published marks bina correction authorization ke change hon	Rejected
Authorized correction apply ho	Recalculation aur audit perform ho
Corrected result republish ho	Required workflow ke baad success


18.5 Failure aur Concurrency Tests
In scenarios ko test karna hoga:
- Concurrent marks updates.
- Duplicate result calculation requests.
- Repeated finalization requests.
- Repeated publication requests.
- Result persistence ke waqt database failure.
- Invalid lifecycle transitions.
- Missing ya outdated grading configuration.
- Marks update karte waqt stale client data.
- Timeout ke baad request retry.
18.6 Regression Tests
Existing EduOS ke ye modules bhi verify hon:
- Authentication.
- Authorization.
- User/profile management.
- Academic sessions.
- Classes.
- Sections.
- Subjects.
- Teacher assignments.
- Student enrollments.
- Attendance.
Group 13 ki implementation se pehle se complete modules break nahi hone chahiye.
19. Implementation Prerequisites
Group 13 implement karne se pehle neeche di gayi dependencies verify karni hongi.
Prerequisite	Kyun Zaroori Hai?
Authentication	Request bhejne wale user ko identify karne ke liye
Authorization	Permissions aur resource access enforce karne ke liye
User/profile management	Account IDs ko student aur teacher profiles se connect karne ke liye
Academic sessions	Academic period define karne ke liye
Classes aur sections	Examination ka academic context establish karne ke liye
Subject management	Examination subjects validate karne ke liye
Teacher assignments	Teaching responsibility verify karne ke liye
Student enrollments	Student eligibility verify karne ke liye
MongoDB architecture	References, indexes aur data ownership define karne ke liye
REST API conventions	Existing endpoints ke saath consistency ke liye
Validation/error handling	Consistent failure behavior ke liye
Audit conventions	Academic changes ki accountability ke liye


Agar koi prerequisite incomplete ho, to us gap ko document karna hoga aur approved implementation sequence follow karna hoga.
Existing EduOS domain ka replacement bina approval ke nahi banana chahiye.
20. AI Coding Agent Ke Liye Implementation Instructions
Jab AI coding agent ko Group 13 implement karne ka task diya jaye, to usay ye instructions deni hongi.
20.1 Pehle Repository Inspect Karo
Code change karne se pehle ye cheezein inspect karo:
- Existing folder structure.
- Existing examination-related models aur routes.
- Existing marks ya result schemas.
- Authentication middleware.
- Permission middleware.
- Academic context models.
- Teacher assignment relationships.
- Student enrollment relationships.
- Validation conventions.
- Centralized error handling.
- Audit logging conventions.
- Existing tests.
Ye assume mat karo ke agar koi module empty nazar aa raha hai to us se related functionality kahin aur implement nahi hui.
20.2 Existing Architecture Preserve Karo
AI coding agent ko:
- Established EduOS folder structure preserve karni hai.
- Existing authentication aur authorization reuse karni hai.
- Existing academic entities reuse karni hain.
- Existing route, controller, service aur model conventions follow karne hain.
- Existing concepts ke duplicate models create nahi karne.
- Unrelated modules rewrite nahi karne.
- Unnecessary technologies introduce nahi karni.
- Backend stack change nahi karna.
Sirf examination management implement karne ke liye PostgreSQL, Python backend services, microservices, Redis, BullMQ ya RAG introduce nahi karna.
20.3 Documentation aur Code Mein Conflict Ho To
Agar existing code is specification se conflict karta hai, to agent ko:
1. Conflicting behavior identify karna hai.
2. Affected files aur dependencies identify karni hain.
3. Explain karna hai ke conflict kyun important hai.
4. Resolution propose karna hai.
5. Approval-required architectural change se pehle ruk jana hai.
Approved business rules ko silently change nahi karna.
20.4 Implementation Order
Module ko controlled sequence mein implement karo:
1. Prerequisites inspect aur verify karo.
2. Existing schema ke mutabiq domain models finalize karo.
3. Examination management implement karo.
4. Schedule management aur validation implement karo.
5. Student eligibility checks implement karo.
6. Marks entry aur validation implement karo.
7. Grading configuration implement karo.
8. Result calculation implement karo.
9. Draft aur finalization workflows implement karo.
10. Publication restrictions implement karo.
11. Student aur parent result access implement karo.
12. Controlled correction aur audit behavior implement karo.
13. Database constraints aur indexes add karo.
14. Functional, authorization aur failure tests add karo.
15. Regression tests run karo.
16. Implementation status aur remaining risks document karo.
20.5 Completion Report
Implementation ke baad agent ko report karna hoga:
- Kaun si files create hui hain.
- Kaun si files modify hui hain.
- Kaun se existing components reuse hue hain.
- Kaun se domain models implement hue hain.
- Kaun si permissions enforce hui hain.
- Kaun se business rules implement hue hain.
- Kaun se database constraints aur indexes add hue hain.
- Kaun se tests execute hue hain.
- Tests ke results kya hain.
- Known limitations kya hain.
- Kaun se policy decisions abhi unresolved hain.
- Approved specification se koi deviation hui hai ya nahi.
Sirf code file maujood hone ki wajah se kisi feature ko implemented claim nahi karna.
Isi tarah tests, security review, configuration verification aur deployment checks ke evidence ke baghair production readiness claim nahi karni.
21. Definition of Done — Group 13 Kab Complete Mana Jayega?
Group 13 tab complete mana jayega jab applicable requirements implement aur verify ho chuki hon.
Examination Management
- [ ] Authorized users examinations create aur manage kar sakte hon.
- [ ] Examination schedules validate hote hon.
- [ ] Academic sessions, classes, sections aur subjects validate hote hon.
- [ ] Teacher authorization enforce hoti ho.
- [ ] Student eligibility verify hoti ho.
- [ ] Prohibited schedule conflicts policy ke mutabiq handle hote hon.
Marks Management
- [ ] Authorized users marks enter kar sakte hon.
- [ ] Invalid marks reject hote hon.
- [ ] Maximum marks enforce hote hon.
- [ ] Missing aur absent marks policy ke mutabiq handle hote hon.
- [ ] Duplicate marks records prevent hote hon.
- [ ] Published marks ordinary workflow se unauthorized change na ho sakte hon.
Results
- [ ] Subject results correctly calculate hote hon.
- [ ] Overall results approved calculation policy follow karte hon.
- [ ] Grade scales institutional requirements ke mutabiq configurable hon.
- [ ] Missing marks silently zero mein convert na hote hon.
- [ ] Finalization aur publication separate controlled operations hon.
- [ ] Unpublished results students aur parents ke liye inaccessible hon.
- [ ] Published results ordinary edits se protected hon.
- [ ] Authorized corrections recalculation aur audit recording trigger karti hon.
Security aur Data Integrity
- [ ] Student result ownership verify hoti ho.
- [ ] Parent-child access verify hota ho.
- [ ] Teacher academic context verify hota ho.
- [ ] Permissions backend par enforce hoti hon.
- [ ] Sensitive operations audit hoti hon.
- [ ] Historical academic records preserve hote hon.
- [ ] Appropriate indexes aur uniqueness constraints implement hon.
Quality
- [ ] Functional tests pass hon.
- [ ] Authorization tests pass hon.
- [ ] Calculation tests pass hon.
- [ ] Failure aur concurrency tests pass hon.
- [ ] Regression tests pass hon.
- [ ] Existing EduOS architecture preserve ho.
- [ ] Documentation actual implementation se match karti ho.
- [ ] Remaining limitations honestly documented hon.
22. Final Technology Decisions
Area	Final Decision
Backend	Existing Node.js + Express.js
Database	MongoDB Atlas
Data modeling	Examination, schedule, marks aur result ke separate concepts
API	Existing REST API conventions
Authentication	Existing EduOS authentication middleware
Authorization	Existing permissions + resource-level checks
Marks validation	Backend enforce karega
Grade calculation	Backend-controlled aur policy-driven
Grade scale	Approved institutional policy ke mutabiq configurable
Result lifecycle	Draft → Finalized → Published
Published result modification	Authorized correction workflow tak restricted
Audit	Sensitive academic changes ke liye required
Historical academic records	Institutional retention policy ke mutabiq preserve honge
MongoDB transactions	Sirf jab multi-document atomic consistency required ho
Redis aur BullMQ	Bina justified requirement introduce nahi honge
Microservices	Use nahi honge
AI grading	Group 13 se bahar
Existing EduOS architecture	Preserve karni hai


23. Senior-Level Design Review — Sab Se Important Decisions
Bahi, ab kuch important decisions samjho jo is documentation ko ek practical engineering specification banate hain.
Decision 1 — Marks aur Results Ek Cheez Nahi Hain
Marks teacher enter karta hai.
Result system approved rules ke mutabiq calculate karta hai.
Agar dono concepts ko properly separate na kiya jaye, to marks change hone ke baad overall grade ya percentage inconsistent reh sakta hai.
Decision: Marks entry aur result calculation logically separate rahenge.
Decision 2 — Exam Complete Hone Ka Matlab Result Ready Hona Nahi
Examination khatam ho sakta hai, lekin kuch teachers ne abhi marks enter nahi kiye honge.
Is liye examination lifecycle aur result lifecycle ko alag manage karna zaroori hai.
Decision: Examination completion aur result readiness separate states hongi.
Decision 3 — Finalized aur Published Result Alag Hain
Finalized result publication ke liye approve ho chuka hota hai.
Published result students aur authorized parents ke liye official form mein available hota hai.
Ye distinction accidental early publication ko prevent karti hai.
Decision: Finalization aur publication separate controlled operations honge.
Decision 4 — Published Marks Ordinary Update Se Change Nahi Hone Chahiye
Official academic record ko correct karne ki zaroorat ho sakti hai.
Lekin correction authorized aur auditable honi chahiye.
Is se system correction allow bhi karta hai aur accountability bhi preserve karta hai.
Decision: Published results ki correction controlled workflow se hogi.
Decision 5 — Grading Policy Hardcode Nahi Hogi
Agar grading formula ke andar fixed values likh di jayein, to institutional policy change hone par code changes ki zaroorat par sakti hai.
Policy-driven grading system maintain karna comparatively asaan hai.
Lekin configuration validate karna bhi zaroori hai.
Decision: Grade calculation applicable configured grading policy ke mutabiq hogi.
Decision 6 — Database Relationship Authorization Ka Replacement Nahi
Teacher ka examination record mein hona ya student ka valid enrollment hona apne aap har operation ki permission nahi deta.
Backend ko ye cheezein saath evaluate karni hongi:
- User ki permission.
- Resource ke saath relationship.
- Academic context.
- Current lifecycle state.
Decision: Resource-level authorization har sensitive operation par enforce hogi.
Final Assessment
Bahi, Group 13 ka central objective examination se lekar official result publication tak poore workflow ko define karna hai.
Is design mein:
- Examination scheduling.
- Student eligibility.
- Marks validation.
- Grade calculation.
- Result finalization.
- Result publication.
- Controlled corrections.
Sab ek consistent system ka hissa hain.
Lekin implementation se pehle teen policy areas ko institution ke actual rules ke mutabiq confirm karna zaroori hai.
1. Grading Policy
- Grade ranges kya hongi?
- Passing criteria kya honge?
- Decimal marks allowed honge?
- GPA/CGPA ki zaroorat hai ya nahi?
2. Incomplete Results
Kya har eligible student ke marks complete hone chahiye, ya institution partial publication allow karti hai?
3. Result Corrections
Published result correct karne ke liye authorized correction kaafi hai, ya additional approval workflow bhi mandatory hai?
In policies ko explicitly define karne se developer ko academic rules guess nahi karne padenge.

24. Implementation aur Verification Review
24.1 Implemented Backend Scope
Repository review ke mutabiq Group 13 ke core backend components maujood hain:
- Examination aur schedule create/update, academic references aur schedule-conflict validation.
- Examination lifecycle transitions aur results-ready completeness check.
- Teacher assignment aur student enrollment ke mutabiq resource authorization.
- Marks validation, absent status, duplicate prevention index aur stale-version protection.
- Configurable grade scale, weighted result calculations aur missing-marks rejection.
- Draft, finalized aur published result workflows.
- Student/parent published-result access checks aur teacher subject scoping.
- Published-result correction, recalculation aur before/after audit details.

24.2 Verification Evidence
2026-10-16 review ke dauran:
- Group 13 automated test file mein 19 tests pass hue, including schedule-conflict, lifecycle, marks-lock, publication-retry, correction-audit aur HTTP permission/validation checks.
- Backend ke tamam 9 test files direct execution se pass hue.
- `npm test` sandbox mein `spawn EPERM` se fail hua, kyun ke Node test runner worker process spawn nahi kar saka. Har test file ko directly run karne ka workaround pass hua.

Ye results automated unit/service checks aur kuch in-process HTTP checks ko verify karte hain. Ye complete live database API workflow ya production readiness ka proof nahi hain.

24.3 Remaining Verification
Database-backed API tests abhi execute nahi hue. MongoDB test database, seed data aur transaction-capable replica-set configuration ke saath in flows ko verify karna baqi hai:
- Admin exam/schedule creation se le kar marks entry, calculation, finalization aur publication tak ka complete HTTP workflow.
- Student aur active parent ke published result endpoints; unpublished result rejection.
- Schedule conflict aur invalid academic reference requests ka HTTP response (service-level conflict aur academic-session rejection unit tests maujood hain).
- Repeated calculate/finalize/publish request behavior aur correction ke baad re-finalization/republishing.
- Database failure par multi-document transaction rollback.
- Concurrent marks requests aur duplicate-key behavior under MongoDB.

In-memory tests production MongoDB transaction semantics, indexes ya replica-set behavior verify nahi karte. Live API verification ke liye test-only database aur known seed accounts/records required hain. Production credentials ko tests mein use nahi karna chahiye.

Institutional grading/decimal policy, partial-result publication policy aur correction approval policy bhi confirm hona baqi hain; current implementation approved initial behavior ke mutabiq whole-number marks, complete results aur permission-gated admin correction use karti hai.
