EduOS — Group 14: Fees & Finance Management
Final Engineering Specification & AI Coding Agent Instructions
Project: EduOS — Education Management System
Module: Group 14 — Fees & Finance Management
Backend: Node.js + Express.js
Database: MongoDB Atlas + Mongoose
Frontend: Next.js
Architecture: Modular Monolith
Scope: Single educational institute
Documentation purpose: Requirements, architecture decisions, implementation rules, security, testing and long-term maintenance.
1. AI Coding Agent ke liye sab se zaroori instructions
1.1 Tumhara role
Tum EduOS project mein ek senior backend engineer, software architect aur careful code reviewer ki tarah kaam karoge.

Tumhara maqsad sirf code generate karna nahi hai. Tumhein aisa code implement karna hai jo:
- Samajhne mein asaan ho.
- Business requirements ko correctly implement kare.
- Secure ho.
- Existing architecture ke saath consistent ho.
- Test karna asaan ho.
- Maintain aur extend karna asaan ho.
- Future mein naye payment providers add karne ki gunjaish rakhta ho.
- Unnecessary complexity se bacha rahe.
Senior engineering ka matlab unnecessary design patterns, bohat zyada files ya complicated code likhna nahi hai. Senior engineering ka matlab sahi problem ke liye sahi level ka solution choose karna hai.

Har architectural decision ka clear reason hona chahiye.
1.2 Sab se pehle existing project ko samjho
Group 14 ka implementation shuru karne se pehle:
1. Existing repository aur folder structure inspect karo.
2. Existing authentication aur authorization implementation dekho.
3. Existing routes, middleware, controllers, services, models aur validation conventions samjho.
4. Existing error handling aur API response format inspect karo.
5. Existing permission constants aur role definitions inspect karo.
6. Existing audit/history mechanisms inspect karo.
7. Existing notification, background-job aur file-storage integrations samjho, agar relevant hon.
8. Existing database models aur indexes inspect karo.
9. Existing tests aur testing conventions dekho.
10. Payment provider integration ke liye official provider documentation ki zaroorat identify karo.
Pehle se maujood implementation ko samjhe baghair duplicate system create mat karo.
Important rule
Agar repository ka existing code is documentation se conflict karta hai:
- Conflict ko identify karo.
- Affected files aur existing behavior report karo.
- Proposed solution aur uske trade-offs explain karo.
- Architecture ya approved business policy change karne se pehle permission lo.
Chupke se architecture change mat karna.
2. EduOS ki existing architecture
EduOS ka approved backend architecture:
Client
  |
  v
Route
  |
  v
Middleware
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

Existing project conventions ke mutabiq in layers ko use karo.

Har operation mein zabardasti har layer add karna zaroori nahi. Lekin kisi layer ko skip karne ka decision existing architecture aur actual requirement ke mutabiq hona chahiye.
2.1 Har layer ki responsibility
Layer	Simple meaning	Responsibility
Route	Request ka rasta	API endpoint define karna
Middleware	Darwaze par checking	Authentication, permissions, validation aur relevant request controls
Controller	Request handler	Input receive karna aur response return karna
Service	Business logic	Fee, payment, invoice aur refund ke rules implement karna
Policy	Access rules	Decide karna ke user requested resource par action kar sakta hai ya nahi
Repository	Data-access boundary	Existing conventions ke mutabiq database operations organize karna
Model	Data structure	Schema, validation aur relevant database constraints define karna
Database	Permanent storage	Financial records ko store karna


Agar project mein kisi layer ka naam ya responsibility pehle se different hai, existing convention ko inspect karke follow karo.
2.2 Architecture boundaries
- Frontend financial decisions ka trusted source nahi hoga.
- Controller mein tamam financial business logic jama mat karo.
- Payment provider ka provider-specific code har jagah duplicate mat karo.
- Authorization sirf frontend buttons hide karke implement mat karo.
- Database consistency ko sirf frontend validation par depend mat karo.
- Email ya notification failure ki wajah se verified payment ko unsuccessful mat banao.
- Group 17 ke notification workflow ko duplicate mat karo.
3. Group 14 ka purpose
Group 14 EduOS ke financial operations manage karega.

Institute ko ye kaam karne chahiye:
1. Fee structures define karna.
2. Students ke liye fees assign karna.
3. Fee invoices aur challans generate karna.
4. Payments initiate aur track karna.
5. Multiple payment providers support karna.
6. Partial payments aur installments manage karna.
7. Discounts aur scholarships record karna.
8. Successful payments ki receipts generate karna.
9. Refunds aur reversals ko audit ke saath manage karna.
10. Outstanding fees track karna.
11. Financial reports generate karna.
12. Failed, delayed aur uncertain payments reconcile karna.
13. Unauthorized access aur payment abuse ko prevent karna.
14. Financial actions ka audit trail maintain karna.
Ye tamam features existing EduOS architecture ke andar implement honge.

Group 14 ke liye microservices introduce nahi karni.

EduOS abhi single institute ke liye hai. Multi-tenant architecture ya tenant-based restrictions add mat karna jab tak future requirement formally approve na ho.
4. Core engineering principles
Implementation mein ye principles follow karo.
4.1 Single Responsibility Principle (SRP)
Har component ki responsibility clear honi chahiye.

Misal:
- Fee Service fees aur invoices ke business rules manage kare.
- Payment Service payment lifecycle manage kare.
- Payment Provider Adapter external provider ke saath communication handle kare.
- Receipt logic receipt ki generation aur record management handle kare, existing project conventions ke mutabiq.
Aisa ek bara service mat banao jo fees, payments, refunds, receipts aur reports sab kuch independently handle kare.

Lekin har choti operation ke liye nayi class ya file banana bhi zaroori nahi.

Decision: Responsibility clear rakho, abstraction sirf zaroorat par introduce karo.
4.2 Don't Repeat Yourself (DRY)
Same financial calculation ya payment verification logic multiple controllers mein duplicate mat karo.

Misal ke taur par outstanding balance ka calculation agar multiple operations mein use hota hai, to uske liye existing service architecture ke mutabiq ek reliable source of truth rakho.

Lekin har do similar lines ko shared utility mein convert karna bhi zaroori nahi. Shared abstraction tab banao jab uska purpose clear ho.
4.3 Keep It Simple, Stupid (KISS)
Solution ko requirement se zyada complicated mat banao.

Agar existing architecture ek simple service se problem solve kar sakti hai, to unnecessary factory layers, managers, registries ya abstract base classes mat introduce karo.
4.4 You Aren't Gonna Need It (YAGNI)
Future mein shayad kaam aane wali har technology abhi add mat karo.

Misal:
- Sirf future scalability ke khayal se Redis add mat karo.
- Sirf future microservices ke liye message broker introduce mat karo.
- Har operation ke liye background worker mat banao.
- Multi-institute support abhi add mat karo.
- Har payment provider ke liye aise features define mat karo jo us provider mein supported hi na hon.
Future expansion ko support karne ke liye design ko reasonable rakho, lekin unimplemented requirements ko code mein zabardasti mat ghusao.
4.5 Security by Design
Security ko feature complete hone ke baad add karne ke bajaye implementation ke shuru se consider karo.

