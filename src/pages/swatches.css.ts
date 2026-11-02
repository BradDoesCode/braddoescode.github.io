// The live palette as custom properties for the swatches on /about-this-site/,
// written as a real stylesheet at build time so the strict CSP (style-src
// 'self', no style attributes) holds. The values come from tokens.css through
// src/lib/contrast.ts, so the swatches show the colours the site really uses.
import type { APIRoute } from 'astro';
import { COLOUR_TOKENS, readPalettes } from '../lib/contrast';

export const GET: APIRoute = () => {
  const palettes = readPalettes();
  const css = (['light', 'dark'] as const)
    .map(
      (mode) =>
        `.swatches--${mode} {\n${COLOUR_TOKENS.map((name) => `  --sw-${name}: ${palettes[mode][name]};`).join('\n')}\n}\n`,
    )
    .join('\n');
  return new Response(`/* Generated from src/styles/tokens.css */\n${css}`, {
    headers: { 'Content-Type': 'text/css; charset=utf-8' },
  });
};
