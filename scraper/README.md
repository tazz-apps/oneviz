# OneViz Scraper

Takes an existing business website URL, extracts content via Claude API, fills a template, deploys to Netlify, and prints a cold email draft.

## Requirements

- Node.js (no npm packages — built-in modules only)
- `ANTHROPIC_API_KEY` in environment
- `NETLIFY_API_TOKEN` in environment (set in `~/.bash_profile`)

## Usage

```bash
source ~/.bash_profile
node scraper/scrape.js <url> [--style=dark-pro|light-minimal|bold-color]
```

**Default style:** `dark-pro`

### Examples

```bash
# Financial advisor site → dark-pro template
node scraper/scrape.js https://example-doradca.pl

# Beauty salon → bold-color template
node scraper/scrape.js https://salon-kwiatkowski.pl --style=bold-color

# Insurance agent → light-minimal template
node scraper/scrape.js https://ubezpieczenia-kowalski.pl --style=light-minimal
```

## Output

```
OneViz Scraper
Target: https://example.pl
Style:  dark-pro

[1/5] Fetching https://example.pl ...
[2/5] Calling Claude API to extract business data...
[3/5] Filling template...
[4/5] Deploying to Netlify...
[5/5] Done.

═══════════════════════════════════════════════════
PREVIEW URL:  https://oneviz-jan-kowalski-abc123.netlify.app
═══════════════════════════════════════════════════

COLD EMAIL DRAFT:
─────────────────────────────────────────────────
Temat: Jan Kowalski — podgląd nowej strony
...
─────────────────────────────────────────────────
```

## How it works

1. Fetches the target site HTML (first 8KB — enough for contact info and services)
2. Sends to `claude-haiku-4-5` for JSON extraction (cheap, fast — ~$0.001/run)
3. Fills the selected template with extracted values
4. Creates a new Netlify site and deploys the filled HTML
5. Prints the live preview URL + a ready-to-send Polish cold email

## Cost per scrape

- Claude Haiku: ~$0.001
- Netlify: free (within free tier limits)

## Notes

- Unfilled `{{VARIABLES}}` are left empty — JS in the template auto-hides those elements
- The site name on Netlify is `oneviz-{slug}-{timestamp}` — delete unused previews periodically
- No browser rendering — JS-heavy sites may yield less data (plain HTML only)
