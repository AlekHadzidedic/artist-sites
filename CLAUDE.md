# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Required Skills

- **Always invoke `using-superpowers`** at the start of any task, new conversation, or after clearing context.
- **Always invoke `frontend-design`** when doing any frontend design work (building pages, components, styling, layouts).

## Project Overview

Static site builder for music artist portfolio websites. Each artist gets a self-contained subdirectory with a one-page scrolling site managed via Decap CMS (formerly Netlify CMS), built with 11ty (Eleventy), and hosted on Netlify.

**Status:** Planning/documentation phase complete. Implementation not yet started. See `docs/plans/2025-02-10-music-artist-website-design.md` for the 10-task implementation roadmap.

## Tech Stack

- **Static generator:** 11ty (Eleventy) v3
- **CMS:** Decap CMS with git-gateway backend
- **Hosting:** Netlify (with Identity + Git Gateway for auth)
- **Styling:** Vanilla CSS with CSS custom properties for theming
- **Templates:** Nunjucks (`.njk`)
- **Content format:** JSON for structured data, Markdown for rich text (bio)
- **No JS framework** — static HTML output, minimal client-side JS

## Commands (per artist directory)

```bash
npm run serve    # eleventy --serve (local dev with hot reload)
npm run build    # eleventy (production build to _site/)
```

## Architecture

### Per-Artist Directory Structure

```
example-artist/
├── admin/              # Decap CMS (index.html + config.yml)
├── content/            # All site content as JSON/Markdown
│   ├── site.json       # Name, tagline, logo
│   ├── bio.json        # Short + long bio
│   ├── links.json      # Music & social links
│   ├── contact.json    # Email, mailing list embed
│   ├── shows/          # Folder collection (one JSON per show)
│   ├── photos/         # Folder collection (one JSON per photo)
│   └── videos/         # Folder collection (one JSON per video)
├── _includes/          # Nunjucks layout templates
├── _data/              # 11ty data loader (artist.js aggregates content/)
├── static/             # CSS, JS, images (pass-through copied)
├── index.njk           # Single-page template with all sections
├── eleventy.config.js  # 11ty configuration
├── package.json        # Only dep: @11ty/eleventy
└── netlify.toml        # Netlify build + deploy config
```

### Data Flow

1. Artist edits content via Decap CMS UI at `/admin`
2. Decap commits JSON/Markdown changes to git via Netlify Git Gateway
3. Git push triggers Netlify build
4. 11ty reads `content/` via `_data/artist.js` data loader
5. Nunjucks templates render a single-page static site
6. Built `_site/` deployed to Netlify CDN

### Key Design Decisions

- **Git as content backend** — no database, content lives in repo as JSON files
- **Per-artist isolation** — each artist is a self-contained subdirectory (can be split to own repo/domain)
- **One-page scroll layout** — sections: Hero, Music, Shows, Videos, About, Connect, Contact
- **Netlify Identity for auth** — artists don't need GitHub accounts to edit their site
- **Two visual modes via CSS variables** — "Bold" (high contrast, neon-on-dark) and "Minimal" (muted, whitespace-heavy)

## v1 Scope

**Included:** Bio, music streaming links, shows/tour dates, social links, photo gallery, YouTube video embeds, mailing list signup, contact info

**Deferred to v2:** Merch store, blog/news, complex press kit

## Key Documentation

- `docs/ux-research-music-artist-websites.md` — UX benchmarking and content requirements
- `docs/plans/2025-02-10-music-artist-website-design.md` — Full implementation plan with code examples for all 10 tasks

<!-- synced-from-global-claude-md -->
# Global rules (synced from ~/.claude/CLAUDE.md, which cloud sessions cannot see)

# Global instructions

## Web scraping / crawling — use crawl4ai ONLY (all projects)
- **All web scraping, crawling, and page extraction uses the self-hosted crawl4ai server. Do NOT use Firecrawl** (its plugin/skills are disabled). Prefer crawl4ai over WebFetch for full-page / JS-rendered content.
- Skills (global): `crawl4ai` (umbrella: scrape/markdown/screenshot/pdf, MCP + REST), `crawl4ai-crawl` (deep-crawl + batch), `crawl4ai-extract` (CSS/XPath/regex JSON), `crawl4ai-interact` (JS + sessions). MCP server `crawl4ai` is registered (user scope).
- **Design / reference research: crawl4ai FIRST, screenshots second.** Pull the page's markdown or HTML with crawl4ai and read the structure (section order, grid, type roles, what the accent is reserved for) before forming any judgement about a reference site. Screenshots are fine and often useful — they are just not the first move, and never the only one. Reason: an image read costs many times a markdown read and answers fewer structural questions.
- Server: `https://crawl.arlek.online` (public, Bearer) / `http://crawl4ai:11235` (internal, e.g. n8n). Creds: `~/.claude/crawl4ai.env`. Ops: `ssh vps` (Hostinger VPS, runs alongside n8n). Runs the derived image `crawl4ai-trusted` — trust patch baked in, so native deep-crawl / sessions / js_code work over REST. See `~/.claude/skills/crawl4ai/SKILL.md` for details + revert.

<!-- synced-from-global-claude-md -->
