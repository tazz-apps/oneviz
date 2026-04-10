# OneViz — Claude Code Context

Read this first. Gives you the project state, file map, and infrastructure dependencies before touching anything.

---

## What this project is

OneViz is a Polish local-business web agency. The model: scrape a prospect's existing site → generate a static HTML demo → cold email → sell a one-time site build (490–1,490 PLN) + recurring maintenance subscription (49–199 PLN/mo).

Stack: pure static HTML templates + Netlify hosting + Groq/Claude LLM for content extraction.

**Current phase:** Level 2 → Level 3 (first 5 paying clients). Zero clients so far. Scraper validated on 1 site (panminaostrzy.pl, confidence 80/100 — sendable). Cold outreach not started yet.

---

## File map

| File | Purpose |
|---|---|
| `ROADMAP.md` | Level 2→5 growth plan. Read before suggesting new features. |
| `TODO.md` | Single source of truth for pending work. Update after each session. |
| `packages.md` | Pricing tiers, maintenance plans, add-ons, hosting policy. |
| `PROMPT.md` | System prompt for manually filling a template from a client brief. |
| `brief.md` | Client onboarding form structure. |
| `tally-forms.md` | Tally form build spec (Form 1 onboarding + Form 2 maintenance updates). |
| `templates/` | 3 HTML templates (dark-pro, light-minimal, bold-color). 34 `{{VARIABLES}}` each. |
| `demo/natalia/` | Live demo site — currently placeholder data. |
| `scraper/scrape.js` | Core tool: URL → extract data → Netlify deploy → cold email output. |
| `scraper/last-site-preview.html` | Filled template from last scraper run (local preview, no Netlify). |
| `scraper/last-preview.html` | Email preview with copy buttons (output of last scraper run). |
| `website/index.html` | OneViz service landing page (the storefront). |
| `website/design-decisions.md` | 23 documented design decisions — read before touching the website. |

---

## Infrastructure dependencies

OneViz Phase 2 (automated lead pipeline) depends on homelab infrastructure. See `~/Documents/dev/ai-vault/CONTEXT.md` for full spec.

| Dependency | What it does in oneviz | Where it lives |
|---|---|---|
| **OpenClaw** | Async job queue worker — polls `scraper/jobs/`, runs scrape.js, routes emails | Homelab VM 103, Debian 12, `192.168.100.110` |
| **Cloudflare Tunnel** | Exposes OpenClaw endpoint publicly without static IP | Configured on OpenClaw VM |
| **Resend** | Transactional email for drip sequence (free tier: 100/day) | External service, not yet set up |
| **Netlify** | Hosting + deploy triggers for all client sites | External service, token in `.env` |

**Phase 1 (now):** scraper runs manually on this machine. OpenClaw not yet involved.
**Phase 2 (Level 3.5):** OpenClaw picks up jobs from a `scraper/jobs/` queue. Not built yet.

---

## Key constraints

- Never suggest rewriting templates in React/Astro/Tailwind — working HTML is an asset, rewrite = weeks of work for zero client benefit.
- Never suggest a client CMS — maintenance subscription model is more profitable.
- Scraper LLM: Groq (llama-3.1-8b) is primary, Claude API is fallback. Gemini blocked in Poland/EU on free tier.
- Price ladder: never lower prices, only raise. Current pilot price: 499 PLN (first 5 clients only).
- Confidence threshold: scraper gate is 50/100. Below that, do not auto-send cold email.
- **Netlify credits:** Free plan = 300/month, 15 per deploy. ~134 remaining as of 2026-04-10. Do not deploy during testing.
- **Scraper deploy modes:** no flag = local file only (free), `--ngrok` = shareable tunnel for cold outreach (free, not yet built), `--deploy` = Netlify permanent URL (costs credits, use only for committed clients).

---

*Last updated: 2026-04-10 (session 3)*
