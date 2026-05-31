# Verification checklist

Run through this before declaring a comparison complete.

## Content

- Each option column has all sub-sections filled in (no empty cells, no "TBD" — write "n/a" or
  "doesn't apply" explicitly).
- Each option is genuinely distinct from the others — if two columns end up similar, drop one.
- The comparison axes actually differentiate (if every option scores the same on an axis, drop the axis).
- The recommendation states a preference with reasoning, framed as a starting point not a verdict.

## Build & rendering

- Renders standalone in a browser: columns line up, the matrix is readable, copy buttons work.
- Ran the build; the output opens correctly **with networking disabled** — diagrams are inline
  `<svg>`, code is highlighted with distinct token colors, and no `cdnjs`/`jsdelivr`/`prism`
  references remain. (Shiki emits `class="shiki warm-paper"` and uppercase hex like `#D6432E`; match
  case-insensitively if you script the check.)

## Accessibility & print

- Keyboard pass: Tab reaches every interactive element with a visible focus ring; tabs respond to
  arrow keys; the diagram overlay closes on Escape.
- Contrast: small mono labels use `--ink-label` (AA), not `--ink-dim`.
- Print preview (Cmd-P) is clean: no diagram/table/callout splits mid-page; dark fills are outlined.
