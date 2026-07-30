---
name: crawl4ai-extract
description: Use when extracting structured data as JSON from web pages with the self-hosted crawl4ai server — pulling specific fields like prices, titles, listings, or table rows via CSS selectors, XPath, or regex, no LLM needed. Triggers on "extract structured data", "get all the products/prices", "scrape fields into JSON", "extract as JSON with a schema", "pull the table", "get every listing".
---

# crawl4ai — structured extraction (no LLM)

Field-level JSON extraction on the self-hosted server. Deterministic, free, fast — CSS/XPath/regex, no LLM key required. **REQUIRED BACKGROUND:** creds/auth/URLs in the `crawl4ai` skill.

## CSS schema (most common)

Pass `extraction_strategy` inside `crawler_config`. Result comes back in `results[0].extracted_content` as a JSON array (one object per `baseSelector` match).

```bash
set -a; source ~/.claude/crawl4ai.env; set +a
curl -s -X POST "$CRAWL4AI_BASE_URL/crawl" \
  -H "Authorization: Bearer $CRAWL4AI_API_TOKEN" -H 'Content-Type: application/json' -d '{
  "urls":["https://example.com"],
  "crawler_config":{"type":"CrawlerRunConfig","params":{
    "cache_mode":"bypass",
    "extraction_strategy":{"type":"JsonCssExtractionStrategy","params":{"schema":{
      "name":"items",
      "baseSelector":"div.product",
      "fields":[
        {"name":"title","selector":"h2","type":"text"},
        {"name":"price","selector":".price","type":"text"},
        {"name":"url","selector":"a","type":"attribute","attribute":"href"}
      ]}}}
  }}}' | python -c 'import sys,json;print(json.load(sys.stdin)["results"][0]["extracted_content"])'
```

- `baseSelector` = the repeating row/card; each match → one object. Omit it (or use `body`) for a single object.
- field `type`: `text`, `attribute` (+ `"attribute":"href"`), `html`; nested objects/lists supported via `type:"nested"` / `"list"` with their own `fields`.

## Variants

- **XPath:** `"type":"JsonXpathExtractionStrategy"`, selectors are XPath expressions.
- **Regex:** `"type":"RegexExtractionStrategy","params":{"pattern":"..."}` for pattern scraping (emails, prices, phone numbers).

## LLM extraction (optional — needs server config)

`LLMExtractionStrategy` (schema-by-prompt / natural-language extraction) needs an LLM API key configured in the server env (`.llm.env`, e.g. `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`) — **not configured on this server**. Add a key + `docker compose up -d crawl4ai`, or run it via the Python SDK, if you truly need fuzzy/NL extraction. For structured pages, CSS/XPath above is enough and costs nothing.

## Quick reference

| Data shape | Strategy |
|---|---|
| Repeating cards/rows | `JsonCssExtractionStrategy` + `baseSelector` |
| XPath needed | `JsonXpathExtractionStrategy` |
| Regex patterns | `RegexExtractionStrategy` |
| NL prompt / fuzzy | `LLMExtractionStrategy` (needs LLM key) |

## Common mistakes

- Missing `baseSelector` when rows repeat → one merged object. Set it to the row selector.
- `type:"attribute"` without `"attribute":"href"` → null values.
- `extracted_content` is a JSON **string** — parse it (`json.loads`).
- Selectors must match the raw/cleaned HTML; if JS renders the content, run `/execute_js` first (see `crawl4ai-interact`).