Har sensitive operation ke liye ye sawal poochho:
- User authenticated hai?
- User ke paas required permission hai?
- User is particular invoice ya payment ko access kar sakta hai?
- Client ka input trusted source se verify hua?
- Request repeat hone par duplicate financial operation ka risk hai?
- Database mein state transition valid hai?
- Operation ka audit record required hai?
4.6 Fail Safely
Agar payment ka result uncertain ho, to usay andazay se successful ya failed mark mat karo.

Misal:

Provider ko payment request send ho gayi, lekin network timeout ho gaya.

Iska matlab ye nahi ke payment fail ho gayi.

Mumkin hai provider ne payment process kar di ho lekin response EduOS tak na pohncha ho.

Aise case mein existing state model ke mutabiq payment ko pending ya reconciliation-required state mein rakho aur provider ke documented mechanism se result verify karo.

Financial uncertainty ko fake certainty mein convert mat karo.
5. Group 14 ke modules
Group 14 mein neeche diye gaye functional areas cover honge.
No.	Module	Purpose
1	Fee Structure Management	Fee categories aur structures define karna
2	Student Fee Assignment	Student ko applicable fee assign karna
3	Invoice / Challan Management	Payable amount aur due date record karna
4	Payment Management	Payment initiate aur track karna
5	Dynamic Payment Providers	Different payment providers integrate karna
6	Payment Verification	Provider ki confirmation verify karna
7	Payment Reconciliation	Provider aur EduOS records compare karna
8	Receipt Management	Verified payments ki receipts manage karna
9	Discounts & Scholarships	Approved fee reductions record karna
10	Partial Payments & Installments	Multiple payments aur installment schedules support karna
11	Refunds & Reversals	Refund lifecycle aur records manage karna
12	Outstanding Fees	Remaining balances track karna
13	Financial Reports	Financial information summarize karna
14	Security & Abuse Protection	Access control, idempotency aur justified request limits
15	Audit & Testing	Financial changes ka trace aur verification


Ye functional areas hain. Inke naam par separate folders ya files banana mandatory nahi. Actual file placement existing repository aur fixed folder structure ke mutabiq hoga.
6. Fee Structure Management
6.1 Purpose
Institute ko apni fee categories aur fee structures define karne ka option dena.

Examples:
- Admission Fee
- Tuition Fee
- Examination Fee
- Laboratory Fee
- Transport Fee
- Library Fee
Ye examples hain, mandatory fixed categories nahi.
6.2 Requirements
System ko approved institutional rules ke mutabiq:
- Fee structures create karne dene chahiye.
- Existing fee structures retrieve karne dene chahiye.
- Authorized users ko editable fields update karne dene chahiye.
- Fee structure ki active/inactive state manage karni chahiye.
- Fee amount aur relevant dates validate karni chahiye.
- Historical invoices par existing financial records preserve karne chahiye.
6.3 Important rule
Agar kisi fee structure se pehle invoices generate ho chuke hain, to structure update karne se purane invoices ke amounts silently change nahi hone chahiye.

Invoice ko us waqt ki approved financial terms ke mutabiq preserve karna zaroori hai.

Agar historical invoices ko recalculate karne ki requirement ho, to uske liye explicit business rule, authorization aur audit requirements define karo.
7. Student Fee Assignment
7.1 Purpose
Har student par applicable fees assign karna.

Fee assignment mein relevant institutional information ho sakti hai, jaise:
- Student profile reference.
- Applicable fee structure.
- Academic session.
- Class ya enrollment reference, agar relevant ho.
- Assigned amount.
- Due date.
- Assignment status.
Exact fields existing models aur approved business rules inspect karne ke baad finalize karo.
7.2 Important rules
- Student ki identity server-side authenticated context aur approved enrollment relationships se verify karo.
- Client ke bheje hue student ID par blindly trust mat karo.
- Duplicate assignments prevent karne ke liye actual business rule identify karo.
- Agar same student ko multiple legitimate fee components assign ho sakte hain, to unhein incorrectly duplicate samajh kar reject mat karo.
- Existing academic enrollment relationships reuse karo.
- Historical assignments ko hard-delete karne se pehle retention aur audit requirements check karo.
Duplicate prevention ko business rule ke mutabiq design karo, sirf student ID par universal uniqueness laga kar nahi.
8. Invoice / Challan Management
8.1 Purpose
Invoice student ko batata hai:
- Kitni fee payable hai.
- Kitni fee pay ho chuki hai.
- Kitni fee outstanding hai.
- Due date kya hai.
- Invoice ki current state kya hai.
8.2 Invoice aur payment mein farq
Dono ko ek hi record mein merge mat karo.

Invoice institute ki payable amount ka record hai.

Payment us payable amount ko settle karne ke liye ki gayi financial transaction ka record hai.

Example:

Student ka invoice Rs. 20,000 ka hai.

Student pehle Rs. 5,000 aur baad mein Rs. 15,000 pay karta hai.

Is situation mein:
- Invoice amount: Rs. 20,000
- First payment: Rs. 5,000
- Second payment: Rs. 15,000
- Total verified payments: Rs. 20,000
- Remaining balance: Rs. 0
Invoice paid ho sakta hai, lekin uski payment history mein do separate payments rahengi.
8.3 Invoice calculation
Conceptually:
Outstanding Balance =
Payable Amount - Verified Applied Payments

Agar discounts, credits, refunds ya adjustments applicable hon, to formula approved accounting policy ke mutabiq expand karna hoga.

Unhein bina defined accounting rules ke simple subtraction mein mix mat karo.
8.4 Important rules
- Invoice amounts backend calculate aur validate kare.
- Client-supplied outstanding balance ko trust mat karo.
- Invoice ko sirf frontend status ke basis par paid mat mark karo.
- Invoice aur payment statuses ko separate rakho.
- Historical invoice amounts silently change mat karo.
- Payment application ko duplicate hone se protect karo.
- Concurrent payments mein outstanding balance overspend hone ka risk handle karo.
Unresolved policy
Late fees, penalties, invoice cancellation, due-date extension aur invoice-number format ke rules agar existing project documentation mein defined nahi hain, to unhein khud se invent mat karo.
9. Payment Management
Ye Group 14 ka sab se sensitive module hai.
9.1 Payment lifecycle
Payment ka conceptual workflow:
Student / Authorized User
          |
          v
Payment API Request
          |
          v
Authentication & Authorization
          |
          v
Invoice and Amount Validation
          |
          v
Idempotency / Duplicate Protection
          |
          v
Pending Payment Record
          |
          v
Payment Provider Integration
          |
          v
Provider Result Verification
          |
          v
Verified Payment State Update
          |
          v
Invoice Balance Recalculation
          |
          v
Receipt Generation

Actual implementation existing architecture aur provider ki official documentation ke mutabiq hogi.
9.2 Payment initiation
Payment initiate karte waqt backend:
1. User ki identity verify kare.
2. Required permission check kare.
3. Invoice access aur ownership verify kare.
4. Invoice ki current state check kare.
5. Server-side payable aur outstanding amount calculate kare.
6. Currency aur amount validate kare.
7. Selected payment provider ki availability check kare.
8. Applicable idempotency aur duplicate protection apply kare.
9. Pending payment record create kare.
10. Provider ki official integration requirements ke mutabiq request process kare.
Agar provider external API call karta hai, to network failures aur timeouts ko explicitly handle karo.
9.3 Client amount par trust nahi karna
Agar frontend request mein ye data bhejta hai:
{
  "invoiceId": "invoice-example",
  "amount": 500
}

