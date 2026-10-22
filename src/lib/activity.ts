// Turns src/data/activity.json (written by `npm run stats`) into the shapes the
// activity chart draws. Everything here runs at build time; the page ships only
// the finished SVG.
//
// The data holds relative levels, not counts: each week is a whole number from
// 0 to 100, scaled so the busiest week is 100. The chart shows the shape of the
// activity and nothing more, so no count, axis value or average appears in the
// data, the markup or the text (see confidentiality.md).
import raw from '../data/activity.json';
import { formatDate } from './format';

export type Metric = 'contributions' | 'pull-requests';

export interface Week {
  /** The Monday the week starts, YYYY-MM-DD. */
  week: string;
  /** 0 to 100, relative to the busiest week. */
  level: number;
}

interface ActivityData {
  generatedAt: string;
  metric: Metric;
  from: string;
  weeks: Week[];
}

export const activity = raw as ActivityData;

/** The month the team began building with AI agents. */
export const CHANGE_MONTH = '2026-04';

const DAY = 86_400_000;
const parse = (date: string) => Date.parse(`${date}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** A week belongs to the month its Thursday falls in (the ISO convention). */
function monthOf(week: string): string {
  return iso(parse(week) + 3 * DAY).slice(0, 7);
}

export interface Bar {
  /** Weeks, or months for the phone layout. */
  value: number;
  /** True from April 2026. */
  after: boolean;
  /** "Jul 2025" and so on, set on the bars that carry a tick label. */
  tick?: string | undefined;
}

const monthName = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

function tickLabel(month: string, withYear: boolean): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  return (withYear ? monthYear : monthName).format(date);
}

const QUARTER_STARTS = ['01', '04', '07', '10'];

/**
 * One bar per week. A quarter's first week carries a tick label; the year is
 * written on the first tick and on each January.
 */
export function weeklyBars(everyOther = false): Bar[] {
  const seen = new Set<string>();
  let quarters = 0;
  return activity.weeks.map(({ week, level }) => {
    const month = monthOf(week);
    const isQuarter = QUARTER_STARTS.includes(month.slice(5)) && !seen.has(month);
    let tick: string | undefined;
    if (isQuarter) {
      seen.add(month);
      if (!everyOther || quarters % 2 === 0) {
        tick = tickLabel(month, seen.size === 1 || month.endsWith('-01'));
      }
      quarters += 1;
    }
    return { value: level, after: month >= CHANGE_MONTH, tick };
  });
}

/**
 * One bar per month, showing the average per week for the weeks in it, so a
 * five-week month does not look busier than a four-week one.
 */
export function monthlyBars(everyOther = false): Bar[] {
  const months = new Map<string, number[]>();
  for (const { week, level } of activity.weeks) {
    const month = monthOf(week);
    months.set(month, [...(months.get(month) ?? []), level]);
  }
  let quarters = 0;
  return [...months].map(([month, counts]) => {
    let tick: string | undefined;
    if (QUARTER_STARTS.includes(month.slice(5))) {
      if (!everyOther || quarters % 2 === 0) tick = tickLabel(month, quarters === 0 || month.endsWith('-01'));
      quarters += 1;
    }
    return { value: counts.reduce((a, b) => a + b, 0) / counts.length, after: month >= CHANGE_MONTH, tick };
  });
}

export interface Summary {
  metricLabel: string;
  period: string;
  /** The shape in words, with no figures. */
  sentence: string;
}

/**
 * The shape of the data, in words. These sentences state what the chart looked
 * like when the data was last refreshed (low and steady, a gradual rise from
 * April 2026, a sharp rise from August 2026, once usage limits were no longer a constraint), so read them again whenever
 * `npm run stats` brings in a different picture.
 */
export function summarise(): Summary {
  const { weeks, metric } = activity;
  const first = weeks[0]?.week ?? activity.from;
  const last = weeks.at(-1)?.week ?? activity.from;
  const period = `${formatDate(first)} to ${formatDate(iso(parse(last) + 6 * DAY))}`;
  const what = metric === 'pull-requests' ? 'Pull requests opened per week' : 'GitHub contributions per week';
  const sentence =
    `${what}, from ${period}, shown relative to the busiest week. ` +
    'Activity was low and steady from June 2025. It rose gradually from April 2026, when we started building with AI agents, ' +
    'and rose sharply from August 2026, once usage limits were no longer a constraint.';
  return { metricLabel: what, period, sentence };
}

// The drawing is unitless: the plot is `slots * SLOT` wide and 100 tall, and
// the SVG stretches it to whatever box the CSS gives it. Text is not drawn in
// the SVG at all. Axe cannot check the contrast of SVG text, so the labels are
// HTML, placed by CSS grid cells that line up with the bars.
const SLOT = 10;
const BAR = 7;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  after: boolean;
}

export interface Cell {
  /** A quarter's tick label, set on the bar it sits under. */
  tick: string | undefined;
  /** True on the first bar from April 2026, where the marker line goes. */
  marker: boolean;
}

export interface Geometry {
  viewWidth: number;
  rects: Rect[];
  /** One per bar, so HTML rows can share the plot's columns. */
  cells: Cell[];
}

const round = (n: number) => Math.round(n * 100) / 100;

export function layout(bars: Bar[]): Geometry {
  // Scaled so the tallest bar fills the plot. There is no axis, so no scale is
  // shown or implied.
  const top = Math.max(...bars.map((b) => b.value), 1);
  const firstAfter = bars.findIndex((b) => b.after);
  const rects: Rect[] = [];
  bars.forEach((bar, i) => {
    const h = (bar.value / top) * 100;
    if (h > 0) {
      rects.push({ x: i * SLOT + (SLOT - BAR) / 2, y: round(100 - h), w: BAR, h: round(h), after: bar.after });
    }
  });

  return {
    viewWidth: bars.length * SLOT,
    rects,
    cells: bars.map((bar, i) => ({ tick: bar.tick, marker: firstAfter > 0 && i === firstAfter })),
  };
}
