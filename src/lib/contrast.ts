// The site's palette and its contrast ratios, worked out from the real tokens.
//
// There is one source of truth for colour: src/styles/tokens.css. This file
// reads that file (the light `:root` block and the dark-mode block) and never
// repeats a hex value. The "Colour and readability" section of
// /about-this-site/ and the link-preview cards (src/lib/og.ts) both read from
// here, so neither can drift from what the CSS says.
//
// `assertPalette` throws if a text pair is under 4.5:1 or a UI pair under 3:1,
// in either mode. The about page calls it while it is built, so a colour change
// that falls short stops the build.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const COLOUR_TOKENS = ['bg', 'surface', 'fg', 'muted', 'accent', 'hairline', 'rule', 'border'] as const;
export type ColourToken = (typeof COLOUR_TOKENS)[number];
export type Palette = Record<ColourToken, string>;
export type Mode = 'light' | 'dark';

/** Role of each token, in the words the about page uses. */
export const TOKEN_ROLES: Record<ColourToken, string> = {
  bg: 'Page',
  surface: 'Card',
  fg: 'Text',
  muted: 'Muted text',
  accent: 'Accent',
  hairline: 'Hairline rule',
  rule: 'Section rule',
  border: 'Border and quiet bars',
};

const TOKENS_FILE = 'src/styles/tokens.css';

// Read from the project root: once bundled, import.meta.url points into dist/.
function readTokensCss(): string {
  return readFileSync(join(process.cwd(), TOKENS_FILE), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The body of the first rule whose selector starts at `start`, braces balanced. */
function block(css: string, start: number): string {
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`${TOKENS_FILE}: unbalanced braces`);
}

function colours(body: string): Partial<Palette> {
  const found: Partial<Palette> = {};
  for (const name of COLOUR_TOKENS) {
    const value = body.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1];
    if (value) found[name] = value.toLowerCase();
  }
  return found;
}

/** Light and dark palettes, parsed from src/styles/tokens.css. */
export function readPalettes(): Record<Mode, Palette> {
  const css = readTokensCss();
  const rootAt = css.search(/:root\s*\{/);
  const darkAt = css.search(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  if (rootAt < 0 || darkAt < 0) throw new Error(`${TOKENS_FILE}: cannot find the :root and dark-mode blocks`);
  const light = colours(block(css, rootAt));
  const dark = colours(block(css, darkAt));
  for (const [mode, palette] of [['light', light], ['dark', dark]] as const) {
    const missing = COLOUR_TOKENS.filter((name) => !palette[name]);
    if (missing.length) throw new Error(`${TOKENS_FILE}: ${mode} theme has no six-digit hex for ${missing.join(', ')}`);
  }
  return { light: light as Palette, dark: dark as Palette };
}

// ---------- WCAG 2.x contrast ----------

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const TEXT_MIN = 4.5;
export const UI_MIN = 3;

export interface Pair {
  label: string;
  use: string;
  /** The foreground colour: the text, or the bar. */
  a: ColourToken;
  /** What it sits on. */
  b: ColourToken;
  kind: 'text' | 'ui';
}

export const pairs: Pair[] = [
  { label: 'Text on page', use: 'Body text and link text', a: 'fg', b: 'bg', kind: 'text' },
  { label: 'Muted on page', use: 'Labels, years and tags', a: 'muted', b: 'bg', kind: 'text' },
  { label: 'Accent on page', use: 'Hover links and the big multiplier', a: 'accent', b: 'bg', kind: 'text' },
  { label: 'Text on card', use: 'Body text on a card', a: 'fg', b: 'surface', kind: 'text' },
  { label: 'Muted on card', use: 'Quiet text on a card', a: 'muted', b: 'surface', kind: 'text' },
  { label: 'Accent on card', use: 'Card labels', a: 'accent', b: 'surface', kind: 'text' },
  { label: 'Skip link', use: 'Page colour on a text-coloured button', a: 'bg', b: 'fg', kind: 'text' },
  { label: 'Accent bars', use: 'Chart bars from April, markers and rules', a: 'accent', b: 'bg', kind: 'ui' },
  { label: 'Quiet bars', use: 'Earlier chart bars and borders', a: 'border', b: 'bg', kind: 'ui' },
];

export interface Result extends Pair {
  ratio: number;
  need: number;
  pass: boolean;
}

export function evaluate(palette: Palette): Result[] {
  return pairs.map((pair) => {
    const ratio = contrast(palette[pair.a], palette[pair.b]);
    const need = pair.kind === 'text' ? TEXT_MIN : UI_MIN;
    return { ...pair, ratio, need, pass: ratio >= need };
  });
}

/** Contrast results for both modes, from the tokens as they are now. */
export function readResults(): { palettes: Record<Mode, Palette>; results: Record<Mode, Result[]> } {
  const palettes = readPalettes();
  return {
    palettes,
    results: { light: evaluate(palettes.light), dark: evaluate(palettes.dark) },
  };
}

/** Throws, naming every failing pair, if any pair is under its minimum in either mode. */
export function assertPalette(results: Record<Mode, Result[]>): void {
  const failures = (['light', 'dark'] as const).flatMap((mode) =>
    results[mode]
      .filter((r) => !r.pass)
      .map((r) => `${mode}: ${r.label} is ${r.ratio.toFixed(2)}:1, needs ${r.need}:1`),
  );
  if (failures.length) {
    throw new Error(`Colour contrast below the standard in ${TOKENS_FILE}:\n  ${failures.join('\n  ')}`);
  }
}
