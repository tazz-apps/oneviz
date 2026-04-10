# OneViz — TODO & Backlog

*Single source of truth for everything pending. Update after each session.*
*Last updated: 2026-04-10*

---

## 🔴 Before First Client (Critical Path)

These block the first sale. Do before sending any cold outreach.

- [ ] **Domain** — register `oneviz.pl` (or alternative). Update `canonical` in `website/index.html`
- [ ] **Contact email** — replace `kontakt@oneviz.pl` placeholder in website footer with real email
- [ ] **Phone / WhatsApp numbers** — replace `+48000000000` in two places: sticky bar CTA + WhatsApp button (`wa.me/48000000000`). Both in `website/index.html`
- [ ] **Netlify token** — rotate at app.netlify.com → User settings → Applications. Was briefly visible in bash_profile
- [ ] **Microsoft Clarity** — create free account at clarity.microsoft.com, set up project, replace `CLARITY_PROJECT_ID` placeholder in:
  - `website/index.html`
  - `templates/dark-pro/index.html`
  - `templates/light-minimal/index.html`
  - `templates/bold-color/index.html`
- [ ] **Natalia demo URL** — replace `https://oneviz-demo-natalia.netlify.app` in `website/index.html` with real Netlify URL after deploy
- [ ] **Natalia brief** — fill in real contact info, services, bio in `demo/natalia/index.html` (currently has placeholder data)
- [ ] **Tally forms** — build Form 1 (onboarding) and Form 2 (maintenance updates) manually using spec in `tally-forms.md`

---

## 🟡 After First Client / Ongoing Process

- [ ] **Airtable CRM** — create base "OneViz Clients", one row per client: name, slug, package, domain, Netlify URL, status, launch date, maintenance Y/N
- [ ] **Slug convention** — apply `{surname}-{industry}-{city}` naming to every new Netlify deploy going forward
- [ ] **"Zostało 5 miejsc"** — static text in Program Pilotażowy section. Update manually in `website/index.html` after each pilot client signs
- [ ] **Scraper validation** — test `scraper/scrape.js` on 3 real Polish business sites: one WordPress, one Wix, one static. Note which types extract well. Don't send cold outreach until validated

  **Test 1 — panminaostrzy.pl (2026-04-10) — ✅ resolved**
  - v1: 16/34 fields, confidence 50/100, name "Bogdan Adm PMN", wrong phone "280-746548"
  - v2 (current): 23–32/34 fields, confidence 80/100, name "Bogdan Pusz" (email fallback), phone "791 382 022" (aria-label)
  - Fixes applied: htmlToText, category detection (rzemiosło), tone detection (casual), phone priority chain, name-from-email fallback, issues filter
  - Still missing on site: prices, business hours, address — correct issues in email
  - Verdict: ✅ sendable — email output is clean, issues are real

  **Still needed:**
  - WordPress site test (Test 2)
  - Static site test (Test 3)
- [ ] **Price ladder** — update website pricing after pilot slots fill: 1–5 → 499 PLN, 6–10 → 790 PLN, 11–20 → 990 PLN, 21+ → 1,490 PLN. Never lower, only raise

---

## 🟢 Level 3 Backlog (after first 5 clients)

- [ ] **Google Places API pre-fill** — client types business name → auto-fills phone, address, category, reviews. Add to onboarding form as optional step. ~1 day effort. Requires Google API key (free tier)
- [ ] **Make/Zapier notifications** — form submitted → you get notified + Airtable row created. Start with notifications only, not full automation. ~2h with Make free tier
- [ ] **Scraper: `--ngrok` flag** — spin up local file server + ngrok tunnel → shareable URL for cold outreach without spending Netlify credits. Three-stage model: no flag = local review, `--ngrok` = cold email (free), `--deploy` = committed client (Netlify, permanent)
- [ ] **Scraper: add `--slug` flag** — pass client slug via CLI so `deployToNetlify()` uses it instead of auto-generated name. Keeps Netlify site names consistent with convention
- [ ] **Resend.com email account** — set up for Phase 2 automated drip. Free tier: 100 emails/day. Needed when lead volume > 5/week

---

## 🔵 Level 4 Backlog (5–20 clients)

- [ ] **`generate.js` — AI content from Tally form** — takes Tally CSV/JSON → calls LLM (Groq primary, Claude fallback — same pattern as scrape.js) → outputs filled `{{VARIABLES}}` JSON. Cuts delivery from 3–5h to 20 min review. Test on Natalia's data first. Input: brief answers (~1,500 tokens in). Output: all 34 fields generated, not extracted. Quality depends on how much detail client provides in form.
- [ ] **SEO automation** — Claude generates title tag, meta description, OG tags, FAQ schema from service descriptions. Add to delivery checklist
- [ ] **Maintenance subscription workflow** — set up recurring payment link (Stripe or Fakturownia auto-invoice). Build client list with subscription status
- [ ] **Phase 2 lead pipeline** — waiter-cook async architecture: Netlify Function → Airtable → OpenClaw → Resend. See ROADMAP.md Level 3.5 for full spec
- [ ] **Sticky phone CTA on client templates** — add fixed bottom bar (phone + WhatsApp) to all 3 templates for mobile. Currently only on OneViz website

---

## 💡 Ideas & Feature Requests

*Documented for future consideration. Not committed yet.*

### WordPress Conversion Add-on
**Origin:** prospect/client asked about it directly (2026-04-09)

**What it is:** Convert a finished OneViz static HTML site into a WordPress theme so the client can self-edit via wp-admin.

**How it works technically:**
- Templates are clean HTML with `{{VARIABLES}}` — conversion is mechanical
- Split `index.html` → `header.php`, `footer.php`, `page-home.php`, `functions.php`, `style.css`
- Replace `{{VARIABLE}}` → `<?php the_field('VARIABLE'); ?>` (ACF)
- Register all 34 variables as ACF field group
- Output: WordPress theme zip ready to upload

**Script idea:** `convert-to-wp.js` — automates 80% of conversion. Input: filled HTML. Output: WordPress theme folder + zip. ~2–3h to build, reusable forever.

**Pricing:**
- WordPress Migration (client wants CMS): 800–1,200 PLN add-on
- Code Export + WP Theme (client has own WordPress hosting): 1,500–2,000 PLN

**Important caveat:** Once on client's WordPress, automated maintenance (15-min updates) stops working. Must be in contract. This is actually a sales argument for staying on Netlify.

**Status:** Idea stage. Build `convert-to-wp.js` after `generate.js` is done (Level 4).

---

### Microsoft Clarity Data for Content Refresh
**Origin:** Clarity added to all templates 2026-04-09

After 3–6 months of data: use Clarity heatmaps + scroll depth to identify which sections get ignored → feed to Claude for AI Content Refresh (Pro maintenance plan feature). Turns usage data into automated copy improvements.

---

### Language Toggle for Client Sites
**Origin:** Built for OneViz website, not yet in client templates

Add bilingual toggle (data-pl/data-en pattern) to templates as optional feature. Relevant for: border cities (Kraków near Slovakia/Czech), professionals with international clients, travel/hospitality. Add-on: 200–400 PLN.

---

### Booking / Calendar Integration
Already in add-ons list (400–800 PLN). Priority target: beauty, fitness, medical clients. Calendly embed is simplest — one `<iframe>`, zero backend.

---

### Google Business Profile Badge
Pull live Google rating (⭐ 4.8 · 127 opinii) via Places API and display as trust signal on client site. Auto-updates. Requires Places API key already needed for pre-fill feature.

---

## 📋 Completed

- [x] 3 HTML templates (dark-pro, light-minimal, bold-color)
- [x] Natalia demo site built
- [x] `scraper/scrape.js` — URL → Netlify deploy → cold email output
- [x] Bug fix: `confidence` not destructured from `extractData()` in main() — was always `undefined`
- [x] Quality gate (content length check) + confidence scoring
- [x] 2-step drip email sequence in scraper output
- [x] `scraper/last-preview.html` — email preview with copy buttons
- [x] `brief.md` — client onboarding form
- [x] `tally-forms.md` — full Tally build spec (Form 1 + Form 2)
- [x] `packages.md` — pricing tiers + maintenance + add-ons
- [x] `ROADMAP.md` — Level 2→5 growth map
- [x] `website/index.html` — OneViz service landing page
- [x] `website/design-decisions.md` — 23 documented design decisions for microblog
- [x] Microsoft Clarity snippet added to all templates + website
- [x] Nav links added to website (Jak działa / Demo / Cennik / Kontakt)
- [x] "Strona jak lodówka" trust section (5 cards including Clarity)
- [x] Growth path strip (One-Page → Podstrony → Blog → Automatyzacja)
- [x] Sticky mobile CTA bar (WhatsApp + Zadzwoń)
- [x] Language toggle (PL/EN) with localStorage persistence
- [x] FAQ accordion (5 questions)
- [x] Program Pilotażowy pricing card
- [x] Sample email section with animated issues
- [x] Scraper LLM: switched to Groq (llama-3.1-8b, free tier) as primary, Claude as fallback. Gemini blocked in Poland/EU (free tier limit=0 on all models — confirmed 2026-04-10)
