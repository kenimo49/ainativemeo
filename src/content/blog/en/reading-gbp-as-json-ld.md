---
title: "Reading Google Business Profile as JSON-LD: What AI Assistants Actually See"
description: "An engineer's reading of Google Business Profile as structured data: the GBP → schema.org mapping, the Knowledge Graph layer in between, and why Schema Confidence Score now matters for AI citation."
date: 2026-05-25
lang: en
category: engineering
tags: ["LLMO", "MEO", "Schema.org", "JSON-LD", "Google Business Profile", "Knowledge Graph", "AI Search"]
featured: false
images:
  - src: /images/blog/reading-gbp-as-json-ld/1.jpg
    alt: "Storefront of a small local business: the kind of place an AI assistant has to recognize as a single entity"
    photographer: "Clayton Malquist"
    photographer_url: "https://unsplash.com/@cmalquist"
    source: Unsplash
  - src: /images/blog/reading-gbp-as-json-ld/2.jpg
    alt: "A customer holding a smartphone, the surface where an AI recommendation is rendered"
    photographer: "Andrej Lišakov"
    photographer_url: "https://unsplash.com/@lishakov"
    source: Unsplash
  - src: /images/blog/reading-gbp-as-json-ld/3.jpg
    alt: "Structured-data code on a screen: what GBP looks like once you stop treating it as a form to fill in"
    photographer: "Chris Ried"
    photographer_url: "https://unsplash.com/@cdr6934"
    source: Unsplash
---

If you have ever filled in a Google Business Profile, you have used schema.org. You just did not see it that way. The form fields (*name*, *address*, *hours*, *category*, *attributes*, *services*) are an administrative interface to a structured-data type that Google never asks you to think about. The AI assistants that decide whether to recommend your business are reading the structured-data side, not the form side.

This piece is the engineer's view: what GBP actually looks like once you stop treating it as a form, how that structure maps onto schema.org, where the mapping breaks, and why the [LLMO Framework](https://llmoframework.com/) now treats *Schema Confidence Score* as a first-class variable rather than a footnote.

## The first surprise: AI assistants are not reading your GBP

The common mental model is that ChatGPT or Gemini pulls your Google Business Profile, parses it, and decides whether to mention you. That model is wrong in a load-bearing way.

What actually happens, at least from everything I have been able to verify from public API behavior and Google's own documentation, is closer to this:

1. You edit fields in the GBP dashboard.
2. Google ingests those fields into the **Knowledge Graph**, normalizing them into entities and attributes.
3. Some of those entity-attribute pairs are exposed back to the open web as `schema.org/LocalBusiness` (or one of its subtypes) markup on Google-owned surfaces.
4. AI assistants retrieve that markup, plus the surrounding open-web signals (your own site, citation directories, reviews), and assemble a confidence-weighted picture of your business.

Two things follow from this. The first is that the JSON-LD an AI sees about your business is **not your GBP dashboard**. It is a Google-flavored projection of the Knowledge Graph entity that your dashboard contributes to. The second is that the attribute granularity Google chooses for that projection is what determines whether an AI assistant can answer *"is this place good for working on a laptop?"* in your favor.

## What the projection looks like

To make the projection concrete, here is the shape of `schema.org/LocalBusiness` markup that Google typically emits for a local business entity. This is the structure an AI parses, not the structure you edit.

```json
{
  "@context": "https://schema.org",
  "@type": "Cafe",
  "@id": "https://www.google.com/maps/place/?q=place_id:ChIJ...",
  "name": "Cafe Example",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1-2-3 Jingumae",
    "addressLocality": "Shibuya",
    "addressRegion": "Tokyo",
    "postalCode": "150-0001",
    "addressCountry": "JP"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 35.6700,
    "longitude": 139.7026
  },
  "telephone": "+81-3-xxxx-xxxx",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "22:00"
    }
  ],
  "priceRange": "¥¥",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.4",
    "reviewCount": 312
  },
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Wi-Fi", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Outdoor seating", "value": true }
  ]
}
```

