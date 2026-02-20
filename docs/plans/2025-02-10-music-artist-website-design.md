# Music Artist Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a simple music artist website with Netlify + Decap CMS. Artists log in to update bio, links, shows, photos, and videos. Content lives in git. Public site is static, one-page scroll with hero, music, shows, videos, about, connect, contact.

**Architecture:** Static site built with 11ty. Decap CMS at `/admin` for content editing. Netlify Identity for auth (no GitHub required). Netlify Git Gateway commits Decap edits to repo. Each artist gets a subdirectory (e.g. `artist-sites/artist-name/`). Content in `content/` as markdown/JSON; 11ty builds at deploy time.

**Tech Stack:** 11ty, Decap CMS, Netlify (hosting + Identity + Git Gateway), vanilla CSS (CSS variables for themes), no JS framework.

**References:**
- `docs/ux-research-music-artist-websites.md` – content schema, page structure, requirements
- Decap CMS: https://decapcms.org/docs/
- 11ty: https://www.11ty.dev/docs/

---

## Task 1: Create Project Structure for First Artist

**Files:**
- Create: `example-artist/.gitkeep`
- Create: `example-artist/admin/.gitkeep`
- Create: `example-artist/content/.gitkeep`
- Create: `example-artist/static/.gitkeep`
- Create: `example-artist/_includes/.gitkeep`

**Step 1:** Create directory structure

```bash
mkdir -p example-artist/admin example-artist/content example-artist/static/css example-artist/static/js example-artist/static/images/uploads example-artist/_includes
```

**Step 2:** Add .gitkeep so empty dirs are tracked (or add a placeholder file)

**Step 3:** Commit

```bash
git add example-artist/
git commit -m "chore: add example-artist directory structure"
```

---

## Task 2: Add Decap CMS Admin Page

**Files:**
- Create: `example-artist/admin/index.html`
- Create: `example-artist/eleventy.config.js` (stub for now so 11ty copies admin)

**Step 1:** Create `example-artist/admin/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</head>
<body></body>
</html>
```

**Step 2:** Create minimal `example-artist/eleventy.config.js` to pass-through admin folder

```javascript
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("static");
  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site",
      data: "_data",
    },
    passthroughFileCopy: true,
  };
};
```

**Step 3:** Commit

```bash
git add example-artist/admin/index.html example-artist/eleventy.config.js
git commit -m "feat: add Decap CMS admin page"
```

---

## Task 3: Add Decap CMS Config – Backend and Media

**Files:**
- Create: `example-artist/admin/config.yml`

**Step 1:** Create `example-artist/admin/config.yml` with backend and media settings

```yaml
backend:
  name: git-gateway
  branch: main

media_folder: "static/images/uploads"
public_folder: "/images/uploads"

locale: "en"
```

**Note:** `repo` is not needed for git-gateway; Netlify infers it from the connected site.

**Step 2:** Commit

```bash
git add example-artist/admin/config.yml
git commit -m "feat: add Decap backend and media config"
```

---

## Task 4: Add Decap CMS Collections – Site Config and Bio

**Files:**
- Modify: `example-artist/admin/config.yml`

**Step 1:** Add `site_url` and `display_url` (update after Netlify deploy)

```yaml
site_url: https://example-artist.netlify.app
display_url: https://example-artist.netlify.app
```

**Step 2:** Add collections for site config (single file) and bio

```yaml
collections:
  - name: "site"
    label: "Site"
    files:
      - name: "config"
        label: "Site Config"
        file: "content/site.json"
        fields:
          - { label: "Artist Name", name: "artistName", widget: "string" }
          - { label: "Tagline", name: "tagline", widget: "string", required: false }
          - { label: "Logo", name: "logo", widget: "image", required: false }

  - name: "bio"
    label: "Bio"
    files:
      - name: "bio"
        label: "Bio"
        file: "content/bio.json"
        fields:
          - { label: "Short Bio (Hero)", name: "short", widget: "text" }
          - { label: "Long Bio (About)", name: "long", widget: "markdown" }
```

**Step 3:** Create placeholder content files so Decap can open them

