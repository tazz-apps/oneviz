#!/usr/bin/env node
/**
 * OneViz Scout — V1
 * Usage: node scout.js --city="Kraków" --category="fryzjer" [options]
 *
 * Queries Google Places API (new, 2022+) for local businesses.
 * Writes filtered candidates to scraper/leads.json for human review.
 * Does NOT run scrape.js, send email, or deploy anything.
 *
 * Options:
 *   --limit=N        Max leads (default 20, max 20 — V1 has no pagination)
 *   --min-rating=N   Min Google rating (default 4.0)
 *   --min-reviews=N  Min review count (default 10)
 *   --replace        Overwrite leads.json entirely (default: merge + dedup + preserve statuses)
 *   --dry-run        Print candidates without writing leads.json
 */

const fs   = require("fs");
const path = require("path");

// ── Load .env ─────────────────────────────────────────────────────────────────

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (k && !(k in process.env)) process.env[k] = v;
  });
}

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.slice(`--${name}=`.length) : fallback;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

const city       = getArg("city", "");
const category   = getArg("category", "");
const limitRaw   = parseInt(getArg("limit", "20"), 10);
const minRating  = parseFloat(getArg("min-rating", "4.0"));
const minReviews = parseInt(getArg("min-reviews", "10"), 10);
const replace    = hasFlag("replace");
const dryRun     = hasFlag("dry-run");

// ── Validation ────────────────────────────────────────────────────────────────

const USAGE = 'Usage: node scout.js --city="Kraków" --category="fryzjer" [--limit=20] [--min-rating=4.0] [--min-reviews=10] [--append] [--dry-run]';

if (!city || !category) {
  console.error("Missing required args: --city and --category\n" + USAGE);
  process.exit(1);
}

if (!process.env.GOOGLE_PLACES_API_KEY) {
  console.error("Missing env var: GOOGLE_PLACES_API_KEY — add it to scraper/.env\nSee OPERATIONS.md → One-Time Account Setup → Google Cloud");
  process.exit(1);
}

if (isNaN(limitRaw) || limitRaw < 1) {
  console.error("--limit must be a positive integer");
  process.exit(1);
}

if (limitRaw > 20) {
  console.error("--limit max is 20 (V1 has no pagination). Pass --limit=20 or lower.");
  process.exit(1);
}

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const limit = limitRaw;

// ── Chain exclusion ───────────────────────────────────────────────────────────

const CHAIN_KEYWORDS = [
  "mcdonald", "kfc", "subway", "burger king", "pizza hut",
  "żabka", "biedronka", "lidl", "netto", "aldi", "kaufland",
  "orlen", "bp", "shell", "circle k",
  "t-mobile", "orange", "play", "plus",
  "empik", "reserved", "mohito", "carry", "house",
  "rossmann", "hebe", "douglas", "sephora",
  "ccc", "deichmann", "ecco",
  "leroy merlin", "castorama", "obi", "ikea",
];

function isChain(name) {
  const lower = name.toLowerCase();
  return CHAIN_KEYWORDS.some((k) => lower.includes(k));
}

// ── Website normalization (for dedup) ─────────────────────────────────────────

function normalizeWebsite(url) {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname).toLowerCase().replace(/\/$/, "");
  } catch {
    return url.toLowerCase().trim();
  }
}

// ── Google Places API ─────────────────────────────────────────────────────────

const FIELD_MASK = [
  "places.displayName",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.id",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
].join(",");

