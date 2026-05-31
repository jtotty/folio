# Visual Explainer — Shared Core + Offline Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Repo update (2026-05-31):** This work now ships as the public **`jtotty/folio`** Claude Code plugin
> (a `skills/` monorepo + `.claude-plugin/plugin.json` + `marketplace.json`). Task 0's "git init in
> `~/.claude/skills`" is **superseded** — the repo already exists. During execution, rebase every
> `~/.claude/skills/<skill>` path to `<repo>/skills/<skill>`, place the shared core at
> `skills/visual-explainer-core/`, and change the build invocation in each SKILL.md to
> `node "${CLAUDE_PLUGIN_ROOT}/skills/visual-explainer-core/build.mjs" <file>`. Node deps install on
> first build (and/or via a `SessionStart` hook into `${CLAUDE_PLUGIN_DATA}`), keeping install light.

**Goal:** Factor the locked visual system out of the two explainer skills into one shared, version-controlled design-system core, and add a generation-time build step that produces fully offline (zero-CDN) self-contained HTML, plus accessibility, print, and comprehension upgrades — all without changing the existing look.

**Architecture:** A new `visual-explainer-core/` directory becomes the single source of truth for tokens, typography, primitives, the code-highlighting palette, the Mermaid theme, accessibility, and print CSS/JS. Domain skills (`software-visual-explainer`, `code-option-comparison`, and future article/finance explainers) keep only *thin* templates that carry domain-specific CSS plus `<!-- @core:css -->` / `<!-- @core:js -->` markers. A `build.mjs` script inlines the core, pre-renders every Mermaid diagram to inline SVG via `mmdc`, highlights every code block via Shiki with a custom theme matching the current palette, strips the CDN tags, and writes a self-contained offline file. Because the core exists once and is inlined at build time, drift between explainers becomes impossible.

**Tech Stack:** Node 24 (confirmed available), `shiki` (code highlighting → inline styles), `@mermaid-js/mermaid-cli`/`mmdc` (Mermaid → SVG, needs Chromium via Puppeteer), `node-html-parser` (DOM rewriting). All existing CSS/JS is plain; no framework added.

**The hard constraint (non-negotiable):** The palette, fonts, spacing, and component look do **not** change. This plan *moves* and *hardens* the existing visual system; it does not restyle it. The one borderline item (a small-text contrast fix) is handled by *adding* a token, not recoloring existing elements — see Task 2.

---

## Phase map (so scope can be approved/trimmed before execution)

- **Phase 1 — Foundation & offline (Tasks 0–7):** version control, extract `core.css`/`core.js`, Shiki theme, `build.mjs`, slim both templates. This is the load-bearing work and the thing to do before adding any new explainer.
- **Phase 2 — Robustness (folded into Tasks 2–3):** accessibility (contrast, focus, keyboard, reduced-motion) and print stylesheet live inside the core, so every explainer inherits them.
- **Phase 3 — SKILL.md updates (Tasks 8–9):** fix the broken cross-reference bug, document the build pipeline, write the Layer-0 contract.
- **Phase 4 — Comprehension primitives (Task 10):** details-on-demand, TOC scroll-spy, diagram zoom, Tufte sidenotes, density rule — additive, optional per-doc.
- **Phase 5 — Acceptance (Task 11):** generate a real sample end-to-end and verify offline render, contrast, keyboard, print, and core-sharing.

Note on testing: these are reference/technique skills (per superpowers:writing-skills), so acceptance is *application/rendering verification* — generate a real explainer and inspect the rendered artifact — rather than subagent pressure-testing, which is for discipline skills. Every task below ends with a concrete verification command/observation that plays the role of the test.

---

## File structure (what gets created / modified)

```
~/.claude/skills/
  visual-explainer-core/            # NEW — Layer 0, single source of truth
    SKILL.md                        # NEW — the core contract + build usage
    core.css                        # NEW — all shared CSS (moved verbatim + hardening)
    core.js                         # NEW — all shared JS (moved + a11y + scroll-spy + zoom)
    shiki-theme.json                # NEW — TextMate theme reproducing the warm token palette
    mmdc-config.json                # NEW — Mermaid theme/sequence config (locked palette)
    puppeteer-config.json           # NEW — { "args": ["--no-sandbox"] }
    build.mjs                       # NEW — inline core + prerender Mermaid/code + strip CDN
    package.json                    # NEW — pins shiki, mermaid-cli, node-html-parser
    .gitignore                      # NEW — node_modules, .DS_Store
  software-visual-explainer/
    SKILL.md                        # MODIFY — build pipeline, verification, comprehension guidance
    template.html                   # MODIFY — slim to markers + software-only CSS + body scaffold
  code-option-comparison/
    SKILL.md                        # MODIFY — fix `code-visual-explainer` → `software-visual-explainer`; build pipeline
    template.html                   # MODIFY — slim to markers + .option-* CSS only (fixes stale-duplicate bug)
  docs/plans/2026-05-31-visual-explainer-shared-core.md   # this file
```

---

## Task 0: (Optional, recommended) Put the skills directory under version control

**Why:** You're about to grow a family of interdependent skills sharing one core. Version control makes the refactor reversible and the commit checkpoints in later tasks meaningful. Skip this task if you track `~/.claude` some other way; if skipped, treat each "Commit" step below as a manual checkpoint instead.

**Files:**
- Create: `~/.claude/skills/.gitignore`

- [ ] **Step 1: Initialize the repo**

```bash
cd /Users/james/.claude/skills
git init
```

- [ ] **Step 2: Add a .gitignore**

Create `/Users/james/.claude/skills/.gitignore`:

```gitignore
.DS_Store
**/node_modules/
visual-explainer-core/node_modules/
```

- [ ] **Step 3: Baseline commit**

```bash
cd /Users/james/.claude/skills
git add -A
git commit -m "chore: snapshot skills before visual-explainer shared-core refactor"
```

Expected: a commit containing the current state of both explainer skills.

---

## Task 1: Create `visual-explainer-core/core.css` from the existing CSS (verbatim move)

