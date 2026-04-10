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
 * Requires env vars: NETLIFY_API_TOKEN + at least one of GROQ_API_KEY, ANTHROPIC_API_KEY
 * LLM order: Groq (free tier, primary) → Claude (fallback)
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ── Config ────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GROQ_API_KEY      = process.env.GROQ_API_KEY;
const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN;

const args = process.argv.slice(2);
const targetUrl = args.find((a) => !a.startsWith("--"));
const styleFlag = args.find((a) => a.startsWith("--style="));
const style = styleFlag ? styleFlag.split("=")[1] : "dark-pro";
const DEPLOY = args.includes("--deploy"); // explicit opt-in — costs Netlify credits

const VALID_STYLES = ["dark-pro", "light-minimal", "bold-color"];

if (!targetUrl) {
  console.error("Usage: node scrape.js <url> [--style dark-pro|light-minimal|bold-color] [--deploy]");
  process.exit(1);
}

if (DEPLOY && !NETLIFY_API_TOKEN) {
  console.error("Missing env var: NETLIFY_API_TOKEN (required for --deploy)");
  process.exit(1);
}
if (!GROQ_API_KEY && !ANTHROPIC_API_KEY) {
  console.error("Missing env vars: set GROQ_API_KEY (free tier) and/or ANTHROPIC_API_KEY (fallback)");
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
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") })
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

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|section|article|header|footer|li|h[1-6]|tr|td|th)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function preExtract(html) {
  const found = {};

  // Phone — priority chain (stops at first hit):
  // 1. tel: href attribute — most reliable, always intentional
  const telHref = html.match(/href=["']tel:([+\d\s\-()\u00a0]{7,20})["']/i);
  if (telHref) {
    found.PHONE = telHref[1].replace(/[\u00a0]/g, " ").trim();
  } else {
    // 2. aria-label on buttons (WordPress/Elementor pattern: aria-label="791 382 022")
    const ariaMatch = html.match(/aria-label=["'](\+?[\d][\d\s\-]{6,18}\d)["']/);
    if (ariaMatch && /\d{3}/.test(ariaMatch[1])) {
      found.PHONE = ariaMatch[1].trim();
    } else {
      // 3. Schema.org / JSON-LD telephone field
      const schemaMatch = html.match(/"telephone"\s*:\s*"([^"]+)"/i);
      if (schemaMatch) {
        found.PHONE = schemaMatch[1].trim();
      } else {
        // 4. Text regex — REQUIRES separator between groups to avoid partial filename matches
        //    e.g. "1280-7465485" in og:image won't match because 280-746 needs another sep
        const phoneMatch = html.match(/(?<!\d)(\+48[\s-])?(\d{3}[\s-]\d{3}[\s-]\d{3})(?!\d)/);
        if (phoneMatch) found.PHONE = phoneMatch[0].trim();
      }
    }
  }

  // Email
  const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) found.EMAIL = emailMatch[0];

  // NIP (hint for LLM to identify correct business name)
  const nipMatch = html.match(/NIP[:\s]*([0-9]{3}[-\s]?[0-9]{3}[-\s]?[0-9]{2}[-\s]?[0-9]{2}|[0-9]{10})/i);
  if (nipMatch) found._nip = nipMatch[1].replace(/[\s-]/g, "");

  // Title tag, OG title, H1 — hints for business name
  const titleMatch = html.match(/<title[^>]*>([^<]{3,80})<\/title>/i);
  if (titleMatch) found._title = titleMatch[1].trim();

  const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{3,80})["']/i)
    || html.match(/<meta[^>]+content=["']([^"']{3,80})["'][^>]+property=["']og:title["']/i);
  if (ogMatch) found._ogTitle = ogMatch[1].trim();

  const h1Match = html.match(/<h1[^>]*>([^<]{3,80})<\/h1>/i);
  if (h1Match) found._h1 = h1Match[1].replace(/<[^>]+>/g, "").trim();

  return found;
}

function detectPlatform(headers, html) {
  const allHeaders = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join("\n").toLowerCase();
  const htmlLow = html.slice(0, 5000).toLowerCase();

  if (allHeaders.includes("x-wix-request-id") || htmlLow.includes("wixstatic.com")) return "Wix";
  if (allHeaders.includes("server: squarespace") || htmlLow.includes("this is squarespace") || htmlLow.includes("squarespace-cdn.com")) return "Squarespace";
  if (htmlLow.includes("webwave.me") || htmlLow.includes("webwave.pl")) return "WebWave";
  if (htmlLow.includes("hostinger.com/templates") || htmlLow.includes("zyro.com")) return "Hostinger";
  if (htmlLow.includes("shoper.pl") || htmlLow.includes("shopercloud")) return "Shoper";
  return null;
}

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

  // Detect platform from headers + HTML
  const platform = detectPlatform(res.headers, res.body);
  if (platform) console.log(`      Platform:    ${platform}`);

  const pre = preExtract(res.body);
  const preFound = Object.keys(pre).filter(k => !k.startsWith("_")).join(", ") || "none";
  console.log(`      Pre-extracted: ${preFound}`);

  // Early exit if no contact data found — don't waste an LLM call
  if (!pre.PHONE && !pre.EMAIL) {
    const reason = platform
      ? `${platform} detected — content is JS-rendered, no static contact data`
      : "no contact data found in raw HTML — site may be JS-rendered or contact info on a subpage";
    throw new Error(`NO_CONTACT: ${reason}. Run manually with business name, phone, and email instead.`);
  }

  // Strip HTML to plain text — dramatically reduces noise, lets LLM see actual content
  const text = htmlToText(res.body);
  const sliced = text.slice(0, 7000); // keeps classify + extract under Groq's 6000 TPM limit
  console.log(`      Text after strip: ${text.length} chars → sending ${sliced.length}`);

  return { sliced, pre };
}

// ── Step 2: LLM extraction — Gemini (primary) → Claude (fallback) ────────────

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
  "TITLE": "job title — describes what they DO, not what they advise on. For tradespeople use craft titles (e.g. 'Mistrz ostrzenia noży', 'Stolarz', 'Elektryk'). For professionals use role titles (e.g. 'Doradca kredytowy', 'Kosmetolog'). Never use 'Doradca' for a craftsman.",
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
  "SERVICE_1_PRICE": "price for service 1 e.g. 'od 50 PLN', '200 PLN/h' — empty if not shown",
  "SERVICE_2_PRICE": "price for service 2 or empty",
  "SERVICE_3_PRICE": "price for service 3 or empty",
  "PROCESS_TITLE": "title for 'how I work' section e.g. '5 etapów ostrzenia noży' — empty if no process described",
  "PROCESS_STEPS": "numbered work steps, one per line e.g. '1. Ocena stanu\n2. Ostrzenie\n3. Polerowanie' — empty if not found",
  "PERSONAL_QUOTE": "personal quote or motto found verbatim on the site — empty if none",
  "QUOTE_AUTHOR": "attribution for the quote e.g. 'Abraham Lincoln' — empty if none",
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

Return ONLY the JSON object. No explanation. No markdown fences.
IMPORTANT: Output valid JSON. For multi-line values (e.g. PROCESS_STEPS), use \\n escape sequences — never literal newlines inside string values.`;

function parseExtractionResponse(text) {
  const clean = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  let data;
  try {
    data = JSON.parse(clean);
  } catch {
    // Sanitize literal newlines inside JSON string values and retry
    const sanitized = clean.replace(/"(?:[^"\\]|\\.)*"/g, m =>
      m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
    );
    data = JSON.parse(sanitized);
  }
  const issues = data._issues || [];
  const confidence = data._confidence || 0;
  delete data._issues;
  delete data._confidence;
  return { data, issues, confidence };
}

function logExtractionResult(data, issues, confidence, provider) {
  const filled = Object.values(data).filter(Boolean).length;
  console.log(`      Provider:   ${provider}`);
  console.log(`      Extracted:  ${filled}/34 fields filled`);
  console.log(`      Confidence: ${confidence}/100 ${confidence >= 80 ? "✓ send" : confidence >= 50 ? "⚠ review first" : "✗ manual enrichment needed"}`);
  if (issues.length) console.log(`      Issues found: ${issues.length}`);
}

const CATEGORY_PROMPTS = {
  rzemiosło: {
    label: "Rzemiosło / Usługi techniczne",
    title: "Use craft/trade titles: 'Mistrz X', 'Rzemieślnik X', 'Stolarz', 'Elektryk', 'Ostrzyciel noży'. NEVER use 'Doradca' for a tradesperson.",
    tagline: "Focus on craft quality, precision, durability, years of practice. Concrete outcome: 'Nóż ostry jak brzytwa w 30 minut'.",
    bio: "Emphasize hands-on skill, years in the trade, what makes their craft different. Avoid corporate language.",
  },
  usługi: {
    label: "Usługi profesjonalne",
    title: "Use professional titles: 'Doradca kredytowy', 'Radca prawny', 'Konsultant IT', 'Agent ubezpieczeniowy'.",
    tagline: "Focus on results, money saved, risk avoided, time saved. Concrete outcome: 'Kredyt w 2 tygodnie. Bez papierologii.'",
    bio: "Emphasize expertise, certifications, types of clients helped, measurable results.",
  },
  uroda: {
    label: "Uroda / Wellness",
    title: "Use beauty titles: 'Stylistka', 'Kosmetolog', 'Fryzjer', 'Wizażystka', 'Masażysta'.",
    tagline: "Focus on transformation, confidence, feeling great. Concrete: 'Włosy które robią wrażenie — Kraków'.",
    bio: "Warm, personal tone. Mention specialization, target client, signature technique.",
  },
  gastronomia: {
    label: "Gastronomia",
    title: "Use F&B titles: 'Szef kuchni', 'Właściciel restauracji', 'Barista', 'Cukiernik'.",
    tagline: "Focus on taste, experience, atmosphere. Concrete: 'Domowa kuchnia. Krakowskie smaki. Bez kompromisów.'",
    bio: "Story-driven. Where they learned, what cuisine, who it's for.",
  },
  handel: {
    label: "Handel / E-commerce",
    title: "Use retail titles: 'Właściciel sklepu X', 'Sprzedawca X', 'Dystrybutor X'.",
    tagline: "Focus on product quality, selection, value, fast delivery.",
    bio: "What they sell, who they sell to, what makes their offer better than Amazon.",
  },
};

const TONE_PROMPTS = {
  casual: {
    label: "Casual",
    greeting: (first) => `Hej ${first},`,
    opener: (n) => `zerknąłem na Twoją stronę i znalazłem ${n} ${n === 1 ? "rzecz" : "rzeczy"} które tracą klientów:`,
    followup: (first, issue, url) =>
      `Hej ${first},\n\npisałem kilka dni temu o ${issue}.\nPrzygotowałem wstępny projekt:\n\n👉 ${url}\n\n30 sekund żeby rzucić okiem.\nJeśli coś Cię zainteresuje — zadzwoń: [Twój numer]\n\n[Twoje imię]`,
    emailGuidance: "Match the owner's casual, direct tone. Use 'Ty' form. Short sentences. No corporate language.",
  },
  warm: {
    label: "Warm / przyjazny",
    greeting: (first) => `Dzień dobry ${first},`,
    opener: (n) => `przejrzałem stronę i znalazłem ${n} ${n === 1 ? "rzecz" : "rzeczy"} które tracą klientów:`,
    followup: (first, issue, url) =>
      `Dzień dobry ${first},\n\npisałem kilka dni temu o ${issue}.\nW międzyczasie przygotowałem wstępny projekt:\n\n👉 ${url}\n\nZajmuje 30 sekund żeby rzucić okiem.\nJeśli coś zainteresuje — zadzwoń: [Twój numer]\n\n[Twoje imię]`,
    emailGuidance: "Friendly but professional. Use 'Ty' form. Warm, approachable tone.",
  },
  formal: {
    label: "Formalny",
    greeting: (first) => `Dzień dobry,`,
    opener: (n) => `przejrzałem Państwa stronę i zidentyfikowałem ${n} ${n === 1 ? "obszar wymagający" : "obszary wymagające"} poprawy:`,
    followup: (first, issue, url) =>
      `Dzień dobry,\n\nkilka dni temu pisałem o ${issue}.\nPrzygotowałem wstępny projekt strony:\n\n👉 ${url}\n\nZapraszam do zapoznania się.\nW razie pytań — proszę o kontakt: [Twój numer]\n\n[Twoje imię]`,
    emailGuidance: "Professional and respectful. Use 'Pan/Pani' or impersonal form. Full sentences.",
  },
};

const CLASSIFY_PROMPT = `Analyze this Polish business website text and return a JSON object with two fields.

category — one of:
- rzemiosło (craftsmen, tradespeople: knife sharpener, plumber, carpenter, electrician, tailor, mechanic, welder)
- usługi (professional services: financial advisor, lawyer, accountant, consultant, insurance, IT, real estate)
- uroda (beauty/wellness: hairdresser, cosmetologist, massage, nail salon, spa, tattoo)
- gastronomia (food & beverage: restaurant, café, bakery, catering, bar, food truck)
- handel (retail: shop, e-commerce, products, wholesale, distributor)

tone — one of:
- casual (uses "Hej", "Cześć", short informal sentences, first-name style, emoji)
- warm (friendly but professional, standard Polish business tone, "Dzień dobry")
- formal (uses "Szanowni Państwo", "uprzejmie informujemy", long formal sentences, "Pan/Pani")

Reply with ONLY valid JSON, e.g.: {"category":"rzemiosło","tone":"casual"}

Business text:
`;

async function classifyBusiness(text) {
  if (!GROQ_API_KEY) return { category: null, tone: null };
  try {
    const res = await apiPost(
      "https://api.groq.com/openai/v1/chat/completions",
      { Authorization: `Bearer ${GROQ_API_KEY}` },
      {
        model: "llama-3.1-8b-instant",
        max_tokens: 20,
        temperature: 0,
        messages: [{ role: "user", content: CLASSIFY_PROMPT + text.slice(0, 1000) }],
      }
    );
    if (res.status !== 200) return { category: null, tone: null };
    const parsed = JSON.parse(res.body);
    const raw = (parsed.choices?.[0]?.message?.content || "").trim();
    const obj = JSON.parse(raw);
    const category = Object.keys(CATEGORY_PROMPTS).includes(obj.category) ? obj.category : null;
    const tone = Object.keys(TONE_PROMPTS).includes(obj.tone) ? obj.tone : "warm";
    return { category, tone };
  } catch {
    return { category: null, tone: "warm" };
  }
}

function buildPromptContent(html, pre, category, tone) {
  const hints = [];
  if (pre.PHONE) hints.push(`PHONE: "${pre.PHONE}" (confirmed via regex — use as-is)`);
  if (pre.EMAIL) hints.push(`EMAIL: "${pre.EMAIL}" (confirmed via regex — use as-is)`);
  if (pre._title) hints.push(`Page title: "${pre._title}"`);
  if (pre._ogTitle) hints.push(`OG title: "${pre._ogTitle}"`);
  if (pre._h1) hints.push(`H1: "${pre._h1}"`);
  if (pre._nip) hints.push(`NIP: ${pre._nip} (use to identify the correct legal business name)`);

  const hintBlock = hints.length
    ? `\nPRE-EXTRACTED DATA (confirmed — embed directly into output JSON):\n${hints.join("\n")}\n`
    : "";

  const cat = category && CATEGORY_PROMPTS[category];
  const categoryBlock = cat
    ? `\nBUSINESS CATEGORY: ${cat.label}
- TITLE guidance: ${cat.title}
- TAGLINE guidance: ${cat.tagline}
- BIO guidance: ${cat.bio}\n`
    : "";

  const ton = tone && TONE_PROMPTS[tone];
  const toneBlock = ton
    ? `\nCOMMUNICATION TONE: ${ton.label} — ${ton.emailGuidance}\n`
    : "";

  return `${EXTRACTION_PROMPT}${categoryBlock}${toneBlock}${hintBlock}\n\nWebsite text content to analyze:\n${html}`;
}

async function extractWithGroq(html, pre, category, tone) {
  const res = await apiPost(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${GROQ_API_KEY}` },
    {
      model: "llama-3.1-8b-instant",
      max_tokens: 1500,
      temperature: 0.2,
      messages: [{ role: "user", content: buildPromptContent(html, pre, category, tone) }],
    }
  );

  if (res.status !== 200) {
    throw new Error(`Groq API error: HTTP ${res.status}\n${res.body}`);
  }

  const parsed = JSON.parse(res.body);
  const text = parsed.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty response");
  if (parsed.usage) {
    const u = parsed.usage;
    console.log(`      Tokens:     ${u.prompt_tokens} in + ${u.completion_tokens} out = ${u.total_tokens} total`);
  }

  return parseExtractionResponse(text);
}

