# OneViz — Business Ideas & Strategic Analysis

*Documented strategic directions that are not yet committed. Not a backlog — a thinking tool.*
*Last updated: 2026-04-11*

---

## Idea 2 — AEO Positioning + JSON-LD Schema (OneViz & Client Templates)

**Origin:** Brainstorming session 2026-04-11 — "Built for humans, optimized for bots" concept

---

### What's real and actionable

**1. JSON-LD LocalBusiness schema on client templates (near term, Level 3)**

The most concrete takeaway. Every client template currently outputs clean semantic HTML but no structured data. Adding a `<script type="application/ld+json">` block to each template with `LocalBusiness` schema (name, phone, address, opening hours, services, geo coordinates) takes ~1 hour per template and gives client sites a genuine edge:

- Google surfaces the data in rich results (phone, hours directly in search)
- AI assistants (ChatGPT browsing, Perplexity, Google SGE) cite structured sources preferentially
- Fills in data already extracted by the scraper — `{{PHONE}}`, `{{ADDRESS}}`, `{{HOURS}}` map directly to schema fields

Variables to wire up: `name`, `telephone`, `address`, `openingHours`, `description`, `geo` (if address available), `url`.

**When to build:** Before client #3. Becomes a real differentiator in cold emails — "twoja strona będzie widoczna dla asystentów AI, nie tylko wyszukiwarek."

**2. "Built for humans, optimized for bots" as positioning copy**

Strong tagline. In Polish context, keep it English (tech-credibility signal) or adapt: *"Widoczna dla ludzi. Czytelna dla algorytmów."* Applies directly to OneViz website — replace or supplement the current H1. The argument is already true: clean static HTML with semantic structure outperforms Wix/WordPress generated bloat in both speed and machine-readability.

**Add to website:** One short paragraph in the "Jak działa" or features section. Not a new page — one paragraph.

---

### What's noise for OneViz (discard)

- **MACH architecture** — Microservices/API-first/Cloud-native/Headless. Irrelevant. OneViz sells 1-page static HTML to hydraulics and hairdressers. Zero need for any of this at any foreseeable scale.
- **Agentic Commerce Protocol / A2A / UCP** — Real standards, wrong audience. A Polish local SMB is not implementing checkout via AI agent tokens. This is enterprise e-commerce territory, 5+ years from the target market.
- **"The Only Interface" SaaS** — Described as a separate project in the source material and it is. Different business model, different stack, different market. Not OneViz.
- **MACH "digital nervous system" metaphor** — Useful for a CTO pitch deck. Useless for cold-emailing a roofer in Kraków.

---

### New project assessment: AEO-as-a-Service

The "optimize for AI agents" angle could theoretically become a separate product for larger clients (e-commerce, service marketplaces) who want their catalog machine-readable. Out of scope for OneViz Phase 1-3. If it ever becomes relevant, the entry point would be adding schema generation to `generate.js` and selling it as an SEO add-on (200–400 PLN one-time).

---

## Idea 1 — AI Local Concierge (Booking + Lead Recovery + CRM)

**Origin:** Gemini analysis + missed call discussion (2026-04-11)

---

### What it is

An AI agent embedded in a local business's digital presence (website, WhatsApp, Instagram DM) that:

- Answers FAQs (price, availability, procedure details)
- Books appointments in real time (Booksy, Calendly)
- Detects high-intent leads and notifies the owner instantly
- Writes a structured summary to CRM (Pipedrive, Livespace) with intent score and recommended next step
- Recovers missed opportunities — user leaves without booking → follow-up trigger

Not a chatbot. A lead capture + qualification + routing engine across all entry points.

---

### Best entry niche: Premium Aesthetic Clinics (Kraków)

**Why aesthetic clinics before legal or general SMB:**

- Decision speed: clinic owner closes in one call if you show ROI. Lawyers analyze for weeks.
- Lead → cash cycle is short (same day/week). Botox, fillers, treatments = high-margin, fast decisions.
- 70% of their communication is repetitive dumb questions: "Ile kosztuje?", "Czy boli?", "Jak długo trwa?" → perfect for AI automation.
- They already live in Booksy + Instagram + WhatsApp → the cross-platform story is immediately credible.
- Polish market less saturated than US. SMBs less AI-adopted → bigger delta in value delivered.

**Legal is Phase 2:**
- Lead value is massive (5k–20k zł+)
- Strong pre-qualification need
- But: slower decisions, compliance awareness required, more complex reasoning flows
- Revisit after version 1.0 is proven

