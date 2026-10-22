// Link-preview cards: one 1200x630 PNG per page, drawn at build time and
// written to dist/og/ by src/pages/og/[...slug].png.ts. Nothing runs in the
// browser. satori lays the card out and turns it into SVG, resvg rasterises it.
//
// The card says only what its page already says: the title, and the page's
// description (a case study's one-line summary). No logos, no images.
//
// The look follows the site's "Editorial" design in its light theme (a card
// has one look). The colours repeat the tokens in src/styles/tokens.css, which
// cannot be imported here because a card is drawn outside the CSS pipeline.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { siteName } from '../data/site';
import { OG_HEIGHT, OG_WIDTH } from './ogSize';

const COLOUR = {
  paper: '#f5f0e5', // --bg
  ink: '#1a1814', // --fg
  muted: '#5a5346', // --muted
  accent: '#9a2b1e', // --accent
  hairline: '#d3cab6', // --hairline
};

const MARGIN_X = 88;
const CONTENT_WIDTH = OG_WIDTH - MARGIN_X * 2;
// Vertical room for the title and the summary together, between the kicker
// above and the address below.
const BODY_HEIGHT = 316;
const SUMMARY_SIZE = 30;
const SUMMARY_LEADING = 1.42;
const SUMMARY_GAP = 30;
const TITLE_LEADING = 1.0;
const SUMMARY_MAX_LINES = 3;

const kicker = `${siteName} · Software developer`;
const address = new URL(import.meta.env.SITE ?? 'https://braddoescode.github.io').host;

// satori reads WOFF (not WOFF2). The static Fontsource packages ship .woff files.
// Read from the project root: once bundled, import.meta.url points into dist/.
const fontFile = (pkg: string, file: string) =>
  readFile(join(process.cwd(), 'node_modules', pkg, 'files', file));

let fonts: Promise<Parameters<typeof satori>[1]['fonts']> | undefined;
function loadFonts() {
  fonts ??= Promise.all([
    fontFile('@fontsource/cormorant-garamond', 'cormorant-garamond-latin-600-normal.woff'),
    fontFile('@fontsource/cormorant-garamond', 'cormorant-garamond-latin-600-italic.woff'),
    fontFile('@fontsource/newsreader', 'newsreader-latin-400-normal.woff'),
    fontFile('@fontsource/newsreader', 'newsreader-latin-500-normal.woff'),
  ]).then(([display, displayItalic, body, bodyMedium]) => [
    { name: 'Cormorant Garamond', data: display, weight: 600 as const, style: 'normal' as const },
    { name: 'Cormorant Garamond', data: displayItalic, weight: 600 as const, style: 'italic' as const },
    { name: 'Newsreader', data: body, weight: 400 as const, style: 'normal' as const },
    { name: 'Newsreader', data: bodyMedium, weight: 500 as const, style: 'normal' as const },
  ]);
  return fonts;
}

/** How many lines `text` takes when wrapped greedily, given an average glyph width in ems. */
function countLines(text: string, size: number, emPerChar: number, width: number): number {
  const maxChars = width / (size * emPerChar);
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/)) {
    const need = used === 0 ? word.length : used + 1 + word.length;
    if (need <= maxChars || used === 0) {
      used = need;
    } else {
      lines += 1;
      used = word.length;
    }
  }
  return lines;
}

/**
 * Cut `text` to at most `limit` characters at a word boundary, and add an
 * ellipsis only when something was dropped. Never leaves a dangling comma,
 * dash or a one-letter word at the end.
 */
export function truncate(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  let cut = clean.slice(0, limit + 1);
  cut = cut.slice(0, Math.max(cut.lastIndexOf(' '), 0));
  // Drop dangling punctuation, one-letter words and joining words, so the text
  // never stops on "and" or "the".
  const dangling = /[\s,;:–—-]+$|\s+(?:\S|and|or|but|the|an|of|to|in|on|at|for|with|so|as|by|from)$/i;
  while (dangling.test(cut)) cut = cut.replace(dangling, '');
  return `${cut.replace(/[.!?]+$/, '')}…`;
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children },
});

