// Link-preview cards, one PNG per page, built into dist/og/ as static files.
// See src/lib/og.ts for the drawing and src/lib/ogPath.ts for the paths.
import type { APIRoute, GetStaticPaths } from 'astro';
import { staticPages } from '../../data/pages';
import { siteName } from '../../data/site';
import { renderCard, type Card } from '../../lib/og';
import { getNotes } from '../../lib/notes';
import { getWork } from '../../lib/work';

export const getStaticPaths = (async () => {
  const cards: Record<string, Card> = {};
  const notes = await getNotes();
  for (const [slug, page] of Object.entries(staticPages)) {
    // No card for a page that is not built: the Notes page exists only once a note is published.
    if (slug === 'notes' && notes.length === 0) continue;
    cards[slug] =
      slug === 'home'
        ? { title: siteName, summary: page.description, stacked: true }
        : { title: page.title, summary: page.description };
  }
  for (const entry of await getWork()) {
    cards[`work/${entry.id}`] = { title: entry.data.title, summary: entry.data.summary };
  }
  for (const entry of notes) {
    cards[`notes/${entry.id}`] = { title: entry.data.title, summary: entry.data.description };
  }
  return Object.entries(cards).map(([slug, card]) => ({ params: { slug }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard(props.card as Card);
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
