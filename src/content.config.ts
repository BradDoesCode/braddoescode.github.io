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
    /** What Brad did, in a few words. */
    role: z.string(),
    tech: z.array(z.string()).default([]),
    /** Drafts are visible in dev and left out of production builds. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { work };
