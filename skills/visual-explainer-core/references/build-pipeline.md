# The build pipeline (`scripts/build.mjs`)

`build.mjs` turns a *draft* explainer — a template-based HTML file that still references the shared
core by marker and writes diagrams/code as plain source — into a **single, fully self-contained,
offline** artifact. It rewrites the file **in place**:

```
node "${CLAUDE_PLUGIN_ROOT}/skills/visual-explainer-core/scripts/build.mjs" path/to/draft.html
```

(Outside an installed plugin, use the repo-relative path `skills/visual-explainer-core/scripts/build.mjs`.)

After it runs, the file opens correctly with **networking disabled**: no CDN `<script>`/`<link>` tags,
diagrams are inline `<svg>`, and code is highlighted with inline styles. There is zero client-side
rendering — nothing is highlighted or drawn in the browser.

## What a draft must contain

The build is driven entirely by markers and conventional source markup:

| In the draft | Becomes |
|---|---|
| `<!-- @core:css -->` (in `<head>`) | `<style>` … inlined `assets/core.css` … `</style>` |
| `<!-- @core:js -->` (before `</body>`) | `<script>` … inlined `assets/core.js` … `</script>` |
| `<pre class="mermaid">…graph source…</pre>` | inline `<svg>` rendered with the locked Mermaid theme |
| `<pre><code class="language-X">…code…</code></pre>` | Shiki-highlighted markup with inline token colors |
| Mermaid / Prism CDN `<script>`/`<link>` tags | removed |

If a marker is missing the build prints a warning and continues (the core simply isn't inlined where
that marker would have been) — it does not abort.

## The four stages, in order

### 1. Inline the shared core

Reads `assets/core.css` and `assets/core.js` and string-replaces the two markers. This happens on the
raw HTML *before* parsing, so the core is inlined byte-for-byte.

### 2. Parse — with one deliberate exception

```js
parse(html, { comment: true, blockTextElements: { script: true, style: true, noscript: true } })
```

`node-html-parser` v6 treats `<pre>` as a raw-text element **by default**, which would hide the
`<code>` children from stage 3 — so we override `blockTextElements` to re-enable parsing inside `<pre>`
while still keeping `<script>`/`<style>`/`<noscript>` raw (so the core CSS/JS we just inlined survives
verbatim and isn't mangled). This is the single most load-bearing line in the file; changing it breaks
either code highlighting or the inlined core.

### 3. Mermaid → inline SVG (`mmdc`)

For every `.mermaid` block: write its source to a temp `.mmd`, shell out to the **local**
`node_modules/.bin/mmdc` (never `npx` — that would re-resolve over the network and defeat "offline"),
render to SVG with the locked theme, and swap the SVG in for the original block.

- **Locked theme:** `-c config/mmdc-config.json` (warm palette + compact sequence sizing),
  `-p config/puppeteer-config.json` (`--no-sandbox`), `-b transparent`.
- The rendered `<svg>` gets `style="max-width:100%;height:auto"` so it scales in the column.
- **Empty blocks are skipped** with a warning (no spurious mmdc invocation).
- All temp files live in one `mkdtemp` dir removed in a `finally`, so a render failure never leaks
  a temp directory.
- A single block failing prints that block's index + mmdc's stderr and aborts the build (fail loud —
  a half-rendered explainer is worse than a clear error).

### 4. Code → Shiki, inline styles

For every `<pre><code class="language-X">`:

- The language id `X` comes from the `language-` class. An **alias map** translates ids that differ
  from Shiki's grammar names (currently `protobuf → proto`).
- Wanted languages are filtered against Shiki's `bundledLanguages`; only known grammars are loaded.
  An **unknown or unsupported id falls back to `text`** (plaintext, no colors) — never an error, so one
  exotic fence can't fail the whole build.
- Highlighting uses the bundled `assets/shiki-theme.json` (`warm-paper` — the TextMate twin of the
  page's code palette), emitting **inline `style="color:#…"`** on each token. No runtime JS, no
  stylesheet dependency.
- The highlighter is disposed in a `finally`.

### Strip CDN tags & atomic write

Any leftover `script[src*="mermaid"]`, `script[src*="prism"]`, or `link[href*="prism"]` is removed
(they're now baked in or unneeded). The result is written to `<file>.tmp` and `renameSync`d over the
original — an **atomic** replace, so an interrupted build never leaves a truncated explainer.

## Dependencies

`scripts/build.mjs` is plain ESM and depends on three pinned packages (see `package.json`):
`@mermaid-js/mermaid-cli` (`mmdc`), `node-html-parser`, and `shiki`. Install once, from the skill root:

```
cd skills/visual-explainer-core && npm install
```

The first install also downloads a headless Chromium for `mmdc` (~150–200 MB, one-time). To reuse an
existing Chrome instead, set `PUPPETEER_EXECUTABLE_PATH` before installing/running. `node_modules/` is
gitignored — deps are fetched on first build, not shipped.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `warning: <!-- @core:css --> marker not found` | The draft is missing the marker — core won't be inlined there. Start from `templates/template.html`. |
| `Mermaid block #N failed to render` | Invalid Mermaid syntax in that block (the stderr follows). Fix the source; use `<br/>` not `\n` for label breaks. |
| Code shows but is one flat color | The language id isn't a Shiki grammar (fell back to `text`). Check the `language-X` id; add an alias if Shiki names it differently. |
| `mmdc: command not found` / ENOENT on `.bin/mmdc` | Deps not installed — run `npm install` in `skills/visual-explainer-core/`. |
| Build looks like it hangs on first run | Chromium is downloading (~150–200 MB). One-time. |

## Extending

- **New language whose id ≠ Shiki's grammar name:** add an entry to the `ALIAS` map in `scripts/build.mjs`.
- **Mermaid look:** edit `config/mmdc-config.json` only — never hand-edit rendered SVG, and never fork
  the palette. Keep it in lockstep with the page tokens.
- **Code palette:** edit `assets/shiki-theme.json` and the matching `.token.*` rules in `assets/core.css`
  together — they are two encodings of one palette and must not drift.
