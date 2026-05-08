# OneViz — Operations

Human-only tasks. Steps that require a browser, an account, or a real-world action.
Claude cannot complete these — it can only reference them.

---

## Secrets Backup

`.env` is gitignored — it exists only on this machine. Back it up in two places:

**Primary — Bitwarden (bitwarden.com, free)**
- Create account → New Item → Secure Note
- Name: `OneViz — scraper .env`
- Paste the full contents of `scraper/.env`
- Update the note whenever a token changes

**Optional — ai-vault encrypted backup**
```bash
# Encrypt and commit
gpg --symmetric --cipher-algo AES256 -o scraper/.env.gpg scraper/.env
# then commit scraper/.env.gpg to ai-vault

# Decrypt when needed
gpg -o scraper/.env -d scraper/.env.gpg
```

- [ ] Bitwarden note created for `scraper/.env`
- [ ] GPG backup in ai-vault (optional)

---

## Per-Client Deploy Checklist

Copy this block for each new client. Fill in artifacts as you complete each step.

```
## Client: _______________
## Date:   _______________

### Pre-deploy
- [ ] Scraper run — confidence score: ___/100
- [ ] Photo sourced — method: [ ] WhatsApp  [ ] stock  [ ] existing URL
- [ ] Photo URL confirmed working

### Deploy
- [ ] `node scrape.js <url> --deploy` run
      Cloudflare Pages URL: ________________________________

### Post-deploy
- [ ] UptimeRobot monitor added
      Monitor ID: ________________________________
- [ ] Tally Form 1 link sent to client
- [ ] 50% upfront invoice sent (Stripe payment link)
- [ ] Maintenance scope message sent via WhatsApp

### Go-live
- [ ] Client domain connected to Cloudflare Pages
- [ ] UptimeRobot URL updated to real domain
- [ ] 50% final invoice sent (Stripe payment link)
- [ ] "X spots remaining" counter updated on website/index.html

### Close
- [ ] Airtable CRM row created
- [ ] Client added to maintenance plan (if applicable)
```

---

## One-Time Account Setup

Steps done once. Check off when complete. Artifacts go into `scraper/.env` or `website/index.html` as noted.

### Domain & Contact
- [ ] **Domain** — register `oneviz.pl` at dowolny registrar
      Registrar: _______________________
      → give domain + real phone + real email to Claude → Claude updates `website/index.html`
- [ ] **Phone / WhatsApp number confirmed**
      Number: _______________________
- [ ] **Contact email confirmed**
      Email: _______________________

### Accounts
- [ ] **Google Cloud** — project created, Places API (New) enabled, API key created and restricted to Places API
      API key → `scraper/.env` as `GOOGLE_PLACES_API_KEY`
      Console: console.cloud.google.com → APIs & Services → Credentials
- [ ] **Cloudflare** — account active, API token in `scraper/.env` ✓
- [ ] **Microsoft Clarity** — project created, ID added to all 4 HTML files
      Project ID: _______________________
- [ ] **UptimeRobot** — account created at uptimerobot.com, email alerts active
- [ ] **Airtable** — base "OneViz Clients" created with columns: name, slug, package, domain, Cloudflare URL, status, launch date, maintenance plan
- [ ] **Stripe** — account created, PLN products set up (see `packages.md` for tiers)
      Publishable key (for reference): _______________________
- [ ] **Fakturownia** — account created, Stripe integration connected (requires NIP)
- [ ] **Tally** — Form 1 (onboarding) and Form 2 (maintenance) built and published
      Form 1 URL: _______________________
      Form 2 URL: _______________________
- [ ] **Cloudinary** — account created (client photo hosting at scale, Level 3)
- [ ] **Resend** — account created (automated drip, Level 3.5)

### Natalia Demo
- [ ] Fill real data in `demo/natalia/index.html` (contact info, services, bio)
- [ ] Run `node scrape.js` with `--deploy` flag
      Cloudflare Pages URL: _______________________
- [ ] Give URL to Claude → Claude updates `website/index.html` demo link

---

## UptimeRobot — Per-Client Steps

1. Log in to uptimerobot.com
2. **Add New Monitor** → HTTP(s)
3. Friendly Name: `Client Name — domain.pl`
4. URL: `https://oneviz-slug.pages.dev` (switch to real domain after go-live)
5. Monitoring Interval: 5 minutes
6. Alert Contacts: your email ✓
7. Save → copy Monitor ID back into the client checklist above

---

## Stripe — Payment Links to Send

| When | Amount | What to send |
|---|---|---|
| Project start | 250 PLN | Pilot 50% upfront payment link |
| Before go-live | 250 PLN | Pilot 50% final payment link |
| Monthly | 49 / 99 / 199 PLN | Maintenance subscription link (matching plan) |

---

## "X Spots Remaining" — How to Update

File: `website/index.html`
Search for: `Zostało` — appears twice (PL + EN versions)

```html
<span data-pl>Zostało 5 miejsc</span>
<span data-en>5 spots remaining</span>
```

Change the number after each pilot client signs. Never goes back up.

---

*Last updated: 2026-04-11*
