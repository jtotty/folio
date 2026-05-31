---
name: software-visual-explainer
description: Converts dense software documents (design specs, RFCs, ADRs, implementation plans, codebase tours, API designs) — or an in-progress feature/app brainstorm from the current Claude Code session — into a single self-contained HTML explainer that mixes plain-language framing with technical detail, diagrams, and syntax-highlighted code. Software topics only — agnostic to language, framework, and stack.
---

# Software Visual Explainer

## Stay in the loop

The output exists for one reason: the human actually reads the artifact. Optimize every micro-decision (density, length, diagram choice, snippet selection) for "I will read this once" comprehension over "I have completely documented the topic." A 60% explanation the reader will finish beats a 100% explanation they won't open. Don't sacrifice clarity to save tokens — HTML is 2–4× more verbose than markdown and the cost is worth it.

## When to use

Trigger phrases: "create an explainer", "help me understand X" (for code/system topics), "make a visual walkthrough of this feature", "turn this spec into something readable", "single HTML file to explain this feature", "draw up what we've been discussing", "turn this brainstorm into an explainer", "visualize this idea".

Inputs are always software-related:
- A design spec plus a stack of per-PR implementation plans.
- An RFC, ADR, or technical research document.
- A complex chunk of an existing codebase the user wants to onboard others to.
- An API design, protocol description, or data flow.
- A migration plan, refactor proposal, or architecture diagram.
- An in-progress brainstorm — a feature or app idea explored in the current session and not yet written down.

The input is either a **written artifact** (a doc, a chunk of code) or **the conversation itself** (a brainstorm with no doc yet). The "Process" and "Content shape" sections below assume a written artifact; "Brainstorm explainer mode" covers the conversation case. The moment a brainstorm gets written to a spec, treat that spec as the written artifact.

Output: **one self-contained HTML file by default**, typically at `docs/explainers/<topic>.html` or wherever the repo keeps narrative docs. For exploration topics with genuinely separate deliverables (e.g. brainstorm → multiple option write-ups → chosen plan), a linked web of HTML files is acceptable — each file is its own complete artifact. External resources (Mermaid, Prism.js) come from CDN; everything else is inlined.

## When NOT to use

This skill is for **explainer-shaped** documents — synthesizing a design, plan, or codebase concept into a readable narrative. Do not use it for the other HTML-artifact shapes:

- **Side-by-side option comparison grids** (e.g. "6 distinct onboarding approaches") → use the sibling skill `code-option-comparison`.
- **Design prototypes with live-tuning sliders** (animation params, system-prompt tuning) → prompt from scratch; the case-by-case shape resists generalization.
- **Throwaway editors** (drag-drop card triage, structured-config editing with copy-out) → prompt from scratch.
- **Non-software topics** (mechanical systems, biology, finance) → use a different skill or none.

PR code review with diff annotation is covered as a mode within this skill — see "PR explainer mode" below. An in-progress brainstorm with no written doc is also covered as a mode — see "Brainstorm explainer mode" below. (A still-divergent brainstorm renders as a *narrative* exploration here; if the user wants a scannable side-by-side grid instead, that is `code-option-comparison`.)

## Process

1. **Read every source fully.** Specs first (for intent), plans second (for what actually shipped). Do not skim — accuracy is the whole job. (Brainstorm mode: the "source" is the conversation scrollback — re-read it end to end the same way; see "Brainstorm explainer mode".)
2. **Verify against the source-of-truth code.** Documents drift from implementation. Confirm every symbol, state name, type name, method signature, and relationship you plan to reference against the actual codebase — prefer Serena MCP semantic lookups (`find_symbol`, `get_symbols_overview`, `find_referencing_symbols`) when available; fall back to `git grep`. Documents written before code often use placeholder names that get renamed during implementation; trust the code over the doc. (Brainstorm mode: verify only the *existing-code* references the brainstorm builds on; proposed code is exempt — mark it with the `proposed` badge instead of verifying it.)
3. **Pick the syntax-highlighting language(s).** Detect from the repo (look at file extensions in the directories the explainer covers) or ask. Prism supports 250+ languages; load the matching component (see "Code blocks" below). If the explainer spans multiple languages (Ruby backend + TypeScript frontend), load a Prism component for each.
4. **Draft the file** using `template.html` (sibling file in this skill directory) as the starting point. Replace placeholders; preserve the palette, fonts, and component styles.
5. **Self-review against the codebase.** Map every code snippet, every state name, every named entity in the document back to a real symbol in the code. Fix discrepancies inline before showing the user. (Brainstorm mode: map only the existing-code references to real symbols; confirm every proposed element instead carries the `proposed` badge.)
6. **Offer to review.** End by asking the user to spot-check; do not declare complete until they've seen it rendered.

