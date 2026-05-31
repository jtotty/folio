---
name: code-option-comparison
description: Produces a single-page HTML grid that compares N (typically 3-6) design or implementation options side by side. Each option gets a column with the same sub-sections so the reader can scan tradeoffs at a glance. Use when the user needs to choose between distinct approaches — UI layouts, API shapes, schema designs, algorithm strategies, architectural patterns. Software topics only.
---

# Code Option Comparison

## Why this skill exists

When a user is choosing between distinct ways to do something — "should we use Redis or Postgres LISTEN/NOTIFY for the pubsub layer?", "give me 4 different onboarding flow designs", "compare a polling vs streaming vs websocket implementation" — the right artifact is not a long narrative document. It's a grid: N columns, same sub-sections in each, scannable tradeoffs.

This skill produces that grid as a single self-contained HTML file.

## When to use

Trigger phrases: "compare N approaches", "side-by-side comparison", "give me 4 different ways to X", "lay them out so I can compare", "show me the tradeoffs between X and Y and Z."

Inputs:
- A choice point the user is facing — a design decision, an implementation strategy, a schema shape, an algorithm.
- Either the options enumerated by the user, or a brief asking you to generate N distinct options.

Output: **one self-contained HTML file**, typically at `docs/comparisons/<topic>.html`. The file is a grid with one column per option plus a comparison matrix at the bottom.

## When NOT to use

- **One topic with a narrative arc** → use `software-visual-explainer` instead.
- **PR review** → use `software-visual-explainer` in PR mode.
- **Throwaway interactive editors** → prompt from scratch.
- **More than ~6 options** → grids get unscannable. Pick a top 6 and note the also-rans, or write a narrative.

## Process

1. **Enumerate the options.** Either work from the user's list, or generate N distinct options yourself — explicitly vary the tradeoff each option is making (cost vs latency, simplicity vs flexibility, etc.). Each option must be distinct enough that the comparison is meaningful.
2. **Define the comparison axes** — the same 4-8 questions you'll answer for every option. Examples: complexity to implement, ongoing maintenance cost, latency profile, failure modes, team familiarity, vendor lock-in, observability. Pick axes that actually differentiate the options.
3. **Verify against the codebase** if any option is "what we have today" or "a small extension of what we have." Real symbols, real method names — same rule as `software-visual-explainer`.
4. **Pick the syntax-highlighting language(s)** for any code snippets per column. Load matching Prism components.
5. **Draft using `template.html`** in this skill directory. Fill in N column blocks.
6. **Self-review.** Each column should answer every axis. The comparison matrix at the bottom should let the reader see all options against all axes at once. Don't leave cells empty — write "n/a" or "doesn't apply" explicitly.
7. **Offer to review.** Ask the user to spot-check. Note which option you'd recommend and why; the reader is choosing, not you.

## Content shape

Each option column has the same structure. The shape is rigid — that's what makes it scannable.

| Sub-section | Purpose |
|---|---|
| Option name | Short, distinct (3-6 words). The tradeoff in the name is fine ("Redis — fast but stateful"). |
| Tagline | One-sentence framing of the tradeoff this option is making. |
| Mockup / Diagram | A small Mermaid or SVG illustration of the shape, or a mockup if the topic is UI. |
| Sketch code | 5-15 lines of representative code showing what an implementation looks like. Not full code — the shape. |
| Tradeoffs | 3-5 bullets: what you gain, what you give up. |
| Cost / Effort | Implementation effort, ongoing cost, team-skills required. |
| Pick this if | One sentence: when is this the right call? |

After all N columns: a **comparison matrix table** — rows are the comparison axes (from Process step 2), columns are the options. Cells are short verdicts (✓ / ⚠ / ✗ with one-phrase explanation; or quantitative values if applicable).

After the matrix: a brief **recommendation** section where you state which option you'd lean toward and why, framed as "if I were choosing, I'd start with X because of Y" — leaving the actual choice to the reader.

## Visual system

Same locked palette as `software-visual-explainer` — warm cream `#f7f5f0`, paper `#ffffff`, forest-green accent `#2f5d50`, Iowan Old Style serif body, SF Mono labels. Full CSS in `template.html`.

Each option column is a paper card with the same internal structure. The visual rhythm is the point: identical sub-section order, identical typography, only the content differs. This is what lets the reader compare.

For 3-4 options the columns sit in a CSS grid that's 3-4 wide on desktop, 2 wide at tablet, 1 wide on mobile. For 5-6 options the grid is 3 wide on desktop, 2 wide at tablet, 1 wide on mobile (so 5-6 options become 2 rows of 3).

## Copy buttons

Every code snippet in every column gets a copy button (using the `.copy-btn` primitive from the `software-visual-explainer` template). The recommendation section gets a "copy this option as a starting point" button that exports a structured summary (markdown or JSON) for the reader to paste back into Claude as a prompt to start implementing.

## Verification checklist

- Each option column has all sub-sections filled in (no empty cells, no "TBD").
- Each option is genuinely distinct from the others — if two columns end up similar, drop one.
- The comparison axes actually differentiate (if every option scores the same on an axis, drop the axis).
- The recommendation states a preference with reasoning, framed as a starting point not a verdict.
- Renders standalone in a browser; columns line up; matrix is readable; copy buttons work.
- Ran the build; the output opens correctly with networking disabled — diagrams are inline `<svg>`,
  code is highlighted with distinct token colors, and no `cdnjs`/`jsdelivr` references remain. (Shiki
  emits `class="shiki warm-paper"` and uppercase hex like `#D6432E`; match case-insensitively if you
  script the check.)
- Keyboard pass: Tab reaches every interactive element with a visible focus ring; tabs respond to
  arrow keys; the diagram overlay closes on Escape.
- Contrast: small mono labels use `--ink-label` (AA), not `--ink-dim`.
- Print preview (Cmd-P) is clean: no diagram/table/callout splits mid-page; dark fills are outlined.

## Build (offline self-contained output)

The template references the shared design system via `<!-- @core:css -->` / `<!-- @core:js -->`
markers, writes Mermaid as `.mermaid` blocks, and writes code as `<pre><code class="language-X">`.
After filling in the content, run the build to produce a fully offline, self-contained file:

    node "${CLAUDE_PLUGIN_ROOT}/skills/visual-explainer-core/build.mjs" path/to/your-explainer.html

(When developing this skill outside the installed plugin, use the repo path to
`skills/visual-explainer-core/build.mjs` instead — `${CLAUDE_PLUGIN_ROOT}` is only set inside an
installed plugin.)

The build inlines `core.css`/`core.js`, pre-renders every Mermaid diagram to inline SVG, highlights
every code block via Shiki (inline styles), and strips the CDN tags. The result opens with **no
network**. The first time, install the build's dependencies: run `npm install` once in
`visual-explainer-core/` — this also fetches a headless Chromium for Mermaid (~150–200 MB, one-time;
set `PUPPETEER_EXECUTABLE_PATH` to reuse a system Chrome).

**Do not fork the palette.** All colors, fonts, and component styles live in `visual-explainer-core`.
Never redefine `:root` tokens in a domain template; add only domain-specific components.

## Output file location

Default: `docs/comparisons/<topic>.html`. Create the directory if it doesn't exist. Topic name kebab-case.

## Template

The full HTML skeleton lives at `template.html` next to this `SKILL.md`. Start from a copy of that file.
