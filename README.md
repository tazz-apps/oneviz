# OneViz — Productized Website Templates

Fast, high-margin website delivery for small businesses. AI-assisted pipeline: brief → filled template → Netlify deploy.

## Templates

| Template | Style | Best for |
|----------|-------|----------|
| `dark-pro` | Dark navy + electric blue | Financial advisors, lawyers, accountants, B2B |
| `light-minimal` | Clean white + deep navy | Insurance, real estate, coaches, medical |
| `bold-color` | White + coral/red accent | Beauty, fitness, creative, wellness |

All templates: same HTML structure, 30 `{{VARIABLES}}`, mobile-first, zero dependencies.

## Workflow

```
1. Client fills brief.md (7 questions, ~5 min)
2. You pick a template style
3. Paste brief + template into Claude with PROMPT.md
4. Get back filled index.html + fill report
5. Deploy to Netlify → send link to client
```

## Variables

All templates use the same 30 variables:

```
FULL_NAME, TITLE, TAGLINE, CITY, PHONE, EMAIL, PHOTO_URL
BIO_SHORT, BIO_LONG, EXPERIENCE_YEARS, CLIENTS_COUNT
SERVICE_1_TITLE, SERVICE_1_DESC (×3)
WHY_1_TITLE, WHY_1_DESC (×3)
REVIEW_1_TEXT, REVIEW_1_AUTHOR (×2)
CTA_PRIMARY, CTA_SECONDARY
LINKEDIN_URL, FACEBOOK_URL, INSTAGRAM_URL, WHATSAPP_NUMBER
GOOGLE_MAPS_EMBED
```

Optional variables (JS auto-hides elements if empty): `PHOTO_URL`, `EXPERIENCE_YEARS`, `CLIENTS_COUNT`, `GOOGLE_MAPS_EMBED`, all social URLs.

## Packages

See `packages.md` for pricing tiers.

## Scraper (lead gen)

See `scraper/README.md` for the URL → Netlify demo pipeline.

## Demo

Live demo: Natalia Wiśniewska (financial consultant) — `demo/natalia/`
