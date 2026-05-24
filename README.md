# AI Native MEO

**https://ainativemeo.com/**

The LLMO Framework's local-business implementation — written for the era when customers ask AI, not search engines, for recommendations.

## About

AI Native MEO documents the shift from traditional Map Engine Optimization (ranking on Google Maps) to AI-Native local search (being cited and recommended by ChatGPT, Gemini, Claude, and Perplexity). The site is built on the [LLMO Framework](https://llmoframework.com/) — the emerging standard for AI search optimization that subsumes earlier terms like AEO and GEO.

Unlike marketing-agency MEO blogs, AI Native MEO is written from the engineering layer: how Google Business Profile data flows into LLM training and retrieval, which JSON-LD schemas survive AI parsing, what each AI engine actually cites when asked for local recommendations, and how to structure a local business so it survives the next decade of search.

## Tech Stack

- **Framework**: Astro v6 + Tailwind CSS v4
- **Hosting**: GitHub Pages
- **Languages**: Bilingual (EN / JA)
- **LLMO**: JSON-LD structured data, sitemap, hreflang alternates

## Project Structure

```
ainativemeo/
├── src/
│   ├── content/blog/
│   │   ├── en/          # English articles
│   │   └── ja/          # Japanese articles
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   └── Nav.astro
│   └── pages/
│       ├── index.astro       # EN homepage
│       ├── about.astro       # EN about
│       └── ja/               # JA pages
├── public/
│   ├── favicon.svg
│   └── CNAME
└── astro.config.mjs
```

## Editorial Categories

| Category | Label (EN / JA) | Focus |
|----------|-----------------|-------|
| `framework` | Framework / フレームワーク | Core definitions, LLMO Framework alignment, the shape of AI Native MEO as a discipline |
| `engineering` | Engineering / エンジニアリング | JSON-LD, GBP structure, schema choices, how each AI engine parses local data |
| `comparison` | Comparison / 比較 | Cross-framework analysis (LLMO / GEO / AEO), tool comparisons, AI engine citation behavior |

These categories are not silos. A framework piece names the engineering primitives it depends on. A comparison piece grounds itself in working JSON-LD examples. An engineering piece always points back to the framework it implements.

## Editorial Stance

- **LLMO Framework as the standard**: every implementation choice is justified against the LLMO Framework, not against a marketing playbook.
- **Engineer perspective**: chemistry-of-search rather than "10 SEO hacks". If we cannot show the JSON, we do not claim the result.
- **No agency voice**: the site does not pretend to be a MEO consultancy or share fictional case studies. When real case studies exist, they will be cited with data.
- **Cross-framework literacy**: AEO and GEO are acknowledged where they apply; LLMO is positioned where it is most precise.

## Roadmap

- **Phase 0** (current): Foundation pages + cornerstone articles defining AI Native MEO and its LLMO Framework alignment.
- **Phase 1**: Weekly engineering deep-dives via the harness-ops PDCA cycle.
- **Phase 2**: First documented case study from a real testbed business.
- **Phase 3**: Industry overlay expansion (real estate, healthcare, education) as parallel LLMO Framework implementations.

## Development

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # build to ./dist/
npm run preview   # preview the production build
```

## Related

- [LLMO Framework](https://llmoframework.com/) — the upstream standard
- [kenimoto.dev](https://kenimoto.dev/) — author profile and book catalog
- Companion book (forthcoming): *AIに選ばれる店をつくる — 店舗オーナーのための AI Native MEO 入門*