to backend ko sirf is liye Rs. 500 charge karne ki permission nahi mil jati.

Backend ko invoice aur approved financial rules se actual payable amount verify karna hoga.

Client amount ko ignore, compare ya validate karne ka exact behavior provider integration aur approved partial-payment policy par depend karega.

Frontend trusted financial authority nahi hai.
9.4 Payment statuses
Illustrative payment states:
PENDING
SUCCEEDED
FAILED
CANCELLED

Ye suggested examples hain, mandatory final enum nahi.

Implementation se pehle existing enums, state transitions aur provider behavior inspect karo.

Agar provider asynchronous processing support karta hai ya result uncertain ho sakta hai, to state model mein suitable pending/reconciliation behavior ensure karo.

Invalid state transitions reject honi chahiye.
9.5 Invoice status alag rahega
Illustrative invoice states:
UNPAID
PARTIALLY_PAID
PAID
OVERDUE

Payment SUCCEEDED aur invoice PARTIALLY_PAID ek hi waqt mein valid ho sakte hain.

Example:
- Invoice: Rs. 20,000
- Verified payment: Rs. 8,000
- Remaining amount: Rs. 12,000
Payment successful hai, lekin invoice abhi fully paid nahi hua.

Final enums aur transitions existing project conventions aur approved business rules ke mutabiq honge.
10. Dynamic Payment Providers
10.1 Requirement
EduOS mein aaj Easypaisa integrate ho sakta hai.

Future mein JazzCash, bank transfer ya koi aur supported provider add karna ho, to existing payment business logic ko har baar rewrite nahi karna chahiye.

Payment system ko itna flexible hona chahiye ke naye provider ki integration existing financial rules ko bypass na kar sake.
10.2 Approved design direction: Strategy + Adapter concepts
Is project ke liye Strategy aur Adapter concepts ko saath use karne ka direction approve kiya gaya hai, lekin unnecessary abstraction ke baghair.

Dono ka kaam alag hai.
Strategy Pattern — kis provider behavior ko select karna hai?
Strategy Pattern ka simple matlab hai ke system interchangeable behaviors mein se appropriate behavior select kar sake.

Misal:

Student Easypaisa select karta hai.

System configured aur enabled Easypaisa integration select karta hai.

Agar JazzCash enabled hai, to JazzCash integration select ki ja sakti hai.

Har provider ke liye har jagah alag if/else chain likhne ke bajaye provider selection ko ek controlled mechanism se handle karo.

Conceptual example:
Payment Service
       |
       v
Provider Selection
       |
       +------> Easypaisa Strategy
       |
       +------> JazzCash Strategy
       |
       +------> Bank Payment Strategy

Ye conceptual diagram hai, mandatory file structure nahi.
Adapter Pattern — provider ke different API ko EduOS ke saath compatible banana
Har payment provider ki API alag ho sakti hai.

Misal ke taur par:
- Request fields different.
- Authentication method different.
- Response structure different.
- Error codes different.
- Webhook format different.
- Refund capabilities different.
Adapter provider-specific behavior ko existing EduOS payment workflow ke saath compatible banata hai.

Conceptual example:
              EduOS Payment Service
                        |
                        v
                Provider Interface
                        |
             +----------+----------+
             |          |          |
             v          v          v
         Easypaisa   JazzCash     Bank
          Adapter     Adapter    Adapter
             |          |          |
             v          v          v
         Provider    Provider    Bank API
            API        API

Dono mein farq
Question	Strategy	Adapter
Main purpose kya hai?	Suitable behavior select karna	Different external interface ko compatible banana
Kis problem ko solve karta hai?	Provider selection aur interchangeable behavior	Provider-specific API differences
Kya ye same pattern hain?	Nahi	Nahi
Kya dono saath use ho sakte hain?	Haan	Haan
Kya har project mein dono zaroori hain?	Nahi	Nahi


10.3 Provider integration ki boundary
Provider adapter mein ye responsibilities ho sakti hain, provider ki official requirements ke mutabiq:
- Provider-specific request banana.
- Required authentication/signature generate karna.
- External API call karna.
- Provider response parse karna.
- Provider errors ko safely map karna.
- Webhook payload ko parse karna.
- Provider transaction reference handle karna.
- Refund capability expose karna, agar provider support karta ho.
Core financial rules Payment Service aur approved workflow mein rahenge.

Adapter ko khud se ye decide nahi karna chahiye ke student ko kitni fee pay karni hai ya invoice paid hona chahiye.
10.4 Common interface ko overdesign mat karo
Har provider ko force mat karo ke woh aise operations implement kare jo uske paas supported hi nahi.

Misal ke taur par agar kisi provider mein refund API nahi hai, to uske liye fake refund implementation mat banao.

Provider capabilities ko actual official documentation aur integration requirements ke mutabiq represent karo.
10.5 New provider add karne ka target
Naya provider add karte waqt ideally:
1. Provider documentation inspect ho.
2. Required credentials aur configuration add hon.
3. Provider-specific integration implement ho.
4. Provider enablement aur capability rules define hon.
5. Signature, authentication aur webhook verification implement ho, agar applicable ho.
6. Unit aur integration tests add hon.
7. Sandbox ya equivalent verification ho.
8. Existing invoice, authorization aur payment business rules unchanged rahen.
Agar naya provider existing architecture mein fit nahi hota, to agent problem aur proposed trade-off explain kare.

Sirf design pattern ka naam use karne ke liye unnecessary interfaces aur classes mat banao.
10.6 Official provider documentation
Provider integration se pehle official documentation se verify karo:
- Authentication method.
- API endpoints.
- Required request fields.
- Supported currencies.
- Transaction references.
- Callback/webhook behavior.
- Signature verification.
- Status lookup mechanism.
- Retry behavior.
- Timeout behavior.
- Refund support.
- Rate limits.
- Sandbox availability.
In details ko andazay se invent mat karo.

Agar official documentation ya credentials available nahi hain, to missing requirements report karo. Fake successful integration ko complete mat declare karo.
11. Payment verification aur webhook security
11.1 Browser response par trust nahi karna
Frontend par “Payment Successful” dikhne se payment automatically verified nahi ho jati.

Browser response ko user modify kar sakta hai, request repeat kar sakta hai ya fake success screen trigger kar sakta hai.

EduOS ko provider ke documented trusted verification mechanism se payment verify karni hogi.
11.2 Verification requirements
Provider ki official API aur security requirements ke mutabiq:
- Provider transaction reference validate karo.
- Merchant/account reference verify karo.
- Amount verify karo.
- Currency verify karo.
- Provider ka actual transaction status verify karo.
- Webhook signature ya authenticity verify karo, agar provider support karta hai.
- Duplicate webhook processing prevent karo.
- Unexpected status transitions reject karo.
- Unverified success par invoice settle mat karo.
Har provider ka exact verification mechanism uski official documentation ke mutabiq implement hoga.
11.3 Duplicate webhook protection
Provider ek webhook multiple times bhej sakta hai.

