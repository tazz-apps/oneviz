#!/usr/bin/env node
/**
 * OneViz Scraper — Option B
 * Usage: node scrape.js <url> [--style dark-pro|light-minimal|bold-color]
 *
 * Flow:
 *   1. Fetch HTML from target URL
 *   2. Send to Claude API → extract business data as JSON ({{VARIABLE}} keys)
 *   3. Load template, replace all {{VARIABLES}}
 *   4. Create Netlify site + deploy
 *   5. Print preview URL + cold email draft
 *
 * Requires env vars: ANTHROPIC_API_KEY, NETLIFY_API_TOKEN
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ── Config ────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN;

const args = process.argv.slice(2);
const targetUrl = args.find((a) => !a.startsWith("--"));
const styleFlag = args.find((a) => a.startsWith("--style="));
const style = styleFlag ? styleFlag.split("=")[1] : "dark-pro";

const VALID_STYLES = ["dark-pro", "light-minimal", "bold-color"];

if (!targetUrl) {
  console.error("Usage: node scrape.js <url> [--style dark-pro|light-minimal|bold-color]");
  process.exit(1);
}

if (!ANTHROPIC_API_KEY || !NETLIFY_API_TOKEN) {
  console.error("Missing env vars: ANTHROPIC_API_KEY and/or NETLIFY_API_TOKEN");
  process.exit(1);
}

if (!VALID_STYLES.includes(style)) {
  console.error(`Invalid style. Choose from: ${VALID_STYLES.join(", ")}`);
  process.exit(1);
}

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", style, "index.html");

// ── Helpers ───────────────────────────────────────────────────────────────────

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; OneViz-Scraper/1.0)",
          ...(options.headers || {}),
        },
      },
      (res) => {
        // Follow redirects (max 3)
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && (options._redirects || 0) < 3) {
          const redirectUrl = res.headers.location.startsWith("http")
            ? res.headers.location
            : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
          return request(redirectUrl, { ...options, _redirects: (options._redirects || 0) + 1 }, body)
            .then(resolve)
            .catch(reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") })
        );
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function apiPost(url, headers, bodyObj) {
  const body = JSON.stringify(bodyObj);
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...headers },
  }, body);
}

function apiPut(url, headers, rawBuffer) {
  return request(url, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream", "Content-Length": rawBuffer.length, ...headers },
  }, rawBuffer);
}

// ── Step 1: Fetch target site HTML ────────────────────────────────────────────

async function fetchSite(url) {
  console.log(`\n[1/5] Fetching ${url} ...`);
  const res = await request(url);
  if (res.status !== 200) throw new Error(`Fetch failed: HTTP ${res.status}`);
  console.log(`      Got ${res.body.length} bytes`);
  // Trim to ~8000 chars to stay within Claude context and reduce cost
  return res.body.slice(0, 8000);
}

// ── Step 2: Claude API — extract business data ────────────────────────────────

const EXTRACTION_PROMPT = `You are extracting business data from a website's HTML to fill a template.

Return ONLY a valid JSON object with these keys (use empty string "" if not found):

{
  "FULL_NAME": "owner's full name or business name",
  "TITLE": "job title or role (1 short line, Polish OK)",
  "TAGLINE": "main value proposition (max 10 words, Polish OK)",
  "CITY": "city name",
  "PHONE": "phone number in tel: format, e.g. +48123456789",
  "EMAIL": "email address",
  "PHOTO_URL": "",
  "BIO_SHORT": "1-2 sentence intro (Polish OK)",
  "BIO_LONG": "2-3 sentences about background and expertise (Polish OK)",
  "EXPERIENCE_YEARS": "number only, or empty",
  "CLIENTS_COUNT": "number + unit like '200+' or empty",
  "SERVICE_1_TITLE": "first service name",
  "SERVICE_1_DESC": "1-2 sentences describing service 1",
  "SERVICE_2_TITLE": "second service name",
  "SERVICE_2_DESC": "1-2 sentences describing service 2",
  "SERVICE_3_TITLE": "third service name",
  "SERVICE_3_DESC": "1-2 sentences describing service 3",
  "WHY_1_TITLE": "differentiator 1 title",
  "WHY_1_DESC": "1-2 sentences",
  "WHY_2_TITLE": "differentiator 2 title",
  "WHY_2_DESC": "1-2 sentences",
  "WHY_3_TITLE": "differentiator 3 title",
  "WHY_3_DESC": "1-2 sentences",
  "REVIEW_1_TEXT": "first testimonial quote or empty",
  "REVIEW_1_AUTHOR": "author name and title or empty",
  "REVIEW_2_TEXT": "second testimonial quote or empty",
  "REVIEW_2_AUTHOR": "author name and title or empty",
  "CTA_PRIMARY": "Zadzwoń",
  "CTA_SECONDARY": "Zobacz ofertę",
  "LINKEDIN_URL": "",
  "FACEBOOK_URL": "",
  "INSTAGRAM_URL": "",
  "WHATSAPP_NUMBER": "",
  "GOOGLE_MAPS_EMBED": ""
}

Also return a separate key "_issues" with an array of strings listing problems found on the original site (max 4 items). These will be used in a cold email.

Example _issues: ["Brak numeru telefonu w widocznym miejscu", "Strona nie działa na telefonie", "Brak opisów usług", "Przestarzały wygląd"]

Return ONLY the JSON object, no explanation, no markdown fences.`;

async function extractData(html) {
  console.log(`\n[2/5] Calling Claude API to extract business data...`);

  const res = await apiPost(
    "https://api.anthropic.com/v1/messages",
    {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\nHTML to analyze:\n${html}`,
        },
      ],
    }
  );

  if (res.status !== 200) {
    throw new Error(`Claude API error: HTTP ${res.status}\n${res.body}`);
  }

  const parsed = JSON.parse(res.body);
  const text = parsed.content[0].text.trim();

  // Strip markdown fences if Claude added them anyway
  const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const data = JSON.parse(clean);

  const issues = data._issues || [];
  delete data._issues;

  console.log(`      Extracted: ${Object.values(data).filter(Boolean).length}/30 fields filled`);
  if (issues.length) console.log(`      Issues found: ${issues.length}`);

  return { data, issues };
}

// ── Step 3: Fill template ─────────────────────────────────────────────────────

function fillTemplate(templateHtml, data) {
  let html = templateHtml;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    html = html.replace(regex, value || "");
  }
  return html;
}

// ── Step 4: Deploy to Netlify ─────────────────────────────────────────────────

function netlifyHeaders() {
  return { Authorization: `Bearer ${NETLIFY_API_TOKEN}` };
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function deployToNetlify(htmlContent, businessName) {
  console.log(`\n[4/5] Deploying to Netlify...`);

  const slug = slugify(businessName || "oneviz-demo");
  const siteName = `oneviz-${slug}-${Date.now().toString(36)}`;

  // Create site
  const siteRes = await apiPost(
    "https://api.netlify.com/api/v1/sites",
    { ...netlifyHeaders(), "Content-Type": "application/json" },
    { name: siteName }
  );
  if (siteRes.status !== 201 && siteRes.status !== 200) {
    throw new Error(`Netlify create site failed: HTTP ${siteRes.status}\n${siteRes.body}`);
  }
  const site = JSON.parse(siteRes.body);
  console.log(`      Site created: ${site.ssl_url}`);

  // Create deploy with SHA1 digest
  const buf = Buffer.from(htmlContent, "utf8");
  const sha1 = crypto.createHash("sha1").update(buf).digest("hex");

  const deployRes = await apiPost(
    `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
    { ...netlifyHeaders(), "Content-Type": "application/json" },
    { files: { "/index.html": sha1 } }
  );
  if (deployRes.status !== 200 && deployRes.status !== 201) {
    throw new Error(`Netlify deploy create failed: HTTP ${deployRes.status}\n${deployRes.body}`);
  }
  const deploy = JSON.parse(deployRes.body);

  // Upload file
  const uploadRes = await apiPut(
    `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`,
    netlifyHeaders(),
    buf
  );
  if (uploadRes.status !== 200) {
    throw new Error(`Netlify file upload failed: HTTP ${uploadRes.status}\n${uploadRes.body}`);
  }

  // Poll until ready
  process.stdout.write("      Waiting for deploy");
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    process.stdout.write(".");
    const statusRes = await request(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}`,
      { headers: netlifyHeaders() }
    );
    const d = JSON.parse(statusRes.body);
    if (d.state === "ready") {
      console.log(" ready!");
      return site.ssl_url;
    }
    if (d.state === "error") throw new Error(`Deploy failed: ${d.error_message}`);
  }
  throw new Error("Deploy timed out after 60s");
}

// ── Step 5: Print results ─────────────────────────────────────────────────────

function printColdEmail(data, issues, previewUrl) {
  const name = data.FULL_NAME || "Właściciel";
  const firstName = name.split(" ")[0];
  const issueLines = issues.length
    ? issues.map((i) => `• ${i}`).join("\n")
    : "• Strona wymaga odświeżenia i optymalizacji";

  console.log(`
═══════════════════════════════════════════════════════
PREVIEW URL:  ${previewUrl}
═══════════════════════════════════════════════════════

COLD EMAIL DRAFT:
─────────────────────────────────────────────────────
Temat: ${name} — podgląd nowej strony

Dzień dobry ${firstName},

przygotowałem wstępny podgląd nowej strony:
${previewUrl}

Główne problemy na obecnej stronie:
${issueLines}

Mogę wdrożyć w 2–3 dni roboczych. Strony zaczynam od 1 500 PLN.

Pozdrawiam,
[Twoje imię]
─────────────────────────────────────────────────────
`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nOneViz Scraper`);
  console.log(`Target: ${targetUrl}`);
  console.log(`Style:  ${style}`);

  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template not found: ${TEMPLATE_PATH}`);
  }
  const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf8");

  const html = await fetchSite(targetUrl);
  const { data, issues } = await extractData(html);

  console.log(`\n[3/5] Filling template...`);
  const filled = fillTemplate(templateHtml, data);
  console.log(`      Done — ${filled.length} bytes`);

  const previewUrl = await deployToNetlify(filled, data.FULL_NAME || data.TITLE);

  printColdEmail(data, issues, previewUrl);
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
