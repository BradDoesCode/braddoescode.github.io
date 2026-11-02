import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Case studies. Front matter follows the write-case-study skill.
const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    /** One plain sentence for the listing page. */
    summary: z.string(),
    date: z.coerce.date(),
    /** The years the work was done, shown in listings instead of the publish
     *  year, for example "2022–2025". Falls back to the year of `date`. */
    years: z.string().optional(),
    /** Position in listings, lowest first. Entries without one come after, newest first. */
    order: z.number().optional(),
    /** What Brad did, in a few words. */
    role: z.string(),
    tech: z.array(z.string()).default([]),
    /** Drafts are visible in dev and left out of production builds. */
    draft: z.boolean().default(false),
  }),
});

// Notes: occasional short posts. Front matter follows the write-note skill.
// MDX only: Astro applies the `components` map (MarkdownLink, which makes
// external links safe) to MDX, not to plain Markdown.
const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    /** One plain sentence: used in the listing, the meta description, the feed and the link-preview card. */
    description: z.string(),
    date: z.coerce.date(),
    /** Set when a published note is changed in a way a reader should know about. */
    updated: z.coerce.date().optional(),
    /** Drafts are visible in dev and left out of production builds. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, notes };
