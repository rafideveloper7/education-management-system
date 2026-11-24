group 19 
EduOS: Central Document Management
Final Engineering Specification & AI Coding Agent Instructions
Project: EduOS, Education Management System
Module: Central Document Management
Backend: Node.js + Express.js
Database: MongoDB Atlas + Mongoose
Frontend: Next.js
Architecture: Modular Monolith
Scope: Single educational institute
1. AI Coding Agent ke liye sab se zaroori instructions
1.1 Tumhara role
Tum EduOS me Senior Backend Engineer, Software Architect, Security Reviewer aur QA Engineer ki tarah kaam karoge. Documents me private data hota hai (student ke papers, certificates, teacher records). Yahan ek ghalti ka matlab hai kisi ka private document dusre ko mil jana.
1.2 Pehle existing project samjho
Abhi koi code create, delete ya modify nahi karna. Pehle sirf inspect karo.
Folder structure aur layer conventions
Upload kahan kahan ho raha hai: assignments, admission, complaints/applications (Group 16), student/teacher profile photo, results, notices
Cloudinary config: files public hain ya private/authenticated?
Existing upload middleware (multer ya koi aur), file type/size validation
Auth, permission aur ownership middleware, permission constants
Parent-student aur teacher-assignment relationships (access rules ke liye)
Module 1 (Central Audit) aur Module 2 (Settings) ki services
Error handling, response format, existing tests
1.3 Reuse-First rule: pehle dhundo, phir pooch lo
Naya code likhne se pehle check karna mandatory hai.
Step 1: Search karo. Dekho ki is module ka koi kaam pehle se kisi aur module me to nahi ho raha. Naam se nahi, behavior se dhundo. Is module me overlap ka khatra bohat zyada hai, kyunki attachments kai modules me alag alag bane ho sakte hain.
Step 2: Kuch mile to STOP. Bina poochhe reuse, replace ya parallel version nahi banana:
Existing implementation mili hai:
- Kahan: <file paths>
- Ye kya karta hai: <summary>
- Kaun use karta hai: <dependent modules>
- Is document se overlap/farq: <details>

Options:
A) Reuse   B) Extend   C) Naya banao + existing migrate
D) Naya banao + existing chhod do (duplicate ka risk)

Meri recommendation: <option aur wajah>
Tumhara faisla chahiye. Intezar kar raha hoon.
Step 3: Faisle ke baghair aage mat badho.
Rules: existing module chupke se replace/delete nahi. Dependent code break nahi. Overlap clear na ho to bhi poochho.
1.4 Non-negotiable rules
Naya folder, database, framework ya duplicate auth nahi (bina approval).
Existing modules ka behavior silently change nahi.
Existing attachments ko is module me migrate karna alag, approved task hoga. Chupke se nahi.
Business policy khud invent nahi karni.
Test evidence ke baghair "complete" ya "production ready" nahi.
Section 1.3 har naye model/service/route se pehle lagu hai.
2. Existing architecture
Client → Route → Middleware → Controller → Service
       → Policy / Repository → Model → MongoDB Atlas
                                      ↘ File Storage (Cloudinary)
