# folio

**Calm, consistent, self-contained HTML explainers for dense docs.**

`folio` is a small family of [Claude Code](https://docs.claude.com/en/docs/claude-code) skills that turn
dense source material — design specs, RFCs, ADRs, codebase tours, API designs, option comparisons —
into a single self-contained HTML page that mixes plain-language framing with technical detail,
diagrams, and syntax-highlighted code.

## Why another explainer?

Most AI "visual explainer" tools pick a *different* look on every run — new fonts, new gradients,
new color scheme each time. That novelty is the enemy of comprehension: every page makes the reader
re-learn where to look.

folio does the opposite. It has **one locked visual system** — warm paper, a forest-green accent, a
serif body, monospace labels, no gradients, no emoji — applied identically to every explainer it
produces. You recognize a folio page on sight, and you spend your attention on the *content*, not the
chrome. The goal is simple: a page you'll actually read once, all the way through.

## Skills

| Skill | What it makes |
|---|---|
| `software-visual-explainer` | A narrative explainer for one software topic — a feature, spec, migration, PR, or codebase area. Plain-language framing + Mermaid diagrams + real, syntax-highlighted code. Has dedicated **PR-review** and **brainstorm** modes. |
| `code-option-comparison` | A scannable side-by-side grid comparing 3–6 design or implementation options against the same axes, with a recommendation. |

Software topics today. The shared design system is built to grow — **finance** (tax, investing,
business analysis) and **long-form article** explainers are on the roadmap.

## Install

**In Claude Code (marketplace):**

```
/plugin marketplace add jtotty/folio
/plugin install folio@jtotty
```

**Or via the `skills` CLI:**

```
npx skills@latest add jtotty/folio
```

Then ask Claude things like *"create an explainer for this spec"*, *"turn this brainstorm into a
visual walkthrough"*, or *"compare these 4 approaches side by side."*

## Design principles

- **One locked theme, every time.** Consistency over novelty. See `skills/*/SKILL.md` → "Visual system (locked)".
- **Stay in the loop.** Optimize every choice for *the human actually reading it once* — a 60%
  explanation they finish beats a 100% one they don't open.
- **Real code, not pseudocode.** Snippets are verified against the source so the reader sees the exact
  symbols they'll find in the codebase.
- **Self-contained output.** One HTML file. (Today: diagrams/highlighting load from CDN. Next: a build
  step pre-renders everything for fully offline output — see [the plan](docs/plans/2026-05-31-visual-explainer-shared-core.md).)

## Roadmap

- Extract the locked visual system into a shared `visual-explainer-core` so every skill — and every
  future domain — inherits one identity with zero drift.
- Offline-by-default output: pre-render Mermaid → inline SVG and code → inline-styled highlighting.
- Accessibility (WCAG-AA contrast, focus, keyboard), a print/Save-as-PDF stylesheet, and reading-first
  comprehension aids (scroll-spy, sidenotes, details-on-demand).
- New domains: `finance-visual-explainer`, `article-visual-explainer`.

The full implementation plan lives in [`docs/plans/`](docs/plans/2026-05-31-visual-explainer-shared-core.md).

## License

MIT © 2026 jtotty
