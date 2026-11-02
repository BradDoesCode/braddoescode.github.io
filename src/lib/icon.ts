// Home-screen icons: the "B" mark from public/favicon.svg, drawn as flat PNGs
// at build time with resvg. They serve /apple-touch-icon.png (iOS) and the
// icons listed in /site.webmanifest (Android and others).
//
// The colours are the light tokens in src/styles/tokens.css, read through
// src/lib/contrast.ts. The icon is a full-bleed opaque square with no rounded
// corners: iOS rounds it itself and fills transparency with black, and
// Android's maskable icons are cropped by the launcher.
//
// MARK_PATH is the same path as in public/favicon.svg, which cannot import it:
// if the letter changes, change both.
import { Resvg } from '@resvg/resvg-js';
import { readPalettes } from './contrast';

/** The "B", drawn in a 32 by 32 box. Keep in step with public/favicon.svg. */
export const MARK_PATH =
  'M9 8h7.2c3 0 4.8 1.5 4.8 3.9 0 1.6-.8 2.7-2.2 3.3 1.8.5 2.9 1.8 2.9 3.7 0 2.7-2.1 4.1-5.2 4.1H9V8Zm3.2 2.7v3.4h3.5c1.3 0 2-.6 2-1.7s-.7-1.7-2-1.7h-3.5Zm0 6v3.8h3.8c1.4 0 2.2-.7 2.2-1.9s-.8-1.9-2.2-1.9h-3.8Z';

// The letter's height inside that 32 by 32 box (it is about 12.9 wide), and
// the point to centre it on.
const MARK_HEIGHT = 16;
const MARK_CENTRE = { x: 15.45, y: 16 };

export interface IconOptions {
  /** Pixel width and height. */
  size: number;
  /** How tall the letter is, as a share of the icon's height. */
  letter: number;
}

/**
 * Letter sizes. A plain icon can carry a big letter. A maskable icon is
 * cropped by the launcher, and what matters must sit inside a circle whose
 * radius is 40% of the icon's width (the "safe zone"). At 0.46 of the height
 * the letter's corners are about 0.30 of the width from the centre.
 */
export const LETTER = { plain: 0.54, maskable: 0.46 } as const;

/** The icons /site.webmanifest lists, by file name (without .png) under /icons/. */
export const manifestIcons: Record<string, IconOptions & { purpose: 'any' | 'maskable' }> = {
  'icon-192': { size: 192, letter: LETTER.plain, purpose: 'any' },
  'icon-512': { size: 512, letter: LETTER.plain, purpose: 'any' },
  'icon-maskable-512': { size: 512, letter: LETTER.maskable, purpose: 'maskable' },
};

export function iconSvg({ size, letter }: IconOptions): string {
  const scale = (size * letter) / MARK_HEIGHT;
  const { bg, accent } = readPalettes().light;
  const x = size / 2 - MARK_CENTRE.x * scale;
  const y = size / 2 - MARK_CENTRE.y * scale;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" fill="${accent}"/>`,
    `<path transform="translate(${x} ${y}) scale(${scale})" fill="${bg}" d="${MARK_PATH}"/>`,
    '</svg>',
  ].join('');
}

export function iconPng(options: IconOptions): Response {
  const png = new Resvg(iconSvg(options), { fitTo: { mode: 'original' } }).render().asPng();
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
}
