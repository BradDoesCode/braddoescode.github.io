// The single local gate (`npm run check`). Runs fully offline once installed.
//
// Stages, in order:
//   1. astro check        types, Astro diagnostics
//   2. astro build        static build into dist/
//   3. output assertions  .nojekyll, CSP meta on every page, no inline
//                         script/style, no third-party runtime resources,
//                         no draft markers (UNVERIFIED, Source: comments),
//                         and the activity data holds only dates and relative levels
//   4. html-validate      HTML validity of every built page
//   5. linkinator         internal links and fragments, against a local server
//   6. pa11y-ci           WCAG 2.2 AA via axe and HTML_CodeSniffer, in light
//                         and dark colour schemes
//
// After the summary it also prints a warning (not a failure) for any CV entry
// flagged `needsUpdate` in src/data/cv.ts; see scripts/cv-flags.mjs.
//
// Exits non-zero if any stage fails. External links are listed but not
// followed, because the check must not need a network.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LinkChecker } from 'linkinator';
import { flaggedCvEntries, formatCvFlags } from './cv-flags.mjs';
import { startServer } from './serve.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const bin = (name) => join(root, 'node_modules', '.bin', name);

const results = [];
const out = (line = '') => process.stdout.write(line + '\n');

function banner(title) {
  out();
  out(`==> ${title}`);
}

function run(command, args) {
  return new Promise((done) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
    child.on('error', (error) => {
      out(`Could not start ${command}: ${error.message}`);
      done(1);
    });
    child.on('exit', (code, signal) => done(signal ? 1 : (code ?? 1)));
  });
}

async function stage(name, fn, { fatal = false } = {}) {
  banner(name);
  let ok = false;
  try {
    ok = (await fn()) === true;
  } catch (error) {
    out(`Stage threw: ${error?.stack ?? error}`);
  }
  results.push({ name, ok });
  out(ok ? `PASS: ${name}` : `FAIL: ${name}`);
  return ok || !fatal;
}

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      found.push(join(entry.parentPath, entry.name));
    }
  }
  return found.sort();
}

// URL path a page is served at, e.g. dist/work/index.html -> /work/
function pagePath(file) {
  const rel = '/' + relative(dist, file).split('\\').join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
}

const REQUIRED_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
];

// The activity chart is built from src/data/activity.json, which `npm run stats`
// writes from GitHub. It may hold dates, relative levels (whole numbers from 0 to 100, scaled to
// the busiest week, so no raw count is ever published) and one of two
// metric names, and nothing else: no repository or organisation names, titles,
// URLs or any other text from GitHub. Anything extra fails the build.
const ACTIVITY_METRICS = ['contributions', 'pull-requests'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function sameKeys(object, allowed) {
  const keys = Object.keys(object);
  return keys.length === allowed.length && allowed.every((key) => keys.includes(key));
}

async function activityProblems() {
  const problems = [];
  const file = 'src/data/activity.json';
  let data;
  try {
    data = JSON.parse(await readFile(join(root, file), 'utf8'));
  } catch (error) {
    return [`${file}: cannot be read as JSON (${error.message})`];
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return [`${file}: must be an object`];
  }
  if (!sameKeys(data, ['generatedAt', 'metric', 'from', 'weeks'])) {
    problems.push(`${file}: top-level keys must be exactly generatedAt, metric, from, weeks (found ${Object.keys(data).join(', ') || 'none'})`);
  }
  if (!isIsoDate(data.generatedAt)) problems.push(`${file}: generatedAt is not an ISO date`);
  if (!ACTIVITY_METRICS.includes(data.metric)) {
    problems.push(`${file}: metric must be one of ${ACTIVITY_METRICS.join(', ')}`);
  }
  if (!isIsoDate(data.from)) problems.push(`${file}: from is not an ISO date`);
  if (!Array.isArray(data.weeks) || data.weeks.length === 0) {
    problems.push(`${file}: weeks must be a non-empty array`);
    return problems;
  }
  let previous = '';
  data.weeks.forEach((entry, index) => {
    const where = `${file}: weeks[${index}]`;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      problems.push(`${where} must be an object`);
      return;
    }
    if (!sameKeys(entry, ['week', 'level'])) {
      problems.push(`${where} keys must be exactly week, level (found ${Object.keys(entry).join(', ') || 'none'})`);
    }
    if (!isIsoDate(entry.week)) {
      problems.push(`${where}.week is not an ISO date`);
    } else {
      if (new Date(`${entry.week}T00:00:00Z`).getUTCDay() !== 1) problems.push(`${where}.week is not a Monday`);
      if (entry.week <= previous) problems.push(`${where}.week is not after the one before`);
      previous = entry.week;
    }
    if (!Number.isInteger(entry.level) || entry.level < 0 || entry.level > 100) {
      problems.push(`${where}.level must be an integer from 0 to 100`);
    }
  });
  // Belt and braces: whatever the keys say, no string may be anything but a
  // date or a metric name.
  const strings = [];
  (function walk(value) {
    if (typeof value === 'string') strings.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  })(data);
  for (const text of strings) {
    if (!isIsoDate(text) && !ACTIVITY_METRICS.includes(text)) {
      problems.push(`${file}: contains a string that is not a date or a metric name`);
      break;
    }
  }
  return problems;
}