export interface Card {
  /** The page title; for the home page, the name. */
  title: string;
  /** The page description or, for a case study, its summary. */
  summary: string;
  /** Set the last word of the title on its own line in italic, as the home hero does. */
  stacked?: boolean;
}

/** Choose the title size and the summary text so that both fit the card. */
function fit(card: Card) {
  const summary = truncate(card.summary, 160);
  const summaryLines = Math.min(
    SUMMARY_MAX_LINES,
    countLines(summary, SUMMARY_SIZE, 0.5, CONTENT_WIDTH),
  );
  const summaryHeight = summaryLines * SUMMARY_SIZE * SUMMARY_LEADING + SUMMARY_GAP;
  const words = card.title.split(' ');
  const lineOf = (size: number) =>
    card.stacked && words.length > 1
      ? 2
      : countLines(card.title, size, 0.41, CONTENT_WIDTH);
  for (let size = card.stacked ? 128 : 112; size >= 60; size -= 4) {
    const lines = lineOf(size);
    // Two lines are the goal. A third is allowed only once the type is smaller.
    const allowed = size >= 88 ? 2 : 3;
    if (lines <= allowed && lines * size * TITLE_LEADING + summaryHeight <= BODY_HEIGHT) {
      return { size, summary };
    }
  }
  return { size: 60, summary };
}

function tree(card: Card, size: number, summary: string): Node {
  const words = card.title.split(' ');
  const last = card.stacked && words.length > 1 ? words.pop() : undefined;
  const titleStyle = {
    fontFamily: 'Cormorant Garamond',
    fontWeight: 600,
    fontSize: size,
    lineHeight: TITLE_LEADING,
    letterSpacing: '-0.012em',
    // Even line lengths, and never a one-letter word ("I", "a") stranded at a line end.
    textWrap: 'balance',
    color: COLOUR.ink,
  };
  const title = last
    ? h('div', { ...titleStyle, flexDirection: 'column' }, [
        h('div', {}, words.join(' ')),
        h('div', { fontStyle: 'italic', color: COLOUR.accent }, last),
      ])
    : h('div', titleStyle, card.title.replace(/(^|\s)(\S)\s/g, '$1$2 '));

  return h(
    'div',
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      boxSizing: 'border-box',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: `64px ${MARGIN_X}px 56px`,
      backgroundColor: COLOUR.paper,
    },
    [
      // Top: the accent rule, then the kicker.
      h('div', { flexDirection: 'column' }, [
        h('div', { width: 96, height: 5, backgroundColor: COLOUR.accent }),
        h(
          'div',
          {
            marginTop: 28,
            fontFamily: 'Newsreader',
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: COLOUR.muted,
          },
          kicker,
        ),
      ]),
      // Middle: the title, then the summary.
      h('div', { flexDirection: 'column', height: BODY_HEIGHT, justifyContent: 'flex-start' }, [
        title,
        h(
          'div',
          {
            marginTop: SUMMARY_GAP,
            fontFamily: 'Newsreader',
            fontWeight: 400,
            fontSize: SUMMARY_SIZE,
            lineHeight: SUMMARY_LEADING,
            color: COLOUR.muted,
            maxWidth: CONTENT_WIDTH,
            lineClamp: SUMMARY_MAX_LINES,
          },
          summary,
        ),
      ]),
      // Bottom: a hairline and the site address.
      h('div', { flexDirection: 'column' }, [
        h('div', { height: 1, backgroundColor: COLOUR.hairline }),
        h(
          'div',
          {
            marginTop: 20,
            fontFamily: 'Newsreader',
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: '0.06em',
            color: COLOUR.muted,
          },
          address,
        ),
      ]),
    ],
  );
}

/** Draw one card and return it as PNG bytes. */
export async function renderCard(card: Card): Promise<Uint8Array> {
  const { size, summary } = fit(card);
  const svg = await satori(tree(card, size, summary) as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
