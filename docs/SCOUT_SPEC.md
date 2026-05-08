# Scout — Specification

Scout finds candidate businesses and writes `leads.json` for human review.
It does not run the scraper. It does not send email. It does not deploy anything.

---

## CLI (V1)

```bash
node scout.js --city="Kraków" --category="fryzjer"
```

| Arg | Required | Default | Description |
|---|---|---|---|
| `--city` | Yes | — | Polish city name: "Kraków", "Warszawa", "Wrocław" |
| `--category` | Yes | — | Business type keyword (see category list below) |
| `--limit` | No | 20 | Max leads to write — **hard cap: 20** (one API page, no pagination in V1) |
| `--min-rating` | No | 4.0 | Minimum Google rating |
| `--min-reviews` | No | 10 | Minimum review count |
| `--replace` | No | false | Overwrite leads.json entirely — default is merge + dedup + preserve statuses |
| `--dry-run` | No | false | Print candidates to console without writing leads.json — use for first API tests |

---

## Data source

**New Google Places API only** — use the 2022+ endpoint, not the deprecated `maps.googleapis.com/maps/api/place/` URLs.

**Endpoint:** `POST https://places.googleapis.com/v1/places:searchText`

**Headers:**
```
Content-Type: application/json
X-Goog-Api-Key: <GOOGLE_PLACES_API_KEY>
X-Goog-FieldMask: places.displayName,places.websiteUri,places.rating,places.userRatingCount,places.id,places.formattedAddress,places.nationalPhoneNumber
```

**Request body:**
```json
{
  "textQuery": "{category} in {city}, Poland",
  "languageCode": "pl",
  "maxResultCount": 20
}
```

One call returns all needed fields. No separate Place Details call required.

**Cost (as of March 2025 pricing change):**
`places:searchText` maps to the **Text Search Pro** SKU.
Google now provides **5,000 free calls/month per SKU** instead of the old $200 credit.

One Scout run with `--limit=20` = one Text Search request (no pagination, no Place Details calls).
At expected V1 volume (e.g. 20 categories × 10 cities = 200 calls/month): **effectively $0/month**.
After 5,000 calls/month the SKU becomes paid — not a realistic concern at OneViz volume.

**Still required regardless:**
- Google Cloud billing account (card on file, even for free-tier use)
- API key restricted to Places API (New)
- Set a budget alert in Google Cloud Console (e.g. €5/month) to catch unexpected usage
- Terms may differ for EEA billing addresses (Poland) — check product availability at sign-up

Sources: mapsplatform.google.com/pricing · developers.google.com/maps/billing-and-pricing/march-2025

Required env var (add to `scraper/.env`):
```
GOOGLE_PLACES_API_KEY=
```

---

## Filters

Apply all filters before writing to leads.json:

| Filter | Value | Rationale |
|---|---|---|
| Has website URL | Required | scrape.js needs a URL — "no website" is a separate product path |
| Rating ≥ | 4.0 (configurable via `--min-rating`) | Avoids pitching obviously bad businesses |
| Review count ≥ | 10 (configurable via `--min-reviews`) | Filters inactive/unproven listings without being too strict |
| Exclude chains | Yes (see list below) | Chains have central marketing — not our market |
| No duplicate URLs | Yes | Skip if website already exists in leads.json |

**Chain exclusion list** — skip if business name contains any of:
```
McDonald, KFC, Subway, Burger King, Pizza Hut,
Żabka, Biedronka, Lidl, Netto, Aldi, Kaufland,
Orlen, BP, Shell, Circle K,
T-Mobile, Orange, Play, Plus,
Empik, Reserved, Mohito, Carry, House,
Rossmann, Hebe, Douglas, Sephora,
CCC, Deichmann, Ecco,
Leroy Merlin, Castorama, OBI, Ikea
```

---

## Output format

File: `scraper/leads.json` (gitignored — contains business contact data)

