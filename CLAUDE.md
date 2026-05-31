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

## In progress

The shared-core + offline-build refactor is planned in
`docs/plans/2026-05-31-visual-explainer-shared-core.md`. When executed, the locked CSS/JS moves to a
shared `skills/visual-explainer-core/`, and a `build.mjs` pre-renders Mermaid/code for offline output.
Bundled scripts are referenced at runtime via `${CLAUDE_PLUGIN_ROOT}`.
