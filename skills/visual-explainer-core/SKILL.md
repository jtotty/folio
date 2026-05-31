---
name: visual-explainer-core
description: Use when building or modifying any visual-explainer skill (software, article, finance, or new domains) that must share one consistent locked theme and produce offline self-contained HTML. The single source of truth for the explainer family's palette, typography, primitives, code highlighting, Mermaid theme, accessibility, print, and the build pipeline.
---

# Visual Explainer Core

## Overview

One locked design system, shared by every explainer skill. Domain skills supply content and a few
domain-specific components; everything visual — tokens, type, callouts, tables, diagram cards,
interactive primitives, accessibility, print — lives here so the whole family stays identical.
Consistency is the product: a reader recognizes any explainer on sight, with zero per-generation
theme variation.

## What lives here

Files are grouped by role; `SKILL.md` + `package.json` stay at the root.

| Path | Responsibility |
|---|---|
| `assets/core.css` | All shared CSS: `:root` tokens, typography, primitives, code-token palette, a11y, print. |
| `assets/core.js` | Copy buttons, tabs (+keyboard), sliders, TOC scroll-spy, back-to-top, diagram zoom. |
| `assets/shiki-theme.json` | TextMate theme reproducing the warm code palette (inline-style highlighting). |
| `config/mmdc-config.json` | Mermaid theme/sequence config (locked palette). |
| `config/puppeteer-config.json` | `--no-sandbox` for headless Chromium. |
| `scripts/build.mjs` | Inlines core, pre-renders Mermaid→SVG and code→Shiki, strips CDN. Offline output. |
| `references/build-pipeline.md` | Full walkthrough of what the build does, its deps, and troubleshooting. |

## How a domain skill uses the core

1. The domain `templates/template.html` puts `<!-- @core:css -->` in `<head>` and `<!-- @core:js -->`
   before `</body>`, and adds only its own components in a small `<style>` block.
2. Author fills in content; Mermaid as `.mermaid` blocks, code as `<pre><code class="language-X">`.
3. Run the build to produce a self-contained offline artifact:

       node "${CLAUDE_PLUGIN_ROOT}/skills/visual-explainer-core/scripts/build.mjs" <file.html>

   Install deps once first: `npm install` in `skills/visual-explainer-core/` (fetches a one-time
   headless Chromium). **What each build stage does, and how to debug it, is in
   [`references/build-pipeline.md`](references/build-pipeline.md).**

## The locked palette (do not change)

Background `#f7f5f0`, paper `#ffffff`, code-bg `#f1ede4`. Ink `#1a1a1a`/`#4a4a4a`/`#8a8a8a`,
small-label `#6e6a63` (AA). Accent `#2f5d50` (forest green), warn `#b8651f`, bad `#a8413a`,
proposed `#5d5398`. Serif body (Iowan Old Style → Source Serif Pro → Georgia), mono labels
(SF Mono → JetBrains Mono → IBM Plex Mono → Menlo). No gradients. No emoji. No dark mode.

## Rules for new explainers (article, finance, …)

- **Never redefine `:root` tokens** in a domain template. Add components, not colors.
- New domain components belong in the domain template's small `<style>`, not in `core.css` — unless
  they're genuinely reusable across domains, in which case promote them to `core.css` deliberately.
- Generalize the accuracy discipline: "verify against source of truth" means match the source
  document / figure / rule and cite it (e.g. for finance, a wrong tax figure is harmful — cite the
  authority and the as-of date).

## When NOT to touch this

Don't edit `core.css`/`core.js` for a one-off look in a single explainer — that breaks the family
contract. Per-document needs go in the domain template; only family-wide changes go here.
