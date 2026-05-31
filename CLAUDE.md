# folio — contributor context

This repo is a Claude Code plugin: a family of "visual explainer" skills under `skills/`, each a
folder with a `SKILL.md` (+ supporting assets). Installed via `.claude-plugin/plugin.json` (skills
list) and `.claude-plugin/marketplace.json` (self-hosted marketplace).

## The one rule: the theme is locked

folio's entire value is a **single, consistent visual identity** across every explainer it generates:
warm cream background, paper white cards, forest-green accent (`#2f5d50`), Iowan Old Style serif body,
SF Mono labels. **No gradients. No emoji. No dark mode. No per-generation theme variety.**

When editing skills, only *add* components or fix correctness/legibility — never restyle, recolor, or
introduce theme switching. "Vary the design for visual interest" is the wrong direction here; the
popular per-generation-aesthetic pattern (nicobailon, frontend-slides, Hallmark) is exactly what this
project rejects. Consistency is the product.

## Layout

Each skill keeps `SKILL.md` at its root and groups supporting files by role (the canonical skill
layout, as in nicobailon/visual-explainer):

```
.claude-plugin/                 plugin.json + marketplace.json (install manifests)
skills/
  software-visual-explainer/
    SKILL.md                    lean orchestrator
    references/*.md             detail, loaded on demand
    templates/template.html
  code-option-comparison/       (same shape)
  visual-explainer-core/        shared design system (not a user-facing generator)
    SKILL.md
    assets/      core.css, core.js   ← canonical locked theme
```

**SKILL.md is an orchestrator, kept lean.** It carries when-to-use, the process spine, and a
reference map; everything else (content shapes, diagram/code detail, primitives, checklists) lives in
`references/*.md` and is pulled in only when needed. When adding guidance, put detail in a reference
file and link it from SKILL.md — don't grow the always-loaded SKILL.md.

## Shared core + CDN rendering (no build)

The locked theme lives once in `skills/visual-explainer-core/assets/` (`core.css`, `core.js`). Each
domain `templates/template.html` is **fully self-contained**: it embeds an inline copy of that core
and loads Mermaid + Prism from a CDN. There is **no build step** — fill in the template, replace
`{{LANGUAGE}}` in the Prism `<script>` tag, and open the file in a browser. (CDN-dependent, so not
offline; that's the deliberate trade for simplicity.)

`core.css`/`core.js` are the **canonical** copy; the templates' inline copies must match them. When
you change the theme, edit the canonical files first, then paste the update into each template's
`<style>` / `<script>`. This manual sync is the one discipline that keeps the family consistent —
there is deliberately no build to automate it.

**`visual-explainer-core` is intentionally NOT listed in `.claude-plugin/plugin.json`'s `skills`
array.** It is shared infrastructure and a contributor contract, not a user-facing explainer
generator, so it is not surfaced as an installable `/folio:` command. Do not "fix" this omission.