```json
[
  {
    "placeId": "places/abc123",
    "name": "Salon Example",
    "city": "Kraków",
    "category": "fryzjer",
    "website": "https://example.pl",
    "rating": 4.6,
    "reviewCount": 38,
    "formattedAddress": "ul. Przykładowa 1, 30-000 Kraków",
    "phone": "+48123456789",
    "source": "google_places",
    "status": "new",
    "createdAt": "2026-05-08T10:00:00Z"
  }
]
```

Notes:
- `placeId` is the full resource name returned by the new Places API (format: `places/{id}`) — used as primary dedup key
- `website` is normalized for secondary dedup (strip trailing slash, lowercase scheme+host)
- `scrapeResult`, `outreach`, `notes` fields are added later by run-queue.js and human updates — Scout does not write them

Full schema and lifecycle status values: `docs/LEAD_SCHEMA.md`

---

## Category keywords

| CLI `--category` value | Maps to scraper category |
|---|---|
| fryzjer, salon-fryzjerski | uroda |
| kosmetolog, salon-kosmetyczny | uroda |
| masaz, spa, nail-studio | uroda |
| hydraulik, instalator | rzemiosło |
| elektryk | rzemiosło |
| stolarz | rzemiosło |
| doradca-kredytowy, doradca-finansowy | usługi |
| ubezpieczenia, agent-ubezpieczeniowy | usługi |
| restauracja, bistro | gastronomia |
| kawiarnia, cafe | gastronomia |
| sklep, butik | handel |

Use hyphen form on CLI; scout.js normalizes to Polish search terms internally.

---

## ID generation

```
{city-slug}-{category-slug}-{name-slug}-{3-digit-seq}
```

Examples:
- `krakow-fryzjer-salon-anna-001`
- `krakow-hydraulik-serwis-karol-003`

Seq increments per run to avoid collisions when appending.

---

## What Scout does NOT do

- Run `scrape.js` — that is `run-queue.js`'s job (V2)
- Send email
- Deploy to Cloudflare Pages
- Assess website quality — confidence gate is inside scrape.js
- Contact the business

---

## Integration with run-queue.js (V2)

After human review of leads.json (remove bad fits, update status to `approved`):

```bash
node run-queue.js leads.json --limit=5
```

run-queue.js:
1. Reads leads.json, filters `status: "approved"`
2. Calls `node scrape.js <website>` per lead (sequential — Groq rate limit)
3. Updates lead `status`: `"approved"` → `"scraped"` | `"scrape_failed"`
4. Writes `confidence`, `fieldsFilledCount`, `error` into `scrapeResult`

---

## Implementation notes

**`displayName` is an object**, not a string. Access as:
```js
place.displayName?.text
```

**`placeId` is the full resource name**, not a bare ID:
```
"places/ChIJN1t_tDeuEmsRUsoyG83frY4"   // correct — what the new API returns
"ChIJN1t_tDeuEmsRUsoyG83frY4"           // wrong — old API format
```

**No separate Place Details call.** The field mask on the Text Search request returns all needed data in one response.

**Deduplication order:**
1. Match by `placeId` (exact) — skip if already in leads.json
2. Match by normalized website (lowercase, strip trailing slash, strip `www.`) — skip if already present

**Zero npm dependencies.** Use built-in Node.js `https` module for the API call, same pattern as `scrape.js`.

---

## V1 scope — what to build, what to skip

**V1 builds:**
- New Google Places API Text Search (single call, one page, max 20 results)
- All filters above
- `--dry-run` flag
- leads.json write + merge with dedup

**V1 does not include:**
- Pagination / results beyond 20
- PageSpeed Insights pre-filter
- "No website" path (separate product decision)
- Auto-run of scraper
- Website crawling of any kind
- Email collection (Places API rarely returns email; scraper extracts it from the site)
- Manual CSV fallback (add only if Places API proves unreliable)
- Any changes to scrape.js

---

*Spec version: 2026-05-08*