async function assertOutput() {
  const problems = [];
  const fail = (message) => problems.push(message);

  if (!existsSync(join(dist, '.nojekyll'))) {
    fail('dist/.nojekyll is missing (GitHub Pages would drop _astro/)');
  }
  for (const needed of ['404.html', 'robots.txt', 'sitemap-index.xml']) {
    if (!existsSync(join(dist, needed))) fail(`dist/${needed} is missing`);
  }

  const pages = await htmlFiles(dist);
  if (pages.length === 0) fail('dist contains no HTML pages');

  for (const file of pages) {
    const name = relative(root, file);
    const html = await readFile(file, 'utf8');

    const csp = html.match(
      /<meta\s[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/i,
    );
    if (!csp) {
      fail(`${name}: no Content-Security-Policy meta tag`);
    } else {
      for (const directive of REQUIRED_CSP) {
        if (!csp[0].includes(directive)) {
          fail(`${name}: CSP is missing "${directive}"`);
        }
      }
      if (/unsafe-inline|unsafe-eval/.test(csp[0])) {
        fail(`${name}: CSP allows unsafe-inline or unsafe-eval`);
      }
    }

    // Draft markers belong in source only. In .astro files they are JSX
    // comments ({/* UNVERIFIED: ask Brad */}), which the build drops; an HTML
    // comment would be published.
    if (/UNVERIFIED/.test(html)) fail(`${name}: contains an UNVERIFIED draft marker`);
    if (/<!--\s*Source:/i.test(html)) fail(`${name}: contains a "Source:" HTML comment`);

    // Anything the CSP above would block, or a third party would receive.
    if (/<script(?![^>]*\ssrc=)/i.test(html)) fail(`${name}: inline <script>`);
    if (/<style[\s>]/i.test(html)) fail(`${name}: inline <style>`);
    if (/\sstyle=["']/i.test(html)) fail(`${name}: inline style attribute`);
    if (/\son[a-z]+=["']/i.test(html)) fail(`${name}: inline event handler`);
    if (/<script[^>]*\ssrc=["']?(https?:)?\/\//i.test(html)) {
      fail(`${name}: third-party script`);
    }
    const foreignLinks = [...html.matchAll(/<link\s[^>]*>/gi)]
      .map((m) => m[0])
      .filter((tag) => /\shref=["']?(https?:)?\/\//i.test(tag))
      .filter((tag) => !/\srel=["']?(canonical|alternate|sitemap)/i.test(tag));
    for (const tag of foreignLinks) fail(`${name}: third-party <link>: ${tag}`);
    if (/<(img|iframe|video|audio|source)[^>]*\ssrc=["']?(https?:)?\/\//i.test(html)) {
      fail(`${name}: third-party embedded resource`);
    }

    // Every external <a> must be safe to follow.
    for (const [tag] of html.matchAll(/<a\s[^>]*>/gi)) {
      if (/\shref=["']?https?:\/\//i.test(tag)) {
        const rel = tag.match(/\srel=["']([^"']*)["']/i)?.[1] ?? '';
        if (!/\bnoopener\b/.test(rel) || !/\bnoreferrer\b/.test(rel)) {
          fail(`${name}: external link without rel="noopener noreferrer": ${tag}`);
        }
      }
    }
  }

  for (const entry of await readdir(dist, { recursive: true })) {
    if (/\.map$|(^|\/)\.env/.test(entry)) fail(`dist/${entry}: should not be published`);
  }

  // The CSS minifier folds animation-* longhands into the `animation`
  // shorthand, and Chrome drops a shorthand that contains a scroll or view
  // timeline, which silently turns scroll-driven animations off. Keep the
  // timeline in longhands (see src/styles/motion.css).
  for (const file of await readdir(dist, { recursive: true })) {
    if (!file.endsWith('.css')) continue;
    const css = await readFile(join(dist, file), 'utf8');
    for (const [, value] of css.matchAll(/(?<![\w-])animation\s*:\s*([^;}]*)/g)) {
      if (/\b(?:view|scroll)\(|(?:^|[\s,])--[\w-]+/.test(value)) {
        fail(`dist/${file}: animation shorthand contains a timeline, which browsers drop: "animation:${value}"`);
      }
    }
  }

  problems.push(...(await activityProblems()));

  for (const problem of problems) out(`  ${problem}`);
  if (!problems.length) out(`  ${pages.length} pages checked, activity data holds only dates and relative levels`);
  return problems.length === 0;
}

async function listExternalLinks() {
  const seen = new Set();
  for (const file of await htmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    for (const [, url] of html.matchAll(/<a\s(?:[^>]*\s)?href=["'](https?:\/\/[^"']+)["']/gi)) {
      seen.add(url);
    }
  }
  return [...seen].sort();
}

async function checkLinks(server) {
  const checker = new LinkChecker();
  const broken = [];
  let checked = 0;
  checker.on('link', (link) => {
    checked += 1;
    if (link.state === 'BROKEN') broken.push(link);
  });
  await checker.check({
    // 404.html is not linked from anywhere, so name it explicitly.
    path: [`${server.origin}/`, `${server.origin}/404.html`],
    recurse: true,
    checkFragments: true,
    // Offline gate: only links that resolve to the local server are followed.
    linksToSkip: async (link) => !link.startsWith(server.origin),
    timeout: 10_000,
  });
  for (const link of broken) {
    out(`  [${link.status}] ${link.url}  (found on ${link.parent})`);
  }
  out(`  ${checked} links checked, ${broken.length} broken`);
  const external = await listExternalLinks();
  out(`  ${external.length} external links not followed (offline gate):`);
  for (const url of external) out(`    ${url}`);
  return broken.length === 0;
}

async function accessibility(server) {
  const tmp = await mkdtemp(join(tmpdir(), 'pa11y-'));
  try {
    const urls = (await htmlFiles(dist)).map((f) => server.origin + pagePath(f));
    let allOk = true;
    for (const scheme of ['light', 'dark']) {
      const config = {
        defaults: {
          standard: 'WCAG2AA',
          runners: ['axe', 'htmlcs'],
          timeout: 60_000,
          chromeLaunchConfig: {
            // Blink's enum: 0 is dark, 1 is light.
            args: [`--blink-settings=preferredColorScheme=${scheme === 'dark' ? 0 : 1}`],
          },
        },
        urls,
      };
      const configPath = join(tmp, `pa11yci-${scheme}.json`);
      await writeFile(configPath, JSON.stringify(config));
      out(`  -- ${scheme} colour scheme, ${urls.length} pages`);
      const code = await run(bin('pa11y-ci'), ['--config', configPath]);
      if (code !== 0) allOk = false;
    }
    return allOk;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

async function main() {
  let go = await stage('astro check', async () => (await run(bin('astro'), ['check'])) === 0, { fatal: true });
  if (go) {
    go = await stage('astro build', async () => (await run(bin('astro'), ['build'])) === 0, { fatal: true });
  }
  if (go) {
    await stage('output assertions (.nojekyll, CSP, no inline code or third parties)', assertOutput);
    await stage('html-validate', async () => (await run(bin('html-validate'), ['dist'])) === 0);
    const server = await startServer(dist);
    try {
      await stage('internal links (linkinator)', () => checkLinks(server));
      await stage('accessibility (pa11y-ci)', () => accessibility(server));
    } finally {
      await server.close();
    }
  }

  banner('Summary');
  for (const { name, ok } of results) out(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  const skipped = go ? 0 : 1;
  if (skipped) out('  Later stages were skipped because a build stage failed.');
  const failed = results.some((r) => !r.ok) || skipped;
  out(failed ? '\nnpm run check: FAILED' : '\nnpm run check: all stages passed');

  // A warning only: it never changes the exit code. Printed last so it is the
  // last thing on screen.
  try {
    const warning = formatCvFlags(await flaggedCvEntries());
    if (warning.length) {
      out();
      out('!'.repeat(72));
      for (const line of warning) out(line);
      out('!'.repeat(72));
    }
  } catch (error) {
    out(`\nCould not read CV flags: ${error?.message ?? error}`);
  }
  process.exit(failed ? 1 : 0);
}

main();