Misal:
Webhook #1 → Payment successful
Webhook #2 → Same payment successful
Webhook #3 → Same payment successful

Expected result:
- Ek hi verified payment record.
- Ek hi logical payment application.
- Invoice balance duplicate tareeqe se reduce na ho.
- Receipt records duplicate na hon, jab tak explicit policy multiple receipts allow na kare.
- Audit trail mein zaroorat ke mutabiq processing attempts record ho sakte hain.
Webhook processing idempotent honi chahiye.
11.4 Webhook processing aur external side effects
Database mein payment state update aur external provider call ko ek hi database transaction samajh kar implement mat karo.

External API call aur MongoDB transaction alag systems hain.

Timeout ya partial failure ki situation ke liye explicit recovery behavior define karo.

Jahan multiple MongoDB documents ko ek consistent state mein update karna zaroori ho, wahan MongoDB transaction consider karo, agar deployment aur schema design support karte hon.

MongoDB transaction ko har operation mein automatically add mat karo. Uska reason aur actual consistency requirement clear honi chahiye.
12. Idempotency aur duplicate payment protection
12.1 Idempotency ka simple meaning
Agar same logical operation galti se multiple times request ho, to uska effect duplicate financial transaction nahi banna chahiye.

Misal:

Student Pay button dabata hai, lekin response nahi aata.

Woh dobara button press karta hai.

Network retry bhi request repeat kar sakti hai.

System ko bina validation ke do independent payments create nahi karni chahiye.
12.2 Requirements
Payment initiation ke liye suitable idempotency mechanism design karo.

Exact implementation existing architecture aur provider behavior inspect karne ke baad decide hogi.

Considerations:
- Idempotency key ka scope.
- Authenticated user.
- Requested operation.
- Invoice/payment relationship.
- Same key ke saath different payload ka behavior.
- Key ki uniqueness.
- Concurrent requests.
- Database constraints aur indexes.
- Existing pending payment reuse karne ki policy.
Agar duplicate request same logical payment ko represent karti hai, to existing valid result return karne ka behavior define karo.

Agar same key ke saath conflicting request aaye, to usay silently accept mat karo.
12.3 Important difference
Rate limiting aur idempotency alag problems solve karte hain.

Rate limiting requests ki frequency control karta hai.

Idempotency duplicate logical operations ke side effects prevent karti hai.

Ek ko doosre ka replacement mat samjho.
13. Partial Payments aur Installments
13.1 Partial payments
Partial payments support karne ke liye system ko approved policy ke mutabiq invoice ke outstanding balance ke against multiple successful payments apply karne chahiye.

Example:
Invoice Amount: Rs. 30,000

Payment 1: Rs. 10,000
Payment 2: Rs.  5,000
Payment 3: Rs. 15,000

Total Verified Payments: Rs. 30,000
Outstanding Balance: Rs. 0

Ye sirf example hai. Minimum payment, installment amounts aur payment deadlines institutional policy se define honge.
13.2 Important validation
Har payment se pehle latest outstanding balance verify karo.

Do concurrent requests ek hi outstanding amount ko independently use karke overpayment create na kar saken.

Amount validation aur payment application ko appropriate consistency controls ke saath implement karo.
13.3 Installments
Installment schedule aur actual payment records ko conceptual taur par alag rakho.

Installment batata hai ke kab kitni amount payable hai.

Payment batata hai ke actual mein kitni amount successfully receive hui.

In dono ko merge karne se payment history aur outstanding balances manage karna mushkil ho sakta hai.
13.4 Abhi undecided policies
Agar existing requirements mein define nahi hain, to agent khud se decide nahi karega:
- Minimum partial-payment amount.
- Maximum installment count.
- Installment grace period.
- Late payment penalty.
- Overpayment handling.
- Due-date extension rules.
- Installment restructuring.
In policies ko implementation se pehle approval ke liye report karo.
14. Discounts aur Scholarships
14.1 Purpose
Authorized users ko approved fee discounts ya scholarships record karne dena.
14.2 Security requirements
- Discount create karne ke liye suitable permission honi chahiye.
- Amount ya percentage validated hona chahiye.
- Applicable invoice aur student verify hone chahiye.
- Discount approval required ho to approval workflow follow ho.
- Reason aur audit information preserve honi chahiye.
- Historical financial records silently overwrite na hon.
14.3 Important accounting decision
Discount, payment aur refund ek hi cheez nahi hain.
- Discount: Payable amount mein approved reduction.
- Payment: Student se receive hui verified amount.
- Refund: Pehle receive hui payment ka approved return.
- Adjustment: Financial record mein approved change, jiski exact definition institutional accounting policy se aayegi.
In concepts ko ek generic “amount update” operation mein combine mat karo.

Agar discount partial payment ke baad apply karna ho, to outstanding balance aur existing payment records par iska effect approved accounting policy ke mutabiq hona chahiye.
15. Refunds aur Reversals
15.1 Purpose
Authorized aur approved refunds ko safely manage karna.
15.2 Important rules
- Refund original payment record ko overwrite ya delete karke represent mat karo.
- Refund ko separate auditable financial operation ke taur par track karo.
- Original payment reference preserve karo.
- Refund amount validate karo.
- Duplicate refund requests prevent karo.
- Authorization aur approval requirements follow karo.
- Refund reason aur audit record preserve karo.
- Provider refund support verify karo.
- Refund pending, successful ya failed hone ki state accurately represent karo.
- Provider response aur actual refund status verify karo.
15.3 Refund limits
Refund amount ko approved financial policy aur original payment ke remaining refundable balance se validate karo.

Concurrent refund requests duplicate ya excessive refund create na kar saken.

Refund ki successful state sirf request submit hone se establish nahi hoti. Provider ki documented confirmation zaroori hai.
15.4 Unresolved policy
Refund approval ke liye kaun sa role authorized hoga, refund limits kya hongi aur approval ke liye kitne steps honge — ye existing permissions aur approved institute policy ke mutabiq decide karo.

Agar policy defined nahi, to khud se role permissions invent mat karo.
16. Receipt Management
16.1 Purpose
Student ya authorized parent ko verified payment ki receipt available karwana.
16.2 Requirements
Receipt mein policy ke mutabiq relevant information ho sakti hai:
- Receipt number.
- Payment reference.
- Invoice reference.
- Student reference.
- Verified payment amount.
- Currency.
- Payment date.
- Payment method/provider.
- Relevant institution details.
Exact fields existing project conventions aur institute requirements ke mutabiq finalize karo.
16.3 Important rules
- Receipt sirf verified successful payment ke against issue ho.
- Failed ya pending payment ko paid receipt ke taur par represent mat karo.
- Receipt number ki uniqueness ensure karo.
- Duplicate webhook se duplicate receipt issuance prevent karo.
- Receipt access par ownership aur permission check karo.
- Receipt record aur payment record ka relationship preserve karo.
- Historical receipt ko silently rewrite mat karo.
Agar corrected receipt ki requirement ho, to correction policy aur audit trail define karo.
17. Outstanding Fees aur Financial Reports
17.1 Outstanding fees
System ko relevant authorized users ke liye outstanding fee information provide karni chahiye.

