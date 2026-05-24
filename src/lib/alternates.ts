import type { CollectionEntry } from 'astro:content';

export const SUPPORTED_LANGS = ['en', 'ja'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export interface Alternate {
  hreflang: string;
  href: string;
}

function urlForLang(lang: Lang, slug: string): string {
  return lang === 'en'
    ? `https://ainativemeo.com/blog/${slug}/`
    : `https://ainativemeo.com/${lang}/blog/${slug}/`;
}

export function blogAlternates(
  allPosts: CollectionEntry<'blog'>[],
  slug: string,
): Alternate[] {
  const available: Lang[] = SUPPORTED_LANGS.filter((lang) =>
    allPosts.some((p) => p.id === `${lang}/${slug}`),
  );

  if (available.length === 0) return [];

  const alternates: Alternate[] = available.map((lang) => ({
    hreflang: lang,
    href: urlForLang(lang, slug),
  }));

  const defaultLang: Lang = available.includes('en') ? 'en' : available[0];
  alternates.push({
    hreflang: 'x-default',
    href: urlForLang(defaultLang, slug),
  });

  return alternates;
}

export function staticAlternates(path: string): Alternate[] {
  const enHref = `https://ainativemeo.com${path}`;
  const jaPath = path === '/' ? '/ja/' : `/ja${path}`;
  const jaHref = `https://ainativemeo.com${jaPath}`;
  return [
    { hreflang: 'en', href: enHref },
    { hreflang: 'ja', href: jaHref },
    { hreflang: 'x-default', href: enHref },
  ];
}
