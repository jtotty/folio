# Interactive primitives, layout, and the visual system

The reusable components the template ships, how the page behaves on small screens, and the locked
visual system (defined once in `visual-explainer-core`).

## Interactive primitives

Use them where they serve the explanation; don't decorate. All ship in the shared core
(`visual-explainer-core/assets/core.css` + `core.js`).

- **Copy-to-clipboard buttons** (`.copy-btn`). Attach to any block the reader might want to feed back
  into Claude — code snippets, parameter tables, option lists, prompt drafts. Each button declares
  `data-copy-target="#id"` or `data-copy-text="literal"` and copies on click. This closes the
  human-Claude loop: the reader takes what they learn and pastes it back into a prompt.
- **Tabbed sections** (`.tabs` + `.tab-btn` + `.tab-panel`). For "Option A / Option B / Option C"
  comparisons inside an explainer, before/after states, or alternative implementations.
- **Collapsible details** (`<details class="collapsible">`). For long code snippets, optional
  deep-dives, or "show me the math" sections that would bloat the main flow. Native
  `<details>`/`<summary>`, styled to match the palette.
- **Range sliders** (`.slider-row` + `.slider` + `.slider-value`). For tunable parameters — animation
  timing, threshold values, simulation inputs. Pair with a live readout and a "copy current settings"
  button so the reader can paste the tuned values back into a prompt.
- **Severity badges** (`.badge.severity-info` / `.severity-warn` / `.severity-block`). For PR review
  annotations, edge-case flagging, deprecation notes.

These primitives exist to **close the loop** — give the reader a way to take what they learn or tune
in the document and feed it back to Claude. A copy button on every tunable parameter is a small thing
that makes the doc feel alive.

## Mobile responsiveness

The template is responsive at two breakpoints:

- **820px** — grid columns collapse, TOC columns merge.
- **480px** — typography rebalances, tables marked `.matrix.responsive` collapse to stacked cards,
  padding shrinks, sliders restack vertically, Mermaid blocks become horizontally scrollable.

When writing new sections, sanity-check at ~375px viewport width. Long inline code spans should
`word-break: break-word`; wide tables should be marked `.matrix.responsive` so the card-collapse
kicks in.

## Visual system (locked)

The palette and components are defined **once** in `visual-explainer-core` — warm cream background,
paper-white cards, forest-green accent (`#2f5d50`), Iowan Old Style serif body, SF Mono labels, no
gradients, no emoji, no dark mode. See that skill's `SKILL.md` for the full token list.

**Never redefine `:root` tokens** in this skill's template — add only software-specific components in
its small `<style>` block. The palette is locked across documents for recognizability; if the user
explicitly asks for a different palette, follow their lead — otherwise keep this one.

Authoring conventions worth remembering (all already styled in the core):

- **h2** has a top border + generous top padding — it's a real section break.
- **h3** is accent-colored — a sub-point within a section.
- **h4** is mono, uppercase, letter-spaced — used for eyebrows and dense labels, not prose headings.
- **`<em class="term">`** marks a domain term on first use (accent-colored, not italic).
