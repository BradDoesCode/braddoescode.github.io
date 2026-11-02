import { getCollection, type CollectionEntry } from 'astro:content';

export type NoteEntry = CollectionEntry<'notes'>;

/**
 * Notes for listings, routes and the feed, newest first. Drafts appear in
 * dev so a note can be worked on, and never in a production build.
 */
export async function getNotes(): Promise<NoteEntry[]> {
  const entries = await getCollection('notes', ({ data }) => !import.meta.env.PROD || !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Whether any note is published. The Notes page, its feed, its link-preview
 * card, the header's Notes link and the feed link in the page head all depend
 * on this, so they cannot disagree. With none, a production build outputs
 * nothing about notes at all. In dev drafts count, as in getNotes.
 */
export async function hasPublishedNotes(): Promise<boolean> {
  return (await getNotes()).length > 0;
}
