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

// ── Step 1: Fetch + quality gate ─────────────────────────────────────────────

const MIN_CONTENT_LENGTH = 800; // below this = JS-rendered or empty shell

async function fetchSite(url) {
  console.log(`\n[1/5] Fetching ${url} ...`);
  const res = await request(url);
  if (res.status !== 200) throw new Error(`Fetch failed: HTTP ${res.status}`);

  const len = res.body.length;
  console.log(`      Got ${len} bytes`);

  if (len < MIN_CONTENT_LENGTH) {
    throw new Error(
      `LOW_CONTENT: only ${len} bytes — likely JS-rendered (Wix/Squarespace) or empty. ` +
      `Run manually with business name + city instead.`
    );
  }

  // Trim to ~8000 chars to stay within Claude context and reduce cost
  return res.body.slice(0, 8000);
}

// ── Step 2: Claude API — extract business data ────────────────────────────────

const EXTRACTION_PROMPT = `You are a Senior Direct-Response Copywriter and UX Designer specializing in Polish local businesses.
Your task: transform raw, often messy data from an existing business website into modern, conversion-focused content for a one-page website.

RULES — apply to every field:
- Zero fluff: remove "serdecznie zapraszamy", "jesteśmy liderem", "wysoka jakość", "profesjonalne podejście" — replace with specifics
- Polish market context: local SMB clients trust years of experience, concrete results, and location
- Transform vague into concrete: "Robimy dachy" → "Solidny dach na 30 lat. Gwarancja i terminowość w {city}"
- If you find "15 lat doświadczenia" — make it the hero headline, not a footnote
- Short sentences. Active voice. Benefit-first.
- All output text in Polish unless a field is a URL or number

Return ONLY a valid JSON object with these keys (use empty string "" if not found or cannot be inferred):

{
  "FULL_NAME": "owner's full name or business name",
  "TITLE": "job title — short, specific (e.g. 'Doradca kredytowy', not 'Specjalista')",
  "TAGLINE": "hero headline — max 8 words, concrete benefit, location if relevant",
  "CITY": "city name only",
  "PHONE": "phone in tel: format e.g. +48123456789",
  "EMAIL": "email address",
  "PHOTO_URL": "",
  "BIO_SHORT": "1 punchy sentence — who they are and what makes them worth calling",
  "BIO_LONG": "2-3 sentences — background, specialization, who they help. No fluff.",
  "EXPERIENCE_YEARS": "number only, or empty",
  "CLIENTS_COUNT": "number + unit e.g. '200+', or empty",
  "SERVICE_1_TITLE": "service name — verb + noun e.g. 'Kredyty hipoteczne'",
  "SERVICE_1_DESC": "1-2 sentences — who it's for and what result they get",
  "SERVICE_2_TITLE": "service name",
  "SERVICE_2_DESC": "1-2 sentences",
  "SERVICE_3_TITLE": "service name",
  "SERVICE_3_DESC": "1-2 sentences",
  "WHY_1_TITLE": "differentiator — specific, not generic (avoid 'Doświadczenie')",
  "WHY_1_DESC": "1-2 sentences expanding the differentiator with proof or detail",
  "WHY_2_TITLE": "differentiator",
  "WHY_2_DESC": "1-2 sentences",
  "WHY_3_TITLE": "differentiator",
  "WHY_3_DESC": "1-2 sentences",
  "REVIEW_1_TEXT": "testimonial quote — keep authentic, trim filler words",
  "REVIEW_1_AUTHOR": "First name + role/context e.g. 'Marek K., właściciel firmy'",
  "REVIEW_2_TEXT": "testimonial quote or empty",
  "REVIEW_2_AUTHOR": "author or empty",
  "CTA_PRIMARY": "Zadzwoń",
  "CTA_SECONDARY": "Zobacz ofertę",
  "LINKEDIN_URL": "",
  "FACEBOOK_URL": "",
  "INSTAGRAM_URL": "",
  "WHATSAPP_NUMBER": "",
  "GOOGLE_MAPS_EMBED": "",
  "_issues": ["max 4 specific problems found on the original site — used in cold outreach email"],
  "_confidence": 0
}

For _confidence (0–100): estimate how much usable business content was in the HTML.
- 80–100: rich content, most fields filled, ready to send
- 50–79: partial content, key fields present but gaps exist — review before sending
- 0–49: thin content (JS shell, Wix placeholder, almost no text) — manual enrichment needed

Return ONLY the JSON object. No explanation. No markdown fences.`;

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
  const confidence = data._confidence || 0;
  delete data._issues;
  delete data._confidence;

  const filled = Object.values(data).filter(Boolean).length;
  console.log(`      Extracted: ${filled}/34 fields filled`);
  console.log(`      Confidence: ${confidence}/100 ${confidence >= 80 ? "✓ send" : confidence >= 50 ? "⚠ review first" : "✗ manual enrichment needed"}`);
  if (issues.length) console.log(`      Issues found: ${issues.length}`);

  if (confidence < 50) {
    throw new Error(
      `LOW_CONFIDENCE: score ${confidence}/100 — content too thin to generate a good demo. ` +
      `Enrich manually with business name + city or request info from the lead.`
    );
  }

  return { data, issues, confidence };
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

