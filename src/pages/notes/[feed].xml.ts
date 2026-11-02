// The RSS feed, at /notes/rss.xml. Written by hand, so it needs no dependency.
// Each item carries the note's title, link, guid, date and description, not
// its full text. With no published note there is no feed: getStaticPaths
// returns nothing and the file is not built.
import type { APIRoute, GetStaticPaths } from 'astro';
import { siteName } from '../../data/site';
import { staticPages } from '../../data/pages';
import { getNotes } from '../../lib/notes';

export const getStaticPaths = (async () => {
  return (await getNotes()).length > 0 ? [{ params: { feed: 'rss' } }] : [];
}) satisfies GetStaticPaths;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://braddoescode.github.io');
  const entries = await getNotes();
  const home = new URL('/notes/', base).href;
  const feedUrl = new URL('/notes/rss.xml', base).href;
  const items = entries.map((entry) => {
    const link = new URL(`/notes/${entry.id}/`, base).href;
    return [
      '    <item>',
      `      <title>${escapeXml(entry.data.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${entry.data.date.toUTCString()}</pubDate>`,
      `      <description>${escapeXml(entry.data.description)}</description>`,
      '    </item>',
    ].join('\n');
  });
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(`Notes | ${siteName}`)}</title>`,
    `    <link>${escapeXml(home)}</link>`,
    `    <description>${escapeXml(staticPages.notes.description)}</description>`,
    '    <language>en-GB</language>',
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    `    <lastBuildDate>${entries[0]!.data.date.toUTCString()}</lastBuildDate>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
