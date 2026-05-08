# OneViz — Pipeline Architecture

Three-layer pipeline. Each layer has a clear input, output, and owner.

---

## Layers

```
Scout
  Input:  city + category (CLI args)
  Output: leads.json (candidate businesses)
  Script: scout.js (not yet built)

Scraper / Builder
  Input:  URL (from leads.json or direct CLI)
  Output: last-site-preview.html, last-preview.html, optional Cloudflare Pages URL
  Script: scrape.js (built, validated)

Human Review
  Input:  email preview + demo link
  Action: approve quality → send Email 1 manually
  Owner:  you
```

---

## Data flow

```
scout.js --city="Kraków" --category="fryzjer"
        │
        ▼
  leads.json   ←── filtered, rated, has-website-only
        │
  [human review: remove bad leads]
        │
        ▼
  run-queue.js leads.json --limit=5   (V2, not yet built)
        │
        ├── node scrape.js <url>  (per lead)
        │         │
        │         ├── last-site-preview.html  (template filled)
        │         ├── last-preview.html       (email copy UI)
        │         └── confidence score logged
        │
  [human review: check demo quality]
        │
        ▼
  Send Email 1 manually (issues hook, no demo link)
        │
        ▼
  Wait 3 days — no reply → Send Email 2 (demo link)
        │
        ▼
  Phone / WhatsApp close
```

---

## What is not automated (intentionally)

- **Email sending** — manual only. Polish ePrivacy/GDPR requires consent for electronic marketing.
- **Demo deployment** — `--deploy` is a manual flag, not automatic. Use only for prospects who responded.
- **Lead approval** — human reviews leads.json before running the queue.
- **Demo approval** — human reviews email preview before sending.

---

## Component status

| Component | File | Status |
|---|---|---|
| Scout | `scraper/scout.js` | Not built — spec in SCOUT_SPEC.md |
| Queue runner | `scraper/run-queue.js` | Not built — spec in PIPELINE_ROADMAP.md |
| Scraper | `scraper/scrape.js` | Built, validated on panminaostrzy.pl |
| Lead store | `scraper/leads.json` | Schema in LEAD_SCHEMA.md |
| Preview store | `scraper/previews/` | Not built (V2) |

---

## Related docs

- `docs/SCRAPER_CONTRACT.md` — scrape.js interface, env vars, outputs, error codes
- `docs/SCOUT_SPEC.md` — scout.js CLI, filters, Google Places integration, output format
- `docs/LEAD_SCHEMA.md` — canonical leads.json field definitions
- `docs/PIPELINE_ROADMAP.md` — V1 through V4 build sequence
- `ROADMAP.md` — business growth roadmap (Level 2→5, separate from this)
