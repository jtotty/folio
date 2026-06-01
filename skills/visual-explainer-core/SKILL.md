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

`SKILL.md` at the root; the theme in `assets/`; the splicer in `scripts/`.

| Path | Responsibility |
|---|---|
| `assets/core.css` | All shared CSS: `:root` tokens, typography, primitives, the Prism code-token palette, a11y, print. |
| `assets/core.js` | Copy buttons, tabs (+keyboard), sliders, TOC scroll-spy, back-to-top, diagram zoom — plus the locked `mermaid.initialize` and `Prism.highlightAll`. |
| `scripts/assemble.sh` | Stamps `core.css`/`core.js` into a marker-based draft to produce the final HTML. Zero install (awk/bash); the only "build" there is. |

## How a domain skill uses the core

Each domain `templates/template.html` is a **marker skeleton**: structure and component markup, the
Mermaid + Prism CDN tags, and two markers — `<!-- @core:css -->` / `<!-- @core:js -->` — where the
shared theme is stamped in. To produce an explainer:

1. Copy `templates/template.html` to a working draft.
2. Fill in content: Mermaid as `.mermaid` blocks, code as `<pre><code class="language-X">`. Replace
   `{{LANGUAGE}}` in the Prism `<script>` tag (and the other `{{…}}` placeholders) with the document's
   values.
3. **Splice in the theme:** `bash scripts/assemble.sh <draft> <output.html>` — stamps the canonical
   `core.css`/`core.js` into the markers. Zero install (awk/bash), no Node.
4. **Open `<output.html>` in a browser.** The theme is now inlined; Mermaid + Prism load from CDN.
   (Needs a network connection to reach the CDN; not offline-self-contained, by design.)

## One source of truth (no hand-sync)

`assets/core.css` and `assets/core.js` are the **only** copy of the locked theme. Templates don't
embed it — they carry the `<!-- @core:css -->` / `<!-- @core:js -->` markers, and `assemble.sh` stamps
the canonical files in at generation time. **Drift is impossible by construction:** to change the
theme, edit `core.css`/`core.js` here and every explainer assembled afterward picks it up. Never paste
the theme into a template — there is nothing to keep in sync, and a pasted copy is exactly the drift
this core exists to prevent.

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
