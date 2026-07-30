---
name: crawl4ai-interact
description: Use when a page needs JavaScript or multi-step interaction before scraping with the self-hosted crawl4ai server — reading JS-rendered values, scrolling/clicking to load content, keeping a browser session across steps (login, pagination), or returning computed values. Triggers on "run JS on the page", "execute javascript", "scroll to load", "click then scrape", "log in then crawl", "paginated", "infinite scroll", "the scrape came back empty because it's a JS app".
---

# crawl4ai — JS execution (`/execute_js`)

Run JavaScript snippets on a page and capture their return values, then scrape the resulting DOM. Enabled on this server (`CRAWL4AI_EXECUTE_JS_ENABLED=true`). **REQUIRED BACKGROUND:** creds/auth/URLs in the `crawl4ai` skill.

## Run scripts, get results

`POST /execute_js` with `scripts` (array; each snippet may `return` a value).

```bash
set -a; source ~/.claude/crawl4ai.env; set +a
curl -s -X POST "$CRAWL4AI_BASE_URL/execute_js" \
  -H "Authorization: Bearer $CRAWL4AI_API_TOKEN" -H 'Content-Type: application/json' -d '{
    "url":"https://example.com",
    "scripts":[
      "window.scrollTo(0, document.body.scrollHeight)",
      "return document.querySelectorAll(\"a\").length",
      "return document.title"
    ]}' | python -c 'import sys,json;print(json.load(sys.stdin)["js_execution_result"])'
```

- `js_execution_result.results[i]` = return value of `scripts[i]` (null if it returns nothing). Verified: returns `{"success":true,"results":["Example Domain",1]}`.
- The same response also carries the **post-JS** `html`, `cleaned_html`, `links`, `media` — run JS, then scrape the rendered DOM in one call (feed the HTML into `crawl4ai-extract` selectors).

## Stateful multi-step flows (`/crawl` with `session_id` + `js_code`)

This server runs a derived image (`crawl4ai-trusted`) patched so **authenticated requests are TRUSTED** (baked in, zero maintenance — see umbrella `crawl4ai` skill), so `session_id` and in-crawl `js_code` work — keep one browser tab alive across calls for login → navigate → paginate. Reuse the same `session_id`; use `js_only:true` on follow-ups to run JS without a fresh navigation.

```bash
set -a; source ~/.claude/crawl4ai.env; set +a
POST(){ curl -s -X POST "$CRAWL4AI_BASE_URL/crawl" -H "Authorization: Bearer $CRAWL4AI_API_TOKEN" -H 'Content-Type: application/json' -d "$1"; }
# step 1: load page, keep the session
POST '{"urls":["https://example.com/list"],"crawler_config":{"type":"CrawlerRunConfig","params":{"session_id":"job1","cache_mode":"bypass"}}}' >/dev/null
# step 2: same session — click "next" / load more, then read the new DOM
POST '{"urls":["https://example.com/list"],"crawler_config":{"type":"CrawlerRunConfig","params":{"session_id":"job1","js_only":true,"js_code":["document.querySelector(\".next\").click()"],"cache_mode":"bypass"}}}'
```

- `wait_for` (CSS/JS condition) pairs well with `js_code` to wait for content after an action.
- `/execute_js` (above) is simpler for **single-load** JS; use `session_id` when state must persist across calls.

## `/execute_js` notes

- Enabled via `CRAWL4AI_EXECUTE_JS_ENABLED=true`; disable with `=false` + `docker compose up -d crawl4ai`.
- Each `/execute_js` call is a fresh page load — for persistence use the `session_id` flow above.

## Common mistakes

- Forgetting `return` — a snippet with no `return` yields null in `results`.
- Reusing a `session_id` after the page navigated away — keep the same URL + `js_only:true` for follow-up steps.
- Not waiting for async content — add `wait_for` after a click before reading the DOM.
- The trust patch is baked into the `crawl4ai-trusted` image; on a version bump, rebuild it (`docker compose build crawl4ai`) or `session_id`/`js_code` 400 again.