Examples:
- Unpaid invoices.
- Partially paid invoices.
- Overdue invoices.
- Remaining balance.
- Approved discounts ya adjustments ka relevant effect.
17.2 Financial reports
Reports mein, authorized access ke mutabiq, ye information ho sakti hai:
- Total invoiced amount.
- Total verified payments.
- Outstanding balances.
- Payment provider ke mutabiq transactions.
- Date-range summaries.
- Failed ya pending transactions.
- Refund summaries.
- Reconciliation discrepancies.
17.3 Calculation rules
Report ke totals ko source financial records aur approved accounting rules se derive karo.

Payment initiation request ko collected revenue mein count mat karo.

Pending payment ko successful payment ke barabar mat samjho.

Refunds aur adjustments ko report mein kaise account karna hai, ye approved accounting policy se determine hoga.
17.4 Reporting security
- Reports ke endpoints par authorization required hai.
- Student sirf apne authorized records access kare.
- Parent sirf permitted linked-child records access kare.
- Admin aur finance roles ki permissions existing authorization model ke mutabiq hon.
- Large reports ke liye pagination, filtering aur resource usage consider karo.
- Unnecessary sensitive payment details logs ya report exports mein expose mat karo.
18. Authentication, Authorization aur Ownership
EduOS ka authentication aur authorization system pehle se exist karta hai.

Group 14 ke liye naya independent authentication system mat banao.

Existing implementation ko reuse karo.
18.1 Authentication
Authentication ka sawal:
Request karne wala user kaun hai?

Existing authentication middleware user identity verify karega.
18.2 Authorization
Authorization ka sawal:
Kya is user ke paas ye operation perform karne ki permission hai?

Existing permission system ko reuse karo.

Suggested permission names sirf examples hain:
FEE_STRUCTURE_VIEW
FEE_STRUCTURE_CREATE
FEE_STRUCTURE_UPDATE

FEE_INVOICE_VIEW
FEE_INVOICE_CREATE

PAYMENT_VIEW
PAYMENT_INITIATE
PAYMENT_RECONCILE

REFUND_VIEW
REFUND_REQUEST
REFUND_APPROVE

RECEIPT_VIEW
FINANCIAL_REPORT_VIEW

Ye names final approved constants nahi hain.

Implementation se pehle existing roles.constants.js, permissions.constants.js aur authorization middleware inspect karo.

Agar relevant permission pehle se exist karti hai, to duplicate permission mat banao.
18.3 Ownership
Ownership ka sawal:
Kya user is particular record ko access kar sakta hai?

Example:

Student A authenticated hai, lekin usay Student B ka invoice ID mil jata hai.

Sirf authenticated hone se Student A ko Student B ka invoice access nahi milna chahiye.

Backend ko relationship aur ownership verify karni hogi.
18.4 Parent access
Parent ko student ki financial information access dene se pehle:
- Existing Guardian–Student relationship verify karo.
- Relationship status aur access rules check karo.
- Relevant permission apply karo.
- Requested student record ke saath relationship validate karo.
Sirf request mein studentId bhej dene se parent ko access mat do.
18.5 Admin permissions
Admin role ka matlab automatic unlimited access nahi.

Financial operations ke liye explicit permissions aur approved policy follow karo.
19. Rate Limiting aur Abuse Protection
Ye section tumhari approved requirement ke mutabiq hai.
19.1 Sab se important decision
EduOS par blanket, strict IP-only rate limiting apply mat karna.

Institute ke bohat se students same school Wi-Fi ya shared network use kar sakte hain.

Agar IP address ke basis par sab requests ko bohat aggressively limit kar diya gaya, to legitimate students bhi payment initiate karne ya apni payment status check karne se block ho sakte hain.

Lekin iska matlab ye nahi ke IP-based abuse protection ko completely ignore karna hai.

IP ek useful security signal ho sakta hai. Isay doosre signals ke saath carefully evaluate karo.
19.2 Pehle analyze, phir implement
Rate limiting implement karne se pehle har relevant endpoint aur workflow ka analysis karo.

Har endpoint ke liye ye questions answer karo:
1. Kya endpoint public hai ya authenticated?
2. Kya endpoint financial side effect create karta hai?
3. Kya duplicate request se financial problem ho sakti hai?
4. Kya endpoint frequently poll kiya ja sakta hai?
5. Kya endpoint sensitive information expose karta hai?
6. Kya provider ki official rate limit hai?
7. Kya shared Wi-Fi users ko affect karne ka risk hai?
8. Kya existing middleware ya infrastructure already protection provide karta hai?
9. Kya endpoint ko user-specific ya operation-specific controls ki zaroorat hai?
10. Kya proposed limit ko test karke legitimate usage ke saath verify kiya ja sakta hai?
Analysis ke baad hi justified rate limits implement karo.
19.3 IP-only limit ko primary protection mat banao
IP address ko sole ya primary identifier banakar financial operations ko aggressively block mat karo.

Agar public endpoint par IP-based protection justified ho, to:
- Uska exact threat model document karo.
- Shared Wi-Fi aur NAT ka effect evaluate karo.
- Legitimate traffic ko unnecessarily block na karne ki koshish karo.
- Existing infrastructure capabilities inspect karo.
- Appropriate tests add karo.
- Limit aur uski scope ko documented rakho.
Agar safe limit determine karne ke liye information missing ho, to arbitrary numeric value choose karne ke bajaye issue report karo.
19.4 Endpoint-specific protection
Har endpoint ka risk ek jaisa nahi.

Example:
Endpoint category	Main concern	Possible protection
Payment initiation	Duplicate ya abusive financial requests	Authentication, authorization, idempotency, business validation aur justified request limits
Payment status	Excessive polling	Suitable polling policy aur justified request controls
Webhook	Forged ya duplicate events	Provider verification, idempotent processing aur appropriate abuse controls
Financial reports	Excessive resource consumption	Authorization, pagination, query validation aur resource limits
Public endpoints	Unauthenticated abuse	Risk-based controls, agar required hon


Ye examples hain. Actual policies endpoint analysis ke baad define hongi.
19.5 User-based aur operation-based protection
Jahan justified ho, authenticated user, operation aur endpoint ki nature ko consider karo.

Payment initiation ke liye idempotency aur invoice state validation important hain.

Lekin user ID par limit lagane se pehle bhi expected usage aur legitimate retries consider karo.

Kisi bhi identifier ko akela complete security solution mat samjho.
19.6 Redis automatically add mat karna
Redis ya distributed rate limiter sirf is wajah se add mat karo ke system mein rate limiting hai.

Pehle deployment architecture inspect karo.

Agar application multiple instances par run hoti hai, to per-process in-memory limit globally consistent nahi hogi.

Aisi situation mein shared state, infrastructure-level protection ya doosra justified approach evaluate karna hoga.

Technology introduce karne se pehle requirement, operational cost aur trade-offs explain karo.
19.7 Numeric limits invent mat karo
Har endpoint ke liye requests per minute ki arbitrary values set mat karo.

Limit decide karne ke liye:
- Expected user behavior.
- Endpoint risk.
- Existing infrastructure.
- Provider documentation.
- Legitimate traffic patterns.
- Testing results.
consider karo.

