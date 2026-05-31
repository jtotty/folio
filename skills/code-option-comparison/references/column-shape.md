# Column shape, layout, and copy buttons

The grid is rigid on purpose — identical sub-section order and typography in every column is what lets
the reader compare. Only the content differs.

## Each option column

| Sub-section | Purpose |
|---|---|
| Option name | Short, distinct (3-6 words). The tradeoff in the name is fine ("Redis — fast but stateful"). |
| Tagline | One-sentence framing of the tradeoff this option is making. |
| Mockup / Diagram | A small Mermaid or SVG illustration of the shape, or a mockup if the topic is UI. |
| Sketch code | 5-15 lines of representative code showing what an implementation looks like. Not full code — the shape. |
| Tradeoffs | 3-5 bullets: what you gain, what you give up. |
| Cost / Effort | Implementation effort, ongoing cost, team-skills required. |
| Pick this if | One sentence: when is this the right call? |

## After the columns

- A **comparison matrix table** — rows are the comparison axes (the same 4–8 questions you answer for
  every option), columns are the options. Cells are short verdicts (✓ / ⚠ / ✗ with a one-phrase
  explanation; or quantitative values where applicable). The matrix lets the reader see all options
  against all axes at once.
- A brief **recommendation** section stating which option you'd lean toward and why, framed as "if I
  were choosing, I'd start with X because of Y" — leaving the actual choice to the reader.

## Layout & visual rhythm

Same locked palette as `software-visual-explainer` (defined in `visual-explainer-core`) — warm cream,
paper white, forest-green accent, Iowan Old Style serif, SF Mono labels. Each option column is a paper
card with the same internal structure. The visual rhythm is the point: identical sub-section order,
identical typography, only the content differs.

- **3–4 options:** a CSS grid 3–4 wide on desktop, 2 wide at tablet, 1 wide on mobile.
- **5–6 options:** 3 wide on desktop, 2 wide at tablet, 1 wide on mobile (so 5–6 become 2 rows of 3).

## Copy buttons

Every code snippet in every column gets a copy button (the `.copy-btn` primitive from the shared
core). The recommendation section gets a "copy this option as a starting point" button that exports a
structured summary (markdown or JSON) for the reader to paste back into Claude as a prompt to start
implementing.
