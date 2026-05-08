# OneViz — Changelog

Notable decisions, builds, and deployments. One entry per session with significant changes.

---

## 2026-05-08 — Session 8: Scout pipeline + technical docs

**What changed:**
- `scraper/scout.js` — new script: Google Places API (new, 2022+ endpoint) → `leads.json`. Filters: rating ≥ 4.0, reviews ≥ 10, has website, no chains. Default merge behavior (safe); `--replace` for explicit overwrite; `--dry-run` for testing.
- `scraper/.env.example` — added `GOOGLE_PLACES_API_KEY`
- `OPERATIONS.md` — added Google Cloud setup step (Places API, budget alert)
- `CLAUDE.md` — file map updated to include `docs/`, `scout.js`, `OPERATIONS.md`
- `docs/ARCHITECTURE.md` — pipeline overview: Scout → Scraper → Human Review
- `docs/SCRAPER_CONTRACT.md` — scrape.js interface reference
- `docs/SCOUT_SPEC.md` — scout.js spec (Google Places new API, V1 filters, pricing)
- `docs/LEAD_SCHEMA.md` — canonical leads.json schema + status lifecycle
- `docs/PIPELINE_ROADMAP.md` — V1→V4 technical build sequence
- Obsidian vault: `Projects/OneViz/` — 6 business-facing docs created

**Why:**
Formalised the three-layer pipeline (Scout → Scraper → Human Review) based on architectural review with Codex. Scout is the missing front-end: everything downstream (scrape.js, Cloudflare deploy, cold email) already existed.

**State:** scout.js local-only, not yet run against real API. Awaiting Google Cloud API key setup before first dry-run.

---

## 2026-04-11 — Session 6–7: Cloudflare Pages migration + scraper quality fixes

**What changed:**
- `scraper/scrape.js` — Cloudflare Pages deploy (`--deploy`), Groq as primary LLM, category/tone detection, phone priority chain, name-from-email fallback, segment-aware booking hints, 2-step email output
- `scraper/last-preview.html` — email preview UI with copy buttons
- All 3 templates — JSON-LD LocalBusiness schema, booking placeholder
- `website/index.html` — AI Value section, scope section, booking FAQ, sticky mobile CTA

**Why:**
Netlify's 15-deploy-per-site cap is structurally incompatible with the maintenance subscription model. Cloudflare Pages is unlimited on free tier.

**State:** Deployed and validated on panminaostrzy.pl (confidence 80/100, sendable).