Final decision: Rate limiting must be evidence-based, endpoint-specific and proportionate to risk. Strict blanket IP-only blocking is not approved.
20. Audit Trail aur Financial History
Financial records ke liye traceability bohat important hai.

System ko relevant operations ke liye ye information preserve karni chahiye:
- Kis user ne action kiya.
- Kya action perform hua.
- Kis financial record par action hua.
- Action kab hua.
- Action ka reason, agar required ho.
- Relevant state change.
- Relevant external transaction reference, jab applicable ho.
Exact audit fields aur storage approach existing EduOS audit conventions inspect karne ke baad implement karo.
20.1 Important rules
- Sensitive secrets audit records mein store mat karo.
- Passwords, API secrets ya complete payment credentials logs mein mat likho.
- Financial history ko silently overwrite mat karo.
- Refunds aur corrections ke original records preserve karo.
- Failed attempts aur unexpected state transitions ko appropriate level par log karo.
- Audit logging ko is tarah design karo ke sensitive personal ya financial data unnecessarily expose na ho.
Har harmless read operation ke liye excessive audit records create karna bhi zaroori nahi. Audit scope risk aur existing project policy ke mutabiq ho.
21. Data integrity aur database consistency
MongoDB Atlas aur Mongoose existing database stack hain.

Kisi doosre database par migrate mat karo.
21.1 Schema design
Existing schemas inspect karne ke baad hi naye fields aur models add karo.

Conceptually Group 14 mein ye data concepts ho sakte hain:
- Fee Structure
- Student Fee Assignment
- Invoice / Challan
- Payment
- Receipt
- Refund
- Audit Record
Lekin ye conceptual entities hain.

In sab ke liye automatically separate collections create karna mandatory nahi.

Har collection ka decision access patterns, relationships, history, consistency aur existing architecture ko dekh kar lo.
21.2 Database constraints
Relevant records ke liye suitable validation aur indexes consider karo.

Examples:
- Unique receipt number.
- Appropriate provider transaction reference uniqueness.
- Suitable idempotency key uniqueness.
- Relevant invoice references.
- Efficient payment history queries.
Uniqueness constraints actual business rules ke mutabiq define karo.

Misal ke taur par provider transaction reference ki uniqueness ka scope provider aur transaction type par depend kar sakta hai.

Existing valid records ko dekhay baghair aisi constraint add mat karo jo legitimate data ko reject kar de.
21.3 Concurrent requests
Agar do requests same invoice ka outstanding balance simultaneously read karti hain, to dono individually valid lag sakti hain.

Lekin combined result overpayment create kar sakta hai.

Is risk ko actual data model aur workflow ke mutabiq handle karo.

Suitable techniques mein atomic database updates, unique constraints, conditional state transitions ya MongoDB transactions shamil ho sakti hain.

Har operation ke liye same mechanism blindly use mat karo.

Chosen approach ka reason document karo aur concurrency tests add karo.
22. API design
Neeche diye gaye endpoints sirf conceptual examples hain.

Actual endpoints existing Express route conventions aur API versioning ko inspect karne ke baad finalize honge.
22.1 Student endpoints
GET /api/v1/student/fees
GET /api/v1/student/fees/:invoiceId

POST /api/v1/student/payments
GET /api/v1/student/payments/:paymentId

GET /api/v1/student/receipts
GET /api/v1/student/receipts/:receiptId

22.2 Webhook endpoint
POST /api/v1/webhooks/payments/:provider

Webhook route ko ordinary student-authenticated endpoint ki tarah blindly protect ya expose mat karo.

Provider webhook ki authentication requirements alag ho sakti hain. Official provider documentation ke mutabiq signature/authenticity verification aur appropriate middleware use karo.

Webhook endpoint ko provider verification ke baghair trusted financial operation perform nahi karna chahiye.
22.3 Admin endpoints
Admin/finance endpoints existing role aur permission conventions ke mutabiq define honge.

Potential operations:
- Fee structures manage karna.
- Student fees assign karna.
- Invoices generate aur manage karna.
- Payments retrieve karna.
- Reconciliation run karna.
- Approved discounts record karna.
- Refund workflow manage karna.
- Financial reports access karna.
Actual route names aur HTTP methods existing conventions ko inspect karne ke baad select karo.
22.4 API validation
Har endpoint ke liye:
- Input validation.
- Authorization.
- Ownership checks.
- Correct HTTP status codes.
- Consistent error response.
- Appropriate logging.
- Duplicate operation protection, jahan zaroori ho.
apply karo.

Provider ke raw errors ya secrets client ko return mat karo.
23. Error handling aur recovery
Payment system mein errors expected hain.

Examples:
- Provider timeout.
- Provider unavailable.
- Invalid webhook.
- Invalid amount.
- Expired invoice.
- Duplicate request.
- Payment already completed.
- Database operation failure.
- Provider status unavailable.
- Reconciliation mismatch.
Har error ko ek hi generic 500 Internal Server Error mein convert karke important state information lose mat karo.

Lekin raw internal exceptions, stack traces ya secrets bhi client ko expose mat karo.
23.1 Error categories
Conceptually:
Situation	Expected behavior
Invalid input	Request reject karo
Unauthorized operation	Access reject karo
Invoice inaccessible	Existing security/error policy follow karo
Provider timeout	Payment result ko blindly failed mat mark karo
Duplicate webhook	Duplicate financial effects prevent karo
Database failure	Consistency preserve karo aur safe recovery allow karo
Reconciliation mismatch	Mismatch record/report karo aur approved recovery process follow karo


Exact status codes aur error formats existing project conventions ke mutabiq honge.
23.2 Retry safety
Har failed operation ko automatically retry karna safe nahi hota.

Provider ko payment request send karne ke baad timeout aaye, to blindly nayi payment initiate mat karo.

Pehle determine karo ke existing transaction ko status lookup ya provider-supported idempotency ke through safely recover kiya ja sakta hai ya nahi.
24. Payment reconciliation
24.1 Reconciliation ka simple meaning
Reconciliation ka matlab EduOS ke payment records ko provider ke transaction records ke saath compare karna hai.

Example:

EduOS mein payment pending hai, lekin provider ke records ke mutabiq transaction successful hai.

Aisi mismatch ko identify aur resolve karna reconciliation ka kaam hai.
24.2 Requirements
System ko approved operational workflow ke mutabiq:
- Relevant provider transaction references retrieve karne chahiye.
- EduOS records aur provider records compare karne chahiye.
- Amount aur currency mismatch identify karni chahiye.
- Pending ya uncertain transactions identify karni chahiye.
- Duplicate transaction references detect karne chahiye.
- Reconciliation result aur relevant action audit karna chahiye.
24.3 Important rules
- Provider result verify kiye baghair payment success invent mat karo.
- Reconciliation ke naam par original payment record silently overwrite mat karo.
- Har mismatch ko automatically correct karna zaroori nahi.
- Automated correction sirf tab karo jab uske rules clearly defined aur safe hon.
- Ambiguous financial cases ko manual review ya approved recovery workflow ke liye report karo.
Reconciliation schedule, batch size aur automation requirements existing infrastructure aur institute ki operational needs ke mutabiq decide honge.
25. Notifications aur Group 17 integration
Payment events ke baad notifications relevant ho sakti hain.