## Content shape (in this order)

Adapt to the material. Drop sections that don't apply; never invent content to fill a section.

| Section | Purpose | Style |
|---|---|---|
| Header | eyebrow + h1 + lede + mono meta strip (date, ticket ID, branch, etc.) | One paragraph, plain-language framing of the feature's purpose |
| TOC | paper card, mono eyebrow, two-column ordered list | Anchor links to each section |
| What this feature does | The "why" in plain language, no jargon | A short summary table mapping triggers (HTTP requests, events, state transitions) to effects is often the right move |
| Vocabulary | Define domain terms before using them | 2x2 vocabulary grid of small cards — one term per card |
| Lifecycle / Flow | Dynamic behaviour: state machines, request flow, event sequence | Mermaid state, sequence, or flow diagram inside a `.diagram` paper card |
| Data model / Structure | Static structure: tables, classes, modules, types | Mermaid ER, class, or graph diagram (or custom SVG when Mermaid can't express it) |
| Architecture / Concern shape | How the code is organized | Custom HTML module/class boxes (see `template.html`) with an added/unchanged/kept legend |
| The N PRs, in order | If the topic is a multi-PR stack or migration, summarize each | Grid of paper cards with mono PR tags |
| Key code | The 4-6 most important snippets — actual real code, not pseudocode | `<pre><code class="language-X">` blocks (Prism highlights them) |
| Worked example / Walkthrough | Concrete inputs and outputs for an abstract flow | Dark-header matrix table showing step-by-step state transitions or values |
| Edge cases & guards | The "what if" matrix | Short h3s with one-paragraph answers — reference the actual code path that handles each |
| Out of scope | What this work deliberately does NOT do | Tight bulleted list |
| Footer | Mono small text with source paths | Single line |

## PR explainer mode

When the topic is a single pull request (the meta strip carries a `branch` or `PR #N` field), shift the content shape:

- Replace "What this feature does" with **"What this PR changes"** — diff-shaped summary.
- Add a **"Diff with annotations"** section using `.diff` blocks. Each hunk renders as `.diff-hunk` with line-prefix coloring (`.line.add` in accent-green, `.line.del` in bad-red, `.line.ctx` neutral). Margin annotations attach via `<aside class="margin-note">` blocks alongside specific hunks.
- Use **severity badges** (`.badge.severity-info`, `.severity-warn`, `.severity-block`) on annotations to color-code findings.
- Drop the "PR stack" section (irrelevant for a single PR).
- Always include a **"What to review carefully"** callout listing the 3–5 lines/files that need the reviewer's attention most.

## Brainstorm explainer mode

When the design exists **only in the current conversation** — a feature or app idea explored with Claude in this session and never written to a doc — the source is the conversation scrollback itself. (The moment a written spec exists, that spec is the source and this is ordinary document mode.) This mode has one job document mode does not: **keep the reader certain about what is already real versus what is still just an idea.**

**Divergent vs. converged.** A brainstorm has either settled on a direction or is still weighing options — shape the explainer to match:

- **Converged** — the chat reached a leading direction. Explain that design as the primary narrative; the alternatives shrink to a one-paragraph "why this direction over the others."
- **Divergent** — no decision yet. Render the competing directions as a narrative — prose framing each, tradeoffs, diagrams — ending in a "leaning toward" callout with your recommendation. If the user wants a pure side-by-side scan rather than a narrative, that is the sibling skill `code-option-comparison` — defer to it.

**The `proposed` marker.** Every code block, diagram, and section that describes not-yet-built content carries a `<span class="badge proposed">Proposed</span>` badge (the `.badge.proposed` class ships in `template.html` in a distinct indigo, separate from the severity palette). This is the non-negotiable of brainstorm mode: an idea must never read as shipped reality. Existing code the brainstorm builds on stays unmarked and is verified normally (Process step 2). Pair the badge with a one-line legend near the top so the reader learns the convention immediately.

**Content-shape shifts** from the shared "Content shape" table:

| Shared section | Brainstorm-mode shift |
|---|---|
| Header meta strip | No ticket/branch. Carry a `status` field reading `Exploratory — not yet built`, or `Direction chosen` once converged. |
| What this feature does | → **"What we're exploring"** — the problem and the proposed direction in plain language. |
| *(new)* | **"Directions considered"** — divergent: the competing approaches with tradeoffs, ending in a "leaning toward" callout. Converged: one paragraph on why this direction, or drop. |
| The N PRs, in order | → **"Proposed build order"** — forward-looking implementation slices: how you'd actually ship it, in what order. |
| Key code | Proposed snippets — sketch-level is fine — and every block carries the `proposed` badge. |
| *(new)* | **"Open questions"** — the unresolved decisions, each with a `.copy-btn` so the reader can paste the question straight back into a prompt. |
| Lifecycle / Data model / Architecture diagrams | Kept — diagrams of proposed structures; the `.diagram` card heading carries a `proposed` badge. |
| Out of scope | Kept — still valuable. |

## Visual system (locked)

The palette and components are framework-agnostic and meant to read like a printed technical report. Full CSS is in `template.html`. Key tokens:

- **Background** `#f7f5f0` (warm cream). **Paper** `#ffffff`. **Code-bg** `#f1ede4`.
- **Ink** `#1a1a1a` / `#4a4a4a` / `#8a8a8a` (three weights).
- **Accent** `#2f5d50` (forest green). **Warn** `#b8651f`. **Bad** `#a8413a`. **Good** = accent.
- **Body font**: Iowan Old Style → Source Serif Pro → Georgia (serif stack).
- **Mono font**: SF Mono → JetBrains Mono → IBM Plex Mono → Menlo.
- **No gradients.** **No emoji.**
- **h2** has a top border + 32px top padding. **h3** is accent-colored.
- **h4** is mono, uppercase, letter-spaced — used for eyebrows and dense labels.

The palette is locked across documents for recognizability. If the user explicitly asks for a different palette, follow their lead — otherwise keep this one.

## Diagrams

Three flavors, used together as needed:

1. **Mermaid** for state, flow, sequence, class, and ER diagrams. Always wrap the `.mermaid` block inside a `.diagram` paper card. Theme variables in `template.html` map Mermaid's colors onto the warm palette. Prefer:
   - `stateDiagram-v2` for state machines (AASM, XState, enum-based state fields).
   - `sequenceDiagram` for request/response flows, message-passing, async coordination.
   - `flowchart` for control flow, decision trees, pipeline stages.
   - `erDiagram` for database schemas and entity relationships.
   - `classDiagram` for type hierarchies, inheritance, interface implementations.

   For `sequenceDiagram`, use `participant` rather than `actor` — `actor` draws an oversized stick-figure glyph. The template already ships compact sequence-diagram sizing: a `sequence` config block in `mermaid.initialize` plus `!important` font-size CSS overrides (Mermaid injects an id-scoped `<style>` into the SVG that outranks ordinary class rules, so plain CSS or the JS font config alone will not shrink the text).

2. **Custom HTML module / class boxes** for "what lives where" diagrams — a dark prefixed entity tile pointing down to one or more `.concern` boxes with accent-left-borders and mono lists. Set `data-kind` to a 1-2 letter prefix matching the entity type (M = model, C = class, S = service, R = route, F = function, T = type/interface). Use `<li class="added">` for new code, `<li class="unchanged">` for pre-existing. Pair with a `.legend` row of swatches.

3. **Custom inline SVG** when Mermaid can't express the idea — architecture illustrations needing precise spatial layout, force-flow diagrams, geometric concepts, custom technical drawings. Inline the `<svg>` directly; use palette colors via `fill="#2f5d50"` or via CSS variables. Wrap in a `.svg-diagram` card. Don't reach for SVG when Mermaid would do — only when it's genuinely the right tool.

## Code blocks

- `<pre><code class="language-X">…</code></pre>` where `X` is the Prism language identifier: `ruby`, `python`, `typescript`, `javascript`, `jsx`, `tsx`, `go`, `rust`, `java`, `swift`, `kotlin`, `csharp`, `cpp`, `c`, `sql`, `bash`, `yaml`, `json`, `graphql`, `protobuf`, `erb`, `haml`, `elixir`, `clojure`, `scala`, `php`, etc.
- The template loads Prism core via `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js` with `data-manual`.
- For each language you use, add a matching component: `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-<lang>.min.js`. The template ships with a placeholder line — replace it (and add more) for the language(s) in this explainer.
- An explicit `Prism.highlightAll()` runs on `DOMContentLoaded`.
- The custom token palette (bright but warm — punchy red keywords, amber strings, teal symbols, blue constants, purple numbers, orange builtins) is in `template.html`. The token classes Prism emits are language-agnostic, so the same palette works across all languages without modification.

**Use real code, not pseudocode.** The whole point of syntax highlighting is that the reader sees the exact symbols they'd find in the codebase. If a snippet needs trimming for the explainer, trim with `# ...` (or the equivalent comment syntax) rather than paraphrasing.

## Interactive primitives

The template includes reusable interactive components. Use them where they serve the explanation; don't decorate.

- **Copy-to-clipboard buttons** (`.copy-btn`). Attach to any block the reader might want to feed back into Claude — code snippets, parameter tables, option lists, prompt drafts. Each button declares `data-copy-target="#id"` or `data-copy-text="literal"` and copies on click. This closes the human-Claude loop: the reader takes what they learn in the document and pastes it back into a prompt.

- **Tabbed sections** (`.tabs` + `.tab-btn` + `.tab-panel`). For "Option A / Option B / Option C" comparisons inside an explainer, before/after states, or alternative implementations.

- **Collapsible details** (`<details class="collapsible">`). For long code snippets, optional deep-dives, or "show me the math" sections that would bloat the main flow. Native `<details>`/`<summary>`, styled to match the palette.

- **Range sliders** (`.slider-row` + `.slider` + `.slider-value`). For tunable parameters — animation timing, threshold values, simulation inputs. Pair with a live readout and a "copy current settings" button so the reader can paste the tuned values back into a prompt.

- **Severity badges** (`.badge.severity-info` / `.severity-warn` / `.severity-block`). For PR review annotations, edge-case flagging, deprecation notes.

These primitives exist to **close the loop** — give the reader a way to take what they learn or tune in the document and feed it back to Claude. A copy button on every tunable parameter is a small thing that makes the doc feel alive.

## Mobile responsiveness

The template is responsive at two breakpoints:
- **820px** — grid columns collapse, TOC columns merge.
- **480px** — typography rebalances, tables marked `.matrix.responsive` collapse to stacked cards, padding shrinks, sliders restack vertically, Mermaid blocks become horizontally scrollable.

When writing new sections, sanity-check at ~375px viewport width. Long inline code spans should `word-break: break-word`; wide tables should be marked `.matrix.responsive` so the card-collapse kicks in.

## Mixing technical and non-technical

The brief is always "mix of technical explanations with code examples and non-technical explanations." Concrete patterns:

- Every section opens with a plain-language sentence before any code, table, or diagram. The serif body + warm palette reads like a technical report, not API docs — the prose around the code carries half the explanation.
- Callout boxes (`.callout`, `.callout.warn`, `.callout.bad`) carry the "if you remember one thing" framings — use them sparingly (2–4 per document).
- Worked examples with concrete inputs beat abstract descriptions. For a feature with state and stock math, show real numbers per step. For an API, show real request/response payloads. For a state machine, show the exact transition trace.
- Define domain terms via `<em class="term">` on first use; the accent-colored styling signals "this is jargon, here's its meaning."

**Allow joyful flourishes.** Small interactive details that make the doc feel alive — a satisfying copy button, a working slider with live readout, a subtle hover state on a clickable element, a smooth state-transition animation — are encouraged when they serve the explanation. Don't decorate; do let the doc breathe.

## Reading-first density rules

- Lead the header with a `<p class="reading-meta">~N-min read · covers A, B, C</p>` so the reader
  knows the shape before committing.
- **No prose block exceeds ~5 lines** without a visual break or a transformation: lists → cards,
  steps → numbered flow, endpoints/params → table. A wall of text is a bug.
- **One concept per panel.** A vocab card, a callout, or a diagram covers exactly one idea.
- Push optional depth into `<details class="collapsible">` so the *default* scroll stays short —
  essentials visible, evidence on demand.
- **Diagram node budget:** if a Mermaid diagram exceeds ~12 nodes, split it into a small overview
  plus detail cards rather than one unreadable graph. Use `<br/>` (never `\n`) for label line breaks.
- Mark any diagram the reader may want to inspect closely with `data-expandable` (click to zoom).
- Caveats/citations go in Tufte sidenotes (`.sidenote-toggle` + `.sidenote`) — they float into the
  margin on wide screens and collapse to tap-to-reveal on mobile, keeping the main column clean.

## Verification checklist (before declaring complete)

- Every symbol in a code snippet exists in the codebase — confirm via Serena MCP (`find_symbol`) when available, else `git grep <symbol>`.
- Every state name in a state diagram matches the actual AASM `state :foo`, enum value, or constant.
- Every association/relationship in an ER diagram matches the actual `has_many`/`belongs_to`/foreign-key declaration.
- Every type name in a class diagram matches the actual class, module, or interface in the code.
- Worked-example inputs and outputs are internally consistent and match the semantics described in the source.
- No gradients, no emojis, no CSS framework utility classes (Bootstrap, Tailwind) unless explicitly requested.
- The file renders standalone — open it in a browser, confirm all CDN scripts load, all diagrams render, all code blocks highlight in distinct token colors (not a single flat color), all interactive primitives work.
- Mobile spot-check at 375px width: nothing overflows, all text remains readable.
- Ran the build; the output opens correctly with networking disabled — diagrams are inline `<svg>`,
  code is highlighted with distinct token colors, and no `cdnjs`/`jsdelivr` references remain. (Shiki
  emits `class="shiki warm-paper"` and uppercase hex like `#D6432E`; match case-insensitively if you
  script the check.)
- Keyboard pass: Tab reaches every interactive element with a visible focus ring; tabs respond to
  arrow keys; the diagram overlay closes on Escape.
- Contrast: small mono labels use `--ink-label` (AA), not `--ink-dim`.
- Print preview (Cmd-P) is clean: no diagram/table/callout splits mid-page; dark fills are outlined.

**Brainstorm mode adds** (and relaxes the first four items above — they apply to *existing-code* references only):

- Every proposed code block, diagram, and section carries the `proposed` badge — nothing not-yet-built reads as shipped, and a one-line legend explains the badge.
- Existing-code references the brainstorm builds on are still verified normally (Serena MCP / `git grep`).
- A divergent explainer ends in a "leaning toward" recommendation; a converged one states the chosen direction plainly in the meta-strip `status` field.
- Every "Open questions" entry has a working copy button.

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

Ask the user, or default to a sensible location based on the repo layout (look for an existing `docs/`, `notes/`, `wiki/`, or similar directory; create `docs/explainers/` if nothing fits). Use the Write tool with the full HTML inline; do not split a single explainer into multiple files (a "web of HTML files" for an exploration topic is different — each file is its own complete artifact). Keep the topic name kebab-case.

## Template

The full HTML skeleton with CSS palette tokens, component styles, Prism + Mermaid wiring, interactive primitives, and a section scaffold lives at `template.html` next to this `SKILL.md`. Start from a copy of that file and fill in the placeholders rather than rebuilding the styles from scratch.
