# Verification checklist

Run through this before declaring an explainer complete. Accuracy is the whole job — a wrong symbol or
state name is worse than a missing one.

## Accuracy (against the source-of-truth code)

- Every symbol in a code snippet exists in the codebase — confirm via Serena MCP (`find_symbol`) when
  available, else `git grep <symbol>`.
- Every state name in a state diagram matches the actual AASM `state :foo`, enum value, or constant.
- Every association/relationship in an ER diagram matches the actual
  `has_many`/`belongs_to`/foreign-key declaration.
- Every type name in a class diagram matches the actual class, module, or interface in the code.
- Worked-example inputs and outputs are internally consistent and match the semantics described in the
  source.

## Rendering

- Open the file in a browser **with a network connection** — Mermaid renders every diagram and Prism
  highlights every code block (both load from CDN).
- Every Prism `{{LANGUAGE}}` placeholder has been replaced with a real language id; each code block
  highlights in distinct token colors (not a single flat color). A flat block means that language's
  Prism component isn't loaded — fix the `<script>` tag and the `language-X` id.
- No gradients, no emojis, no CSS framework utility classes (Bootstrap, Tailwind) unless explicitly
  requested.

## Accessibility & print

- Keyboard pass: Tab reaches every interactive element with a visible focus ring; tabs respond to
  arrow keys; the diagram overlay closes on Escape.
- Contrast: small mono labels use `--ink-label` (AA), not `--ink-dim`.
- Mobile spot-check at 375px width: nothing overflows, all text remains readable.
- Print preview (Cmd-P) is clean: no diagram/table/callout splits mid-page; dark fills are outlined.

## Brainstorm mode additions

Relaxes the four **Accuracy** items above — they apply to *existing-code* references only — and adds:

- Every proposed code block, diagram, and section carries the `proposed` badge — nothing not-yet-built
  reads as shipped — and a one-line legend explains the badge.
- Existing-code references the brainstorm builds on are still verified normally (Serena MCP / `git grep`).
- A divergent explainer ends in a "leaning toward" recommendation; a converged one states the chosen
  direction plainly in the meta-strip `status` field.
- Every "Open questions" entry has a working copy button.
