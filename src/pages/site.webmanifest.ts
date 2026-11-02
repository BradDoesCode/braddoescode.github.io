// The web app manifest, written at build time so its colours come from the
// light tokens in src/styles/tokens.css (through src/lib/contrast.ts). It is
// here for the home-screen icon and name. `display: browser` keeps the site a
// website: it opens in the browser, not as an app.
import type { APIRoute } from 'astro';
import { siteName, siteShortName } from '../data/site';
import { readPalettes } from '../lib/contrast';
import { manifestIcons } from '../lib/icon';

export const GET: APIRoute = () => {
  const { bg } = readPalettes().light;
  const manifest = {
    name: siteName,
    short_name: siteShortName,
    lang: 'en-GB',
    start_url: '/',
    display: 'browser',
    background_color: bg,
    theme_color: bg,
    icons: Object.entries(manifestIcons).map(([name, { size, purpose }]) => ({
      src: `/icons/${name}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose,
    })),
  };
  return new Response(JSON.stringify(manifest, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
