import { getCollection, type CollectionEntry } from 'astro:content';

export type WorkEntry = CollectionEntry<'work'>;

/**
 * Case studies for listings and routes, newest first. Drafts appear in dev so
 * the templates can be worked on, and never in a production build.
 */
export async function getWork(): Promise<WorkEntry[]> {
  const entries = await getCollection('work', ({ data }) => !import.meta.env.PROD || !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Whether any case study is published. The home page's featured section and
 * the header's Work link both depend on this, so they cannot disagree. In dev
 * drafts count (as in getWork), so the templates stay visible while being
 * worked on; in production only non-draft entries do. /work/ always builds.
 */
export async function hasPublishedWork(): Promise<boolean> {
  return (await getWork()).length > 0;
}

/**
 * One case study by id, if it is published (in dev, drafts count, as in
 * getWork). A link to a case study should be rendered only when this returns
 * an entry, so it can never point at a page that was left out of the build.
 */
export async function getPublishedWork(id: string): Promise<WorkEntry | undefined> {
  return (await getWork()).find((entry) => entry.id === id);
}
