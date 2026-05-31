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

```
.claude-plugin/   plugin.json + marketplace.json (install manifests)
skills/           one folder per skill, each with SKILL.md
docs/plans/       implementation plans (e.g. the shared-core + offline-build refactor)
```

## Shared core + offline build (shipped)

The shared-core + offline-build refactor is complete. Shared assets live at
`skills/visual-explainer-core/` (`core.css`, `core.js`, `shiki-theme.json`). Skills reference the
core via `<!-- @core:css -->` / `<!-- @core:js -->` markers in their `template.html`.

To produce a fully offline artifact, run:

    node "${CLAUDE_PLUGIN_ROOT}/skills/visual-explainer-core/build.mjs" path/to/your-file.html

(Outside an installed plugin, substitute the repo-relative path to `build.mjs`.) Run `npm install`
once in `skills/visual-explainer-core/` first — this also fetches a one-time headless Chromium for
Mermaid pre-rendering (~150–200 MB; set `PUPPETEER_EXECUTABLE_PATH` to reuse a system Chrome).

**`visual-explainer-core` is intentionally NOT listed in `.claude-plugin/plugin.json`'s `skills`
array.** It is shared infrastructure and a contributor contract, not a user-facing explainer
generator, so it is not surfaced as an installable `/folio:` command. Do not "fix" this omission.
