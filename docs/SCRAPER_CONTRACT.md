# OneViz Scraper — Contract

Interface documentation for `scraper/scrape.js`. Do not change the CLI or output format without updating this doc.

---

## CLI

```bash
node scrape.js <url> [--style=<style>] [--deploy] [--deploy-netlify]
```

| Arg | Type | Default | Description |
|---|---|---|---|
| `<url>` | positional, required | — | Target business site URL |
| `--style=<style>` | optional | `dark-pro` | Template: `dark-pro`, `light-minimal`, `bold-color` |
| `--deploy` | flag | off | Deploy to Cloudflare Pages (permanent public URL) |
| `--deploy-netlify` | flag | off | Deploy to Netlify (legacy fallback) |

Without a deploy flag: local files only. No deploy API cost.

---

## Required env vars

File: `scraper/.env` (gitignored — never commit). Template: `scraper/.env.example`

| Var | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Yes (or ANTHROPIC) | Primary LLM — free tier, llama-3.1-8b-instant |
| `ANTHROPIC_API_KEY` | Yes (or GROQ) | Fallback LLM — Claude Haiku |
| `CLOUDFLARE_API_TOKEN` | Only for `--deploy` | Cloudflare Pages deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Only for `--deploy` | Cloudflare account identifier |
| `NETLIFY_API_TOKEN` | Only for `--deploy-netlify` | Netlify legacy fallback |

---

## Processing steps

```
Step 1 — Fetch HTML
  GET <url>, follow redirects (max 3)
  Gate: content length < 800 bytes → LOW_CONTENT error

Step 2 — Pre-extract
  Regex scan raw HTML for PHONE, EMAIL, title, H1, NIP
  Phone priority: tel: href → aria-label → JSON-LD → text regex
  Gate: no phone AND no email → NO_CONTACT error

Step 3 — Classify (Groq only, cheap call ~20 tokens)
  Category: rzemiosło | usługi | uroda | gastronomia | handel
  Tone:     casual | warm | formal
  6-second pause after classify to avoid Groq TPM collision

Step 4 — Extract (Groq primary → Claude fallback)
  Returns: 34 {{VARIABLES}} + _issues[] + _confidence
  Gate: _confidence < 50 → LOW_CONFIDENCE error

Step 5 — Fill template
  templates/{style}/index.html → all {{VARIABLE}} tokens replaced
  Missing fields → empty string (no broken tokens in output)

Step 6 — Deploy (conditional on flag)
  --deploy:         Cloudflare Pages, new project per run: oneviz-{slug}-{timestamp}
  --deploy-netlify: Netlify
  No flag:          skip, local file only

Step 7 — Output
  Write scraper/last-site-preview.html
  Write scraper/last-preview.html
  Print cold email copy to terminal
  Auto-open last-preview.html in browser
```

---

## Output files

| File | Written when | Content |
|---|---|---|
| `scraper/last-site-preview.html` | Every successful run | Filled HTML template — local preview |
| `scraper/last-preview.html` | Every successful run | Email preview UI with copy buttons (Email 1 + Email 2) |

Both files are overwritten on each run. No history kept. If you need to preserve a result, copy it manually before the next run.

---

## Confidence score

Returned by LLM as `_confidence` (0–100).

| Range | Label | Scraper behavior |
|---|---|---|
| 80–100 | Ready to send | Logged as `✓ send` |
| 50–79 | Review first | Logged as `⚠ review first` |
| 0–49 | Manual enrichment | **Throws LOW_CONFIDENCE — no output files written** |

---

## Exit errors

| Error code | Cause | Remedy |
|---|---|---|
| `LOW_CONTENT` | HTML body < 800 bytes — JS-rendered (Wix, Squarespace, WebWave) | Manual enrichment, or `--source=facebook` (not yet built) |
| `NO_CONTACT` | No phone or email in raw HTML | Site has no static contact info |
| `LOW_CONFIDENCE` | LLM extraction confidence < 50/100 | Content too thin — manual enrichment needed |

---

## Extracted data schema

34 template variables. Full field list with descriptions in `scrape.js` lines 277–323 (the `EXTRACTION_PROMPT`).

Key fields: `FULL_NAME`, `TITLE`, `TAGLINE`, `CITY`, `PHONE`, `EMAIL`, `PHOTO_URL`, `BIO_SHORT`, `BIO_LONG`, `EXPERIENCE_YEARS`, `CLIENTS_COUNT`, `SERVICE_1..3_TITLE/DESC/PRICE`, `WHY_1..3_TITLE/DESC`, `REVIEW_1..2_TEXT/AUTHOR`, `PROCESS_TITLE`, `PROCESS_STEPS`, `PERSONAL_QUOTE`, `QUOTE_AUTHOR`, `CTA_PRIMARY`, `CTA_SECONDARY`, `LINKEDIN_URL`, `FACEBOOK_URL`, `INSTAGRAM_URL`, `WHATSAPP_NUMBER`, `GOOGLE_MAPS_EMBED`

---

## Known limitations

- **Single URL per run.** No batch mode. Use `run-queue.js` (not yet built) to process leads.json.
- **One Cloudflare Pages project per `--deploy` run.** Projects accumulate; no reuse or cleanup.
- **No result persistence.** Output files are overwritten each run.
- **Wix / Squarespace / WebWave:** always fails — JS-rendered, no static content.
- **`--source=facebook` not built.** Planned for Level 3 backlog — businesses with no scrapeable website.

---

## Validated runs

| Site | Date | Result | Confidence | Notes |
|---|---|---|---|---|
| panminaostrzy.pl | 2026-04-10 | Pass | 80/100 | 23–32/34 fields, verdict: sendable |
