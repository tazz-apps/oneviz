# OneViz Website — Design Decisions
*Source material for microblog content. Each section = one post idea.*

---

## 1. Dark hero, white sections below

**Decision:** Hero section is dark navy (#0a1628). Everything below is white or light gray.

**Why it works:**
The dark hero creates immediate contrast — the eye lands on the headline first, not on navigation or background noise. As the visitor scrolls, the switch to white signals a new "chapter." It feels like opening a book. Resend.com, Linear, and Vercel all use this pattern because it separates the emotional hook (dark, dramatic, bold) from the informational content (light, readable, trustworthy).

**Post angle:** *Why the best SaaS landing pages use dark heroes — and what local businesses can learn from them.*

---

## 2. Form in the hero, above the fold

**Decision:** The lead capture form is visible immediately — no scrolling required.

**Why it works:**
Every scroll costs you leads. By the time a visitor reaches a form buried at the bottom of a page, most have already left. Placing the form in the hero communicates one thing instantly: *this page exists to help you take action.* The visitor doesn't need to decide whether to scroll — the decision is already made for them.

**Post angle:** *The most expensive mistake on a business website: hiding the contact form.*

---

## 3. One required field

**Decision:** The form requires only a phone number. Everything else is optional.

**Why it works:**
Each additional required field reduces conversion by 10–20%. For local Polish businesses — insurance agents, financial advisors, beauty salons — a phone call closes deals faster than any email sequence. The phone number is enough to start a conversation. Everything else (name, email, business details) comes out naturally during the call. Collect only what you need to take the next step, nothing more.

**Post angle:** *Why asking for less information gets you more customers.*

---

## 4. The "test your site" hook

**Decision:** The optional field is framed as "Masz stronę? Wklej link — pokażemy co traci klientów" not "Podaj URL swojej strony."

**Why it works:**
One is a bureaucratic instruction. The other is a promise of value. The visitor immediately understands what they get by filling it in. "Pokażemy co traci klientów" triggers curiosity and mild anxiety — two of the strongest motivators in conversion copywriting. The word "traci" (losing) is more powerful than "co można poprawić" (what can be improved). Loss aversion is real.

**Post angle:** *Copywriting micro-decision that doubled our form completion rate.*

---

## 5. "Oddzwonimy — zwykle tego samego dnia" not "w 15 minut"

**Decision:** The CTA promise is "usually same day" not "within 15 minutes."

**Why it works:**
An unmet promise is worse than no promise. "15 minutes" sounds impressive but creates anxiety — what if they call at 7pm? "Zwykle tego samego dnia" is specific enough to remove fear (they won't wait a week) but honest enough to be consistently kept. Trust is built in small moments, and microcopy is one of them.

**Post angle:** *The CTA that converts isn't always the boldest one — it's the most believable one.*

---

## 6. Animated visual with no images and no JavaScript

**Decision:** The hero's right-side visual — floating orbs, browser mockup, shimmer skeleton — is 100% CSS. Zero images, zero JS dependencies.

**Why it works:**
Images add HTTP requests, slow load times, and break on retina displays if not served correctly. A CSS-only animation loads instantly, scales perfectly on every screen, and communicates the same message: *a website being built.* The glass-morphism card (backdrop-filter, rgba backgrounds, subtle rotation) looks expensive but costs nothing in performance. Beauty and speed are not opposites.

**Post angle:** *How to make a hero section feel alive — without a single image file.*

---

## 7. Staggered animation on the issues list

**Decision:** In the "sample email" section, the three issue bullet points fade in one by one with 400ms delays between each.

**Why it works:**
Simultaneous appearance is forgettable. Sequential appearance is a story. Each bullet arriving separately forces the eye to read it, not skim it. The rhythm — pause, arrive, pause, arrive — mimics how a person would deliver bad news in conversation. It creates micro-tension. By the third bullet, the visitor is slightly uncomfortable. That discomfort is the emotion that drives action.

**Post angle:** *Animation isn't decoration. Used correctly, it's a persuasion tool.*

---

## 8. Two-step email sequence: issues first, demo second

**Decision:** Cold outreach sends the analysis email first (no demo link). The demo link only goes out after the prospect replies — or after 3 days of silence.

**Why it works:**
Sending a demo immediately feels like a pitch. Sending problems first feels like a service. The prospect receives value before being asked for anything. When they reply with "what does the new version look like?" — they've already committed emotionally. The demo arrives as an answer to their question, not as unsolicited self-promotion. Curiosity opens doors that sales pitches close.

**Post angle:** *Stop sending demos. Start sending diagnoses.*

---

## 9. "Program Pilotażowy" — never a discount

**Decision:** The 499 PLN offer is called "Program Pilotażowy" with conditions, not a "promocja" or "zniżka."

**Why it works:**
Discounts train clients to wait for the next discount. A pilot program communicates scarcity, exclusivity, and a reason that has nothing to do with the price being too high. The conditions (portfolio consent, testimonial, feedback call) make it feel like a two-way exchange rather than a desperate price cut. Clients who join a program feel selected. Clients who receive a discount feel like they caught you on a bad day.

**Post angle:** *Never discount. Here's what to do instead.*

---

## 10. FAQ with maximum 5 questions

**Decision:** The FAQ section has exactly 5 questions. No more.

**Why it works:**
A long FAQ is an admission that your main page didn't answer the important questions. Five questions that directly address the real objections (photos, editing speed, what happens after a year, Google visibility, existing site migration) do more work than twenty generic ones. Each question is an objection that would otherwise be raised on the phone. Answer them on the page and you only take calls from people who are already convinced.

**Post angle:** *Your FAQ is too long. Here's how to fix it.*

---

## 11. WhatsApp as an alternative CTA

**Decision:** Below the form, two alternative contact options: WhatsApp and phone call.

**Why it works:**
Polish SMB owners are often not at desks. They're meeting clients, driving between appointments, managing a team. WhatsApp is how they already communicate with everyone — suppliers, accountants, family. Offering it as a contact channel removes the formality barrier. A WhatsApp message at 7pm is normal. An email at 7pm feels like homework. Meet people where they already are.

**Post angle:** *The contact button most Polish business websites are missing.*

---

## 12. Section order as a persuasion sequence

**Decision:** NAV → HERO (form) → HOW IT WORKS → SAMPLE EMAIL → DEMO → PRICING → FAQ → FOOTER

**Why it works:**
This sequence mirrors how trust is built in a sales conversation. First: what you get and how to get it (hero). Then: how it works (reduce fear of the unknown). Then: proof of what we send before you spend anything (sample email — radical transparency). Then: what the result looks like (demo). Only then: price. FAQ handles final objections. Every section earns the right to show the next one.

**Post angle:** *The order of your landing page sections matters more than the copy in them.*

---

## 13. Glass-morphism form container

**Decision:** The lead form sits in a container with `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.1)`, and `backdrop-filter: blur(8px)`.

**Why it works:**
On a dark background, a solid box feels heavy and corporate. A glass-morphism container feels modern and lightweight — like the form is floating. The semi-transparency maintains visual continuity with the hero while clearly delineating the action area. It communicates "this is where things happen" without a thick border or background color that would interrupt the flow.

**Post angle:** *One CSS trick that makes forms feel inviting instead of intimidating.*

---

## 14. Language toggle stored in localStorage

**Decision:** When a visitor switches to English, that preference is remembered on refresh and next visit.

**Why it works:**
Forcing a user to re-select their language on every visit is a small friction that signals inattention to detail. Remembering their preference signals the opposite. For a service that promises to build professional, detail-oriented websites, every micro-decision on the own site is a proof point. The language toggle is 10 lines of JavaScript. The trust it builds is disproportionate to the effort.

**Post angle:** *The smallest UX details say the most about how you'll treat your clients.*

---

## 15. No quality badges or "built with" signals

**Decision:** No "Performance: Excellent," "Built with Tailwind," or technology badges on the page.

**Why it works:**
A local insurance agent in Kraków does not know what Tailwind is. Displaying technical badges is writing for developers, not for clients. Every element on a client-facing page should answer one question: *why should I trust this business with my money?* A performance badge does not answer that question. A testimonial does. A 5-step process does. A sample of actual work does. Know your audience and write for them exclusively.

**Post angle:** *Stop impressing other developers. Start convincing your actual clients.*

---

## 16. "Bez spamu. Tylko kontakt w sprawie zapytania."

**Decision:** One line of microcopy under the submit button.

**Why it works:**
The moment before clicking "submit" is the highest-anxiety moment in any form interaction. The visitor is about to hand over personal information to a stranger. One sentence that directly addresses the fear ("I'll get spam") removes the last obstacle. It costs nothing to write. It removes a real psychological barrier. Microcopy is the highest ROI writing on any website.

**Post angle:** *The one sentence every contact form is missing.*

---

## 17. "Strona jak lodówka" — peace of mind as the real product

**Decision:** A dedicated trust section communicates maintenance, SSL, speed, and ownership — not features, but feelings: *you won't have to think about this.*

**Why it works:**
A local business owner doesn't want a website. They want to stop worrying about not having one. The moment you frame your service as "you forget it exists and it works" — you've answered the real objection, which was never about price or design. It was about risk. The refrigerator analogy is powerful because everyone understands it instantly: you don't call a technician every week, you don't check if it's still running, you just open it and things are cold. That's the promise.

**Post angle:** *Your clients aren't buying a website. They're buying peace of mind.*

---

## 18. "Twoja domena, Twoje dane" — owning the fear of lock-in

**Decision:** Explicitly stating "your domain stays in your account, you can leave at any time" on the page — even though the hosting model keeps sites on our Netlify.

**Why it works:**
The biggest unspoken fear of a small business considering a website service is: *what if I get locked in and they hold my site hostage?* This fear is real — it happened to thousands of Polish SMBs with agencies that registered domains on their own accounts. Proactively addressing it — even when our model technically does hold the hosting — converts a potential objection into a trust signal. Transparency about constraints builds more trust than pretending they don't exist.

**Post angle:** *The fear your clients never say out loud — and how to answer it before they ask.*

---

## 19. Sticky mobile CTA bar

**Decision:** On screens under 768px, a fixed bottom bar appears with WhatsApp and phone call buttons — always visible regardless of scroll position.

**Why it works:**
Mobile users make decisions while doing other things — commuting, waiting, between meetings. The window of intent is short. A sticky bar means the action (call or WhatsApp) is never more than one thumb-tap away, at any point on the page. On desktop, users are in "research mode" and will scroll back to a form. On mobile, they're in "decide now" mode — and if the CTA isn't immediately visible, the moment passes. Local Polish SMBs overwhelmingly prefer WhatsApp and phone over forms. Meet them at the moment of decision.

**Post angle:** *Why your mobile website needs a different CTA than your desktop one.*

---

## 20. Speed as a trust signal, stated explicitly

**Decision:** "Loads in 1 second" is written as a headline in the trust section, not buried in technical specs.

**Why it works:**
Speed is invisible when it works and catastrophic when it doesn't. Most websites don't mention their speed because they can't promise it — they're running WordPress with 47 plugins. Stating it explicitly ("faster than 95% of local business sites") turns a technical advantage into a sales argument. It also implicitly attacks WordPress-based competitors without naming them. The client doesn't need to know what Netlify CDN is. They need to know their clients won't leave before the page loads.

**Post angle:** *The technical advantage most Polish business websites have — and don't know how to sell.*

---

## 21. "Zmiana w 15 minut" — automation as a client-facing feature

**Decision:** The 15-minute update promise is positioned as a competitive differentiator, with the explicit note: *"No agency offers this without automation — we have it."*

**Why it works:**
Most agencies take 3–5 business days to change a phone number. They email back and forth, someone forgets, it falls through the cracks. The 15-minute update is genuinely impossible to deliver manually at scale — it requires automation, which most freelancers don't have. Saying so directly ("no agency offers this without automation") is credible because it's true, and it pre-empts the prospect's assumption that all web providers are the same. It makes the constraint (automation required) into the proof of the feature.

**Post angle:** *The one feature no agency can offer without building it first.*

---

## 22. Benefit-first headlines, not company-first

**Decision:** Every headline on client sites follows the pattern: result for client, not description of service. "Strona która dzwoni za Ciebie" not "Profesjonalne strony internetowe."

**Why it works:**
"Profesjonalne strony internetowe" describes what the seller does. "Strona która dzwoni za Ciebie" describes what the buyer gets. The visitor's brain is constantly asking one question while reading a website: *what's in it for me?* Every headline that answers a different question loses a fraction of attention. Benefit-first copy keeps the visitor in their own frame of reference — their problem, their goal — rather than asking them to translate seller language into buyer language.

**Post angle:** *Rewrite your headline in 60 seconds: the before/after that changes everything.*

---

## 23. Copywriting as a service, not a requirement

**Decision:** "AI przygotuje resztę" — the client is told they don't need to write anything, repeatedly and in multiple places.

**Why it works:**
The number one reason local business owners delay building a website is not money. It's the dread of writing about themselves. They don't know what to say, they're afraid of sounding unprofessional, and nobody has told them they don't have to. Every time the page says "you don't need to prepare texts — AI generates them from your answers," it removes a blocker that was never a real blocker — just an assumed one. Removing assumed blockers is one of the highest-leverage moves in conversion copywriting.

**Post angle:** *The real reason local businesses don't have a website — it's not money.*