Layer
Documents me responsibility
Route
Upload/download/list endpoints
Middleware
Auth, permission, upload parsing, size limit
Controller
Request/response
Service
Document rules, file validation, storage coordination, audit call
Policy
Kaun kis document ko dekh/download kar sakta hai
Model
Document metadata schema
File storage
Asli file (DB me sirf metadata aur reference)
Boundaries:
File DB me store nahi hogi. DB me metadata, storage me file.
Frontend access ka trusted source nahi.
Storage URL kisi ko seedha mat do (section 8 dekho).
Provider-specific storage code ek jagah rakho, har controller me nahi.
3. Module ka purpose
Institute ke documents ko ek central, permission-based jagah me manage karna.
Analogy: Ye school ka locker room hai. Har document ka apna locker hai, aur chaabi sirf unke paas hai jinhe ijazat hai. Cloudinary ka link "khula darwaza" nahi hona chahiye.
Spec sec 24 ke document types (examples):
Category
Examples
Student documents
B-form, previous result, photo
Teacher documents
CV, degrees, appointment letter
Admission documents
Application ke saath diye gaye papers
Certificates
Character, leaving, bonafide
Notice attachments
Notice ke saath PDF
Assignment attachments
Teacher/student ki files
Result documents
Result card, transcript
Ye examples hain, final list existing modules inspect karke tay hogi.
4. Core engineering principles
4.1 SRP: Document service files ka metadata, validation aur access manage kare. Assignment ka marking ya admission ka approval us module ka kaam hai.
4.2 DRY: Upload validation ek jagah. Har module apna alag multer/validation na likhe.
4.3 KISS: Pehle simple: ek Document collection, ek owner reference, ek storage reference. Versioning, OCR ya preview-generation abhi nahi.
4.4 YAGNI: Virus-scan service, CDN tuning, OCR, e-signature abhi nahi. Zarorat prove ho tab.
4.5 Security by Design: Har upload aur download par pucho: user authenticated hai? Permission hai? Is specific document ka owner/linked user hai? File type safe hai? Audit hoga?
4.6 Fail Safely: Upload beech me fail ho to adha record ya orphan file na bache. Document access check fail ho to default deny.
5. Documents ka data model
Document:
{
  ownerType: "STUDENT",        // kis entity ka document
  ownerId: "...",
  category: "CERTIFICATE",
  title: "...",
  originalName: "...",         // sirf display ke liye
  mimeType: "application/pdf",
  size: 120345,
  storageRef: "...",           // storage ka internal key
  uploadedBy: "...",           // authenticated user se
  status: "ACTIVE",            // ACTIVE / ARCHIVED
  retentionStartAt: null,
  createdAt: "..."
}
Ye conceptual hai, final schema nahi. Existing model ho to Reuse-First (1.3) lagu hoga.
Rules:
uploadedBy aur ownerId ki verification backend se, client par trust nahi.
Storage key random ho, user ke diye filename se nahi.
originalName sanitize karke sirf display ke liye.
File ka asli content type server check kare, sirf extension ya client-bheje MIME par bharosa nahi.
6. Upload workflow
Upload Request
     ↓
Authentication & Permission
     ↓
Owner/ownership check (kya ye user is entity ke liye upload kar sakta hai?)
     ↓
File validation (type, size, content, name)
     ↓
Storage me upload
     ↓
Metadata DB me save
     ↓
Audit record (Module 1)
     ↓
Response
Zaroori detail: Storage upload aur DB save do alag systems hain, ek transaction me nahi aa sakte.
Storage upload ho gaya, DB save fail: file orphan ho jayegi. Service ko best-effort file delete karni hai.
Jo orphan phir bhi reh jayein, unka cleanup baad me scheduled job (Module 10) se hoga.
Isliye agar DB save pehle ho aur storage baad me, to "pending" status wala record bhi ek option hai. Agent options aur trade-offs report kare, khud se na chune.
7. Download aur access workflow
Download Request
     ↓
Authentication
     ↓
Policy: kya ye user is document ko dekh sakta hai?
     ↓
