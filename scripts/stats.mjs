// Refreshes src/data/activity.json, the weekly activity behind the chart.
// Run it yourself before a deploy: `npm run stats`. It uses your `gh` login,
// makes read-only GitHub queries, and is the only script here that needs a
// network. The build and `npm run check` never call it.
//
// Two metrics are possible:
//
//   contributions   the contribution calendar (GraphQL). It only counts work
//                   GitHub attributes to the account. Private-repository work
//                   is left out when the account does not show private
//                   contributions, or when the commit email is not linked.
//   pull-requests   pull requests opened per week, counted with GitHub search
//                   across every repository the login can see.
//
// By default the script asks both, and uses the calendar only if its pull
// request total is within reach of the search count (a calendar that has missed
// most of the work would show a misleading flat line). Otherwise it uses pull
// requests. Force one with `--metric contributions` or `--metric pull-requests`.
// What it found is printed, so the choice is never silent.
//
// Only dates and relative levels are written. Each week becomes a whole number
// from 0 to 100, scaled so the busiest week is 100, because the repository is
// public and the chart shows shape only (confidentiality.md). The raw counts
// are printed to the terminal for the person running this and never written to
// disk. No repository, organisation, title, URL or other text from GitHub
// reaches the file either, and the data guard in scripts/check.mjs fails the
// build if anything else turns up there.
//
// Weeks start on Monday and are whole weeks: the first is the first Monday on
// or after START, and the week in progress is left out, because a part-week
// would read as a dip.
import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const run = promisify(execFile);

const LOGIN = 'BradDoesCode';
const START = '2025-06-01';
const OUT = new URL('../src/data/activity.json', import.meta.url);
// GitHub's search API allows 30 requests a minute.
const SEARCH_GAP_MS = 2200;
const DAY = 86_400_000;

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const parse = (date) => Date.parse(`${date}T00:00:00Z`);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function mondayOnOrAfter(date) {
  const ms = parse(date);
  const day = new Date(ms).getUTCDay(); // 0 is Sunday
  return iso(ms + ((8 - day) % 7) * DAY);
}

function mondayOnOrBefore(date) {
  const ms = parse(date);
  const day = new Date(ms).getUTCDay();
  return iso(ms - ((day + 6) % 7) * DAY);
}

async function gh(args, attempts = 4) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const { stdout } = await run('gh', args, { maxBuffer: 32 * 1024 * 1024 });
      return stdout.trim();
    } catch (error) {
      if (attempt >= attempts) {
        throw new Error(`gh ${args[0]} failed: ${String(error.stderr || error.message).split('\n')[0]}`);
      }
      await sleep(attempt * 8000);
    }
  }
}

// Whole weeks from `first`, stopping before the week still in progress.
function weekStarts(first, today) {
  const starts = [];
  for (let ms = parse(first); ms + 7 * DAY <= parse(today); ms += 7 * DAY) {
    starts.push(iso(ms));
  }
  return starts;
}

async function calendarWeeks(from, to, starts) {
  const totals = { total: 0, commits: 0, pullRequests: 0, restricted: 0 };
  const byWeek = new Map(starts.map((week) => [week, 0]));
  // GraphQL accepts at most one year per query.
  for (let start = parse(from); start < parse(to) + DAY; start += 364 * DAY) {
    const end = Math.min(start + 364 * DAY - 1, parse(to) + DAY - 1);
    const query = `query { user(login: "${LOGIN}") { contributionsCollection(from: "${new Date(start).toISOString()}", to: "${new Date(end).toISOString()}") {
      totalCommitContributions totalPullRequestContributions restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`;
    const result = JSON.parse(await gh(['api', 'graphql', '-f', `query=${query}`]));
    const c = result.data.user.contributionsCollection;
    totals.total += c.contributionCalendar.totalContributions;
    totals.commits += c.totalCommitContributions;
    totals.pullRequests += c.totalPullRequestContributions;
    totals.restricted += c.restrictedContributionsCount;
    for (const week of c.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        const monday = mondayOnOrBefore(day.date);
        if (byWeek.has(monday)) byWeek.set(monday, byWeek.get(monday) + day.contributionCount);
      }
    }
  }
  return { totals, weeks: starts.map((week) => ({ week, count: byWeek.get(week) })) };
}

async function searchCount(from, to) {
  const out = await gh([
    'api', '-X', 'GET', 'search/issues',
    '-f', `q=author:${LOGIN} type:pr created:${from}..${to}`,
    '-f', 'per_page=1',
    '-q', '.total_count',
  ]);
  const count = Number.parseInt(out, 10);
  if (!Number.isInteger(count) || count < 0) throw new Error('unexpected search response');
  return count;
}

async function pullRequestWeeks(starts) {
  const weeks = [];
  for (const week of starts) {
    weeks.push({ week, count: await searchCount(week, iso(parse(week) + 6 * DAY)) });
    await sleep(SEARCH_GAP_MS);
  }
  return weeks;
}

async function main() {
  const flag = process.argv.indexOf('--metric');
  const forced = flag > -1 ? process.argv[flag + 1] : undefined;
  if (forced && !['contributions', 'pull-requests'].includes(forced)) {
    throw new Error('--metric must be "contributions" or "pull-requests"');
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = mondayOnOrAfter(START);
  const starts = weekStarts(from, today);
  const to = iso(parse(starts.at(-1)) + 6 * DAY);
  console.log(`Weeks: ${starts.length}, from ${from} to ${to} (Monday to Sunday, whole weeks only)`);

  const calendar = await calendarWeeks(from, to, starts);
  const prTotal = await searchCount(from, to);
  console.log(
    `Calendar: ${calendar.totals.total} contributions (${calendar.totals.commits} commits, ` +
      `${calendar.totals.pullRequests} pull requests, ${calendar.totals.restricted} restricted)`,
  );
  console.log(`Search: ${prTotal} pull requests opened`);

  const calendarLooksReal = calendar.totals.pullRequests >= prTotal * 0.8;
  const metric = forced ?? (calendarLooksReal ? 'contributions' : 'pull-requests');
  console.log(`Using: ${metric}${forced ? ' (forced)' : calendarLooksReal ? '' : ' (the calendar does not reflect the work)'}`);

  const raw = metric === 'contributions' ? calendar.weeks : await pullRequestWeeks(starts);
  const sum = raw.reduce((total, w) => total + w.count, 0);
  const max = Math.max(...raw.map((w) => w.count), 0);
  if (metric === 'pull-requests' && sum !== prTotal) {
    console.log(`Note: weekly counts add to ${sum}, the whole-period search said ${prTotal}. A pull request may have been opened while this ran.`);
  }

  // Raw totals: terminal only.
  const changeMonth = '2026-04';
  const month = (week) => iso(parse(week) + 3 * DAY).slice(0, 7);
  const before = raw.filter((w) => month(w.week) < changeMonth);
  const after = raw.filter((w) => month(w.week) >= changeMonth);
  const total = (list) => list.reduce((t, w) => t + w.count, 0);
  console.log(`Raw totals (not written anywhere): ${sum} in all, busiest week ${max}`);
  console.log(`  before April 2026: ${total(before)} over ${before.length} weeks`);
  console.log(`  from April 2026:   ${total(after)} over ${after.length} weeks`);

  const weeks = raw.map(({ week, count }) => ({ week, level: max === 0 ? 0 : Math.round((count / max) * 100) }));
  const data = { generatedAt: today, metric, from, weeks };
  await writeFile(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote src/data/activity.json (${weeks.length} weeks, relative levels 0 to 100)`);
}

main().catch((error) => {
  console.error(`stats failed: ${error.message}`);
  process.exit(1);
});