function printColdEmail(data, issues, confidence, previewUrl) {
  const name = data.FULL_NAME || "Właściciel";
  const firstName = name.split(" ")[0];
  const issueLines = issues.length
    ? issues.map((i) => `• ${i}`).join("\n")
    : "• Strona wymaga odświeżenia i optymalizacji";
  const firstIssue = issues[0] || "wygląd strony";

  console.log(`
═══════════════════════════════════════════════════════
PREVIEW URL:   ${previewUrl}
CONFIDENCE:    ${confidence}/100 ${confidence >= 80 ? "✓ ready to send" : "⚠ review before sending"}
═══════════════════════════════════════════════════════

STEP 1 — Send this now (issues hook, no demo link yet):
─────────────────────────────────────────────────────
Temat: ${name} — znaleźliśmy 3 rzeczy do poprawy

Dzień dobry ${firstName},

przejrzałem stronę i znalazłem 3 rzeczy które tracą klientów:
${issueLines}

Każdą z nich możemy naprawić.
Chcesz zobaczyć jak to mogłoby wyglądać? Odpisz lub zadzwoń: [Twój numer]

[Twoje imię]
─────────────────────────────────────────────────────

STEP 2 — Send after 3 days if no reply (demo reveal):
─────────────────────────────────────────────────────
Temat: ${name} — przygotowałem podgląd

Dzień dobry ${firstName},

pisałem kilka dni temu o ${firstIssue.toLowerCase()}.
W międzyczasie przygotowałem wstępny projekt:

👉 ${previewUrl}

Zajmuje 30 sekund żeby rzucić okiem.
Jeśli coś zainteresuje — zadzwoń: [Twój numer]

[Twoje imię]
─────────────────────────────────────────────────────
`);
}

// ── Step 6: Write email-preview.html ─────────────────────────────────────────

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtBody(text) {
  return escHtml(text)
    .replace(/(• .+)/g, '<span class="hl">$1</span>')
    .replace(/(👉 https?:\/\/\S+)/g, '<span class="lnk">$1</span>')
    .replace(/(\[.+?\])/g, '<span class="ph">$1</span>');
}

