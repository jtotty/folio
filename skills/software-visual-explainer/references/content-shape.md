# Content shape, modes, and density

How to structure a software explainer: the default section order, the two specialized modes
(PR review, brainstorm), and the rules that keep it readable. Adapt to the material — drop sections
that don't apply; never invent content to fill a section.

## Default content shape (in this order)

| Section | Purpose | Style |
|---|---|---|
| Header | eyebrow + h1 + lede + mono meta strip (date, ticket ID, branch, etc.) | One paragraph, plain-language framing of the feature's purpose |
| TOC | paper card, mono eyebrow, two-column ordered list | Anchor links to each section |
| What this feature does | The "why" in plain language, no jargon | A short summary table mapping triggers (HTTP requests, events, state transitions) to effects is often the right move |
| Vocabulary | Define domain terms before using them | 2x2 vocabulary grid of small cards — one term per card |
| Lifecycle / Flow | Dynamic behaviour: state machines, request flow, event sequence | Mermaid state, sequence, or flow diagram inside a `.diagram` paper card |
| Data model / Structure | Static structure: tables, classes, modules, types | Mermaid ER, class, or graph diagram (or custom SVG when Mermaid can't express it) |
| Architecture / Concern shape | How the code is organized | Custom HTML module/class boxes (see the template) with an added/unchanged/kept legend |
| The N PRs, in order | If the topic is a multi-PR stack or migration, summarize each | Grid of paper cards with mono PR tags |
| Key code | The 4-6 most important snippets — actual real code, not pseudocode | `<pre><code class="language-X">` blocks |
| Worked example / Walkthrough | Concrete inputs and outputs for an abstract flow | Dark-header matrix table showing step-by-step state transitions or values |
| Edge cases & guards | The "what if" matrix | Short h3s with one-paragraph answers — reference the actual code path that handles each |
| Out of scope | What this work deliberately does NOT do | Tight bulleted list |
| Footer | Mono small text with source paths | Single line |

## PR explainer mode

When the topic is a single pull request (the meta strip carries a `branch` or `PR #N` field), shift
the content shape:

- Replace "What this feature does" with **"What this PR changes"** — diff-shaped summary.
- Add a **"Diff with annotations"** section using `.diff` blocks. Each hunk renders as `.diff-hunk`
  with line-prefix coloring (`.line.add` in accent-green, `.line.del` in bad-red, `.line.ctx`
  neutral). Margin annotations attach via `<aside class="margin-note">` blocks alongside specific hunks.
- Use **severity badges** (`.badge.severity-info`, `.severity-warn`, `.severity-block`) on annotations
  to color-code findings.
- Drop the "PR stack" section (irrelevant for a single PR).
- Always include a **"What to review carefully"** callout listing the 3–5 lines/files that need the
  reviewer's attention most.

## Brainstorm explainer mode

When the design exists **only in the current conversation** — a feature or app idea explored with
Claude in this session and never written to a doc — the source is the conversation scrollback itself.
(The moment a written spec exists, that spec is the source and this is ordinary document mode.) This
mode has one job document mode does not: **keep the reader certain about what is already real versus
what is still just an idea.**

**Divergent vs. converged.** A brainstorm has either settled on a direction or is still weighing
options — shape the explainer to match:

- **Converged** — the chat reached a leading direction. Explain that design as the primary narrative;
  the alternatives shrink to a one-paragraph "why this direction over the others."
- **Divergent** — no decision yet. Render the competing directions as a narrative — prose framing each,
  tradeoffs, diagrams — ending in a "leaning toward" callout with your recommendation. If the user
  wants a pure side-by-side scan rather than a narrative, that is the sibling skill
  `code-option-comparison` — defer to it.

**The `proposed` marker.** Every code block, diagram, and section that describes not-yet-built content
carries a `<span class="badge proposed">Proposed</span>` badge (the `.badge.proposed` class ships in a
distinct indigo, separate from the severity palette). This is the non-negotiable of brainstorm mode:
an idea must never read as shipped reality. Existing code the brainstorm builds on stays unmarked and
is verified normally (Process step 2). Pair the badge with a one-line legend near the top so the reader
learns the convention immediately.

**Content-shape shifts** from the default table:

| Default section | Brainstorm-mode shift |
|---|---|
| Header meta strip | No ticket/branch. Carry a `status` field reading `Exploratory — not yet built`, or `Direction chosen` once converged. |
| What this feature does | → **"What we're exploring"** — the problem and the proposed direction in plain language. |
| *(new)* | **"Directions considered"** — divergent: the competing approaches with tradeoffs, ending in a "leaning toward" callout. Converged: one paragraph on why this direction, or drop. |
| The N PRs, in order | → **"Proposed build order"** — forward-looking implementation slices: how you'd actually ship it, in what order. |
| Key code | Proposed snippets — sketch-level is fine — and every block carries the `proposed` badge. |
| *(new)* | **"Open questions"** — the unresolved decisions, each with a `.copy-btn` so the reader can paste the question straight back into a prompt. |
| Lifecycle / Data model / Architecture diagrams | Kept — diagrams of proposed structures; the `.diagram` card heading carries a `proposed` badge. |
| Out of scope | Kept — still valuable. |

## Mixing technical and non-technical

The brief is always "mix of technical explanations with code examples and non-technical
explanations." Concrete patterns:

- Every section opens with a plain-language sentence before any code, table, or diagram. The serif
  body + warm palette reads like a technical report, not API docs — the prose around the code carries
  half the explanation.
- Callout boxes (`.callout`, `.callout.warn`, `.callout.bad`) carry the "if you remember one thing"
  framings — use them sparingly (2–4 per document).
- Worked examples with concrete inputs beat abstract descriptions. For a feature with state and stock
  math, show real numbers per step. For an API, show real request/response payloads. For a state
  machine, show the exact transition trace.
- Define domain terms via `<em class="term">` on first use; the accent-colored styling signals "this
  is jargon, here's its meaning."

**Allow joyful flourishes.** Small interactive details that make the doc feel alive — a satisfying
copy button, a working slider with live readout, a subtle hover state, a smooth state-transition
animation — are encouraged when they serve the explanation. Don't decorate; do let the doc breathe.

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