async function extractWithClaude(html, pre, category, tone) {
  const res = await apiPost(
    "https://api.anthropic.com/v1/messages",
    { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: buildPromptContent(html, pre, category, tone) }],
    }
  );

  if (res.status !== 200) {
    throw new Error(`Claude API error: HTTP ${res.status}\n${res.body}`);
  }

  const parsed = JSON.parse(res.body);
  const text = parsed.content[0].text;
  if (!text) throw new Error("Claude returned empty response");

  return parseExtractionResponse(text);
}

async function extractData(sliced, pre) {
  console.log(`\n[2/5] Extracting business data...`);

  const { category, tone } = await classifyBusiness(sliced);
  if (category) {
    console.log(`      Category:   ${category} (${CATEGORY_PROMPTS[category].label})`);
  } else {
    console.log(`      Category:   unknown — using generic prompt`);
  }
  console.log(`      Tone:       ${tone} (${TONE_PROMPTS[tone].label})`);
  // Brief pause so classify + extract don't collide in the same TPM window
  await new Promise(r => setTimeout(r, 6000));

  let result;

  if (GROQ_API_KEY) {
    try {
      result = await extractWithGroq(sliced, pre, category, tone);
      logExtractionResult(result.data, result.issues, result.confidence, "Groq llama-3.1-8b");
    } catch (err) {
      if (ANTHROPIC_API_KEY) {
        console.warn(`      Groq failed (${err.message}) — falling back to Claude...`);
        result = await extractWithClaude(sliced, pre, category, tone);
        logExtractionResult(result.data, result.issues, result.confidence, "Claude Haiku (fallback)");
      } else {
        throw err;
      }
    }
  } else {
    result = await extractWithClaude(sliced, pre, category, tone);
    logExtractionResult(result.data, result.issues, result.confidence, "Claude Haiku");
  }

  let { data, issues, confidence } = result;

  // Pre-extracted values override LLM for contact fields (regex is more reliable)
  if (pre.PHONE) data.PHONE = pre.PHONE;
  if (pre.EMAIL) data.EMAIL = pre.EMAIL;

  // Filter out LLM-hallucinated contact issues when we already found PHONE + EMAIL
  if (pre.PHONE && pre.EMAIL) {
    issues = issues.filter(i => !/kontakt|telefon|email|adres.*email/i.test(i));
  }

  // Name fallback: if LLM returned a domain slug (no space, or looks like CamelCase slug),
  // try to derive from email local part — e.g. bogdan.pusz@gmail.com → "Bogdan Pusz"
  const name = data.FULL_NAME || "";
  const looksLikeSlug = !name.includes(" ") || /^[A-Z][a-z]+[A-Z]/.test(name);
  if (looksLikeSlug && pre.EMAIL) {
    const local = pre.EMAIL.split("@")[0];
    const genericPrefixes = /^(info|kontakt|contact|biuro|office|hello|admin|noreply|support)$/i;
    if (!genericPrefixes.test(local) && /[._]/.test(local)) {
      const parts = local.split(/[._]/).filter(p => p.length > 1);
      if (parts.length >= 2) {
        const derived = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
        data.FULL_NAME = derived;
        console.log(`      Name fix:   "${name}" → "${derived}" (from email)`);
      }
    }
  }

  if (confidence < 50) {
    throw new Error(
      `LOW_CONFIDENCE: score ${confidence}/100 — content too thin to generate a good demo. ` +
      `Enrich manually with business name + city or request info from the lead.`
    );
  }

  return { data, issues, confidence, tone };
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

function printColdEmail(data, issues, confidence, previewUrl, tone) {
  const name = data.FULL_NAME || "Właściciel";
  const firstName = name.split(" ")[0];
  const issueLines = issues.length
    ? issues.map((i) => `• ${i}`).join("\n")
    : "• Strona wymaga odświeżenia i optymalizacji";
  const firstIssue = (issues[0] || "wygląd strony").toLowerCase();
  const t = TONE_PROMPTS[tone] || TONE_PROMPTS.warm;
  const filled = Object.values(data).filter(Boolean).length;
  const issueCount = issues.length || 1;
  const dataLine = `System zebrał już ${filled}/34 danych z Twojej strony — resztę uzupełniamy razem.`;

  const body1 = `${t.greeting(firstName)}\n\n${t.opener(issueCount)}\n${issueLines}\n\n${dataLine}\nChcesz zobaczyć jak to mogłoby wyglądać? Odpisz lub zadzwoń: [Twój numer]\n\n[Twoje imię]`;
  const body2 = t.followup(firstName, firstIssue, previewUrl);

  console.log(`
═══════════════════════════════════════════════════════
PREVIEW URL:   ${previewUrl}
CONFIDENCE:    ${confidence}/100 ${confidence >= 80 ? "✓ ready to send" : "⚠ review before sending"}
TONE:          ${t.label}
═══════════════════════════════════════════════════════

STEP 1 — Send this now (issues hook, no demo link yet):
─────────────────────────────────────────────────────
Temat: ${name} — znaleźliśmy ${issues.length || 1} ${issues.length === 1 ? "rzecz" : issues.length >= 2 && issues.length <= 4 ? "rzeczy" : "rzeczy"} do poprawy

${body1}
─────────────────────────────────────────────────────

STEP 2 — Send after 3 days if no reply (demo reveal):
─────────────────────────────────────────────────────
Temat: ${name} — przygotowałem podgląd

${body2}
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

function writeEmailPreview(data, issues, confidence, previewUrl, tone) {
  const name = data.FULL_NAME || "Właściciel";
  const firstName = name.split(" ")[0];
  const issueLines = issues.length
    ? issues.map((i) => `• ${i}`).join("\n")
    : "• Strona wymaga odświeżenia i optymalizacji";
  const firstIssue = (issues[0] || "wygląd strony").toLowerCase();
  const t = TONE_PROMPTS[tone] || TONE_PROMPTS.warm;
  const filled = Object.values(data).filter(Boolean).length;
  const total = 34;
  const dataLine = `System zebrał już ${filled}/${total} danych z Twojej strony — resztę uzupełniamy razem.`;

  const issueCount = issues.length || 1;
  const issueWord = issueCount === 1 ? "rzecz" : "rzeczy";
  const subj1 = `${name} — znaleźliśmy ${issueCount} ${issueWord} do poprawy`;
  const body1 = `${t.greeting(firstName)}\n\n${t.opener(issueCount)}\n${issueLines}\n\n${dataLine}\nChcesz zobaczyć jak to mogłoby wyglądać? Odpisz lub zadzwoń: [Twój numer]\n\n[Twoje imię]`;

  const subj2 = `${name} — przygotowałem podgląd`;
  const body2 = t.followup(firstName, firstIssue, previewUrl);

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

  const { sliced, pre } = await fetchSite(targetUrl);
  const { data, issues, confidence, tone } = await extractData(sliced, pre);

  console.log(`\n[3/5] Filling template...`);
  const filled = fillTemplate(templateHtml, data);
  console.log(`      Done — ${filled.length} bytes`);

  // Save filled HTML locally regardless of deploy mode
  const localSitePath = path.join(__dirname, "last-site-preview.html");
  fs.writeFileSync(localSitePath, filled, "utf8");

  let previewUrl;
  if (DEPLOY) {
    console.log(`\n[4/5] Deploying to Netlify...`);
    previewUrl = await deployToNetlify(filled, data.FULL_NAME || data.TITLE);
  } else {
    const localUrl = `file:///${localSitePath.replace(/\\/g, "/")}`;
    previewUrl = localUrl;
    console.log(`\n[4/5] Skipping Netlify (no --deploy flag)`);
    console.log(`      Site preview: ${localUrl}`);
    console.log(`      Run with --deploy when ready to share`);
  }

  printColdEmail(data, issues, confidence, previewUrl, tone);
  writeEmailPreview(data, issues, confidence, previewUrl, tone);
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