async function searchPlaces() {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type":    "application/json",
      "X-Goog-Api-Key":  GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery:       `${category} in ${city}, Poland`,
      languageCode:    "pl",
      maxResultCount:  limit,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places API error: HTTP ${res.status}\n${body}`);
  }

  const data = await res.json();
  return data.places || [];
}

// ── Filter ────────────────────────────────────────────────────────────────────

function filterAndReport(places) {
  const passed = [];
  for (const p of places) {
    const name        = p.displayName?.text || "(no name)";
    const website     = p.websiteUri || "";
    const rating      = p.rating ?? 0;
    const reviewCount = p.userRatingCount ?? 0;

    if (!website)                { console.log(`  skip [no website]          ${name}`); continue; }
    if (rating < minRating)      { console.log(`  skip [rating ${rating.toFixed(1)} < ${minRating}]    ${name}`); continue; }
    if (reviewCount < minReviews){ console.log(`  skip [reviews ${reviewCount} < ${minReviews}]     ${name}`); continue; }
    if (isChain(name))           { console.log(`  skip [chain]               ${name}`); continue; }

    console.log(`  pass                       ${name} — ${rating} ★ (${reviewCount}) — ${website}`);
    passed.push(p);
  }
  return passed;
}

// ── Build lead record ─────────────────────────────────────────────────────────

function buildLead(place) {
  return {
    placeId:          `places/${place.id}`,
    name:             place.displayName?.text || "",
    city,
    category,
    website:          place.websiteUri || "",
    rating:           place.rating ?? null,
    reviewCount:      place.userRatingCount ?? null,
    formattedAddress: place.formattedAddress || "",
    phone:            place.nationalPhoneNumber || null,
    source:           "google_places",
    status:           "new",
    createdAt:        new Date().toISOString(),
  };
}

// ── leads.json — load and merge ───────────────────────────────────────────────

const LEADS_PATH = path.join(__dirname, "leads.json");

function loadExisting() {
  if (!fs.existsSync(LEADS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(LEADS_PATH, "utf8"));
  } catch {
    console.warn("Warning: leads.json could not be parsed — treating as empty");
    return [];
  }
}

function mergeLeads(existing, incoming) {
  const seenPlaceIds  = new Set(existing.map((l) => l.placeId).filter(Boolean));
  const seenWebsites  = new Set(existing.map((l) => l.website ? normalizeWebsite(l.website) : null).filter(Boolean));

  const added   = [];
  const skipped = [];

  for (const lead of incoming) {
    const normWeb = normalizeWebsite(lead.website);
    if (seenPlaceIds.has(lead.placeId) || seenWebsites.has(normWeb)) {
      skipped.push(lead.name);
      continue;
    }
    added.push(lead);
    seenPlaceIds.add(lead.placeId);
    seenWebsites.add(normWeb);
  }

  return { merged: [...existing, ...added], added, skipped };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nOneViz Scout`);
  console.log(`Query:    "${category} in ${city}, Poland"`);
  console.log(`Filters:  rating >= ${minRating}, reviews >= ${minReviews}, limit ${limit}`);
  if (dryRun)   console.log(`Mode:     dry-run (leads.json will not be written)`);
  else if (replace) console.log(`Mode:     replace (existing leads.json will be overwritten)`);
  else          console.log(`Mode:     merge (dedup + preserve existing statuses)`);
  console.log("");

  console.log("[1/3] Querying Google Places API...");
  const places = await searchPlaces();
  console.log(`      ${places.length} result${places.length !== 1 ? "s" : ""} returned\n`);

  console.log("[2/3] Filtering...");
  const filtered = filterAndReport(places);
  console.log(`\n      ${filtered.length} candidate${filtered.length !== 1 ? "s" : ""} passed filters`);

  const incoming = filtered.map(buildLead);

  if (dryRun) {
    console.log("\n[3/3] Dry run — candidates (not written):\n");
    console.log(JSON.stringify(incoming, null, 2));
    return;
  }

  console.log("\n[3/3] Writing leads.json...");

  const existing = replace ? [] : loadExisting();
  const { merged, added, skipped } = mergeLeads(existing, incoming);

  fs.writeFileSync(LEADS_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");

  console.log(`      Added:   ${added.length}`);
  if (skipped.length) console.log(`      Skipped: ${skipped.length} (duplicates)`);
  console.log(`      Total:   ${merged.length} in leads.json`);
  console.log(`\nLeads: ${LEADS_PATH.replace(/\\/g, "/")}`);
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
