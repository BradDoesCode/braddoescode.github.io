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
//                   (GraphQL, only `issueCount`, a few aliased searches per
//                   request) across every repository the login can see.
//
// By default the script asks both, and uses the calendar only if its pull
// request total is within reach of the search count (a calendar that has missed
// most of the work would show a misleading flat line). Otherwise it uses pull
// requests. Force one with `--metric contributions` or `--metric pull-requests`.
// What it found is printed, so the choice is never silent.
//
// Only dates, relative levels and three rounded multipliers are written. Each
// week becomes a whole number from 0 to 100, scaled so the busiest week is 100, because the repository is
// public and the chart shows shape only (confidentiality.md). The multipliers
// compare each period's average week with the average week before April 2026,
// rounded to whole numbers. The raw counts and averages are printed to the
// terminal for the person running this and never written to disk. No repository, organisation, title, URL or other text from GitHub
// reaches the file either, and the data guard in scripts/check.mjs fails the
// build if anything else turns up there.
//
// Weeks start on Monday and are whole weeks: the first is the first Monday on
// or after START, and the week in progress is left out, because a part-week
// would read as a dip.
//
// A failed request is retried at most twice, after a short wait. If it still
// fails the script stops with a non-zero exit and activity.json is left exactly
// as it was: the file is written only once everything has been fetched, and it
// is written to a temporary file and renamed into place.
import { execFile } from 'node:child_process';
import { rename, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const run = promisify(execFile);

const LOGIN = 'BradDoesCode';
const START = '2025-06-01';
const OUT = new URL('../src/data/activity.json', import.meta.url);
// How many weekly searches go into one GraphQL request. Each search takes about
// a second and a half on GitHub's side, a request that runs past about ten
// seconds fails with a 502, and one that comes close can return quiet zeros, so
// three keeps well clear.
const WEEKS_PER_REQUEST = 3;
// A failed request is retried twice, after these waits.
const RETRY_WAITS_MS = [5000, 15000];
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

// Runs `task`, and on failure tries again at most twice after a short wait.
async function withRetries(label, task) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      const message = String(error.stderr || error.message).split('\n')[0];
      if (attempt >= RETRY_WAITS_MS.length) throw new Error(`${label} failed: ${message}`);
      console.log(`${label} failed (${message}). Trying again in ${RETRY_WAITS_MS[attempt] / 1000} seconds.`);
      await sleep(RETRY_WAITS_MS[attempt]);
    }
  }
}

// One GraphQL request through the `gh` login. A response that carries errors
// counts as a failure: GitHub can answer a slow search with a quiet zero.
function graphql(query) {
  return withRetries('gh api graphql', async () => {
    const { stdout } = await run('gh', ['api', 'graphql', '-f', `query=${query}`], { maxBuffer: 32 * 1024 * 1024 });
    const result = JSON.parse(stdout);
    if (result.errors?.length) throw new Error(`GraphQL error: ${result.errors[0].message}`);
    return result;
  });
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
    const result = await graphql(query);
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

// Pull requests opened in each date range, counted with GitHub's GraphQL search.
// Each range is an aliased search field that selects only `issueCount`: no
// nodes, titles or repository names ever come back. Ranges go in chunks, so a
// few requests cover the whole period.
async function searchCounts(ranges) {
  const counts = [];
  for (let i = 0; i < ranges.length; i += WEEKS_PER_REQUEST) {
    const chunk = ranges.slice(i, i + WEEKS_PER_REQUEST);
    const fields = chunk
      .map(({ from, to }, n) => `r${n}: search(type: ISSUE, query: "author:${LOGIN} type:pr created:${from}..${to}") { issueCount }`)
      .join('\n');
    const result = await graphql(`query {\n${fields}\n}`);
    chunk.forEach((_, n) => {
      const count = result.data?.[`r${n}`]?.issueCount;
      if (!Number.isInteger(count) || count < 0) throw new Error('unexpected search response');
      counts.push(count);
    });
  }
  return counts;
}

// Weekly counts, each confirmed by a second, independent count. GitHub's search
// sometimes answers a slow query with a short or empty count and no error, and
// a whole-period count is just as open to it, so nothing is trusted on one
// answer. Two passes run side by side. A week the passes disagree on is asked
// for again, singly, and taken only if two answers match. Otherwise the script
// stops rather than write a wrong picture.
async function pullRequestWeeks(starts) {
  const range = (week) => ({ from: week, to: iso(parse(week) + 6 * DAY) });
  const [first, second] = await Promise.all([searchCounts(starts.map(range)), searchCounts(starts.map(range))]);
  const counts = [];
  for (let i = 0; i < starts.length; i += 1) {
    if (first[i] === second[i]) {
      counts.push(first[i]);
      continue;
    }
    const seen = [first[i], second[i]];
    for (let extra = 0; extra < 2; extra += 1) {
      seen.push((await searchCounts([range(starts[i])]))[0]);
      const agreed = seen.find((value, index) => seen.indexOf(value) !== index);
      if (agreed !== undefined) {
        counts[i] = agreed;
        break;
      }
    }
    if (counts[i] === undefined) throw new Error(`the searches for the week of ${starts[i]} would not agree`);
    console.log(`The week of ${starts[i]} needed a third look: the counts first disagreed.`);
  }
  return starts.map((week, i) => ({ week, count: counts[i] }));
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
  const [prTotal] = await searchCounts([{ from, to }]);
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

  // Rounded multipliers against the average week before April 2026. Only these
  // whole numbers are written (confidentiality.md); the averages behind them are
  // printed here and go nowhere else. A period with no weeks, or a baseline of
  // zero, gets no multiplier at all.
  const limitsMonth = '2026-08';
  const periods = {
    aprilToJuly: raw.filter((w) => month(w.week) >= changeMonth && month(w.week) < limitsMonth),
    fromAugust: raw.filter((w) => month(w.week) >= limitsMonth),
    fromApril: after,
  };
  const average = (list) => (list.length ? total(list) / list.length : 0);
  const baseline = average(before);
  console.log(`Averages per week (not written anywhere): before April 2026 ${baseline.toFixed(2)}`);
  const multipliers = {};
  for (const [name, list] of Object.entries(periods)) {
    const avg = average(list);
    console.log(`  ${name}: ${avg.toFixed(2)} over ${list.length} weeks`);
    if (baseline > 0 && list.length > 0) multipliers[name] = Math.max(1, Math.round(avg / baseline));
  }

  const weeks = raw.map(({ week, count }) => ({ week, level: max === 0 ? 0 : Math.round((count / max) * 100) }));
  const data = { generatedAt: today, metric, from, multipliers, weeks };
  const temp = new URL('../src/data/activity.json.tmp', import.meta.url);
  await writeFile(temp, JSON.stringify(data, null, 2) + '\n');
  await rename(temp, OUT);
  console.log(`Wrote src/data/activity.json (${weeks.length} weeks, relative levels 0 to 100)`);
}

main().catch((error) => {
  console.error(`stats failed: ${error.message}`);
  console.error('src/data/activity.json was not changed.');
  process.exit(1);
});