**Files:**
- Create: `~/.claude/skills/visual-explainer-core/core.css`
- Source: `~/.claude/skills/software-visual-explainer/template.html:23-453` (the entire `:root { … }` through the closing `@media (max-width: 480px)` block)

**Rationale:** `software-visual-explainer/template.html` is the *more complete* of the two stylesheets (it has the `--proposed` token, diff, entity/concern, slider, badge styles that `code-option-comparison` is missing). Use it as the canonical source so nothing is lost. The `.option-*` styles are NOT here — they stay domain-specific (Task 7).

- [ ] **Step 1: Copy the CSS body verbatim into core.css**

Copy the exact contents of `software-visual-explainer/template.html` lines **23–453** (everything between `<style>` and `</style>`, exclusive of those tags) into a new file `visual-explainer-core/core.css`. Do not edit values in this step — this is a pure move so the diff is reviewable. The result begins with `:root {` and ends with the closing brace of the `@media (max-width: 480px)` block.

- [ ] **Step 2: Verify nothing was dropped**

Run:

```bash
# Count selectors as a rough integrity check
grep -c '{' /Users/james/.claude/skills/visual-explainer-core/core.css
```

Expected: a non-zero count matching the source block (~120+ opening braces). Eyeball that `--proposed`, `.diff-hunk`, `.concern`, `.slider`, `.badge.proposed`, and the `@media (max-width: 480px)` block are all present.

- [ ] **Step 3: Commit**

```bash
cd /Users/james/.claude/skills
git add visual-explainer-core/core.css
git commit -m "feat(core): extract shared CSS into visual-explainer-core/core.css"
```

---

## Task 2: Add the robustness layer to `core.css` (a11y + print + new comprehension components)

**Files:**
- Modify: `~/.claude/skills/visual-explainer-core/core.css` (append the blocks below)

**Constraint check:** Every addition here is *additive* — new tokens, new states, new components, a print sheet. No existing color or size is changed. The only contrast fix (`--ink-label`) is a **new** token used to upgrade small mono labels; it does not alter `--ink-dim` itself, so existing larger/decorative uses look identical.

- [ ] **Step 1: Append accessibility tokens + states**

Append to `core.css`:

```css
/* ===== Accessibility layer (additive) ===== */

:root {
  /* #8a8a8a (--ink-dim) is ~3.45:1 on paper — fine for decorative/large use, but
     fails WCAG AA (4.5:1) for the 12-13px mono labels (eyebrow, meta, footer).
     --ink-label is a darker neutral (~5.0:1) used ONLY for those small labels.
     The hue stays the same warm-neutral grey, so the look is unchanged. */
  --ink-label: #6e6a63;
  --focus-ring: #2f5d50;
}

/* Upgrade small mono labels to the AA-compliant neutral. Same family, darker. */
.eyebrow,
.meta,
footer { color: var(--ink-label); }

/* Visible keyboard focus everywhere interactive. Mouse users never see it. */
a:focus-visible,
button:focus-visible,
summary:focus-visible,
.tab-btn:focus-visible,
.copy-btn:focus-visible,
input.slider:focus-visible,
.diagram:focus-visible,
.svg-diagram:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: 3px;
}

/* Honor reduced-motion: kill transitions/animations for users who ask. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Append the comprehension components (reading-meta, sidenotes, back-to-top, diagram zoom)**

Append to `core.css`:

```css
/* ===== Comprehension components (additive) ===== */

/* "~6-min read · covers X, Y, Z" line under the lede. Sets expectations. */
.reading-meta {
  font-family: "SF Mono", "JetBrains Mono", "IBM Plex Mono", Menlo, monospace;
  font-size: 12px; letter-spacing: 0.04em; color: var(--ink-label);
  margin: 6px 0 0;
}

/* Tufte-style numbered sidenote — pure CSS, zero JS.
   Markup:
     <label for="sn-1" class="sidenote-toggle">1</label>
     <input type="checkbox" id="sn-1" class="sidenote-toggle-box">
     <span class="sidenote">The note text.</span>
   Wide screens: floats into the right margin. Narrow: click number to toggle. */
.sidenote {
  float: right; clear: right; width: 40%;
  margin: 4px -44% 18px 0; font-size: 13px; line-height: 1.5;
  color: var(--ink-soft); position: relative;
}
.sidenote-toggle {
  color: var(--accent); cursor: pointer; vertical-align: super;
  font-size: 11px; padding: 0 1px; font-weight: 600;
}
.sidenote-toggle-box { display: none; }
@media (max-width: 980px) {
  .sidenote { display: none; float: none; width: auto; margin: 10px 0; }
  .sidenote-toggle-box:checked + .sidenote {
    display: block;
    background: #fafaf7; border-left: 3px solid var(--rule);
    padding: 10px 14px; border-radius: 0 4px 4px 0;
  }
}

/* Back-to-top affordance — appears after scroll (toggled by core.js). */
.to-top {
  position: fixed; right: 20px; bottom: 20px; z-index: 40;
  display: none; align-items: center; gap: 6px;
  background: var(--paper); border: 1px solid var(--rule);
  color: var(--accent); border-radius: 20px; padding: 8px 14px;
  font-family: "SF Mono", "JetBrains Mono", "IBM Plex Mono", Menlo, monospace;
  font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
  font-weight: 600; cursor: pointer; box-shadow: var(--shadow);
  text-decoration: none;
}
.to-top.visible { display: inline-flex; }
.to-top::before { content: "↑"; }

/* Active TOC link (set by scroll-spy in core.js). */
nav.toc a.active { font-weight: 700; text-decoration: underline; }

/* Clickable diagrams get an expand cursor + tiny hint. */
.diagram[data-expandable], .svg-diagram[data-expandable] { cursor: zoom-in; }
.diagram[data-expandable]:hover, .svg-diagram[data-expandable]:hover {
  border-color: var(--accent);
}

