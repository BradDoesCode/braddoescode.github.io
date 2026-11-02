// `npm run lighthouse`: measures every built page with Lighthouse and writes
// src/data/lighthouse.json, which the "Privacy and performance" section of
// /about-this-site/ reads at build time.
//
// Needs a build first (`npm run build`). It serves dist/ on 127.0.0.1 with
// scripts/serve.mjs, drives the Chrome that puppeteer already downloaded, and
// runs Lighthouse twice per page: its default mobile settings, then its desktop
// preset. It is slow (a few minutes) and needs Chrome, so it is not part of
// `build`, `check` or `deploy`; run it before a deploy when the data is old.
//
// The committed file holds only the date, the Lighthouse version, the modes and
// four integer scores (0 to 100) per page and mode. The raw reports go to a
// folder outside the repo (LIGHTHOUSE_REPORTS, or a temporary folder), never in
// it. The 404 page is skipped: it is noindex on purpose, so its SEO score would
// only measure that.
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import puppeteer from 'puppeteer';
import { startServer } from './serve.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const dataFile = join(root, 'src', 'data', 'lighthouse.json');
const reports = resolve(process.env.LIGHTHOUSE_REPORTS ?? join(tmpdir(), 'braddoescode-lighthouse'));

if (reports === root || reports.startsWith(root + sep)) {
  console.error(`lighthouse: raw reports must go outside the repo, not to ${reports}`);
  process.exit(1);
}

const MODES = { mobile: undefined, desktop: desktopConfig };
const CATEGORIES = { performance: 'performance', accessibility: 'accessibility', bestPractices: 'best-practices', seo: 'seo' };

async function pagePaths() {
  const paths = [];
  for (const entry of await readdir(dist, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || entry.name !== 'index.html') continue;
    const rel = relative(dist, join(entry.parentPath, entry.name)).split(sep).join('/');
    paths.push(rel === 'index.html' ? '/' : `/${rel.slice(0, -'index.html'.length)}`);
  }
  if (paths.length === 0) throw new Error('dist/ holds no pages. Run `npm run build` first.');
  return paths.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
}

const slug = (path) => (path === '/' ? 'home' : path.replaceAll('/', '-').replace(/^-|-$/g, ''));

const paths = await pagePaths();
await mkdir(reports, { recursive: true });
const server = await startServer(dist);
const browser = await puppeteer.launch({ headless: true });
const port = Number(new URL(browser.wsEndpoint()).port);

const pages = {};
let version = '';
try {
  for (const path of paths) {
    pages[path] = {};
    for (const [mode, config] of Object.entries(MODES)) {
      const result = await lighthouse(
        server.origin + path,
        { port, output: 'json', logLevel: 'error', onlyCategories: Object.values(CATEGORIES) },
        config,
      );
      if (!result || result.lhr.runtimeError) {
        throw new Error(`${path} (${mode}): ${result?.lhr.runtimeError?.message ?? 'no result'}`);
      }
      const { lhr } = result;
      version = lhr.lighthouseVersion;
      const scores = {};
      for (const [key, id] of Object.entries(CATEGORIES)) {
        scores[key] = Math.round((lhr.categories[id].score ?? 0) * 100);
      }
      pages[path][mode] = scores;
      await writeFile(join(reports, `${slug(path)}-${mode}.json`), result.report);
      console.log(
        `${mode.padEnd(8)} ${path.padEnd(40)} perf ${scores.performance}  a11y ${scores.accessibility}  best ${scores.bestPractices}  seo ${scores.seo}`,
      );
    }
  }
} finally {
  await browser.close();
  await server.close();
}

const data = { measuredAt: new Date().toISOString().slice(0, 10), lighthouseVersion: version, modes: Object.keys(MODES), pages };
await writeFile(dataFile, JSON.stringify(data, null, 2) + '\n');
console.log(`\nlighthouse: wrote src/data/lighthouse.json (${paths.length} pages, ${Object.keys(MODES).length} modes). Raw reports: ${reports}`);