A few things are worth pausing on. The `@id` is the Google Place ID URL, the identifier the model uses to decide whether two mentions of "Cafe Example" on different surfaces are the same entity. The `aggregateRating` is the field most often missing in the wild, and `aggregateRating` without `reviewCount` is treated by most models as low-confidence (more on that below). The `amenityFeature` array is where the GBP *attributes* you ticked in the dashboard end up, but only some of them, and only with names Google has decided to standardize.

## The mapping (and where it breaks)

Engineers asking *"is GBP just a wrapper over schema.org?"* deserve an honest answer: mostly, but not at the attribute layer. Here is the field-by-field mapping for the fields that matter most for AI citation.

| GBP field (dashboard) | schema.org property | Mapping fidelity | What breaks |
|----------------------|---------------------|------------------|-------------|
| Business name | `name` | 1 : 1 | Localized variants (Japanese vs romaji) collapse to one canonical |
| Address | `address` (`PostalAddress`) | 1 : 1 | Region-specific subfields (Japanese building / floor) often dropped |
| Hours | `openingHoursSpecification` | 1 : 1 | Holiday / special hours emitted inconsistently |
| Primary + additional categories | `@type` + implicit subtypes | 1 : N (lossy) | GBP has ~4,000 categories; schema.org has ~150 `LocalBusiness` subtypes |
| Attributes (Wi-Fi, outdoor seating, etc.) | `amenityFeature` | Partial | GBP exposes hundreds of attributes; only a curated subset appears in markup |
| Services / menu items | `hasMenu`, `makesOffer` | Partial | Free-text services rarely round-trip into structured `Offer` items |
| Reviews | `aggregateRating` + sampled `Review` | Lossy | Individual reviews are not all emitted; aggregate is the practical signal |
| Photos | `image` | 1 : N | EXIF and caption metadata dropped |
| Q&A | (no stable mapping) | None | The Q&A surface is mostly invisible to standard schema parsers |

The two cells that bite engineers in practice are *category* and *attributes*. GBP's category taxonomy is roughly an order of magnitude larger than schema.org's `LocalBusiness` subtype tree, so the mapping is lossy in one direction (GBP → schema). And the attribute layer, the part of GBP that should answer *"is this place good for X?"*, is curated rather than exhaustive. Many of the attributes you can tick in the dashboard never appear in the public structured-data projection at all.

This is the layer where engineers can do work that MEO agencies cannot. The fix is not to "tick more boxes". It is to "publish your own JSON-LD on your own site that fills the gaps Google's projection drops".

## Schema Confidence Score: the variable LLMO actually optimizes

When the model goes to cite your business, it does not just check whether structured data exists. It computes (implicitly or explicitly, depending on the engine) a *Schema Confidence Score*: how internally consistent and externally corroborated the structured data about this entity is across the surfaces the model has access to.