Create `example-artist/content/site.json`:
```json
{
  "artistName": "Example Artist",
  "tagline": "Music that moves you",
  "logo": ""
}
```

Create `example-artist/content/bio.json`:
```json
{
  "short": "A musician making waves.",
  "long": "## About\n\nWrite your full bio here."
}
```

**Step 4:** Commit

```bash
git add example-artist/admin/config.yml example-artist/content/site.json example-artist/content/bio.json
git commit -m "feat: add site and bio collections to Decap"
```

---

## Task 5: Add Decap Collections – Links, Shows, Photos, Videos

**Files:**
- Modify: `example-artist/admin/config.yml`
- Create: `example-artist/content/links.json`
- Create: `example-artist/content/shows.json`
- Create: `example-artist/content/videos.json`

**Step 1:** Add links collection (music + social)

```yaml
  - name: "links"
    label: "Links"
    files:
      - name: "links"
        label: "Links"
        file: "content/links.json"
        fields:
          - label: "Music Links"
            name: "music"
            widget: "list"
            fields:
              - { label: "Platform", name: "platform", widget: "select", options: ["Spotify", "Apple Music", "Bandcamp", "YouTube Music", "SoundCloud", "Other"] }
              - { label: "URL", name: "url", widget: "string" }
          - label: "Social Links"
            name: "social"
            widget: "list"
            fields:
              - { label: "Platform", name: "platform", widget: "select", options: ["Instagram", "TikTok", "Twitter", "YouTube", "Facebook", "Other"] }
              - { label: "URL", name: "url", widget: "string" }
```

**Step 2:** Add shows collection

```yaml
  - name: "shows"
    label: "Shows"
    folder: "content/shows"
    create: true
    format: "json"
    extension: "json"
    slug: "{{year}}-{{month}}-{{day}}_{{slug}}"
    fields:
      - { label: "Date", name: "date", widget: "datetime" }
      - { label: "Venue", name: "venue", widget: "string" }
      - { label: "City", name: "city", widget: "string" }
      - { label: "Ticket URL", name: "ticketUrl", widget: "string", required: false }
```

**Step 3:** Add photos collection

```yaml
  - name: "photos"
    label: "Photos"
    folder: "content/photos"
    create: true
    format: "json"
    extension: "json"
    slug: "{{slug}}"
    fields:
      - { label: "Image", name: "image", widget: "image" }
      - { label: "Caption", name: "caption", widget: "string", required: false }
```

**Step 4:** Add videos collection

```yaml
  - name: "videos"
    label: "Videos"
    folder: "content/videos"
    create: true
    format: "json"
    extension: "json"
    slug: "{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "YouTube URL", name: "youtubeUrl", widget: "string", hint: "Paste the full URL e.g. https://www.youtube.com/watch?v=xxxx" }
```

**Step 5:** Add contact collection

```yaml
  - name: "contact"
    label: "Contact"
    files:
      - name: "contact"
        label: "Contact"
        file: "content/contact.json"
        fields:
          - { label: "Email", name: "email", widget: "string", required: false }
          - { label: "Mailing List Embed", name: "mailingListEmbed", widget: "text", required: false, hint: "Paste Mailchimp/ConvertKit embed code" }
```

**Step 6:** Create placeholder JSON files

`content/links.json`:
```json
{
  "music": [],
  "social": []
}
```

`content/contact.json`:
```json
{
  "email": "",
  "mailingListEmbed": ""
}
```

Create empty `content/shows/.gitkeep`, `content/photos/.gitkeep`, `content/videos/.gitkeep` (or Decap will create on first add).

**Step 7:** Commit

```bash
git add example-artist/admin/config.yml example-artist/content/
git commit -m "feat: add links, shows, photos, videos, contact collections"
```

---

## Task 6: Configure 11ty to Read Content

**Files:**
- Modify: `example-artist/eleventy.config.js`
- Create: `example-artist/.gitignore`

**Step 1:** Update `eleventy.config.js` to use `content/` as data directory and configure input

```javascript
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addDataExtension("json", (contents) => JSON.parse(contents));
  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site",
      data: "_data",
    },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    passthroughFileCopy: true,
  };
};
```

