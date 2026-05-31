# Diagrams and code

How to render the technical content. Three diagram flavors, plus how code blocks get highlighted in
the browser (Prism, from CDN).

## Diagrams

Three flavors, used together as needed:

1. **Mermaid** for state, flow, sequence, class, and ER diagrams. Always wrap the `.mermaid` block
   inside a `.diagram` paper card. Mermaid loads from CDN and renders in the browser with the locked
   theme (the `mermaid.initialize` config baked into `visual-explainer-core`'s `core.js`). Prefer:
   - `stateDiagram-v2` for state machines (AASM, XState, enum-based state fields).
   - `sequenceDiagram` for request/response flows, message-passing, async coordination.
   - `flowchart` for control flow, decision trees, pipeline stages.
   - `erDiagram` for database schemas and entity relationships.
   - `classDiagram` for type hierarchies, inheritance, interface implementations.

   For `sequenceDiagram`, use `participant` rather than `actor` — `actor` draws an oversized
   stick-figure glyph. The locked theme already ships compact sequence-diagram sizing (a `sequence`
   config block in `core.js` plus `!important` font-size overrides in `core.css`). Keep diagrams
   within the node budget (see the
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
- **Prism** (loaded from CDN) highlights every block in the browser, applying the warm token palette
  defined in `visual-explainer-core/assets/core.css` (the `.token.*` rules — punchy red keywords,
  amber strings, teal symbols, blue constants, purple numbers, orange builtins). `core.js` calls
  `Prism.highlightAll()` on load.
- The template's Prism `<script>` tag carries a `{{LANGUAGE}}` placeholder — replace it with the
  language id (`ruby`, `python`, …), and duplicate the `<script>` line for each additional language.
  A block whose language component isn't loaded simply renders unhighlighted — no error.

**Use real code, not pseudocode.** The whole point of syntax highlighting is that the reader sees the
exact symbols they'd find in the codebase. If a snippet needs trimming for the explainer, trim with
`# ...` (or the equivalent comment syntax) rather than paraphrasing.
