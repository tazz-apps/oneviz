# OneViz — Roadmap

The goal is not to build better websites. The goal is to build a pipeline that generates websites.
The difference: a freelancer delivers projects. A pipeline delivers products.

---

## Where we are now — Level 2 (Good Freelancer)

- 3 HTML templates with 34 variables ✓
- Content collection form (Tally) ✓
- Maintenance update form ✓
- Scraper: URL → Netlify preview → cold email ✓
- Demo site live ✓
- Manual delivery: ~3–5 hours per site

Bottleneck: content collection and manual template fill.
Revenue ceiling at this level: ~10–15 sites/month solo.

---

## Near-term — Level 3 (Systematic Freelancer)
*Target: first 5 paying clients. Goal: prove the model, tighten the process.*

### First clients — Program Pilotażowy
499 PLN for first 5 clients (normally 1,490 PLN). Conditions: portfolio consent + testimonial + 10 min feedback call.
This is R&D, not revenue. Goal: test the pipeline, find the real bottleneck, collect social proof.
**Never call it a discount. Call it "Program Pilotażowy" — limited to 5 slots.**

Target profile: local Kraków businesses — insurance agents, financial advisors, real estate agents, kosmetolodzy. Fast decisions, clear scope, no committee.

Price ladder after pilot:
- Clients 1–5: 499 PLN (program pilotażowy)
- Clients 6–10: 790 PLN (have case studies)
- Clients 11–20: 990 PLN (proven process)
- Clients 21+: 1,490 PLN (full price, social proof established)

Rule: never lower price. Only raise it.

### Naming convention (do this before client #1)
Every client gets a consistent slug: `kowalski-ubezpieczenia`, `salon-kwiatkowski`
Used for: Netlify site name, folder, future repo/config naming.
Why it matters: after 20 clients, inconsistent naming creates chaos that's painful to fix retroactively.
- [ ] Add slug field to Tally form (done)
- [ ] Slug format: `{surname}-{industry}-{city}` — e.g. `kowalski-ubezpieczenia-krakow`. Three parts prevent collisions when same industry repeats across cities.
- [ ] Apply to all Netlify deploys going forward

### Client CRM (lightweight)
A simple Airtable or Notion table: one row per client.
Fields: name, slug, package, domain, Netlify URL, status, launch date, maintenance Y/N
Why it matters: without this, you'll be searching WhatsApp threads to find a client's domain at 11pm.
- [ ] Set up Airtable base "OneViz Clients"
- [ ] Add new client row at deposit received