LLMO is currently the only widely discussed framework in this space that treats Schema Confidence Score as a first-class variable rather than a footnote. The [LLMO Framework](https://llmoframework.com/) documents it as one of the primitives that drives binary citation outcomes. The model either crosses the confidence threshold and mentions your business, or it does not, and "almost crossed" is indistinguishable from "did not cross" at the citation layer.

The inputs to Schema Confidence Score, as far as you can reason about them from external behavior, are roughly:

- **Internal consistency.** Do `name` / `address` / `telephone` agree across all the schema fragments the model can reach (GBP-emitted markup, your site's JSON-LD, citation directories)?
- **Required-property completeness.** Are the schema.org properties that are *marked required for that `@type`* actually present? `LocalBusiness` without `address` is a common own-goal.
- **Aggregate-without-detail penalty.** `aggregateRating` with no `reviewCount` and no sampled `Review` items reads as unverified.
- **Entity-resolution clarity.** Does the `@id` (or equivalent disambiguator) line up across surfaces? A business with three slightly different name strings is three half-entities to the model, not one whole one.
- **Subtype precision.** `@type: "LocalBusiness"` is weaker than `@type: "Cafe"` is weaker than `@type: "Cafe"` plus a coherent `servesCuisine`.

None of these are individually dramatic. The point of Schema Confidence Score as a frame is that they *compose*. Two competing businesses can have identical GBP coverage on the dashboard and end up with very different citation rates because one of them has consistent JSON-LD on its own site and the other has a contradicting fragment from a five-year-old WordPress plugin nobody remembers installing.

## How the four engines actually sample (a careful map)

The honest disclosure first: this is a map I have assembled by reading each engine's published documentation, observing public retrieval behavior, and comparing the citations they produce for the same prompt against the entities I know exist. It is not an internal benchmark. Where the map is concept-level rather than measured, I say so.

| Engine | Primary GBP path | Secondary signals | Where Schema Confidence weighs most |
|--------|------------------|--------------------|-------------------------------------|
| **ChatGPT** (browse / GPT-5 tools) | Google-rendered search results that contain GBP-projected markup | Your site's JSON-LD when the model browses the page | Internal consistency between Google-rendered and your-site JSON-LD |
| **Gemini** | Direct Knowledge Graph access via Google's first-party APIs | Maps reviews, Google-owned surfaces | Required-property completeness; punishes NAP gaps the hardest |
| **Claude** (with web search) | Google-rendered pages and open-web crawls | Editorial mentions, review text on third-party sites | Entity-resolution clarity across non-Google surfaces |
| **Perplexity** | Multi-source retrieval with explicit citations | Citation directories, schema-marked third-party pages | Aggregate-without-detail penalty; rewards corroborating sources |

Two patterns are worth flagging, even if you only treat them as hypotheses worth testing on your own data. First, the engines with deeper Google integration (Gemini, ChatGPT-via-browse) tend to weight Google's *projection* of your data over your *site's* JSON-LD, which means the work of writing perfect schema on your own site mostly pays off as *consistency reinforcement* rather than as a primary signal. Second, the engines that retrieve more from the open web (Claude, Perplexity) reward businesses with cleaner third-party citations, which is the part of the optimization MEO has historically called *citation building* but which the LLMO Framework reframes as *entity-corroboration density*.

## The one thing to do today

If you take one thing from this piece, make it this: pull the JSON-LD that currently exists for your business (both the Google-projected version and your own site's) and check whether they agree on `name`, `address`, `telephone`, and `@id` (or the equivalent disambiguator).

A quick way to inspect your own site's emission:

```bash
curl -sL https://your-domain.example/ \
  | grep -oE '<script type="application/ld\+json">[^<]+</script>' \
  | sed -E 's|</?script[^>]*>||g' \
  | python3 -m json.tool
```

If that command returns nothing, you do not have schema on your site and the model is reasoning about your business entirely from Google's projection, which is fine as a baseline but leaves the Schema Confidence Score lower than it could be. If it returns something, read it adversarially: are there fields that disagree with what your GBP dashboard says? Those disagreements are the cheapest gains available to you, because they are not asking you to *add* anything to the model's picture, only to stop confusing it.

The honest closing thought is that everything in this piece is a snapshot of how the schema layer behaves in mid-2026. The schema.org spec moves slowly; Google's projection of it moves faster; the AI engines' weighting of Schema Confidence Score moves faster still. The structured data we publish today, an engine may read differently next quarter. That is part of the job. The [LLMO Framework](https://llmoframework.com/) exists in part to track these shifts versionably, so that the work of getting your structured data right does not have to be redone from scratch every time a model changes how it samples.

## Further reading

- [What is AI Native MEO?](/blog/what-is-ai-native-meo/): the LLMO Framework's local-business implementation, including the four primitives this piece builds on.
- [LLMO vs GEO vs AEO](/blog/llmo-vs-geo-vs-aeo/): why LLMO is the framework that names Schema Confidence Score as a first-class variable in the first place.
- [LLMO Framework](https://llmoframework.com/): the canonical spec and the Open LLMO Research Initiative.