function writeEmailPreview(data, issues, confidence, previewUrl) {
  const name = data.FULL_NAME || "Właściciel";
  const firstName = name.split(" ")[0];
  const issueLines = issues.length
    ? issues.map((i) => `• ${i}`).join("\n")
    : "• Strona wymaga odświeżenia i optymalizacji";
  const firstIssue = (issues[0] || "wygląd strony").toLowerCase();

  const subj1 = `${name} — znaleźliśmy 3 rzeczy do poprawy`;
  const body1 = `Dzień dobry ${firstName},\n\nprzejrzałem stronę i znalazłem 3 rzeczy które tracą klientów:\n${issueLines}\n\nKażdą z nich możemy naprawić.\nChcesz zobaczyć jak to mogłoby wyglądać? Odpisz lub zadzwoń: [Twój numer]\n\n[Twoje imię]`;

  const subj2 = `${name} — przygotowałem podgląd`;
  const body2 = `Dzień dobry ${firstName},\n\npisałem kilka dni temu o ${firstIssue}.\nW międzyczasie przygotowałem wstępny projekt:\n\n👉 ${previewUrl}\n\nZajmuje 30 sekund żeby rzucić okiem.\nJeśli coś zainteresuje — zadzwoń: [Twój numer]\n\n[Twoje imię]`;

  const badge = confidence >= 80
    ? `<span class="badge high">✓ ${confidence}/100 — ready to send</span>`
    : `<span class="badge med">⚠ ${confidence}/100 — review before sending</span>`;

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Email Preview — ${escHtml(name)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f1f5f9;padding:2rem 1rem;min-height:100vh}
  .wrap{max-width:660px;margin:0 auto}
  .top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.6rem;margin-bottom:1.75rem}
  .logo{font-size:1rem;font-weight:800;color:#3B82F6;letter-spacing:-.02em}
  .badge{font-size:.75rem;font-weight:700;padding:.28rem .8rem;border-radius:20px}
  .badge.high{background:rgba(16,185,129,.1);color:#10B981;border:1px solid rgba(16,185,129,.3)}
  .badge.med{background:rgba(251,191,36,.1);color:#FBBF24;border:1px solid rgba(251,191,36,.3)}
  .preview-link{font-size:.78rem;color:#475569;margin-bottom:1.75rem;word-break:break-all}
  .preview-link a{color:#3B82F6}
  .panel{background:#0f1e30;border:1px solid rgba(255,255,255,.09);border-radius:12px;overflow:hidden;margin-bottom:1.25rem}
  .ph-row{background:rgba(59,130,246,.07);border-bottom:1px solid rgba(255,255,255,.06);padding:.65rem 1.1rem;display:flex;align-items:center;justify-content:space-between;gap:.75rem}
  .step{font-size:.7rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#3B82F6}
  .timing{font-size:.7rem;color:#475569}
  .copy-btn{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);color:#3B82F6;padding:.27rem .75rem;border-radius:6px;font-size:.73rem;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit}
  .copy-btn:hover{background:rgba(59,130,246,.22)}
  .copy-btn.ok{color:#10B981;border-color:rgba(16,185,129,.35);background:rgba(16,185,129,.08)}
  .meta{padding:.8rem 1.1rem;border-bottom:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;gap:.3rem}
  .mr{display:flex;gap:.55rem;font-size:.8rem}
  .ml{color:#475569;min-width:50px;flex-shrink:0}
  .mv{color:#94a3b8}
  .ms{color:#f1f5f9;font-weight:600}
  pre.body{padding:1.1rem;font-family:'Courier New',monospace;font-size:.84rem;line-height:1.9;color:#94a3b8;white-space:pre-wrap}
  pre.body .hl{color:#f1f5f9}
  pre.body .lnk{color:#3B82F6}
  pre.body .ph{color:#475569;font-style:italic}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <span class="logo">OneViz — Email Preview</span>
    ${badge}
  </div>
  <p class="preview-link">Preview: <a href="${previewUrl}" target="_blank">${escHtml(previewUrl)}</a></p>

  <div class="panel">
    <div class="ph-row">
      <div><span class="step">Email 1 — wyślij teraz</span> <span class="timing">· issues hook, bez linku do demo</span></div>
      <button class="copy-btn" onclick="cp(this,'e1')">Kopiuj</button>
    </div>
    <div class="meta">
      <div class="mr"><span class="ml">Do:</span><span class="mv">[email klienta]</span></div>
      <div class="mr"><span class="ml">Temat:</span><span class="mv ms">${escHtml(subj1)}</span></div>
    </div>
    <pre class="body" id="e1">${fmtBody(body1)}</pre>
  </div>

  <div class="panel">
    <div class="ph-row">
      <div><span class="step">Email 2 — wyślij po 3 dniach</span> <span class="timing">· tylko jeśli brak odpowiedzi</span></div>
      <button class="copy-btn" onclick="cp(this,'e2')">Kopiuj</button>
    </div>
    <div class="meta">
      <div class="mr"><span class="ml">Do:</span><span class="mv">[email klienta]</span></div>
      <div class="mr"><span class="ml">Temat:</span><span class="mv ms">${escHtml(subj2)}</span></div>
    </div>
    <pre class="body" id="e2">${fmtBody(body2)}</pre>
  </div>
</div>
<script>
  function cp(btn,id){
    navigator.clipboard.writeText(document.getElementById(id).innerText).then(function(){
      btn.textContent='Skopiowano ✓';btn.classList.add('ok');
      setTimeout(function(){btn.textContent='Kopiuj';btn.classList.remove('ok')},2000);
    });
  }
</script>
</body>
</html>`;

  const out = path.join(__dirname, "last-preview.html");
  fs.writeFileSync(out, html, "utf8");
  const filePath = out.replace(/\\/g, "/");
  console.log(`\n📧  Email preview: file:///${filePath}`);

  // Auto-open best-effort
  try {
    const cmd = process.platform === "win32"
      ? `start "" "${out}"`
      : process.platform === "darwin" ? `open "${out}"` : `xdg-open "${out}"`;
    require("child_process").exec(cmd);
  } catch (_) {}
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
  const { data, issues, confidence } = await extractData(html);

  console.log(`\n[3/5] Filling template...`);
  const filled = fillTemplate(templateHtml, data);
  console.log(`      Done — ${filled.length} bytes`);

  const previewUrl = await deployToNetlify(filled, data.FULL_NAME || data.TITLE);

  printColdEmail(data, issues, confidence, previewUrl);
  writeEmailPreview(data, issues, confidence, previewUrl);
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