Allowed → short-lived signed URL ya controlled stream
Denied  → 403/404
Document ka ID jaan lena access nahi deta.
Dry run: Student A ne URL me apna document ID dekha. Usne Student B ke document ka ID daal diya. Policy check fail, reject.
Seedha public storage link kabhi nahi. Link short-lived ho ya backend se stream ho.
8. Permissions
Role
Access (suggested, final policy owner decide karega)
Admin
Broad access (permission ke mutabiq)
Teacher
Apne documents; assigned students ke sirf wahi jo policy allow kare
Student
Apne documents (upload + view, policy ke mutabiq)
Parent
Linked children ke permitted documents
Public User
Sirf apni admission application ke documents
Access hamesha backend policy se, frontend se nahi.
Sensitive categories (B-form, medical, complaint attachments) ka alag access ho sakta hai, ye policy hai.
Normal list API me sirf permitted documents aayein. Total count se bhi information leak na ho.
9. File validation rules
Section 14 ki limits settings se aayengi (Module 2). Agent khud numbers tay nahi karega.
Allowed types ki whitelist (blacklist nahi). Executable, script aur archive types default me band.
Extension + MIME + file ka asli content (magic bytes) teeno check.
Size limit settings se, per category alag ho sakti hai.
Filename sanitize: path traversal (../), special characters, double extension (file.pdf.exe) block.
Ek hi request me files ki tadaad ki limit.
Khali (0 byte) ya corrupt file reject.
Duplicate upload (double click) safe handle ho.
10. API approach
POST   /api/documents                      (multipart upload)
GET    /api/documents                      (filters, pagination, sirf permitted)
GET    /api/documents/:id                  (metadata)
GET    /api/documents/:id/download         (controlled access)
PATCH  /api/documents/:id                  (metadata edit)
PATCH  /api/documents/:id/archive
GET    /api/documents/owner/:type/:id      (kisi student/teacher ke documents)
Existing naming conventions inspect karo. Ye final routes mandatory nahi.
11. SOLID Principles: Documents me practical use
S: Single Responsibility. Validation, storage communication aur access policy alag responsibilities hain. Ek DocumentService ke andar teeno ka bhara hua code mat likho. Lekin har chhoti cheez ke liye nayi class bhi nahi.
O: Open/Closed. Nayi document category aur uske rules add karne ke liye existing code edit na karna pade. Har category apni validation aur access rules config/handler se rakhe. Lambe if (category === "CERTIFICATE") ... else if ... chain se bacho.
L: Liskov Substitution. Storage provider (Cloudinary ya baad me koi aur) ka contract ek jaisa ho: upload, getAccess, remove. Koi provider agar remove par exception phenk de jabke baqi silently chalte hain, to wo contract todta hai.
I: Interface Segregation. Har module ko poora document service mat do. Assignment module ko sirf "attach karo / list karo", admission ko sirf "admission documents". Chhote focused methods.
D: Dependency Inversion. Business modules Cloudinary par direct depend na karein. Wo document service par depend karein. Kal storage badle to sirf storage adapter badle, baqi modules nahi.
Senior advice: Storage adapter tab banao jab provider badalne ki real sambhavna ho ya testing ko mock chahiye. Sirf "future me kaam aayega" wajah se bharmaar mat karo.
12. Security requirements
Backend authorization har upload, list, download par
Ownership/relationship verification (parent-child, teacher-class)
File type, size aur content validation
Private storage, short-lived access
Filename sanitization, random storage keys
Sensitive metadata masking
Rate limiting upload par (actual risk ke mutabiq)
Audit: upload, download of sensitive docs, archive, access denial
Scenario
Expected behavior
Dusre student ka document maange
Reject
Parent kisi aur ke bachche ka document maange
Reject
.exe ko .pdf naam se upload
Reject (content check)
Limit se bari file
Reject, clear error
Storage upload ke baad DB fail
File cleanup, controlled error
Document ID guess karke download
Reject
Storage service down
Controlled error
Duplicate upload (double click)
Safe handle
13. Technology Decision Document
Technology
Decision
Reason
Express, MongoDB, Mongoose, JWT
Use existing
Approved stack
Cloudinary
Conditional
Tab jab private/authenticated delivery verify ho. Public URLs private docs ke liye nahi
Existing upload middleware
Reuse
DRY
Module 1 audit, Module 2 settings
Reuse
DRY
Virus scanning (ClamAV waghera)
Not now
YAGNI, zarorat ho to separately
Redis, CDN tuning, OCR
Not used
Unnecessary
Microservice
Not used
Modular monolith
14. Unresolved Business Policies. Agent must not invent
Upload
Kaun kis cheez ka document upload kar sakta hai?
Allowed file types aur size limits (har category ke liye)?
Ek entity ke kitne documents allowed?
Access
Teacher assigned students ke kaun se documents dekh sakta hai?
Parent child ke kaun se documents dekh sakta hai?
Sensitive categories ka alag access kaun?
Lifecycle
Document replace/version rakhna hai ya purana archive?
Kya admin documents "verified" mark karega (admission docs)?
Delete allowed hai ya sirf archive?
Virus scanning zaroori hai?
Retention (Planned, abhi implement nahi)
Retention Admin-configurable hogi, retentionStartAt se ginti, expiry se pehle Admin ko 3 batch notifications (30/14/3 din), pehle soft delete. Jab owner "X ko N saal" kahe tab implement karo. Certificates aur results ke liye "hamesha" ka option hoga.
Agar answer nahi hai, agent question raise karega. Existing module mile to bhi pehle poochho (1.3).
15. Testing Strategy
Unit tests: file validators (type, size, name, content)
Integration tests: upload/download APIs + MongoDB + storage (mock)
Authorization tests: har role ke allowed/denied cases
Ownership tests: wrong student, wrong child, wrong teacher
Validation tests: fake extension, bari file, khali file, double extension
Failure tests: storage fail, DB fail, upload ke beech fail (orphan cleanup)
Duplicate upload test
Audit tests: upload, download, archive ka record
Settings tests: limits settings se aa rahi hain
Regression tests: assignments, admission, Group 16 attachments toote nahi
Conflict check: koi duplicate upload code ya model to nahi bana
Completion condition: API chal jana kaafi nahi. Access control, file validation, failure handling aur existing modules ki compatibility verify ho.
16. Agent ke liye pehla task (read-only)
Role: Senior Backend Engineer, Architect, Security Reviewer.
Abhi koi code create, delete ya modify nahi karna.
Package install ya script run nahi karni.

