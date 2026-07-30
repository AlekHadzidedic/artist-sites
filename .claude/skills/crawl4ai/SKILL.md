---
name: crawl4ai
description: Use when scraping or crawling web pages, extracting page content as markdown/HTML, taking full-page screenshots or PDFs, running JS on a page, or bulk-crawling a site — via the self-hosted crawl4ai server. This is the default and only web crawler/scraper for this environment. Triggers on "scrape", "crawl", "get the page content", "fetch this URL as markdown", "screenshot this page", "extract data from this site", "download this page". Prefer this over WebFetch for full-page/JS-rendered extraction.
---

# crawl4ai (self-hosted)

Self-hosted **crawl4ai 0.9.2** running on the Hostinger VPS (alongside n8n). **This is the standard tool for all web scraping/crawling in this environment — reach for it first, always.**

- **Public API:** `https://crawl.arlek.online` (Bearer-token auth, valid TLS)
- **Internal** (from n8n / other containers on the VPS): `http://crawl4ai:11235`
- **Creds** (public API): `~/.claude/crawl4ai.env` → `CRAWL4AI_BASE_URL`, `CRAWL4AI_API_TOKEN`
- Docs: https://docs.crawl4ai.com/

## Preferred path: MCP tools

The `crawl4ai` MCP server is registered in Claude Code (SSE, user scope) and shows `✔ Connected`. **Prefer its native tools** when doing interactive work — no curl needed:

| MCP tool | Purpose |
|---|---|
| `md` | Page → Markdown (single-page scrape). |
| `crawl` | Crawl a list of URLs → JSON (html, markdown, links per page) |
| `html` | Cleaned/preprocessed HTML for schema extraction |
| `screenshot` | Full-page PNG |
| `pdf` | Page → PDF |
| `execute_js` | Run JS snippets on the page, return results |
| `ask` | Q&A about the crawl4ai library itself |

If the MCP tools aren't loaded in the current session, use the REST fallback below.

## Fallback path: REST via curl

Load creds, then every request carries `Authorization: Bearer $CRAWL4AI_API_TOKEN`.

```bash
set -a; source ~/.claude/crawl4ai.env; set +a

# page -> markdown (single-page scrape)
curl -s -X POST "$CRAWL4AI_BASE_URL/md" \
  -H "Authorization: Bearer $CRAWL4AI_API_TOKEN" -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","f":"fit"}'

# crawl several URLs -> JSON
curl -s -X POST "$CRAWL4AI_BASE_URL/crawl" \
  -H "Authorization: Bearer $CRAWL4AI_API_TOKEN" -H 'Content-Type: application/json' \
  -d '{"urls":["https://example.com"],"crawler_config":{"type":"CrawlerRunConfig","params":{"cache_mode":"bypass"}}}'

# full-page screenshot -> PNG artifact
curl -s -X POST "$CRAWL4AI_BASE_URL/screenshot" \
  -H "Authorization: Bearer $CRAWL4AI_API_TOKEN" -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```

### Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/md` | POST | URL → markdown |
| `/html` | POST | URL → cleaned HTML |
| `/crawl` | POST | crawl URL list → JSON |
| `/crawl/stream` | POST | streaming NDJSON results |
| `/crawl/job` | POST | async crawl (returns task id; optional webhook) |
| `/llm/job` | POST | async LLM extraction (needs an LLM key set on the server) |
| `/job/{task_id}` | GET | poll async job status/result |
| `/screenshot` | POST | full-page PNG |
| `/pdf` | POST | page → PDF |
| `/execute_js` | POST | run JS on page |
| `/health` | GET | health (no auth) |
| `/playground` | GET | browser test UI (auth) |

### `/md` request fields
`{"url": "...", "f": "fit" | "raw", "q": null, "c": "0"}`
- `f`: `fit` = cleaned "fit" markdown (default, best for LLMs); `raw` = full page markdown.
- `q`: optional query string for content filtering (BM25-style relevance).
- `c`: cache mode (`"0"` = bypass).

## Using it inside n8n (on the VPS)

Use the **internal** URL `http://crawl4ai:11235` (no public hop) in n8n HTTP Request nodes. Still send the Bearer header — the token is in the stack `.env` as `CRAWL4AI_API_TOKEN`. Endpoints for n8n:
- single page → `POST /md`
- multi-page / deep crawl → `POST /crawl` (sync) or `POST /crawl/job` (async + webhook)

## Ops (VPS)

- SSH: `ssh vps` (alias → `root@srv1317127.hstgr.cloud`, key `~/.ssh/vps_crawl4ai`).
- Container: `n8n-crawl4ai-1` (compose project `n8n`, defined in `/docker/n8n/docker-compose.override.yml` — n8n's own compose is untouched).
- Config: `/docker/crawl4ai/config.yml` (tuned for the 4GB box: `crawler.pool.max_pages=6`, `mem_limit 2.5g`, 4GB swap added).
- Restart crawl4ai only: `cd /docker/n8n && docker compose up -d crawl4ai`
- Logs: `docker logs --tail 50 n8n-crawl4ai-1`
- Health: `curl -s https://crawl.arlek.online/health`
- **Never** run `docker compose down` here (stops n8n + traefik too). To remove only crawl4ai: `docker compose rm -sf crawl4ai`.

## Related skills (task recipes)

- **`crawl4ai-crawl`** — many pages / a site section (batch URL list + links-following pattern).
- **`crawl4ai-extract`** — structured JSON via CSS/XPath/regex schemas.
- **`crawl4ai-interact`** — run JavaScript on a page (`/execute_js`) for JS-rendered content.

## Trust boundary (this server is patched)

Upstream 0.9.2 loads every HTTP request as `Provenance.UNTRUSTED`, which **400-rejects** the "power fields" (`deep_crawl_strategy`, `session_id`, in-crawl `js_code`, proxy). **This server runs a derived image patched so authenticated requests are TRUSTED** — the token *is* the trust boundary — so all of those work over REST. `/execute_js` is also enabled (`CRAWL4AI_EXECUTE_JS_ENABLED=true`).

- The patch is **baked into a derived image** `crawl4ai-trusted:0.9.2` via `/docker/crawl4ai/Dockerfile` (`sed Provenance.UNTRUSTED→TRUSTED` in `api.py`+`server.py`, as root at build; runtime stays `appuser`). The compose override uses `build:` (BASE arg), not `image:`. Survives restarts/reboots automatically — **zero maintenance**. `governor.py` still caps deep-crawl pages/depth.
- **Version bump:** change `BASE` in the override → `cd /docker/n8n && docker compose build crawl4ai && docker compose up -d crawl4ai`. The Dockerfile self-checks and the build fails loudly if upstream renamed the field.
- **Revert:** in the override set `image: unclecode/crawl4ai:0.9.2` (drop the `build:` block) → `docker compose up -d crawl4ai`.
- Tradeoff accepted: a token-holder can drive deep-crawl / arbitrary `js_code` / proxy (SSRF surface) — acceptable because the API is token-gated on a private box.

## Notes / limits

- Small box: `pool.max_pages=6`, deep-crawl clamped to `max_pages=25`, per-crawl `wall_clock_s=180`. Bump in `config.yml` if you scale the VPS.
- LLM-extraction endpoints (`/llm/job`, `f=llm`, `LLMExtractionStrategy`) need an LLM API key in the server's env — not configured yet; plain scrape/crawl/markdown/CSS-extraction needs none.
