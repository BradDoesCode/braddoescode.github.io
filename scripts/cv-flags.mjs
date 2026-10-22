// CV entries that carry a `needsUpdate` flag in src/data/cv.ts.
//
// Shared by `npm run check` (prints a warning) and the `pre-publish` and
// `update-cv` skills. Run it directly to list the flags:
//
//   node scripts/cv-flags.mjs
//
// It always exits 0. A flag is a warning here, and a blocker only in the
// `pre-publish` skill. cv.ts has no imports, so its types are stripped with
// the TypeScript compiler that is already installed, and the data file stays
// the single source.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

async function loadCv() {
  const source = await readFile(new URL('../src/data/cv.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const url = 'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64');
  return (await import(url)).cv;
}

export async function flaggedCvEntries() {
  const cv = await loadCv();
  const flagged = [];
  for (const [section, entries] of Object.entries(cv)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (entry && typeof entry === 'object' && entry.needsUpdate) {
        const who = [entry.title, entry.organisation].filter(Boolean).join(', ');
        flagged.push({ section, label: who || section, reason: entry.needsUpdate });
      }
    }
  }
  return flagged;
}

export function formatCvFlags(flagged) {
  if (flagged.length === 0) return [];
  return [
    `WARNING: ${flagged.length} CV ${flagged.length === 1 ? 'entry is' : 'entries are'} flagged needsUpdate in src/data/cv.ts.`,
    'The text may be out of date. Do not publish until Brad has confirmed new wording (pre-publish blocks on this).',
    ...flagged.map((f) => `  - ${f.section}: ${f.label}: ${f.reason}`),
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const lines = formatCvFlags(await flaggedCvEntries());
  console.log(lines.length ? lines.join('\n') : 'No CV entries are flagged needsUpdate.');
}