Examples:
- Payment verified.
- Receipt available.
- Payment failed.
- Invoice due.
- Refund status changed.
Lekin notifications Group 17 ke existing notification architecture ke through handle honi chahiye.

Group 14 mein duplicate notification system mat banao.
Important rule
Agar payment verify aur save ho chuki hai lekin email send nahi hoti, to payment ko failed mark mat karo.

Financial state aur notification delivery alag responsibilities hain.

Agar reliable event-driven delivery ki zaroorat ho, to existing event/job architecture inspect karo aur sirf justified changes propose karo.

Transactional Outbox, queue ya new infrastructure automatically add mat karo. Agar actual reliability requirement uski zaroorat establish karti hai, to implementation se pehle reason aur trade-offs explain karo.
26. Configuration aur secrets management
Provider credentials ko secure server-side configuration mein rakho.

Examples:
- API credentials.
- Secret keys.
- Webhook verification secrets.
- Provider environment configuration.
Existing project configuration conventions follow karo.
Rules
- Secrets frontend code mein expose mat karo.
- Secrets Git repository mein commit mat karo.
- Secrets API responses mein return mat karo.
- Secrets logs mein print mat karo.
- Missing credentials ko fake values se replace karke production-ready claim mat karo.
- Sandbox aur production configuration ko clearly separate rakho.
- Provider environment ki correct selection verify karo.
Agar deployment mein secret manager available hai, to existing infrastructure ke mutabiq use consider karo. Sirf is feature ke liye extra infrastructure automatically introduce mat karo.
27. Testing requirements
Group 14 complete tab nahi hoga jab sirf happy path chal raha ho.

Payment aur financial workflows ke negative cases, retries aur concurrency bhi test karne honge.
27.1 Fee aur invoice tests
- Valid fee structure create hota hai.
- Invalid amount reject hota hai.
- Unauthorized user fee structure create nahi kar sakta.
- Student kisi doosre student ka invoice access nahi kar sakta.
- Invoice amount unexpected tareeqe se mutate nahi hota.
- Duplicate fee assignment approved policy ke mutabiq handle hoti hai.
- Outstanding balance correct calculate hota hai.
27.2 Payment tests
- Valid payment initiation.
- Disabled provider.
- Invalid invoice.
- Incorrect amount.
- Incorrect currency.
- Already paid invoice.
- Partial payment.
- Full payment.
- Insufficient outstanding balance.
- Provider timeout.
- Provider unavailable.
- Provider failure.
- Uncertain provider result.
- Duplicate initiation request.
- Concurrent payment requests.
27.3 Webhook tests
- Valid webhook.
- Invalid signature.
- Invalid transaction reference.
- Amount mismatch.
- Currency mismatch.
- Duplicate webhook.
- Unexpected payment state.
- Forged success event.
- Provider status mismatch.
- Webhook processing ke dauran database failure.
27.4 Receipt tests
- Verified successful payment par receipt generate hoti hai.
- Pending payment par paid receipt issue nahi hoti.
- Failed payment par paid receipt issue nahi hoti.
- Duplicate webhook duplicate receipt create nahi karta.
- Unauthorized user receipt access nahi kar sakta.
- Receipt reference uniqueness enforce hoti hai.
27.5 Refund tests
- Authorized refund request.
- Unauthorized refund request.
- Invalid refund amount.
- Duplicate refund request.
- Refund provider ke paas pending hai.
- Refund provider ke paas fail hota hai.
- Refund successful confirmation.
- Refund amount allowed limit se exceed karne ki attempt.
- Concurrent refund requests.
27.6 Authorization tests
- Student apna invoice access kar sakta hai.
- Student doosre student ka invoice access nahi kar sakta.
- Parent sirf approved linked student ka record access kar sakta hai.
- Unauthorized teacher ya user financial action perform nahi kar sakta.
- Admin action existing explicit permissions ke mutabiq authorize hota hai.
- Frontend permission checks bypass hone par backend access control phir bhi enforce hota hai.
27.7 Rate-limit tests
- Shared Wi-Fi par multiple legitimate students unnecessarily block nahi hote.
- Strict blanket IP-only blocking introduce nahi hoti.
- Justified endpoint-specific limits expected behavior follow karti hain.
- Limits exceed hone par correct error response milta hai.
- Payment initiation ki repeated requests idempotency se handle hoti hain.
- IP signal use karne par documented security rationale aur tests maujood hote hain.
27.8 Integration testing
Har provider integration ke liye, jahan possible ho:
- Provider sandbox use karo.
- Success scenario test karo.
- Failure scenario test karo.
- Timeout aur retry behavior test karo.
- Webhook verification test karo.
- Reconciliation behavior test karo.
Agar provider credentials ya sandbox available nahi, to missing verification clearly report karo.

Mock tests pass hone ka matlab ye nahi ke real provider integration bhi verified hai.
28. Documentation rules
Har significant engineering decision ko understandable documentation mein record karo.

Project ki approved documentation template:
1. Requirement — kya chahiye?
2. Problem — kaunsi problem solve kar rahe hain?
3. Technology — kya use hoga?
4. Why — ye choice kyun ki?
5. Alternative — aur kya options the?
6. Why Not — doosre options kyun select nahi kiye?
7. Trade-off — is choice ka benefit aur cost kya hai?
8. Decision — final approved decision kya hai?
Agar kisi feature mein koi extra technology use nahi ho rahi, to likho:

Technology: Not Used

Unnecessary documentation ko sirf formal sections fill karne ke liye complicated mat banao. Har section mein actual useful reasoning honi chahiye.

Documentation ko code ke saath consistent rakho.

Agar implementation approved decision se different ho, to documentation update karne se pehle required approval lo.
29. Implementation workflow
AI coding agent Group 14 ko ek hi baar mein blindly implement nahi karega.

Approved workflow:
Step 1: Documentation Review
           |
           v
Step 2: Existing Repository Inspection
           |
           v
Step 3: Requirement & Conflict Analysis
           |
           v
Step 4: Implementation Plan
           |
           v
Step 5: Approved Code Changes
           |
           v
Step 6: Automated Tests
           |
           v
Step 7: Verification
           |
           v
Step 8: Fix Identified Problems
           |
           v
Step 9: Documentation Update
           |
           v
Step 10: Group Completion Report

29.1 Har phase mein kya karna hai?
Phase A — Inspection
- Existing code inspect karo.
- Relevant files identify karo.
- Existing conventions note karo.
- Missing requirements aur conflicts identify karo.
Phase B — Planning
Implementation se pehle short plan do:
- Kya implement hoga?
- Kaunsi existing files affect hongi?
- Kaunsi new files waqai zaroori hain?
- Kaun se models ya APIs change honge?
- Kya security risks hain?
- Kya tests add honge?
- Kya external credentials ya provider documentation missing hai?
Phase C — Implementation
- Approved architecture follow karo.
- Existing authentication aur authorization reuse karo.
- Financial rules service layer mein rakho.
- Provider-specific behavior isolate karo.
- Input validation aur error handling apply karo.
- Database consistency aur idempotency requirements enforce karo.
Phase D — Testing
- Relevant existing tests run karo.
- New tests add karo.
- Negative cases verify karo.
- Concurrency aur duplicate requests consider karo.
- Tests fail hon to root cause investigate karo.
Phase E — Verification
Check karo:
- Kya requirements meet hui hain?
- Kya authorization sahi hai?
- Kya payment status correctly verify hota hai?
- Kya invoice balance consistent hai?
- Kya duplicate operations safe hain?
- Kya provider-specific behavior isolated hai?
- Kya documentation accurate hai?
Phase F — Completion report
End mein report do:
- Implemented features.
- Modified files.
- New files aur unki justification.
- Tests run.
- Tests passed/failed.
- Known limitations.
- Missing provider configuration.
- Remaining security concerns.
- Manual verification required.
Agar koi test run nahi kiya gaya, to usay run hua claim mat karo.

