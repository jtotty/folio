# Diagrams and code

How to render the technical content. Three diagram flavors, plus how code blocks become highlighted
offline.

## Diagrams

Three flavors, used together as needed:

1. **Mermaid** for state, flow, sequence, class, and ER diagrams. Always wrap the `.mermaid` block
   inside a `.diagram` paper card. The build pre-renders it to inline SVG with the locked Mermaid
   theme (`config/mmdc-config.json` in `visual-explainer-core`). Prefer:
   - `stateDiagram-v2` for state machines (AASM, XState, enum-based state fields).
   - `sequenceDiagram` for request/response flows, message-passing, async coordination.
   - `flowchart` for control flow, decision trees, pipeline stages.
   - `erDiagram` for database schemas and entity relationships.
   - `classDiagram` for type hierarchies, inheritance, interface implementations.

   For `sequenceDiagram`, use `participant` rather than `actor` — `actor` draws an oversized
   stick-figure glyph. The locked Mermaid config already ships compact sequence-diagram sizing (a
   `sequence` config block plus font-size overrides). Keep diagrams within the node budget (see the
   density rules in [`content-shape.md`](content-shape.md)); use `<br/>` (never `\n`) for label breaks.

2. **Custom HTML module / class boxes** for "what lives where" diagrams — a dark prefixed entity tile
   pointing down to one or more `.concern` boxes with accent-left-borders and mono lists. Set
   `data-kind` to a 1-2 letter prefix matching the entity type (M = model, C = class, S = service,
   R = route, F = function, T = type/interface). Use `<li class="added">` for new code,
   `<li class="unchanged">` for pre-existing. Pair with a `.legend` row of swatches.

3. **Custom inline SVG** when Mermaid can't express the idea — architecture illustrations needing
   precise spatial layout, force-flow diagrams, geometric concepts, custom technical drawings. Inline
   the `<svg>` directly; use palette colors via `fill="#2f5d50"` or via CSS variables. Wrap in a
   `.svg-diagram` card. Don't reach for SVG when Mermaid would do — only when it's genuinely the right tool.

## Code blocks

- Write code as `<pre><code class="language-X">…</code></pre>` where `X` is the language id: `ruby`,
  `python`, `typescript`, `javascript`, `jsx`, `tsx`, `go`, `rust`, `java`, `swift`, `kotlin`,
  `csharp`, `cpp`, `c`, `sql`, `bash`, `yaml`, `json`, `graphql`, `protobuf`, `erb`, `haml`, `elixir`,
  `clojure`, `scala`, `php`, etc.
- The build's **Shiki** step highlights every block offline, emitting inline styles using the warm
  token palette in `visual-explainer-core/assets/shiki-theme.json` (a TextMate theme — punchy red
  keywords, amber strings, teal symbols, blue constants, purple numbers, orange builtins). There is
  **no Prism, no CDN, and no runtime highlighting** — coloring is baked in at build time.
- An alias map in the build handles ids that differ from Shiki's grammar names (e.g. `protobuf` →
  `proto`). An unknown or unsupported id falls back to plain text — no error, just no token coloring.
  (See `visual-explainer-core/references/build-pipeline.md` for the full highlighting stage.)

**Use real code, not pseudocode.** The whole point of syntax highlighting is that the reader sees the
exact symbols they'd find in the codebase. If a snippet needs trimming for the explainer, trim with
`# ...` (or the equivalent comment syntax) rather than paraphrasing.
