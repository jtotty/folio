#!/usr/bin/env node
// Inlines the shared core, pre-renders Mermaid → inline SVG, highlights code via
// Shiki (inline styles), strips CDN tags. Output is a self-contained offline file.
// Usage: node scripts/build.mjs <path-to-draft.html>   (rewrites the file in place)

import { readFileSync, writeFileSync, mkdtempSync, rmSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import { createHighlighter, bundledLanguages } from 'shiki';

const HERE = dirname(fileURLToPath(import.meta.url)); // skills/visual-explainer-core/scripts
const ROOT = dirname(HERE);                            // skills/visual-explainer-core
const inFile = process.argv[2];
if (!inFile) { console.error('usage: node scripts/build.mjs <draft.html>'); process.exit(1); }

let html = readFileSync(inFile, 'utf8');

// 1) Inline shared core CSS + JS at the template markers.
const css = readFileSync(join(ROOT, 'assets', 'core.css'), 'utf8');
const js  = readFileSync(join(ROOT, 'assets', 'core.js'), 'utf8');
if (!html.includes('<!-- @core:css -->')) console.warn('warning: <!-- @core:css --> marker not found');
if (!html.includes('<!-- @core:js -->'))  console.warn('warning: <!-- @core:js --> marker not found');
html = html.replace('<!-- @core:css -->', '<style>\n' + css + '\n</style>');
html = html.replace('<!-- @core:js -->',  '<script>\n' + js + '\n</script>');

// Keep <script>/<style>/<noscript> as raw text so the just-inlined core CSS/JS is
// preserved verbatim, but DO parse inside <pre> so `<code>` blocks become real child
// elements (node-html-parser v6 treats <pre> as raw text by default, which would hide
// the code nodes from the highlighter below).
const root = parse(html, {
  comment: true,
  blockTextElements: { script: true, style: true, noscript: true },
});

// 2) Pre-render every Mermaid block to inline SVG via mmdc (locked theme).
const mmdcCfg = join(ROOT, 'config', 'mmdc-config.json');
const pptrCfg = join(ROOT, 'config', 'puppeteer-config.json');
const MMDC = join(ROOT, 'node_modules', '.bin', 'mmdc');
const mermaids = root.querySelectorAll('.mermaid');
if (mermaids.length) {
  const tmp = mkdtempSync(join(tmpdir(), 've-'));
  try {
    mermaids.forEach((node, i) => {
      const src = node.text.trim();
      if (!src) { console.warn('skipping empty .mermaid block #' + i); return; }
      const mmd = join(tmp, `d${i}.mmd`);
      const out = join(tmp, `d${i}.svg`);
      writeFileSync(mmd, src);
      try {
        execFileSync(MMDC,
          ['-i', mmd, '-o', out, '-c', mmdcCfg, '-p', pptrCfg, '-b', 'transparent'],
          { stdio: 'inherit' });
      } catch (err) {
        console.error('Mermaid block #' + i + ' failed to render:\n' +
          (err.stderr ? err.stderr.toString() : err.message));
        throw err;
      }
      let svg = readFileSync(out, 'utf8').replace(/<\?xml[^>]*\?>/, '').trim();
      svg = svg.replace('<svg ', '<svg style="max-width:100%;height:auto" ');
      node.replaceWith(parse(svg));
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// 3) Highlight every code block via Shiki → inline styles (no client JS).
const ALIAS = { protobuf: 'proto' }; // Prism id -> Shiki id where they differ
const codeNodes = root.querySelectorAll('pre code[class*="language-"]');
if (codeNodes.length) {
  const theme = JSON.parse(readFileSync(join(ROOT, 'assets', 'shiki-theme.json'), 'utf8'));
  const wanted = [...new Set(codeNodes.map((c) => {
    const m = (c.getAttribute('class') || '').match(/language-([\w-]+)/);
    return m ? (ALIAS[m[1]] || m[1]) : null;
  }).filter(Boolean))];
  const known = wanted.filter((l) => l in bundledLanguages);
  const hl = await createHighlighter({ themes: [theme], langs: known });
  try {
    const loaded = new Set(hl.getLoadedLanguages());
    for (const code of codeNodes) {
      const m = (code.getAttribute('class') || '').match(/language-([\w-]+)/);
      let lang = m ? (ALIAS[m[1]] || m[1]) : 'text';
      if (!loaded.has(lang)) lang = 'text';
      const raw = code.text;
      const highlighted = hl.codeToHtml(raw, { lang, theme: 'warm-paper' });
      code.closest('pre').replaceWith(parse(highlighted));
    }
  } finally {
    hl.dispose();
  }
}

// 4) Drop the now-unused CDN tags (Mermaid + Prism).
root.querySelectorAll('script[src*="mermaid"], script[src*="prism"], link[href*="prism"]')
  .forEach((n) => n.remove());

const tmpOut = inFile + '.tmp';
writeFileSync(tmpOut, root.toString());
renameSync(tmpOut, inFile);
console.log('built (offline) →', inFile);