Agar external provider integration sandbox ya credentials ke baghair verify nahi hui, to usay fully verified claim mat karo.
30. Fixed project structure ko protect karo
EduOS ka existing folder structure approved baseline hai.

AI coding agent:
- Existing folders rename nahi karega.
- Existing folders delete nahi karega.
- Existing architecture simplify nahi karega.
- Naye folders sirf tab add karega jab actual requirement aur current architecture uski justification dein.
- Sirf design pattern ka naam use karne ke liye files create nahi karega.
- Existing functionality ko silently replace nahi karega.
- Existing authentication ko duplicate nahi karega.
- Existing notifications ko duplicate nahi karega.
- Existing validation, logging ya error-handling mechanisms ko inspect kiye baghair replace nahi karega.
Agar folder ya file add karna zaroori lage, to pehle reason aur intended responsibility explain karo.

Agar user approval required ho, to code change se pehle approval lo.
31. Abhi tak formally approved decisions
Neeche diye gaye decisions Group 14 ke liye approved design direction hain.
No.	Decision	Status
1	Backend Express.js hi rahega	Approved
2	Database MongoDB Atlas hi rahega	Approved
3	Architecture modular monolith rahegi	Approved
4	Scope single educational institute hai	Approved
5	Existing auth/authz reuse hogi	Approved
6	Dynamic providers ke liye Strategy + Adapter concepts consider honge	Approved
7	Strategy aur Adapter ki responsibilities alag rahengi	Approved
8	Unnecessary design patterns aur abstraction avoid honge	Approved
9	Payment frontend success message se verify nahi hogi	Approved
10	Provider verification aur webhook security implement hogi	Approved
11	Duplicate payment requests aur duplicate webhooks handle honge	Approved
12	Payment aur invoice statuses alag rahenge	Approved
13	Partial payments aur installments support karne ka scope hai	Approved
14	Financial records ke liye auditability zaroori hai	Approved
15	Rate limits endpoint/workflow analysis ke baad define hongi	Approved
16	Strict blanket IP-only rate limiting approved nahi	Approved
17	Shared Wi-Fi/NAT users ko unnecessarily block nahi karna	Approved
18	Redis automatically add nahi karna	Approved
19	Multi-tenant support abhi add nahi karna	Approved
20	Existing folder structure ko protect karna	Approved
21	Conflicting architectural changes ke liye approval lena	Approved
22	Tests aur verification ke baghair production-ready claim nahi karna	Approved


32. Unresolved policies — AI agent ko khud se decide nahi karna
Kuch financial rules institution-specific hain.

Agar ye existing documentation mein defined nahi, to implementation se pehle approval ke liye report karo.

Examples:
- Fee categories aur fee structure ke exact rules.
- Academic session ke mutabiq fee assignment.
- Invoice numbering format.
- Late fee aur penalty policy.
- Minimum partial payment.
- Installment schedule aur grace period.
- Overpayment handling.
- Discounts aur scholarships ki approval policy.
- Partial payment ke baad discount ka accounting behavior.
- Refund approval rules.
- Refund limits aur eligible cases.
- Receipt correction policy.
- Financial report mein refunds aur adjustments ka treatment.
- Currency aur rounding policy.
- Historical invoices ki correction policy.
- Final provider list aur unki supported capabilities.
- Reconciliation schedule aur manual-review rules.
In rules ko khud se invent karna senior engineering nahi hai. Missing business requirements ko identify karna aur unke liye approval lena senior engineering hai.

Jahan koi rule missing ho, agent:
1. Missing decision identify kare.
2. Explain kare ke decision kyun zaroori hai.
3. Safe implementation options bataye.
4. Trade-offs explain kare.
5. Required approval ka wait kare.
Agar missing rule kisi independent component par effect nahi karti, to unrelated work ko block karna zaroori nahi. Agent sirf affected implementation ko rok kar baqi approved work proceed kar sakta hai.
33. VS Code AI Agent ke liye final execution instruction
Neeche diya gaya section agent ko project ke Group 14 kaam ke liye seedhi instruction deta hai.
Final instruction
You are working on EduOS, an existing education management system. Your task is to implement Group 14 — Fees & Finance Management — according to this specification and the existing repository conventions.

Work as a careful senior backend engineer. Optimize for correctness, security, maintainability, simplicity, and clear business rules rather than the number of abstractions or files.

Before changing code, inspect the repository, existing architecture, authentication, authorization, permissions, models, validation, error handling, testing conventions, and related modules.

Use Node.js, Express.js, MongoDB Atlas, and Mongoose as already established by the project. Do not introduce another backend framework, database, microservice architecture, or infrastructure dependency without explicit approval.

Preserve the fixed folder structure. Reuse existing implementations wherever appropriate. Do not silently replace, duplicate, simplify, or redesign approved systems.

For payment-provider integrations, use Strategy and Adapter concepts together only where they solve distinct, real problems. Keep provider-specific API behavior separate from core financial business rules. Verify provider capabilities and security requirements against official documentation. Never invent API behavior or claim a real integration is verified without the required evidence.

Treat payment verification, idempotency, webhook authenticity, authorization, invoice consistency, concurrent requests, auditability, and safe recovery from uncertain provider results as essential engineering concerns.

Analyze rate limits endpoint by endpoint before implementing them. Do not impose strict blanket IP-only limits because many legitimate students may share a school Wi-Fi network or NAT address. Consider IP as a supplementary signal where justified, and use appropriate user-, endpoint-, and operation-level controls when they fit the actual threat model. Do not invent numeric limits or add Redis without a documented reason.

Keep invoice, payment, refund, discount, and receipt concepts distinct. Never mark a payment successful based solely on a frontend response. Never treat a network timeout as proof that a payment failed. Prevent duplicate financial effects from repeated requests or webhooks.

Follow existing role permissions and record-ownership rules. Do not assume that authentication alone grants access to every financial record.

Use the documented workflow:

Inspect → Analyze → Plan → Implement → Test → Verify → Fix → Document → Report.

If a business policy, provider capability, architectural decision, or required credential is missing, clearly report what is missing and why it matters. Do not invent a financial policy or silently change the architecture.

If the repository conflicts with this specification, identify the conflict and affected files, explain the options and trade-offs, and request approval before making an architectural change.

At completion, report exactly what was implemented, which files changed, which tests were run, which tests passed or failed, which provider integrations were verified, and which limitations remain.

Do not claim that code is production-ready merely because it compiles or a happy-path test passes.

The final goal is not just working code. The goal is understandable, secure, testable, maintainable financial software whose decisions remain clear to another developer—even ten years later.