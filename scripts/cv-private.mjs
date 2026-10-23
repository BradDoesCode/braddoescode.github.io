// A private copy of the CV for direct job applications, with a phone number
// and email address on it. Brad runs this locally (`npm run cv:private`).
// The output goes to ~/Documents and is never published or committed.
//
// How it stays private:
//   - It is not part of `build`, `check` or `deploy`, and the public site and
//     the public PDF never contain these details.
//   - The details live in a file outside the repo and are added to the page
//     only in the headless browser, at print time. The built /cv/ page in
//     dist/ is not touched.
//   - It refuses to write its output, or read its config, anywhere inside the
//     repo (dist/ and public/ included).
//   - It does not overwrite a file it did not make.
//
// Paths (both can be overridden, which the tests use):
//   config  $CV_PRIVATE_CONFIG, else ~/.config/braddoescode/cv-private.json
//   output  $CV_PRIVATE_OUT,    else ~/Documents/Bradley Barbrook CV.pdf
//   record  cv-private.state.json beside the config: the hash of each file this
//           script wrote, so it can tell its own output from anyone else's.
//
// The config is { "phone": "...", "email": "..." }. Nothing in it is printed
// or logged.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCvPdf } from './cv-render.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const configPath = resolve(process.env.CV_PRIVATE_CONFIG || join(homedir(), '.config', 'braddoescode', 'cv-private.json'));
const outPath = resolve(process.env.CV_PRIVATE_OUT || join(homedir(), 'Documents', 'Bradley Barbrook CV.pdf'));
const statePath = join(dirname(configPath), 'cv-private.state.json');

function stop(message) {
  console.error(`cv-private: ${message}`);
  process.exit(1);
}

// Resolve a path through symlinks even when the file (or some of its folders)
// does not exist yet, by resolving the nearest folder that does.
async function realPathOf(target) {
  const tail = [];
  let current = resolve(target);
  while (!existsSync(current)) {
    tail.unshift(basename(current));
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return join(await realpath(current), ...tail);
}

async function isInsideRepo(target) {
  const repo = await realpath(root);
  const real = await realPathOf(target);
  return real === repo || real.startsWith(repo + sep);
}

async function readConfig() {
  if (await isInsideRepo(configPath)) {
    stop('the config file must live outside the repo, so it can never be committed.');
  }
  let text;
  try {
    text = await readFile(configPath, 'utf8');
  } catch {
    stop(
      `no config file found at ${configPath}\n` +
        'Create it (outside the repo) with this shape, using your own details:\n' +
        '  {\n    "phone": "01234 567890",\n    "email": "you@example.com"\n  }\n' +
        'To keep it somewhere else, set CV_PRIVATE_CONFIG to its path.',
    );
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    stop(`${configPath} is not valid JSON. Expected { "phone": "...", "email": "..." }.`);
  }
  const phone = typeof data?.phone === 'string' ? data.phone.trim() : '';
  const email = typeof data?.email === 'string' ? data.email.trim() : '';
  if (!/^\+?[\d\s().-]{7,20}$/.test(phone)) stop('"phone" in the config is missing or does not look like a phone number.');
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) stop('"email" in the config is missing or does not look like an email address.');
  return { phone, email };
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function readState() {
  try {
    return JSON.parse(await readFile(statePath, 'utf8'));
  } catch {
    return {};
  }
}

// Newest modification time under the given files and folders.
async function newestMtime(paths) {
  let newest = 0;
  async function visit(target) {
    let info;
    try {
      info = await stat(target);
    } catch {
      return;
    }
    if (info.isDirectory()) {
      for (const name of await readdir(target)) await visit(join(target, name));
    } else {
      newest = Math.max(newest, info.mtimeMs);
    }
  }
  for (const target of paths) await visit(target);
  return newest;
}

async function ensureBuilt() {
  const built = join(dist, 'cv', 'index.html');
  let stale = !existsSync(built);
  if (!stale) {
    const sources = ['src', 'public', 'package.json', 'astro.config.mjs', 'astro.config.ts'].map((p) => join(root, p));
    stale = (await newestMtime(sources)) > (await stat(built)).mtimeMs;
  }
  if (!stale) return;
  console.log('cv-private: dist/ is missing or older than the source, so building the site first.');
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) stop('the build failed, so there is nothing to print.');
}

async function main() {
  if (await isInsideRepo(outPath)) {
    stop('refusing to write the PDF inside the repo (this includes dist/ and public/). Choose a path outside it.');
  }
  const contact = await readConfig();

  // Do not overwrite a file this script did not make.
  const state = await readState();
  if (existsSync(outPath)) {
    const existing = sha256(await readFile(outPath));
    if (state[outPath] !== existing) {
      stop(
        `${outPath} already exists and was not made by this script (or has been changed since), so it was left alone.\n` +
          'Move or rename it, or set CV_PRIVATE_OUT to a different path, then run this again.',
      );
    }
  }

  await ensureBuilt();

  const pdf = await renderCvPdf(dist, async (page) => {
    // Added to the page in the browser only, with textContent, so nothing is
    // parsed as HTML. The built page on disk is unchanged.
    await page.evaluate(({ phone, email }) => {
      const line = document.querySelector('.cv__head .meta:not(.cv__updated)');
      if (!line) throw new Error('could not find the contact line on /cv/');
      const link = document.createElement('a');
      link.href = `mailto:${email}`;
      link.textContent = email;
      const number = document.createElement('span');
      number.textContent = phone;
      // After the location, before the GitHub and LinkedIn links.
      const firstSeparator = line.querySelector('span[aria-hidden="true"]');
      line.insertBefore(number, firstSeparator);
      line.insertBefore(link, firstSeparator);
    }, contact);
  });

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, pdf, { mode: 0o600 });
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify({ ...state, [outPath]: sha256(pdf) }, null, 2) + '\n');
  console.log(`cv-private: wrote ${outPath} (${Math.round(pdf.length / 1024)} KB). It is private: do not copy it into the repo.`);
}

main().catch((error) => stop(`could not make the private CV: ${error?.message ?? error}`));
