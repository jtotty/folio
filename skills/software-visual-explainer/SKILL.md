---
name: software-visual-explainer
description: Use when turning a dense software artifact — a design spec, RFC, ADR, implementation plan, codebase tour, API or protocol design, migration/refactor proposal — or an in-progress feature/app brainstorm from the current Claude Code session into a single self-contained HTML explainer that mixes plain-language framing with diagrams and syntax-highlighted real code. Software topics only; language-, framework-, and stack-agnostic.
---

# Software Visual Explainer

## Core principle: stay in the loop

The output exists for one reason: the human actually reads the artifact. Optimize every micro-decision
(density, length, diagram choice, snippet selection) for "I will read this once" comprehension over
"I have completely documented the topic." A 60% explanation the reader finishes beats a 100% one they
won't open. Don't sacrifice clarity to save tokens — HTML is 2–4× more verbose than markdown and the
cost is worth it.

## When to use

Trigger phrases: "create an explainer", "help me understand X" (code/system topics), "make a visual
walkthrough of this feature", "turn this spec into something readable", "single HTML file to explain
this", "draw up what we've been discussing", "turn this brainstorm into an explainer".

The input is either a **written artifact** (a spec, doc, or chunk of code) or **the conversation
itself** (a brainstorm with no doc yet). The moment a brainstorm gets written to a spec, treat that
spec as the written artifact and use ordinary document mode.

Output: **one fully self-contained HTML file** by default, typically `docs/explainers/<topic>.html`.
For exploration topics with genuinely separate deliverables, a linked web of HTML files is acceptable —
each file its own complete artifact.

## When NOT to use

- **Side-by-side option comparison grids** (e.g. "6 onboarding approaches") → sibling skill
  `code-option-comparison`.
- **Design prototypes with live-tuning sliders**, or **throwaway editors** → prompt from scratch.
- **Non-software topics** (mechanical, biology, finance) → a different skill or none.

PR code review (diff annotation) and an undocumented brainstorm are **modes within this skill**, not
exclusions — see `references/content-shape.md`.

## Process

1. **Read every source fully.** Specs first (intent), plans second (what shipped). Don't skim —
   accuracy is the whole job. (Brainstorm mode: the "source" is the conversation scrollback.)
2. **Verify against the source-of-truth code.** Docs drift from implementation. Confirm every symbol,
   state name, type, and signature against the actual codebase — prefer Serena MCP (`find_symbol`,
   `get_symbols_overview`, `find_referencing_symbols`); fall back to `git grep`. Trust the code over
   the doc. (Brainstorm mode: verify only *existing-code* references; proposed code gets the
   `proposed` badge instead.)
3. **Pick the syntax-highlighting language(s).** Detect from the repo's file extensions, or ask. The
   template loads Prism from CDN — replace `{{LANGUAGE}}` in its `<script>` tag (duplicate the line
   for multiple languages). See `references/diagrams-and-code.md`.
4. **Draft from `templates/template.html`.** Replace placeholders; preserve the locked palette, fonts,
   and component styles. Structure per `references/content-shape.md`.
5. **Self-review against the codebase.** Map every snippet, state name, and named entity back to a
   real symbol. Fix discrepancies before showing the user.
6. **Offer to review.** End by asking the user to spot-check; don't declare complete until they've seen
   it rendered. Run the full `references/verification.md` checklist first.

## Reference map

This SKILL.md is the orchestrator. Detail lives in the reference files — read the one you need:

| For… | Read |
|---|---|
| Section order, PR mode, brainstorm mode, density, technical/non-technical mix | [`references/content-shape.md`](references/content-shape.md) |
| Mermaid / HTML-box / SVG diagrams, and how code gets highlighted | [`references/diagrams-and-code.md`](references/diagrams-and-code.md) |
| Copy buttons, tabs, sliders, badges, responsiveness, the locked visual system | [`references/primitives.md`](references/primitives.md) |
| The pre-completion checklist (accuracy, build, a11y, print, brainstorm) | [`references/verification.md`](references/verification.md) |
| The HTML skeleton to start from | `templates/template.html` |

## Rendering (CDN, no build)

`templates/template.html` is **fully self-contained**: it embeds the shared core and loads Mermaid +
Prism from a CDN. There is **no build step**. Write `.mermaid` blocks and `<pre><code class="language-X">`,
replace `{{LANGUAGE}}` in the Prism `<script>` tag with the language(s) used, and **open the file in a
browser** — Mermaid renders the diagrams and Prism highlights the code. Nothing to install, no Node.
(The page needs a network connection to reach the CDN; it is not offline-self-contained, by design.)

**Do not fork the palette.** The template's `<style>`/`<script>` are an inline copy of
`visual-explainer-core`'s `core.css`/`core.js`. Never hand-edit the theme in one template — change the
canonical `core.css`/`core.js` and re-sync (see that skill). Add only software-specific components in
the template's own `<style>` block.

## Output file location

Ask the user, or default to a sensible spot based on the repo (an existing `docs/`, `notes/`, or
`wiki/`; create `docs/explainers/` if nothing fits). Write the full HTML inline with the Write tool;
keep the topic name kebab-case. Don't split a single explainer into multiple files.
