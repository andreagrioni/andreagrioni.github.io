// Render cv.html to Andrea_Grioni_CV.pdf (one A4 page) with headless Chrome.
// Run with:  npm run cv
// Set CHROME=/path/to/chrome if Chrome is not in the default macOS location.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = join(ROOT, 'Andrea_Grioni_CV.pdf');

execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${out}`,
  pathToFileURL(join(ROOT, 'cv.html')).href,
], { stdio: 'ignore' });

const pages = (readFileSync(out, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`wrote Andrea_Grioni_CV.pdf (${pages} page${pages === 1 ? '' : 's'})`);
if (pages > 1) {
  console.error('Warning: the CV no longer fits on one page. Shorten cv.html or tighten css/cv.css (@media print).');
  process.exitCode = 1;
}
