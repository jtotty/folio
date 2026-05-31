---
name: visual-explainer-core
description: Use when building or modifying any visual-explainer skill (software, article, finance, or new domains) that must share one consistent locked theme. The single source of truth for the explainer family's palette, typography, primitives, code highlighting, Mermaid theme, accessibility, and print — inherited by each skill's self-contained, CDN-rendered template.
---

# Visual Explainer Core

## Overview

One locked design system, shared by every explainer skill. Domain skills supply content and a few
domain-specific components; everything visual — tokens, type, callouts, tables, diagram cards,
interactive primitives, accessibility, print — lives here so the whole family stays identical.
Consistency is the product: a reader recognizes any explainer on sight, with zero per-generation
theme variation.

## What lives here

`SKILL.md` at the root; the theme itself in `assets/`. There is **no build step** — diagrams and
code render in the browser from a CDN.

| Path | Responsibility |
|---|---|
| `assets/core.css` | All shared CSS: `:root` tokens, typography, primitives, the Prism code-token palette, a11y, print. |
| `assets/core.js` | Copy buttons, tabs (+keyboard), sliders, TOC scroll-spy, back-to-top, diagram zoom — plus the locked `mermaid.initialize` and `Prism.highlightAll`. |

## How a domain skill uses the core

Each domain `templates/template.html` is **fully self-contained**: it embeds an inline copy of
`core.css` and `core.js`, and loads Mermaid + Prism from a CDN. To produce an explainer:

1. Start from `templates/template.html` (already self-contained — nothing to wire up).
2. Fill in content: Mermaid as `.mermaid` blocks, code as `<pre><code class="language-X">`. Replace
   `{{LANGUAGE}}` in the Prism `<script>` tag with the language(s) the document uses.
3. **Open the file in a browser.** Mermaid renders the diagrams and Prism highlights the code, both
   from CDN. Nothing to install — no Node, no build. (Output needs a network connection to reach the
   CDN; it is not offline-self-contained, by design.)

## Keeping the theme in sync (canonical core)

`assets/core.css` and `assets/core.js` are the **single canonical copy** of the locked theme; each
template embeds an inline copy. There is deliberately no build to stamp it in automatically, so the
sync is manual: **when you change the theme, edit `core.css`/`core.js` here first, then paste the
updated content into each template's `<style>` / `<script>` block.** Edit the canonical files, never
a template's copy in isolation — that is exactly the drift this core exists to prevent.

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
