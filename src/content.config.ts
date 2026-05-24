import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    lang: z.enum(['en', 'ja']),
    category: z.enum(['framework', 'engineering', 'comparison']).default('framework'),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    canonical_url: z.string().url().optional(),
    og_image: z.string().optional(),
    updated: z.date().optional(),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          photographer: z.string().optional(),
          photographer_url: z.string().url().optional(),
          source: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

export const collections = { blog };
