// Link-preview cards, one PNG per page, built into dist/og/ as static files.
// See src/lib/og.ts for the drawing and src/lib/ogPath.ts for the paths.
import type { APIRoute, GetStaticPaths } from 'astro';
import { staticPages } from '../../data/pages';
import { siteName } from '../../data/site';
import { renderCard, type Card } from '../../lib/og';
import { getWork } from '../../lib/work';

export const getStaticPaths = (async () => {
  const cards: Record<string, Card> = {};
  for (const [slug, page] of Object.entries(staticPages)) {
    cards[slug] =
      slug === 'home'
        ? { title: siteName, summary: page.description, stacked: true }
        : { title: page.title, summary: page.description };
  }
  for (const entry of await getWork()) {
    cards[`work/${entry.id}`] = { title: entry.data.title, summary: entry.data.summary };
  }
  return Object.entries(cards).map(([slug, card]) => ({ params: { slug }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard(props.card as Card);
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