---

### The killer feature

**High-intent lead detection.** When a user says:
- "price for full lips"
- "appointment this week"
- "is it safe for me"

Trigger: notify owner instantly + generate a draft reply + push to CRM.

This is where it's not a chatbot — it's a revenue recovery system.

---

### Positioning (Polish market)

Do NOT say: "AI chatbot" or "AEO optimization"

Say: **"Odzyskujemy klientów, którzy już byli na Twojej stronie, ale nie umówili wizyty."**
("We recover customers who were already on your site but didn't book.")

Or: **"AI employee for your website that books, answers, and brings you customers from AI search."**

---

### AEO layer (Answer Engine Optimization)

Highest long-term asymmetry. As AI search (ChatGPT, Perplexity, Gemini) replaces Google for local queries, businesses need to be *answerable* — not just indexable.

The concierge product has a natural AEO advantage:
- Already controls the website layer
- Already generating conversations = real user intent data
- Can auto-generate "answerable content" (FAQ schema, structured data, natural language answers)
- Can track what people actually ask → optimize for it

Pure AEO tools can't do this. This becomes the moat extension in Phase 2.

**Why AEO is not the first product:**
- SMBs don't understand it yet
- "SEO déjà vu" skepticism ("we've been burned before")
- Proving value requires education + time
- Strong for agencies, content-heavy businesses, SaaS — not for day-1 local SMB pitch

---

### The moat

Not the AI models. Not the prompts.

1. **Integrations** — Booksy, Calendly, Pipedrive, Livespace, WhatsApp Business API. Each integration is a switching cost.
2. **Vertical specialization** — clinic-specific conversation flows, objection handling, treatment knowledge base. Generic tools can't match this.
3. **Data loop** — conversations → intent patterns → conversion outcomes → better flows → better results. Compounds over time.

Google and Booksy will build generic versions. You win by being cross-platform, niche-customized, and ROI-focused.

---

### MVP feature set (tight scope for first 3 clients)

1. Smart chat on website — FAQs, treatment suggestions, objection handling
2. Booking integration — Booksy or Calendly, real-time slots
3. High-intent lead detection — instant owner notification
4. CRM write — Pipedrive/Livespace push with summary + intent score
5. Missed opportunity recovery — exit trigger or email capture + automation

---

### Stack complexity assessment

**5–10x more complex than OneViz.** This is not a warning to avoid it — it's a scoping reality.

OneViz stack: static HTML + Groq LLM + Netlify deploy. A competent developer can ship a client site in hours.

This stack requires:
- Real-time calendar APIs (Booksy API is not developer-friendly)
- CRM webhook pipelines (Pipedrive/Livespace integration and mapping)
- Multi-channel routing (website chat + WhatsApp Business API + Instagram DM)
- AI conversation flows that stay on-topic and don't hallucinate medical/treatment info
- State management across sessions (user leaves and comes back)
- Notification infrastructure (instant owner alerts, not polling)

Realistic pre-client build time: **2–3 months solo**, not 4 weeks. The Gemini "2–4 week MVP" estimate assumes a team or dramatically reduced scope.

---

### Strategic relationship to OneViz

These are not competing businesses. OneViz is the distribution channel for the concierge.

**Natural sequence:**

1. Close 3–5 OneViz clients — website pipeline already built, just needs cold outreach
2. Ship "Missed call → WhatsApp transcript" as a OneViz add-on (79–99 PLN/month, Twilio + Whisper, ~$3–5/month cost). This is the entry point to the voice/notification layer.
3. Learn which clients have a real lead-capture problem vs. just needing a website
4. Concierge becomes either an upsell to existing OneViz clients, or a clean pivot with paying reference customers

OneViz clients = qualified leads for the concierge. The relationship is additive, not a fork.

---

### Honest assessment

**Strategically correct. Operationally premature as a first move.**

The analysis (aesthetic clinics, local moat, AEO as a layer, CRM write as the real differentiator) is sound. This is a better business than OneViz long-term — larger TAM, deeper moat, more defensible.

The execution risk at Day 0: stack complexity is real, sales cycle is unknown, and integration reliability (especially Booksy) is unproven. You need at least one paying customer somewhere before splitting focus.

**Verdict:** Build this. But not yet. OneViz gets you to local businesses and cash flow. The concierge is where you take those clients and the knowledge you've built, and move up-market.

---

*Next review: after OneViz pilot client #1 closes.*
