# UX Research: Music Artist Websites

**Purpose:** Identify what the best-looking artist sites have and need, to inform the artist-sites project and eventual skill creation.

**Method:** Competitive/benchmark research + industry best practices (synthesized per UX skill Workflow 4).

---

## 1. Essential Content Elements

| Element | Priority | Purpose |
|---------|----------|---------|
| **Bio** | Must-have | Background, influences, achievements. Short + long versions. |
| **Music hub** | Must-have | Embedded players, streaming links (Spotify/Apple/Bandcamp), purchase options. Accessible from homepage. |
| **Shows/tour dates** | Must-have | Upcoming performances with ticket links. Keep updated. |
| **Social + streaming links** | Must-have | Direct links to all platforms. "Smart links" to multiple streaming services. |
| **Mailing list signup** | Must-have | Own the relationship; not dependent on social algorithms. |
| **Contact** | Must-have | For fans and collaborators. Easy to find. |
| **Press kit (EPK)** | Should-have | High-res photos, bio, album art, press clips for media and promoters. |
| **Discography** | Should-have | Releases with cover art, dates, project details. |
| **Photos/gallery** | Should-have | Professional shots, live photos, imagery that reflects the artist. |
| **Merch store** | Nice-to-have | Products with clear navigation. |
| **Videos** | Must-have (v1) | Embedded YouTube – music videos, live clips, behind-the-scenes. |
| **News/blog** | Nice-to-have | Keeps site fresh; tour announcements, releases. |

**Design implication:** Our schema must support bio, music links, shows, social links, mailing list, contact, photos, press materials, and embedded video (YouTube). Merch/news can be Phase 2.

---

## 2. Visual Design Patterns (What Makes Them "Best Looking")

### Two Dominant Philosophies

| Style | Best for | Characteristics |
|-------|----------|-----------------|
| **Bold** | EDM, synth-pop, punk, beat producers | Neon on dark, full-width imagery, strong typography, dynamic layouts, memorable first impression |
| **Minimal** | Classical, singer-songwriter, indie | Black-and-white or muted palette, lots of whitespace, content-first, professional |

### Cross-Style Essentials

- **Hero section** – Immediately captures attention. Often photo/video + artist name.
- **Clear navigation** – Few items (Music, Shows, About, Contact, Merch). One-page scroll with jump links is common.
- **Strategic whitespace** – Content breathes; nothing feels cramped.
- **Typography** – Oversized headlines for impact. Coordinated with brand.
- **Color** – Palette reflects artist brand and genre.
- **High-quality visuals** – Photos and art must look professional; low-res hurts credibility.
- **Scroll-triggered animations** – Subtle motion keeps pages dynamic without being gimmicky.
- **Transparent/clean header** – Navigation stays visible and unobtrusive.

**Design implication:** Support both aesthetic directions. Use CSS variables for palette; allow full-width hero, gallery, and typography choices. Keep structure simple so visual style can vary per artist.

---

## 3. Functional Requirements

| Feature | What It Does | Admin Needs |
|---------|--------------|-------------|
| Music links | Links to Spotify, Apple Music, Bandcamp, YouTube, SoundCloud | Add/edit/remove links, set primary platform |
| Tour dates | List of shows with date, venue, city, ticket URL | CRUD shows; mark past |
| Photos | Gallery of images | Upload, reorder, caption, delete |
| Videos | Embedded YouTube | Add YouTube URL, title, optional order |
| Bio | Short and long versions | Edit text |
| Social links | Instagram, TikTok, Twitter, etc. | Add/edit/remove |
| Mailing list | Signup form | Embed code or form config |
| Press kit | Downloadable assets | Upload PDF, photos; edit EPK text |
| Contact | Email or form | Edit contact method |

**Design implication:** Admin must support: links (music + social), show schedule CRUD, photo uploads, video embeds (YouTube URL), bio edits. Mailing list = embed (Mailchimp/ConvertKit) or simple form. Contact = configurable.

---

## 4. Fan Journey (Simplified)

| Stage | Fan goal | Touchpoints | Success |
|-------|----------|-------------|---------|
| **Discover** | Find the artist | Search, social, link in bio | Lands on site |
| **Listen** | Hear the music | Homepage player, Music section | Plays track, clicks streaming link |
| **Connect** | Stay connected | Mailing list, social links | Subscribes, follows |
| **Attend** | See a show | Shows section | Finds date, clicks ticket link |
| **Support** | Buy merch/music | Merch, Bandcamp, store links | Completes purchase |

**Design implication:** Homepage should quickly support Listen (music) and Connect (mailing list, social). Shows and merch can be one click away. No dead ends.

---

## 5. Design Implications for artist-sites

### Content Schema (Admin-Editable)

- **Site config:** Artist name, tagline, logo
- **Bio:** Short (hero), long (about page)
- **Links:** Music (Spotify, Apple, Bandcamp, YouTube, etc.), social (Instagram, TikTok, etc.)
- **Shows:** Date, venue, city, ticket URL, status (upcoming/past)
- **Photos:** Image, caption, order
- **Videos:** YouTube URL, title, order
- **Press kit:** EPK text, downloadable assets
- **Contact:** Email or form destination

### Public Page Structure

1. **Hero** – Name, tagline, key visual, primary CTA (listen / mailing list)
2. **Music** – Player or link grid to streaming
3. **Shows** – Upcoming dates with ticket links
4. **Videos** – Embedded YouTube (music videos, live clips)
5. **About** – Long bio, optionally photos
6. **Connect** – Mailing list, social links
7. **Contact** – For booking, press, fans

### Visual Flexibility

- Theme options: Bold vs minimal (or both via CSS variables)
- Palette configurable per artist
- Typography scale (headings, body)
- Full-width hero and gallery support

---

## 6. Priorities for v1 (Simple)

**Include:**
- Bio (short + long)
- Music links (streaming)
- Show schedule
- Social links
- Photo gallery
- Embedded video (YouTube)
- Mailing list embed
- Contact info

**Defer:**
- Merch store
- Blog/news
- Complex press kit (simple EPK OK)

---

*Synthesized from: Hypebot, Wegic, HTML Burger, Really Good Designs, Allison Rolls, Travlrd, Bandzoogle. No primary user research; benchmark/industry synthesis.*
