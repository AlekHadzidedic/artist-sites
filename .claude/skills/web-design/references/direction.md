# Direction — calibration, clichés, the design plan, and its voice

## Calibration decides how much of this file applies

| Surface | Examples | Anti-generic push | Signature element |
|---|---|---|---|
| Utilitarian | dashboard, admin, settings, CRUD, data table, internal tool | Low — clarity beats character | No, unless brief asks |
| Editorial | landing, marketing, portfolio, campaign, product story, event page | Full strength | Yes, exactly one |
| Hybrid | docs site, pricing page, onboarding flow | Editorial shell, utilitarian content | Optional, small |

For utilitarian surfaces the mandate is: conversion- and task-focused design that removes friction through clarity, trust, and speed — outcome framing, not aesthetic fad. A utilitarian page passes review when a user can complete its primary task without reading instructions, not when it looks distinctive.

## Ground it in the subject

If the brief does not pin down the product or subject, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. The subject's own world — its materials, instruments, artifacts, vernacular — is where distinctive choices come from. A page about letterpress printing has wood type, ink density, and paper texture to draw on; do not give it the same glassmorphic cards you'd give a fintech API.

## The cliché union list

AI-generated design clusters around identifiable looks. All are legitimate when the brief asks for them ("the brief's own words always win"); none may be reached for as a default. If your plan contains one of these and the brief didn't request it, that part fails the genericness review:

1. Warm cream background (near `#F4F1EA`) + high-contrast serif display + terracotta accent.
2. Near-black background + single bright acid-green or vermilion accent.
3. Broadsheet layout: hairline rules, zero border-radius, dense newspaper columns.
4. Purple-to-blue gradient hero.
5. Inter or Space Grotesk as the display face.
6. Emoji as section markers.
7. `rounded-lg` on every element uniformly.
8. The SaaS-template section stack: centered hero → 3-up feature cards → logo strip → pricing table → FAQ accordion, in that order.
9. Text-animation pile-up: three or more sparkle/kinetic/3D-flip text effects on one page (reads as a component-library demo, not a design).
10. Big number + small label + supporting stats + gradient accent as the hero (only use if genuinely the best answer for this subject).
11. Numbered section markers (01 / 02 / 03) on content that is not actually a sequence. Structural devices — numbering, eyebrows, dividers, labels — must encode something true about the content, not decorate it.

## The design plan format

Four parts, written before any code:

**Color** — 4–6 named values with roles, e.g. `ink #1A1714 (text, 90% of the page)`, `bone #F6F3EC (ground)`, `clay #B4552D (accent, held in reserve — links and one CTA only)`. Naming forces a relationship to the subject; "blue-600" is not a name.

**Type** — 2+ roles: a characterful display face used with restraint; a complementary body face; a utility face (often mono) for captions/data if the content has any. State weight and case decisions, not just families.

**Layout** — one sentence of concept + ASCII wireframe. Sketch two candidates and compare before picking:

```
+----------------------------------+   +----------------------------------+
| logo                nav nav CTA  |   | logo                nav nav CTA  |
|                                  |   |----------------+-----------------|
|   DISPLAY HEADLINE SPANNING      |   | DISPLAY        | [ tall image ]  |
|   TWO LINES, LEFT-ALIGNED        |   | HEADLINE       | [ bleeds off  ] |
|   short standfirst, 55ch         |   | body 45ch      | [ right edge  ] |
|   [CTA]  [ghost]                 |   | [CTA]          |                 |
+----------------------------------+   +----------------+-----------------+
```

**Signature** (editorial only) — the single element the page will be remembered by, described concretely enough that someone else could build it. One signature per page. Everything else stays quiet.

**The hero is a thesis.** Open with the most characteristic thing in the subject's world — a headline, an image, an animation, a live demo, an interactive moment — whatever form the subject itself suggests.

## The genericness review (pass 2)

Before building, run each plan part through: "Would I have produced roughly this for any similar brief?" Mentally work a neighboring prompt (different subject, same page type) — if you land somewhere similar, that part is a default, not a choice. Revise it and state what changed and why. Also check: where the brief left an axis free, did you spend that freedom on a cliché-list item? Not taking a risk can be a risk itself — a plan with zero decisions anyone could object to is also a fail for editorial work.

## Voice: how to write the plan

Design direction is written in concrete, sensory, falsifiable statements. Two examples of the right register:

> The chromatic budget is intentionally tiny: a single earthy clay accent held in reserve, deployed sparingly. Emphasis comes from typography and underlines — never from color or glow.

> Buttons are skewed white blocks with hard black shadows that grow on hover, like posters or arcade signs reacting to the player.

Both can be checked against the built page: either emphasis uses color/glow or it doesn't; either the shadows grow on hover or they don't. Contrast with the wrong register: "modern, clean, bold, with a premium feel" — true of nothing in particular, constrains nothing, verifiable never. If a sentence in your plan would be true of any website, delete it.

## Do Not

- Do not start writing components before the four-part plan exists and has passed the genericness review.
- Do not put two signature elements on one page. One risk, spent deliberately.
- Do not use unfalsifiable adjectives ("clean", "modern", "sleek", "premium") anywhere in a design plan.
- Do not apply editorial boldness to utilitarian surfaces — a distinctive settings page is a worse settings page.
- Do not use any cliché-list item on a free axis. If the brief requests one, use it; note that it was requested.
- Do not decorate with structure: no numbered markers on non-sequences, no eyebrows that repeat the heading, no dividers between things that aren't separate.
- Do not skip the "remove one accessory" pass before shipping.
