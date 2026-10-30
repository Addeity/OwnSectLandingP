/*
 * Traces the logo into content/src/wordmark.ts: one filled path the nav and
 * the footer band draw in the page's own colours.
 *
 *   npm i --no-save potrace@2.1.8          (and ImageMagick's `convert`)
 *   node tools/wordmark.mjs [tools/brand/ownsect-logo.webp]
 *
 * The logo is glossy dark letters on a light ground, so the letters are
 * everything darker than about 70% grey, weighted as Rec. 601 luma. Their
 * specular highlights come out as small holes in that, and are filled: any
 * enclosed region under 1000 px² at the source's 1600px width (the O's
 * counter is about 11,600 and the e's eye about 1,300; the largest highlight
 * is 700). The silhouette is then blurred and cut again at double size, which
 * takes the render's lumpy rims off the edge without moving it, and potrace
 * draws it as curves.
 *
 * Run as it stands, this writes content/src/wordmark.ts byte for byte, so the
 * file can always be made again from the picture.
 *
 * With a vector original of the logo, use that instead: this is the next
 * best thing to it, and reads as the logo at every size the site uses.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import potrace from 'potrace';

const src = process.argv[2] ?? 'tools/brand/ownsect-logo.webp';
const out = process.argv[3] ? new URL(path.resolve(process.argv[3]), 'file:') : new URL('../content/src/wordmark.ts', import.meta.url);
const dir = mkdtempSync(path.join(tmpdir(), 'wordmark-'));
const mask = path.join(dir, 'mask.png');

/* letters white on black, highlights filled, then smoothed at double size and back to black on white for potrace */
execFileSync('convert', [
  src, '-grayscale', 'Rec601Luma', '-threshold', '70.6%', '-negate',
  '-define', 'connected-components:area-threshold=1000', '-define', 'connected-components:mean-color=true',
  '-connected-components', '8', '-threshold', '50%', '-negate',
  '-resize', '200%', '-blur', '0x5', '-threshold', '50%', mask,
]);

const HEIGHT = 100;   // the viewBox is this tall, so one decimal is a thousandth of the mark's height
potrace.trace(mask, { threshold: 128, turdSize: 40, optCurve: true, optTolerance: 0.5, alphaMax: 1 }, (err, svg) => {
  if (err) throw err;
  // potrace writes absolute M, C and L commands and Z: read each with its numbers
  const cmds = [];
  for (const t of svg.match(/ d="([^"]+)"/)[1].match(/[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?/gi)) {
    if (/[MCLZ]/i.test(t)) cmds.push({ c: t.toUpperCase(), n: [] });
    else cmds.at(-1).n.push(parseFloat(t));
  }
  const xs = cmds.flatMap((k) => k.n.filter((_, i) => i % 2 === 0));
  const ys = cmds.flatMap((k) => k.n.filter((_, i) => i % 2 === 1));
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const s = HEIGHT / (Math.max(...ys) - minY);
  const num = (v) => String(+v.toFixed(1)).replace(/^(-?)0\./, '$1.');
  const d = cmds.map((k) => (k.c === 'Z' ? 'Z' : k.c + k.n.map((v, i) => num((v - (i % 2 ? minY : minX)) * s)).join(' '))).join('');
  const width = +((Math.max(...xs) - minX) * s).toFixed(1);
  writeFileSync(out, `/*
 * The wordmark: the OwnSect logo as one filled path, traced from the logo
 * itself (tools/brand/ownsect-logo.webp, by tools/wordmark.mjs). The logo is
 * glossy dark letters made for a light ground; this is their silhouette, so
 * it can take whatever colour the page around it has, in either theme, at
 * any size. The counters of the O and the e are holes (even-odd).
 */
export const WORDMARK = {
  viewBox: '0 0 ${width} ${HEIGHT}',
  /** width over height, for laying it out before it draws */
  ratio: ${(width / HEIGHT).toFixed(4)},
  path: '${d}',
} as const;
`);
  console.log(`wrote ${out.pathname}: ${width} by ${HEIGHT}, ${d.length} characters`);
});
