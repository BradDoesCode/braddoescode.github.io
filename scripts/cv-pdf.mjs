// Writes dist/cv/Bradley-Barbrook-CV.pdf, the CV as a downloadable PDF.
//
// It runs after `astro build` (see the `build` script and scripts/check.mjs)
// and prints the built /cv/ page through its own print stylesheet, so the PDF
// is made from the same data as the page and cannot drift from it. It contains
// no phone number, address or email, because the page has none. Runs offline.
// The PDF is a build output in dist/, which git ignores; it is never committed.
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCvPdf } from './cv-render.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const out = join(dist, 'cv', 'Bradley-Barbrook-CV.pdf');

try {
  await stat(join(dist, 'cv', 'index.html'));
} catch {
  console.error('cv-pdf: dist/cv/index.html is missing. Run `astro build` first.');
  process.exit(1);
}

try {
  const pdf = await renderCvPdf(dist);
  await mkdir(join(dist, 'cv'), { recursive: true });
  await writeFile(out, pdf);
  console.log(`cv-pdf: wrote dist/cv/Bradley-Barbrook-CV.pdf (${Math.round(pdf.length / 1024)} KB)`);
} catch (error) {
  console.error(`cv-pdf: could not make the CV PDF: ${error?.stack ?? error}`);
  process.exit(1);
}