### Scraper on real site
Test `scrape.js` on one real Polish business site.
Why it matters: cold outreach only works if the demo looks good. Need to validate extraction quality before sending to prospects.
- [ ] Run on 3 different site types (static, Wix, WordPress)
- [ ] Note which types extract well vs poorly
- [ ] Add extraction quality to cold email decision (don't send weak demos)

### Google Places API pre-fill
Client types their business name → Places API finds them → auto-fills phone, address, category, reviews.
Why it matters: removes the biggest friction point for clients who have a Google Business listing (most local businesses do). Also pulls real reviews — clients rarely have testimonials ready.
Effort: ~1 day. Requires Google API key (free tier covers this volume).
- [ ] Add to onboarding form as optional "find me on Google" step
- [ ] Map Places API response to {{VARIABLES}}

### Rotate Netlify token
Low urgency — token was briefly visible in local bash_profile, not exposed publicly.
- [ ] Generate new token at app.netlify.com → User settings → Applications

---

## Mid-term — Level 3.5 (Lead Capture Automation)
*Trigger: when manual scraper + email response becomes a daily chore (5+ leads/week)*

### Inbound lead flow — Phase 2 architecture
The OneViz website 3-field form (email + phone + business name/city + optional URL) triggers this pipeline:

```
Lead submits form
    ↓
Netlify Function ("the waiter")
    → stores lead in Airtable
    → sends instant confirmation email: "Sprawdź skrzynkę za kilka minut"
    → if URL: sends job to OpenClaw via Cloudflare Tunnel
    → if no URL: sends "we'll call you" email, flags for manual follow-up
    ↓
OpenClaw worker ("the cook") — polls every 10s
    → runs quality gate (content length check)
    → runs scrape.js
    → checks confidence score
    → HIGH (80+): sends demo email automatically via Resend
    → MED (50-79): sends demo email + flags for your review
    → LOW (<50): skips send, notifies you on WhatsApp: "lead came in, scraper failed, worth manual"
```

**Job queue** — simple JSON files in `scraper/jobs/`:
```
job-{timestamp}.json → { status: "pending|processing|done|failed", lead: {...}, result: {...} }
```
Restart-safe, debuggable, no database needed at this volume.

**Email service:** Resend (resend.com) — free tier 100 emails/day, simple API, good deliverability.

**Cloudflare Tunnel:** exposes OpenClaw endpoint publicly without a static IP. Free. Alternative: small Hetzner VPS (€4/month) if scraping gets blocked.

### Lead form fields (OneViz website)
5 fields — richer than 3, handles URL failure gracefully:
1. Email (required)
2. Phone (required)
3. Business name (required) — fallback for Google enrichment when URL fails
4. City (required) — fallback
5. Existing website URL (optional)

### Email sequence (2-step drip)

Two-step flow: lead sees issues first, demo only after they show interest — or after 3 days of silence.
Scraper runs immediately on URL submission but demo is held back intentionally.

```
URL submitted → scraper runs → issues extracted + demo built
    ↓
Email 1 (immediate): issues only, no demo link
    ↓
Response? → send demo link immediately
No response → wait 3 days → Email 2: demo link
```

**Email 1 — Issues hook (sent immediately, URL path):**
> Temat: [Nazwa firmy] — znaleźliśmy 3 rzeczy do poprawy
>
> Dzień dobry,
> przejrzałem stronę [domain].
>
> 3 rzeczy które tracą klientów:
> • [_issue 1]
> • [_issue 2]
> • [_issue 3]
>
> Każdą z nich możemy naprawić.
> Chcesz zobaczyć jak to mogłoby wyglądać? Odpisz lub zadzwoń: [your number]

**Email 2 — Demo follow-up (day 3, no response):**
> Temat: [Nazwa firmy] — przygotowałem podgląd
>
> Dzień dobry,
> pisałem kilka dni temu o [_issue 1].
> W międzyczasie przygotowałem wstępny projekt:
>
> 👉 [Netlify preview URL]
>
> Zajmuje 30 sekund żeby rzucić okiem.
> Jeśli coś zainteresuje — zadzwoń: [your number]

**Email — No URL path (sent immediately when no URL provided):**
> Temat: Dziękujemy za kontakt
> Przygotowujemy indywidualną propozycję — zadzwonię w ciągu 24h.

**Phase 1 (manual):** scraper outputs issues + demo link in terminal. You send Email 1 manually.
Set 3-day phone reminder. No reply → send Email 2 with demo link.

**Phase 2 (automated):** Airtable status field: `scraped` → `email1_sent` → `demo_sent` → `responded` → `closed`.
Resend handles scheduled Email 2 on day 3.

---

## Mid-term — Level 4 (Productized Agency)
*Target: 5–20 clients. Goal: cut delivery time from 3–5h to under 1h per site.*

### AI content generation from form data
Current flow: client answers → you write copy → fill template.
New flow: client answers → Claude generates copy → you review and approve → fill template.
Why it matters: content writing is the biggest time sink per delivery. AI can handle 80% of it from structured form input.

How: take Tally form submission → feed to Claude with this prompt pattern:
```
"Transform this client data into website copy using this schema.
Return only JSON. Short sentences. Local SEO. Benefit-driven."
```
Estimated time saving: 2–3h per site → 20 min review.

Implementation:
- [ ] Write `generate.js` — takes form CSV/JSON → calls Claude API → outputs filled `{{VARIABLES}}` JSON
- [ ] Add to PROMPT.md: structured input schema (Dla kogo / Problem / Efekt → service copy)
- [ ] Test on Natalia's data first

### Make/Zapier automation — notifications only (start here)
Don't automate the full pipeline yet. Start with just: form submitted → you get notified → Airtable row created.
Why notifications first: you need to understand where the manual work actually is before automating it.
Effort: 2 hours with Make free tier.

Full pipeline (later, when you have 10+ clients):
```
Tally submission → Make → Airtable (create record) → Claude API (generate content) → GitHub (create config) → Netlify (trigger build) → WhatsApp (send preview link)
```

### SEO automation
With each site: Claude generates title tag, meta description, Open Graph tags, FAQ schema from service descriptions.
Why it matters: manual SEO per site takes 30–45 min. Automated: 0 min. Small thing, but at 20 sites/month it compounds.

### Maintenance subscription workflow
- [ ] Set up recurring payment link (Stripe or Fakturownia auto-invoice)
- [ ] Build client list with subscription status
- [ ] Form 2 (Zmiana na stronie) → sent to all active maintenance subscribers

---

## Long-term — Level 5 (AI-First Agency)
*Target: 20–50+ sites/year. Goal: AI does 70% of the work, you supervise.*

### JSON config architecture
*Design constraints (apply when building, not before):*
*— Schema defines intent, not style: `"importance": "primary"` not `"color": "#3B82F6"`. Template handles the visual.*
*— Avoid the Inner Platform Effect: if the schema grows complex enough to reinvent HTML/CSS inside JSON, it's too complex. Keep structure lean, style via CSS variables only.*
Current: one HTML file per client with `{{VARIABLES}}` replaced.
Future: one template + one `config/kowalski.json` per client.

```json
{
  "slug": "kowalski-ubezpieczenia",
  "name": "Jan Kowalski",
  "phone": "+48123456789",
  "cta": "call",
  "services": [
    { "title": "Ubezpieczenia OC", "desc": "..." }
  ],
  "reviews": [
    { "text": "...", "author": "..." }
  ]
}
```

Why it matters:
- Update a phone number = edit one JSON field, rebuild. No HTML touching.
- AI regenerates copy = rewrite JSON values, same template.
- Versioning: git diff shows exactly what changed between client revisions.
- Enables bulk operations: update footer across all 50 client sites in one script.

Migration: non-breaking. Current `{{VARIABLE}}` HTML can be converted by a script. Do it when you hit 20 clients.

### CLI tool
```bash
create-site kowalski-ubezpieczenia --package=business --style=light-minimal
```
Creates: config JSON, Netlify site, populates Airtable record, opens preview URL.
Why it matters: current deploy sequence is 6 manual steps. CLI makes it one command.
Effort: ~2 days. Build after the JSON config architecture is in place.

### Full automation pipeline
```
Tally form submitted
  → Make: save to Airtable, trigger AI
  → Claude API: generate content JSON
  → GitHub API: commit config file
  → Netlify: auto-build and deploy
  → WhatsApp: send preview link to client
```
Human in the loop: review AI-generated content before Netlify deploy (one approval step).
Estimated delivery time per site at this level: 20–30 min of your time.

### Revenue model at scale

| Volume | Avg package | Monthly revenue | Your time/month |
|--------|-------------|-----------------|-----------------|
| 5 sites | 2,000 PLN | 10,000 PLN | ~20h |
| 15 sites | 2,000 PLN | 30,000 PLN | ~25h (with automation) |
| 40 sites | 2,000 PLN | 80,000 PLN | ~30h (full pipeline) |

Maintenance subscriptions compound: 20 clients × 150 PLN = 3,000 PLN/month recurring, zero delivery work.

---

## What NOT to do (yet)

| Idea | Why not now |
|------|------------|
| Astro / React / Tailwind | Working HTML templates are an asset. Rewrite = weeks of work for zero client-visible benefit. |
| AI image generation | Stock photos work fine. Add when clients ask. |
| Custom CMS for clients | Maintenance subscription model is simpler and more profitable. |
| App / SaaS dashboard | Build 10 sites first. Validate the market before building infrastructure for it. |

---

## Maturity levels

```
Level 1 — Experiment     ← where we started
Level 2 — Good Freelancer ← where we are now ✓
Level 3 — Systematic      ← next milestone (first 5 clients)
Level 4 — Productized     ← 5-20 clients
Level 5 — AI-First Agency ← 20+ clients/year
```

The jump from Level 2 to 3 is process discipline.
The jump from 3 to 4 is AI-assisted content.
The jump from 4 to 5 is full automation.

Don't skip levels. Each one builds the foundation for the next.

**Golden rule:** if you do something manually twice with the second client — automate it. Your bottleneck is never the code. It's content chaos from clients. That's what AI solves.
