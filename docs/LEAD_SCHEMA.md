# Lead Schema — leads.json

Canonical format for `scraper/leads.json`.
All Scout output and queue-runner state lives in this file.
File is gitignored — contains business contact data.

---

## Full schema

```json
{
  "id": "string — {city}-{category}-{name-slug}-{seq}",
  "name": "string — business display name from Google Places",
  "city": "string — Polish city name e.g. 'Kraków'",
  "category": "string — CLI keyword used in scout e.g. 'fryzjer'",
  "website": "string — full URL including https://",
  "phone": "string | null — phone from Google Places",
  "rating": "number | null — Google rating 1.0–5.0",
  "reviewCount": "number | null — total Google review count",
  "googlePlaceId": "string | null — Google Places place_id for deduplication",
  "source": "'google_places' | 'manual_csv' | 'manual'",
  "scoutedAt": "string — ISO 8601 datetime when lead was added",
  "status": "string — see status values below",
  "scrapeResult": {
    "confidence": "number | null — 0–100 from scrape.js LLM",
    "fieldsFilledCount": "number | null — out of 34 template variables",
    "previewFile": "string | null — path to saved preview copy e.g. scraper/previews/{id}.html",
    "deployedUrl": "string | null — Cloudflare Pages URL if --deploy was used",
    "scrapedAt": "string | null — ISO 8601 datetime",
    "error": "string | null — LOW_CONTENT | NO_CONTACT | LOW_CONFIDENCE | OTHER"
  },
  "outreach": {
    "email1SentAt": "string | null — ISO 8601",
    "email2SentAt": "string | null — ISO 8601",
    "repliedAt": "string | null — ISO 8601",
    "closedAt": "string | null — ISO 8601",
    "outcome": "string | null — 'closed_won' | 'closed_lost' | 'no_reply' | 'not_interested'"
  },
  "notes": "string | null — free text, human-entered"
}
```

---

## Status lifecycle

```
new          ← scout.js writes this
  │
  ├── skipped      ← human: chain, bad fit, already contacted
  │
  └── approved     ← human: good lead, ready to scrape
        │
        ├── scrape_failed   ← run-queue.js: LOW_CONTENT / NO_CONTACT / LOW_CONFIDENCE
        │
        └── scraped         ← run-queue.js: scrape.js completed
              │
              └── email1_sent    ← human: sent first outreach
                    │
                    ├── no_reply     ← 3+ days, no response
                    │     └── email2_sent  ← human: sent follow-up with demo link
                    │
                    └── responded    ← lead replied
                          │
                          ├── closed_won   ← became paying client
                          └── closed_lost  ← said no / went cold
```

---

## Status values

| Status | Set by | Meaning |
|---|---|---|
| `new` | scout.js | Just added, not yet reviewed |
| `approved` | human | Approved for scraping |
| `skipped` | human | Excluded — chain, bad fit, already known |
| `scraped` | run-queue.js | scrape.js completed successfully |
| `scrape_failed` | run-queue.js | scrape.js exited with error (see `scrapeResult.error`) |
| `email1_sent` | human | First outreach email sent (issues hook) |
| `email2_sent` | human | Follow-up email sent (demo link) |
| `responded` | human | Lead replied |
| `closed_won` | human | Became a paying client |
| `closed_lost` | human | Declined or went cold |

---

## Minimal V1 entry (Scout output only)

```json
{
  "id": "krakow-fryzjer-salon-anna-001",
  "name": "Salon Anna",
  "city": "Kraków",
  "category": "fryzjer",
  "website": "https://salon-anna.pl",
  "phone": "+48600000000",
  "rating": 4.3,
  "reviewCount": 27,
  "googlePlaceId": "ChIJxxxxxxxxxx",
  "source": "google_places",
  "scoutedAt": "2026-05-08T10:00:00Z",
  "status": "new",
  "scrapeResult": null,
  "outreach": null,
  "notes": null
}
```

---

## Null policy

- `scrapeResult` is `null` until run-queue.js processes the lead.
- `outreach` is `null` until human manually updates after sending.
- All sub-fields within `scrapeResult` and `outreach` are `null` until their respective step runs.

---

## File location and access

- **Path:** `scraper/leads.json`
- **gitignored:** yes — add to `.gitignore` if not already present
- **Overwrite vs append:** scout.js default is overwrite. Use `--append` flag to add to existing file.
- **Deduplication:** scout.js skips any `googlePlaceId` or `website` already present in leads.json.