/* Fullscreen overlay for an expanded diagram. */
.diagram-overlay {
  position: fixed; inset: 0; z-index: 100; display: none;
  background: rgba(26,26,26,0.72); padding: 4vh 4vw;
  align-items: center; justify-content: center;
}
.diagram-overlay.open { display: flex; }
.diagram-overlay .inner {
  background: var(--paper); border-radius: 8px; padding: 24px;
  max-width: 96vw; max-height: 92vh; overflow: auto; box-shadow: var(--shadow);
}
.diagram-overlay .inner svg { max-width: 100%; height: auto; }
.diagram-overlay .close {
  position: absolute; top: 18px; right: 22px;
  background: var(--paper); border: 1px solid var(--rule);
  color: var(--ink); border-radius: 4px; padding: 6px 12px; cursor: pointer;
  font-family: "SF Mono", "JetBrains Mono", "IBM Plex Mono", Menlo, monospace;
  font-size: 12px;
}
```

- [ ] **Step 3: Append the print stylesheet**

Append to `core.css`:

```css
/* ===== Print / Save-as-PDF (additive) ===== */
@media print {
  :root { --shadow: none; }
  body { background: #fff; font-size: 12px; }
  .wrap { max-width: 100%; padding: 0; }

  /* Never split these across a page break. */
  .diagram, .svg-diagram, .callout, .vocab .v, .item-card,
  .option-card, .concern, table.matrix, pre, .sidenote {
    break-inside: avoid; box-shadow: none;
  }
  h2, h3 { break-after: avoid; }

  /* Save ink: dark fills become outlined instead of solid black. */
  table.matrix thead th { background: #fff !important; color: #000 !important;
    border-bottom: 1.5px solid #000; }
  .entity { background: #fff !important; color: #000 !important; border: 1px solid #000; }
  .entity[data-kind]::before { background: #000; color: #fff; }

  pre { white-space: pre-wrap; word-break: break-word; border: 1px solid var(--rule); }

  /* Hide screen-only chrome. */
  .to-top, .copy-btn, .diagram-overlay { display: none !important; }

  /* Sidenotes print inline as footnotes. */
  .sidenote { float: none; width: auto; margin: 8px 0; display: block; }

  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 10px; color: #555; }
}
```

- [ ] **Step 4: Verify the additions parse**

Run a quick CSS sanity check (no syntax errors / balanced braces):

```bash
node -e "const c=require('fs').readFileSync('/Users/james/.claude/skills/visual-explainer-core/core.css','utf8');const o=(c.match(/{/g)||[]).length,x=(c.match(/}/g)||[]).length;console.log('open',o,'close',x);if(o!==x)process.exit(1)"
```

Expected: `open N close N` with equal counts, exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/james/.claude/skills
git add visual-explainer-core/core.css
git commit -m "feat(core): add a11y, print, and comprehension components to core.css"
```

---

## Task 3: Create `visual-explainer-core/core.js` (existing JS + a11y + scroll-spy + zoom)

**Files:**
- Create: `~/.claude/skills/visual-explainer-core/core.js`
- Source for the copy/tabs/slider handlers: `software-visual-explainer/template.html:748-795` (the `DOMContentLoaded` body, **excluding** the `mermaid.initialize(...)` call — Mermaid is pre-rendered now, so no client Mermaid).

**Note:** Do **not** carry over `mermaid.initialize(...)` or `Prism.highlightAll()` — both are replaced by the build step. The copy-button, tab, and slider logic is moved verbatim, then extended.

- [ ] **Step 1: Write core.js**

Create `visual-explainer-core/core.js` with the full content below (it supersedes the inline `<script>` in both templates):

```js
document.addEventListener('DOMContentLoaded', function () {

  // ---- Copy-to-clipboard buttons (moved verbatim) ----
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copyText;
      if (!text && btn.dataset.copyTarget) {
        var el = document.querySelector(btn.dataset.copyTarget);
        if (el) text = el.innerText || el.value || '';
      }
      if (!text) return;
      navigator.clipboard.writeText(text).then(function () {
        btn.classList.add('copied');
        var orig = btn.dataset.copyLabel || btn.textContent;
        if (!btn.dataset.copyLabel) btn.dataset.copyLabel = orig.trim();
        btn.textContent = 'Copied';
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.textContent = btn.dataset.copyLabel;
        }, 1400);
      });
    });
  });

  // ---- Tabs: click + full keyboard nav + ARIA wiring ----
  document.querySelectorAll('.tabs').forEach(function (tabs) {
    var btns = Array.prototype.slice.call(tabs.querySelectorAll('.tab-btn'));
    var panels = Array.prototype.slice.call(tabs.querySelectorAll('.tab-panel'));
    function select(i) {
      btns.forEach(function (b, j) {
        var on = i === j;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.setAttribute('tabindex', on ? '0' : '-1');
        if (panels[j]) panels[j].setAttribute('aria-hidden', on ? 'false' : 'true');
      });
    }
    btns.forEach(function (btn, i) {
      // Wire ARIA relationships if missing.
      if (!btn.id) btn.id = 'tab-' + Math.random().toString(36).slice(2, 8);
      if (panels[i]) {
        if (!panels[i].id) panels[i].id = btn.id + '-panel';
        btn.setAttribute('aria-controls', panels[i].id);
        panels[i].setAttribute('role', 'tabpanel');
        panels[i].setAttribute('aria-labelledby', btn.id);
      }
      btn.addEventListener('click', function () { select(i); });
      btn.addEventListener('keydown', function (e) {
        var n = btns.length, t = null;
        if (e.key === 'ArrowRight') t = (i + 1) % n;
        else if (e.key === 'ArrowLeft') t = (i - 1 + n) % n;
        else if (e.key === 'Home') t = 0;
        else if (e.key === 'End') t = n - 1;
        if (t !== null) { e.preventDefault(); select(t); btns[t].focus(); }
      });
    });
    var current = btns.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; });
    select(current < 0 ? 0 : current);
  });

  // ---- Slider live readout (moved verbatim) ----
  document.querySelectorAll('.slider').forEach(function (slider) {
    var valueEl = slider.parentElement.querySelector('.slider-value');
    if (!valueEl) return;
    var update = function () { valueEl.textContent = slider.value; };
    update();
    slider.addEventListener('input', update);
  });

  // ---- TOC scroll-spy: highlight the section currently in view ----
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('nav.toc a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('active'); });
          var a = map[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  // ---- Back-to-top button ----
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
  }

  // ---- Click-to-expand diagrams (overlay) ----
  var overlay = document.querySelector('.diagram-overlay');
  if (overlay) {
    var inner = overlay.querySelector('.inner');
    function openDiagram(node) {
      inner.innerHTML = '';
      var clone = node.cloneNode(true);
      clone.removeAttribute('data-expandable');
      inner.appendChild(clone);
      overlay.classList.add('open');
    }
    function closeDiagram() { overlay.classList.remove('open'); inner.innerHTML = ''; }
    document.querySelectorAll('[data-expandable]').forEach(function (node) {
      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', 'Expand diagram');
      node.addEventListener('click', function () { openDiagram(node); });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDiagram(node); }
      });
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeDiagram(); });
    var closeBtn = overlay.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', closeDiagram);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDiagram(); });
  }
});
```

- [ ] **Step 2: Verify it parses as valid JS**

```bash
node --check /Users/james/.claude/skills/visual-explainer-core/core.js && echo "core.js OK"
```

Expected: `core.js OK`.

- [ ] **Step 3: Commit**

```bash
cd /Users/james/.claude/skills
git add visual-explainer-core/core.js
git commit -m "feat(core): add core.js (copy/tabs/slider + a11y, scroll-spy, diagram zoom)"
```

---

## Task 4: Create the Shiki theme that reproduces the current token palette

**Files:**
- Create: `~/.claude/skills/visual-explainer-core/shiki-theme.json`

**Rationale:** Shiki emits inline `style="color:#…"` spans (no client JS, fully offline). To keep the look identical to today's Prism palette, the theme maps TextMate scopes to the exact colors from `software-visual-explainer/template.html:90-100`.

- [ ] **Step 1: Write the theme**

Create `visual-explainer-core/shiki-theme.json`:

```json
{
  "name": "warm-paper",
  "type": "light",
  "colors": {
    "editor.background": "#f1ede4",
    "editor.foreground": "#2a2a2a"
  },
  "tokenColors": [
    { "scope": ["comment", "punctuation.definition.comment"],
      "settings": { "foreground": "#9a9388", "fontStyle": "italic" } },
    { "scope": ["keyword", "keyword.control", "storage.type", "storage.modifier",
                "keyword.operator.new", "keyword.operator.expression", "keyword.other",
                "constant.language.boolean", "constant.language.null",
                "constant.language.nil", "constant.language.undefined",
                "variable.language.this", "variable.language.self"],
      "settings": { "foreground": "#d6432e", "fontStyle": "bold" } },
    { "scope": ["string", "string.quoted", "string.template", "constant.character",
                "string.regexp", "constant.other.symbol.ruby"],
      "settings": { "foreground": "#b8881a" } },
    { "scope": ["constant.other.symbol", "entity.other.attribute-name",
                "keyword.control.at-rule", "meta.attribute"],
      "settings": { "foreground": "#2e8a6b", "fontStyle": "bold" } },
    { "scope": ["constant.other", "entity.name.type", "entity.name.class",
                "support.class", "entity.name.tag", "entity.name.namespace",
                "storage.type.class"],
      "settings": { "foreground": "#2476b8", "fontStyle": "bold" } },
    { "scope": ["constant.numeric", "constant.numeric.integer", "constant.numeric.float"],
      "settings": { "foreground": "#9a3fc4" } },
    { "scope": ["keyword.operator", "punctuation", "meta.brace",
                "punctuation.separator", "punctuation.terminator"],
      "settings": { "foreground": "#6a6a6a" } },
    { "scope": ["entity.name.function", "support.function", "variable",
                "variable.other", "variable.other.readwrite", "variable.parameter",
                "meta.property", "variable.other.property",
                "variable.other.object.property"],
      "settings": { "foreground": "#1a1a1a" } },
    { "scope": ["support.type", "support.constant", "support.function.builtin",
                "support.type.builtin", "keyword.other.important"],
      "settings": { "foreground": "#e07820", "fontStyle": "bold" } }
  ]
}
```

- [ ] **Step 2: Verify it's valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('/Users/james/.claude/skills/visual-explainer-core/shiki-theme.json','utf8'));console.log('theme OK')"
```

Expected: `theme OK`.

- [ ] **Step 3: Commit**

```bash
cd /Users/james/.claude/skills
git add visual-explainer-core/shiki-theme.json
git commit -m "feat(core): add Shiki theme matching the warm token palette"
```

---

## Task 5: Create the build pipeline (`package.json`, configs, `build.mjs`)

**Files:**
- Create: `~/.claude/skills/visual-explainer-core/package.json`
- Create: `~/.claude/skills/visual-explainer-core/mmdc-config.json`
- Create: `~/.claude/skills/visual-explainer-core/puppeteer-config.json`
- Create: `~/.claude/skills/visual-explainer-core/build.mjs`

**Heads-up (document this in SKILL.md too):** The first `mmdc` run downloads a Puppeteer Chromium (~150–200 MB) into the package's cache. This is a one-time cost; subsequent builds reuse it. If a system Chrome is preferred, set `PUPPETEER_EXECUTABLE_PATH` before building.

- [ ] **Step 1: Create package.json with pinned deps**

Create `visual-explainer-core/package.json`:

```json
{
  "name": "visual-explainer-core",
  "private": true,
  "type": "module",
  "version": "1.0.0",
  "description": "Shared design-system core + offline build for the visual-explainer skill family.",
  "scripts": {
    "build": "node build.mjs"
  },
  "dependencies": {
    "@mermaid-js/mermaid-cli": "11.4.2",
    "node-html-parser": "6.1.13",
    "shiki": "1.24.0"
  }
}
```

- [ ] **Step 2: Create the Mermaid config (locked palette)**

Create `visual-explainer-core/mmdc-config.json` (mirrors the current `mermaid.initialize` themeVariables + sequence config from `software-visual-explainer/template.html:797-826`):

```json
{
  "theme": "base",
  "themeVariables": {
    "fontFamily": "'SF Mono','JetBrains Mono','IBM Plex Mono',Menlo,monospace",
    "fontSize": "13px",
    "primaryColor": "#e3ede9",
    "primaryTextColor": "#1a1a1a",
    "primaryBorderColor": "#2f5d50",
    "lineColor": "#8a8a8a",
    "secondaryColor": "#f1ede4",
    "tertiaryColor": "#ffffff",
    "noteBkgColor": "#fcecdc",
    "noteTextColor": "#4a4a4a",
    "noteBorderColor": "#e6e2d8",
    "clusterBkg": "#fafaf7",
    "clusterBorder": "#e6e2d8"
  },
  "sequence": {
    "actorFontSize": 12,
    "messageFontSize": 11,
    "noteFontSize": 11,
    "actorMargin": 55,
    "boxMargin": 8,
    "mirrorActors": false
  }
}
```

- [ ] **Step 3: Create the Puppeteer config**

Create `visual-explainer-core/puppeteer-config.json`:

```json
{ "args": ["--no-sandbox"] }
```

- [ ] **Step 4: Write build.mjs**

Create `visual-explainer-core/build.mjs`:

```js
#!/usr/bin/env node
// Inlines the shared core, pre-renders Mermaid → inline SVG, highlights code via
// Shiki (inline styles), strips CDN tags. Output is a self-contained offline file.
// Usage: node build.mjs <path-to-draft.html>   (rewrites the file in place)

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import { createHighlighter } from 'shiki';

const HERE = dirname(fileURLToPath(import.meta.url));
const inFile = process.argv[2];
if (!inFile) { console.error('usage: node build.mjs <draft.html>'); process.exit(1); }

let html = readFileSync(inFile, 'utf8');

// 1) Inline shared core CSS + JS at the template markers.
const css = readFileSync(join(HERE, 'core.css'), 'utf8');
const js  = readFileSync(join(HERE, 'core.js'), 'utf8');
if (!html.includes('<!-- @core:css -->')) console.warn('warning: <!-- @core:css --> marker not found');
if (!html.includes('<!-- @core:js -->'))  console.warn('warning: <!-- @core:js --> marker not found');
html = html.replace('<!-- @core:css -->', '<style>\n' + css + '\n</style>');
html = html.replace('<!-- @core:js -->',  '<script>\n' + js + '\n</script>');

const root = parse(html, { comment: true });

// 2) Pre-render every Mermaid block to inline SVG via mmdc (locked theme).
const mmdcCfg = join(HERE, 'mmdc-config.json');
const pptrCfg = join(HERE, 'puppeteer-config.json');
const mermaids = root.querySelectorAll('.mermaid');
if (mermaids.length) {
  const tmp = mkdtempSync(join(tmpdir(), 've-'));
  mermaids.forEach((node, i) => {
    const src = node.text.trim();
    const mmd = join(tmp, `d${i}.mmd`);
    const out = join(tmp, `d${i}.svg`);
    writeFileSync(mmd, src);
    execFileSync('npx', ['-y', '@mermaid-js/mermaid-cli', 'mmdc',
      '-i', mmd, '-o', out, '-c', mmdcCfg, '-p', pptrCfg, '-b', 'transparent'],
      { stdio: 'inherit' });
    let svg = readFileSync(out, 'utf8').replace(/<\?xml[^>]*\?>/, '').trim();
    svg = svg.replace('<svg ', '<svg style="max-width:100%;height:auto" ');
    node.replaceWith(parse(svg));
  });
  rmSync(tmp, { recursive: true, force: true });
}

// 3) Highlight every code block via Shiki → inline styles (no client JS).
const ALIAS = { protobuf: 'proto' }; // Prism id -> Shiki id where they differ
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const codeNodes = root.querySelectorAll('pre code[class*="language-"]');
if (codeNodes.length) {
  const theme = JSON.parse(readFileSync(join(HERE, 'shiki-theme.json'), 'utf8'));
  const wanted = [...new Set(codeNodes.map((c) => {
    const m = (c.getAttribute('class') || '').match(/language-([\w-]+)/);
    return m ? (ALIAS[m[1]] || m[1]) : null;
  }).filter(Boolean))];
  const hl = await createHighlighter({ themes: [theme], langs: wanted });
  const loaded = new Set(hl.getLoadedLanguages());
  for (const code of codeNodes) {
    const m = (code.getAttribute('class') || '').match(/language-([\w-]+)/);
    let lang = m ? (ALIAS[m[1]] || m[1]) : 'text';
    if (!loaded.has(lang)) lang = 'text';
    const raw = decode(code.innerHTML);
    const highlighted = hl.codeToHtml(raw, { lang, theme: 'warm-paper' });
    code.closest('pre').replaceWith(parse(highlighted));
  }
}

// 4) Drop the now-unused CDN tags (Mermaid + Prism).
root.querySelectorAll('script[src*="mermaid"], script[src*="prism"], link[href*="prism"]')
  .forEach((n) => n.remove());

writeFileSync(inFile, root.toString());
console.log('built (offline) →', inFile);
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/james/.claude/skills/visual-explainer-core
npm install
```

Expected: `node_modules/` populated; no fatal errors. (Chromium for `mmdc` downloads lazily on first build, not here.)

- [ ] **Step 6: Smoke-test the build on a minimal fixture**

Create a throwaway fixture and run the build:

```bash
cd /Users/james/.claude/skills/visual-explainer-core
cat > /tmp/ve-smoke.html <<'HTML'
<!doctype html><html><head><meta charset="utf-8">
<!-- @core:css -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js" data-manual></script>
</head><body>
<div class="diagram"><div class="mermaid">flowchart LR
  A[Start] --> B[End]</div></div>
<pre><code class="language-python">def greet(name):
    return f"hi {name}"</code></pre>
<!-- @core:js -->
</body></html>
HTML
node build.mjs /tmp/ve-smoke.html
echo "--- checks ---"
grep -c "<svg" /tmp/ve-smoke.html          # expect >=1 (Mermaid inlined)
grep -c "class=\"shiki\"" /tmp/ve-smoke.html  # expect >=1 (code highlighted)
grep -c "cdn.jsdelivr\|cdnjs" /tmp/ve-smoke.html  # expect 0 (CDN stripped)
grep -c "color:#d6432e" /tmp/ve-smoke.html    # expect >=1 (keyword color inlined)
```

Expected: `<svg` count ≥ 1, `class="shiki"` ≥ 1, CDN count **0**, keyword-color ≥ 1. Open `/tmp/ve-smoke.html` in a browser **with networking disabled** and confirm the diagram and highlighted code both render.

- [ ] **Step 7: Commit**

```bash
cd /Users/james/.claude/skills
git add visual-explainer-core/package.json visual-explainer-core/package-lock.json \
        visual-explainer-core/build.mjs visual-explainer-core/mmdc-config.json \
        visual-explainer-core/puppeteer-config.json
git commit -m "feat(core): offline build pipeline (inline core + prerender Mermaid/code)"
```

---

## Task 6: Slim `software-visual-explainer/template.html` to markers + body scaffold

**Files:**
- Modify: `~/.claude/skills/software-visual-explainer/template.html`

**What changes:** Remove the big inline `<style>` block (now `core.css`) and replace with `<!-- @core:css -->`. Remove the inline `<script>` (now `core.js`) and replace with `<!-- @core:js -->`. Remove the Mermaid + Prism CDN `<script>` tags from `<head>` (the build inlines/pre-renders). Keep the entire `<body>` scaffold (header/TOC/sections) **unchanged** — it's the fill-in surface. Add the back-to-top + diagram-overlay elements so core.js can wire them.

- [ ] **Step 1: Replace the `<head>` block**

Replace `software-visual-explainer/template.html` lines **8–454** (from the `<!-- Mermaid for diagrams -->` comment through `</style>`) with:

```html
  <!-- Shared visual-explainer core (tokens, type, primitives, a11y, print).
       The build step inlines visual-explainer-core/core.css here. -->
  <!-- @core:css -->
```

(The `<title>` line above it stays; everything Mermaid/Prism/CSS in between is gone.)

- [ ] **Step 2: Add overlay + back-to-top just inside `<body>`**

Immediately after `<div class="wrap">`, the scaffold stays; just before the closing `</div>` of `.wrap` (right before the existing `<script>`), and the body-level overlay after `</div>`(wrap close), add:

```html
  <!-- Back-to-top (wired by core.js) -->
  <a class="to-top" href="#top">Top</a>

  <!-- Diagram zoom overlay (wired by core.js) -->
  <div class="diagram-overlay" aria-hidden="true">
    <button class="close" aria-label="Close">Close ✕</button>
    <div class="inner"></div>
  </div>
```

Also add `id="top"` to the opening `<header class="page">` so back-to-top has a target. To make a diagram expandable, the author adds `data-expandable` to a `.diagram`/`.svg-diagram` (document this in SKILL.md).

- [ ] **Step 3: Replace the trailing `<script>` block**

Replace `software-visual-explainer/template.html` lines **747–827** (the entire final `<script> … </script>`, including the old DOMContentLoaded handlers AND `mermaid.initialize`) with:

```html
  <!-- Shared interactive behavior. The build step inlines visual-explainer-core/core.js here. -->
  <!-- @core:js -->
```

- [ ] **Step 4: Verify the template still contains its body scaffold and the markers**

```bash
grep -c "@core:css\|@core:js" /Users/james/.claude/skills/software-visual-explainer/template.html  # expect 2
grep -c "id=\"vocab\"\|id=\"walkthrough\"\|class=\"diagram\"" /Users/james/.claude/skills/software-visual-explainer/template.html  # body scaffold intact
grep -c "cdnjs\|jsdelivr\|mermaid.initialize\|<style>" /Users/james/.claude/skills/software-visual-explainer/template.html  # expect 0
```

Expected: markers = 2, scaffold present, CDN/inline-style/`mermaid.initialize` = 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/james/.claude/skills
git add software-visual-explainer/template.html
git commit -m "refactor(software-explainer): template references shared core via markers"
```

---

## Task 7: Rebuild `code-option-comparison/template.html` (markers + `.option-*` CSS only)

**Files:**
- Modify: `~/.claude/skills/code-option-comparison/template.html`

**This fixes the stale-duplicate-CSS bug.** All the shared CSS this file currently duplicates (lines 23–162: tokens, base type, Prism palette, copy-btn, callout, meta, diagram, matrix, footer) comes from the core now. Keep **only** the option-comparison-specific CSS (the `/* ===== Option-comparison specific ===== */` block, lines **164–324**: `.option-grid`, `.option-card`, `.option-*`, `.pill`, `.recommendation`, `.axes-card`, and the option-grid responsive rules).

- [ ] **Step 1: Replace the `<head>` styles**

Replace `code-option-comparison/template.html` lines **8–325** (from `<!-- Mermaid for diagrams -->` through `</style>`) with:

```html
  <!-- Shared visual-explainer core (inlined by the build step). -->
  <!-- @core:css -->

  <style>
    /* ===== Option-comparison specific (domain-only) ===== */
```

Then **keep** the existing domain CSS that currently lives at lines 166–324 (the `.option-grid` through the `@media (max-width: 480px)` option rules), and close it with `</style>`. The net effect: this file's `<style>` now contains *only* the `.option-*`/`.pill`/`.axes-card`/`.recommendation` rules; everything generic is inherited from core.

- [ ] **Step 2: Replace the trailing `<script>`**

Replace `code-option-comparison/template.html` lines **608–654** (the final `<script> … </script>` with the copy-handler and `mermaid.initialize`) with:

```html
  <!-- @core:js -->
```

- [ ] **Step 3: Add overlay + back-to-top (same as Task 6 Step 2)**

Add the `.to-top` anchor and `.diagram-overlay` block just before the closing `</body>`, and `id="top"` on `<header class="page">`.

- [ ] **Step 4: Verify**

```bash
grep -c "@core:css\|@core:js" /Users/james/.claude/skills/code-option-comparison/template.html  # expect 2
grep -c "option-card\|option-grid\|recommendation" /Users/james/.claude/skills/code-option-comparison/template.html  # domain CSS intact
grep -c "cdnjs\|jsdelivr\|--accent: #2f5d50\|mermaid.initialize" /Users/james/.claude/skills/code-option-comparison/template.html  # expect 0 (shared bits gone)
```

Expected: markers = 2, domain CSS present, duplicated-shared-bits = 0.

- [ ] **Step 5: Build-test both templates produce identical core**

Assemble both templates (content placeholders left as-is is fine for this check) and confirm the inlined core block is byte-identical:

```bash
cd /Users/james/.claude/skills/visual-explainer-core
cp ../software-visual-explainer/template.html /tmp/sw.html
cp ../code-option-comparison/template.html /tmp/oc.html
# Only inline core (skip prerender) for a fast equality check:
node -e "
const fs=require('fs');const css=fs.readFileSync('core.css','utf8');
for(const f of ['/tmp/sw.html','/tmp/oc.html']){
  let h=fs.readFileSync(f,'utf8').replace('<!-- @core:css -->','<style>'+css+'</style>');
  fs.writeFileSync(f,h);
}
const a=fs.readFileSync('/tmp/sw.html','utf8'),b=fs.readFileSync('/tmp/oc.html','utf8');
const grab=s=>s.slice(s.indexOf(':root'),s.indexOf('</style>'));
console.log('core identical:', grab(a)===grab(b));
"
```

Expected: `core identical: true` — proof the two skills now share one design system.

- [ ] **Step 6: Commit**

```bash
cd /Users/james/.claude/skills
git add code-option-comparison/template.html
git commit -m "refactor(option-comparison): use shared core; drop duplicated CSS"
```

---

## Task 8: Update both SKILL.md files (fix cross-ref bug + document the build pipeline)

**Files:**
- Modify: `~/.claude/skills/code-option-comparison/SKILL.md`
- Modify: `~/.claude/skills/software-visual-explainer/SKILL.md`

- [ ] **Step 1: Fix the broken sibling-skill name in `code-option-comparison/SKILL.md`**

Replace every occurrence of `code-visual-explainer` with `software-visual-explainer` (4 occurrences: lines 26, 28, 35, 61). Verify:

```bash
grep -n "code-visual-explainer" /Users/james/.claude/skills/code-option-comparison/SKILL.md
```

Expected: **no output** (all fixed).

- [ ] **Step 2: Add a "Build (offline self-contained output)" section to BOTH SKILL.md files**

Insert this section (just before "## Output file location" in each):

```markdown
## Build (offline self-contained output)

The template references the shared design system via `<!-- @core:css -->` / `<!-- @core:js -->`
markers and writes Mermaid as `.mermaid` blocks and code as `<pre><code class="language-X">`.
After filling in the content, run the build to produce a fully offline, self-contained file:

    node ~/.claude/skills/visual-explainer-core/build.mjs path/to/your-explainer.html

The build inlines `core.css`/`core.js`, pre-renders every Mermaid diagram to inline SVG, highlights
every code block via Shiki (inline styles), and strips the CDN tags. The result opens with **no
network**. First run downloads a Chromium for Mermaid (~150–200 MB, one-time; set
`PUPPETEER_EXECUTABLE_PATH` to reuse a system Chrome). If Node is unavailable, fall back to inlining
`core.css`/`core.js` by hand and keeping the Mermaid/Prism CDN tags — but the default is the build.

**Do not fork the palette.** All colors, fonts, and component styles live in `visual-explainer-core`.
Never redefine `:root` tokens in a domain template; add only domain-specific components.
```

- [ ] **Step 3: Update the verification checklists in BOTH SKILL.md files**

Add these items to each "Verification checklist":

```markdown
- Ran `build.mjs`; the output opens correctly with networking disabled (diagrams are inline `<svg>`,
  code is highlighted with distinct token colors, no `cdnjs`/`jsdelivr` references remain).
- Keyboard pass: Tab reaches every interactive element with a visible focus ring; tabs respond to
  arrow keys; the diagram overlay closes on Escape.
- Contrast: small mono labels use `--ink-label` (AA), not `--ink-dim`.
- Print preview (Cmd-P) is clean: no diagram/table/callout splits mid-page, dark fills are outlined.
```

- [ ] **Step 4: Add comprehension guidance to `software-visual-explainer/SKILL.md`**

Add a subsection under "Mixing technical and non-technical" (and reference it from `code-option-comparison` where relevant):

```markdown
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
```

- [ ] **Step 5: Verify both SKILL.md files are coherent**

```bash
grep -c "build.mjs" /Users/james/.claude/skills/software-visual-explainer/SKILL.md   # expect >=1
grep -c "build.mjs" /Users/james/.claude/skills/code-option-comparison/SKILL.md       # expect >=1
grep -c "code-visual-explainer" /Users/james/.claude/skills/*/SKILL.md                 # expect 0
```

- [ ] **Step 6: Commit**

```bash
cd /Users/james/.claude/skills
git add software-visual-explainer/SKILL.md code-option-comparison/SKILL.md
git commit -m "docs(explainers): build pipeline, a11y/print/density guidance, fix sibling cross-ref"
```

---

## Task 9: Write `visual-explainer-core/SKILL.md` (the Layer-0 contract)

**Files:**
- Create: `~/.claude/skills/visual-explainer-core/SKILL.md`

**Rationale:** Future explainers (article, finance) must discover and reuse the core instead of reinventing the palette. This SKILL.md is a reference skill describing the shared system and how to build on it. Description follows the writing-skills CSO rule (triggering conditions, third person, no workflow summary).

- [ ] **Step 1: Write the file**

```markdown
---
name: visual-explainer-core
description: Use when building or modifying any visual-explainer skill (software, article, finance, or new domains) that must share one consistent locked theme and produce offline self-contained HTML. The single source of truth for the explainer family's palette, typography, primitives, code highlighting, Mermaid theme, accessibility, print, and the build pipeline.
---

# Visual Explainer Core

## Overview

One locked design system, shared by every explainer skill. Domain skills supply content and a few
domain-specific components; everything visual — tokens, type, callouts, tables, diagram cards,
interactive primitives, accessibility, print — lives here so the whole family stays identical.
Consistency is the product: a reader recognizes any explainer on sight, with zero per-generation
theme variation.

## What lives here

| File | Responsibility |
|---|---|
| `core.css` | All shared CSS: `:root` tokens, typography, primitives, code-token palette, a11y, print. |
| `core.js` | Copy buttons, tabs (+keyboard), sliders, TOC scroll-spy, back-to-top, diagram zoom. |
| `shiki-theme.json` | TextMate theme reproducing the warm code palette (inline-style highlighting). |
| `mmdc-config.json` | Mermaid theme/sequence config (locked palette). |
| `build.mjs` | Inlines core, pre-renders Mermaid→SVG and code→Shiki, strips CDN. Offline output. |

## How a domain skill uses the core

1. The domain `template.html` puts `<!-- @core:css -->` in `<head>` and `<!-- @core:js -->` before
   `</body>`, and adds only its own components in a small `<style>` block.
2. Author fills in content; Mermaid as `.mermaid` blocks, code as `<pre><code class="language-X">`.
3. Run `node visual-explainer-core/build.mjs <file.html>` → self-contained offline artifact.

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
```

- [ ] **Step 2: Check token efficiency (writing-skills target <500 words for non-frequent skills)**

```bash
wc -w /Users/james/.claude/skills/visual-explainer-core/SKILL.md
```

Expected: under ~500 words. Trim if over.

- [ ] **Step 3: Commit**

```bash
cd /Users/james/.claude/skills
git add visual-explainer-core/SKILL.md
git commit -m "docs(core): add Layer-0 contract SKILL.md for the explainer family"
```

---

## Task 10: Comprehension primitives — confirm they're wired (no new code, verification only)

The CSS (Task 2) and JS (Task 3) already shipped the reading-meta line, sidenotes, scroll-spy,
back-to-top, and diagram zoom. This task verifies they actually function end-to-end and that the
SKILL.md guidance (Task 8 Step 4) points authors at them.

- [ ] **Step 1: Build a fixture exercising every primitive**

Create `/tmp/ve-primitives.html` from `software-visual-explainer/template.html`, then add: a
`.reading-meta` line, one `data-expandable` diagram, one sidenote pair, a TOC with two anchors, and
the `.to-top`/`.diagram-overlay` elements. Run:

```bash
node /Users/james/.claude/skills/visual-explainer-core/build.mjs /tmp/ve-primitives.html
```

- [ ] **Step 2: Manual verification in a browser (networking OFF)**

Confirm: scrolling highlights the active TOC link; back-to-top appears past ~600px and returns to
top; clicking the `data-expandable` diagram opens the overlay and Escape closes it; on a narrow
window the sidenote collapses to a tap-to-reveal number; Tab shows focus rings throughout.

- [ ] **Step 3: No commit needed** (verification only). If a primitive misbehaves, fix in
`core.js`/`core.css` and re-run Task 3/Task 2 verification before proceeding.

---

## Task 11: End-to-end acceptance — generate one real explainer and verify the artifact

**This is the integration test for the whole plan.** Pick a small real topic (e.g. a single
function or a 3-option comparison) so the content is quick but the pipeline is fully exercised.

- [ ] **Step 1: Generate a real software explainer** from `software-visual-explainer/template.html`
following the skill, with at least: one Mermaid diagram, two real code snippets (two languages),
one matrix table, one callout, one sidenote, one `data-expandable` diagram. Save to
`/tmp/accept-explainer.html`.

- [ ] **Step 2: Build it**

```bash
node /Users/james/.claude/skills/visual-explainer-core/build.mjs /tmp/accept-explainer.html
```

Expected: completes; prints `built (offline) → …`.

- [ ] **Step 3: Offline + integrity checks**

```bash
F=/tmp/accept-explainer.html
echo "CDN refs (want 0):"; grep -c "cdnjs\|jsdelivr" $F
echo "inline SVG (want >=1):"; grep -c "<svg" $F
echo "shiki blocks (want >=2):"; grep -c 'class="shiki"' $F
echo "core token present (want >=1):"; grep -c "\-\-accent: #2f5d50" $F
echo "ink-label AA token (want >=1):"; grep -c "\-\-ink-label" $F
```

Expected: CDN 0, SVG ≥1, shiki ≥2, accent token ≥1, ink-label ≥1.

- [ ] **Step 4: Render with networking disabled** and confirm: diagrams render, code is multi-color
(not flat), copy buttons work, tabs/keyboard work, print preview is clean, nothing overflows at
375px width.

- [ ] **Step 5: Final commit + handoff note**

```bash
cd /Users/james/.claude/skills
git add -A
git commit -m "test: end-to-end acceptance of shared-core offline explainer pipeline"
```

---

## Self-review (run before declaring the plan done)

- **Spec coverage:** shared core (T1, T7) ✓ · offline pre-render (T5) ✓ · accessibility (T2, T3) ✓ ·
  print (T2) ✓ · cross-ref bug (T8) ✓ · stale-duplicate-CSS bug (T7) ✓ · comprehension primitives
  (T2, T3, T10) ✓ · Layer-0 contract for future explainers (T9) ✓.
- **Constraint:** no existing color/font/spacing changed; `--ink-label` is additive; no dark mode,
  no per-generation themes. ✓
- **Type consistency:** marker strings `<!-- @core:css -->` / `<!-- @core:js -->` identical across
  `build.mjs`, both templates, and SKILL.md. Theme name `warm-paper` identical in `shiki-theme.json`
  and `build.mjs` `codeToHtml`. Class names (`.to-top`, `.diagram-overlay .inner`, `.active`,
  `data-expandable`) identical across `core.css` and `core.js`.
- **Open design choice (already resolved):** core is inlined at build time (not `@import`-ed) so the
  output stays a single self-contained file with zero drift. Alternative (marker-delimited copy +
  diff check) rejected as more moving parts.

## Out of scope (deliberately deferred)

- The new `article-visual-explainer` and `finance-visual-explainer` skills — they sit on this core
  and come *after* it lands.
- Heavier interactive patterns (sticky-code↔prose walkthroughs, scrollytelling) — offer as optional
  advanced primitives later, per-skill.
- Dark mode / theme switching — intentionally excluded to protect the single locked identity.