**Step 2:** Add `package.json` with 11ty

```json
{
  "name": "example-artist",
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0"
  }
}
```

**Step 3:** Add `.gitignore`: `node_modules/`, `_site/`, `.env`

**Step 4:** Run `npm install` and `npm run build` – should succeed (output may be minimal until we add index).

**Step 5:** Commit

```bash
git add example-artist/eleventy.config.js example-artist/package.json example-artist/.gitignore
git commit -m "chore: configure 11ty and dependencies"
```

---

## Task 7: Create Base Layout and Index Page

**Files:**
- Create: `example-artist/_includes/base.njk`
- Create: `example-artist/index.html` (or `index.njk`)

**Step 1:** Create `_includes/base.njk`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ site.artistName or "Artist" }}</title>
  <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  <nav>
    <a href="#music">Music</a>
    <a href="#shows">Shows</a>
    <a href="#videos">Videos</a>
    <a href="#about">About</a>
    <a href="#connect">Connect</a>
    <a href="#contact">Contact</a>
  </nav>
  <main>
    {{ content | safe }}
  </main>
</body>
</html>
```

**Step 2:** Create `index.njk` that uses layout and loads content

Create `_data/artist.js` to load content from `content/`:

```javascript
const fs = require("fs");
const path = require("path");

const contentDir = path.join(__dirname, "../content");
function loadJson(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(contentDir, filename), "utf8"));
  } catch (e) {
    return {};
  }
}

module.exports = {
  site: loadJson("site.json"),
  bio: loadJson("bio.json"),
  links: loadJson("links.json"),
  contact: loadJson("contact.json"),
  shows: () => {
    // Folder collection - need to read dir
    const dir = path.join(contentDir, "shows");
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith(".md") || f.endsWith(".json"))
      .map((f) => {
        const full = path.join(dir, f);
        return JSON.parse(fs.readFileSync(full, "utf8"));
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },
  photos: () => { /* similar */ return []; },
  videos: () => { /* similar */ return []; },
};
```

Use the second approach (`_data/artist.js`):

```javascript
const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "../content");

function load(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(base, `${name}.json`), "utf8"));
  } catch {
    return {};
  }
}

function loadFolder(name) {
  const dir = path.join(base, name);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json") || f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      return f.endsWith(".json") ? JSON.parse(raw) : { frontmatter: raw };
    });
}

module.exports = function () {
  const shows = loadFolder("shows").sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const photos = loadFolder("photos");
  const videos = loadFolder("videos");
  return {
    site: load("site"),
    bio: load("bio"),
    links: load("links"),
    contact: load("contact"),
    shows,
    photos,
    videos,
  };
};
```

**Note:** Add `format: json` and `extension: json` to shows, photos, videos in Decap config (Task 5) so Decap writes JSON files 11ty can parse.

**Step 3:** Commit. Then create `index.njk` (Task 8), `style.css` (Task 9), `netlify.toml` (Task 10). See plan summary below.

---

## Task 8: Index Page

Create `index.njk` with layout `base.njk`, sections: Hero, Music, Shows, Videos, About, Connect, Contact. Use `artist` data. For YouTube: extract video ID from URL, use `https://www.youtube.com/embed/{{id}}`. For bio markdown: add `markdown-it` and filter.

## Task 9: CSS

Create `static/css/style.css`. CSS variables for themes. Minimal default. Responsive. Per UX research doc.

## Task 10: Netlify

Create `netlify.toml` in `example-artist/`. If repo root is artist-sites, use `base = "example-artist"`, `command = "cd example-artist && npm install && npm run build"`, `publish = "example-artist/_site"`. Enable Identity + Git Gateway in Netlify. Update `site_url` in config.

---

## Execution

Plan complete and saved to `docs/plans/2025-02-10-music-artist-website-design.md`.

**Execution options:**

1. **Subagent-Driven (this session)** – Work through tasks one at a time with review between each.
2. **Parallel Session (separate)** – Open a new session with `@executing-plans` and run through the plan with checkpoints.

**Which approach?**
</think>
Finalizing the plan and adding implementation details:
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace