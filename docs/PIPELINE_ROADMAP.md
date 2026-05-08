# OneViz Pipeline — Technical Roadmap

Build sequence for the Scout → Scraper → Human Review pipeline.
For the business growth roadmap (Level 2→5) see `/ROADMAP.md`.

---

## V1 — Scout (current build target)

**Goal:** Replace "find a URL, run scraper manually" with a structured, filterable lead list.

**Deliverables:**
- `scraper/scout.js` — Google Places → `leads.json`
- `scraper/leads.json` — canonical lead file (gitignored)

**CLI:**
```bash
node scout.js --city="Kraków" --category="fryzjer" --limit=20
```

**Scraper changes:** none. Human picks URLs from leads.json and runs scrape.js individually.

**Human review gates:**
1. Review leads.json — remove chains, bad fits, already-contacted
2. Run `scrape.js` on approved leads one at a time
3. Review email preview before sending any outreach

**Spec:** `docs/SCOUT_SPEC.md`

---

## V2 — Queue Runner

**Trigger:** Running scrape.js on 5+ leads per day manually becomes a bottleneck.

**Deliverables:**
- `scraper/run-queue.js` — reads leads.json, runs scrape.js per lead, writes results back
- `--slug` flag added to scrape.js — uses leads.json `id` as Cloudflare project name for consistent naming
- `scraper/previews/{id}.html` — per-lead preview copies so results aren't overwritten

**CLI:**
```bash
node run-queue.js leads.json --limit=5 --style=light-minimal
```

**Behavior:**
- Processes only `status: "approved"` leads
- Sequential execution (not parallel — Groq rate limit: 6000 TPM)
- Updates lead status: `approved` → `scraped` | `scrape_failed`
- Writes `confidence`, `fieldsFilledCount`, `error` into each lead's `scrapeResult`

**Human review gate remains:** inspect previews folder before sending email.

---

## V3 — Confidence-based Review Queue

**Trigger:** Queue volume makes reviewing every result the new bottleneck.

**Deliverables:**
- run-queue.js flags `confidence >= 80` as `status: "review_ready"`
- Post-run console summary: `"5 processed — 3 review_ready, 1 low confidence, 1 failed"`
- `scraper/review/` folder: only `review_ready` previews copied here for easy access

**Still no auto-email. Still human-approved per send.**

---

## V4 — Resend Drip Integration

**Trigger:** Approved leads exceed what manual email sending can handle (5+ per day sustained).

**Deliverables:**
- Resend.com account + `RESEND_API_KEY` in `.env`
- `scraper/send-email.js <lead-id>` — sends Email 1 via Resend for a specific lead
- Airtable CRM status sync — `email1_sent`, `email2_sent` written back to leads.json
- Email 2 scheduled via Resend scheduled send (day 3, triggered by human or Airtable automation)

**Human approval still required** — `send-email.js` is a one-lead-at-a-time tool, not a bulk sender.

This maps to Level 3.5 in `/ROADMAP.md` (the Phase 2 waiter-cook architecture). Do not build until lead volume makes manual sending the actual bottleneck.

---

## What will not be automated

| Action | Reason |
|---|---|
| Sending Email 1 without human approval | Polish ePrivacy + GDPR — electronic marketing requires consent or legitimate interest handled carefully |
| Auto-deploying to Cloudflare Pages per lead | Deploy only for committed prospects; accumulating projects costs nothing but creates noise |
| "No website" businesses via current scraper | scrape.js requires a URL — this is a separate product path (`--source=facebook`, planned) |
| Parallel scraper execution | Groq free tier rate limit (6000 TPM) — sequential is the correct default |

---

## Open questions (decide before building V1)

These are business decisions not yet documented anywhere:

| Question | Decision needed |
|---|---|
| Which cities to target in V1? | Kraków only, or Kraków + Warszawa? |
| Minimum rating threshold? | 3.5 is the spec default — override? |
| Minimum review count? | 5 is the spec default — override? |
| Contact email: collect from site or Google only? | Google Places often has phone but not email |
| Prefer generic emails (`kontakt@`, `biuro@`) over personal? | Filter in scout or leave to human review? |
| PageSpeed pre-filter? | V1: no. V2: optionally add as secondary filter |

---

*Last updated: 2026-05-08*
