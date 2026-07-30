---
name: crawl4ai-crawl
description: Use when crawling multiple pages or a whole site section with the self-hosted crawl4ai server — following links to a depth (native deep-crawl), or batch-scraping a known list of URLs. Triggers on "crawl the site", "get all pages under /docs", "scrape these N urls", "bulk crawl", "crawl every page", "deep crawl", "download the docs", "follow links".
---

# crawl4ai — crawl (deep-crawl + batch)

Multi-page crawling on the self-hosted crawl4ai server. **REQUIRED BACKGROUND:** creds, auth, MCP tools, and ops live in the `crawl4ai` skill — read it for `~/.claude/crawl4ai.env`, the public/internal URLs, and the token.

> **Trust note:** this server runs a derived image (`crawl4ai-trusted`) patched so **authenticated requests are TRUSTED** — native `deep_crawl_strategy`, `session_id`, `js_code`, and filters work over REST. Baked into the image (zero maintenance). See the umbrella `crawl4ai` skill for the Dockerfile + revert.

## Native deep-crawl (follow links to depth N)

`POST /crawl` with a `deep_crawl_strategy` in `crawler_config`. Returns one result per page discovered.

```bash
set -a; source ~/.claude/crawl4ai.env; set +a
curl -s -X POST "$CRAWL4AI_BASE_URL/crawl" \
  -H "Authorization: Bearer $CRAWL4AI_API_TOKEN" -H 'Content-Type: application/json' -d '{
  "urls":["https://docs.example.com/"],
  "crawler_config":{"type":"CrawlerRunConfig","params":{
    "cache_mode":"bypass",
    "deep_crawl_strategy":{"type":"BFSDeepCrawlStrategy","params":{
      "max_depth":2,
      "max_pages":25,
      "include_external":false
    }}
  }}}' | python -c 'import sys,json;r=json.load(sys.stdin)["results"];print(len(r),"pages");[print(" ",x["url"]) for x in r]'
```

**Strategies** (the `type`):
| type | behavior |
|---|---|
| `BFSDeepCrawlStrategy` | breadth-first (level by level) — good default |
| `DFSDeepCrawlStrategy` | depth-first (follow one branch deep) |
| `BestFirstCrawlingStrategy` | visit highest-scoring links first (needs a scorer) |

**Params:** `max_depth` (links from seed), `max_pages` (hard cap — the server also clamps via `governor.py`), `include_external` (follow off-domain links).

### Filter to a section
Add a `filter_chain` so it only follows matching URLs:
```json
"deep_crawl_strategy":{"type":"BFSDeepCrawlStrategy","params":{
  "max_depth":2,"max_pages":25,
  "filter_chain":{"type":"FilterChain","params":{"filters":[
    {"type":"URLPatternFilter","params":{"patterns":["*core*"]}},
    {"type":"DomainFilter","params":{"allowed_domains":["docs.example.com"]}}
  ]}}
}}
```

### Prioritize by relevance (BestFirst)
```json
"deep_crawl_strategy":{"type":"BestFirstCrawlingStrategy","params":{
  "max_depth":2,"max_pages":25,
  "url_scorer":{"type":"KeywordRelevanceScorer","params":{"keywords":["pricing","api"],"weight":0.7}}
}}
```

## Batch a known URL list (no link-following)

When you already have the URLs (≤100), skip deep-crawl:
```bash
curl -s -X POST "$CRAWL4AI_BASE_URL/crawl" -H "Authorization: Bearer $CRAWL4AI_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"urls":["https://a.com","https://b.com"],
       "crawler_config":{"type":"CrawlerRunConfig","params":{"cache_mode":"bypass"}}}'
```

## Quick reference

| Need | How |
|---|---|
| Crawl a site to depth N | `deep_crawl_strategy` (BFS/DFS/BestFirst) |
| Only a section | add `filter_chain` (URLPatternFilter / DomainFilter) |
| Most-relevant first | `BestFirstCrawlingStrategy` + `KeywordRelevanceScorer` |
| N known URLs | `urls:[...]` (≤100), no strategy |
| Streaming (NDJSON) | `POST /crawl/stream` |
| Async + webhook | `POST /crawl/job` → `GET /job/{task_id}` |

## Common mistakes

- `max_pages` too high on a big site → long crawl; server clamps but start small (10–25) and raise.
- `include_external:true` can wander off-site — keep `false` + a `DomainFilter` for site crawls.
- Deep-crawl needs a single seed per strategy; pass one URL in `urls` when using `deep_crawl_strategy`.
- Result `markdown`/`extracted_content` fields are strings — parse them.
- The trust patch is baked into the `crawl4ai-trusted` image; on a version bump, rebuild it (`docker compose build crawl4ai`) or these strategies 400 again.