REUSE-FIRST RULE:
Naya kuch banane se pehle check karo ki ye kaam pehle se kisi module
me ho raha hai (naam aur behavior dono se). Mile to STOP, report karo
(kahan, kya karta hai, kaun use karta hai, overlap, options A/B/C/D,
recommendation) aur mera faisla maango. Chupke se replace/delete nahi.

Inspect karo:
1. Saare upload/attachment flows (assignments, admission, Group 16,
   profile photo, notices, results): file paths ke saath.
2. Cloudinary config: public ya private/authenticated delivery?
3. Existing upload middleware aur validation (type, size, content).
4. Files abhi kaise access hoti hain (direct URL ya backend)?
5. Parent-student aur teacher-assignment relationships.
6. Module 1 audit aur Module 2 settings reuse ho sakte hain?
7. Existing tests.

Report format:
- Already exists (file paths ke saath)
- Overlaps / possible conflicts (A/B/C/D options ke saath)
- Security risks (public links, weak validation waghera)
- Missing
- Conflicts with this document
- Questions for owner

Evidence ke baghair "complete" mat likho.
Business policy khud invent mat karo.
Ab Module 4 (Timetable Management) isi style me banau?

17. Reuse-First Implementation Status

17.1 Approved reuse decision
- Owner ne Option A, reuse, choose kiya.
- Central-only documents ke liye naya CentralDocument metadata model aur reusable service/routes add kiye.
- Existing AdmissionDocument aur Assignment/Submission files ko migrate nahi kiya; unke existing user-facing endpoints unchanged hain.
- Central APIs existing module records ko read-only, Admin-only wrappers ke through expose karti hain.
- Existing assignment private Cloudinary adapter upload/download/destroy ke liye reuse hua.
- Module 1 CommunicationAudit collection ko DOCUMENT entity type ke saath reuse kiya; nayi audit collection nahi bani.

17.2 Approved current policy
- Central-only upload: Admin-only.
- Central-only limit: 10 MB.
- Allowed types existing module-specific rules ke union se validate honge.
- Central-only access: Admin aur document owner. Parent/teacher access for Central-only documents abhi pending.
- Existing-module central listing/download: Admin-only.
- Existing module ke existing user-facing upload/download/list behavior unchanged.
- Archive-only lifecycle: delete API/service nahi; retention code nahi.
- Unauthorized access 403 ya 404 se deny hota hai; ID guessing se record leak nahi hota.

17.3 Pending owner decisions
- Parent aur teacher access for Central-only categories.
- Sensitive category-specific access.
- Retention/expiry implementation.
- Virus scanning.
- Document replacement/versioning beyond existing module behavior.
- Export or centralized delete policy.

17.4 Verification
- Central document focused tests pass.
- Admission, assignment, communication, examination, fees, and authorization regression tests pass.