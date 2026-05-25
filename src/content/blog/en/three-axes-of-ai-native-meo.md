---
title: "The Three Axes of AI Native MEO: Structure, Confidence, and Provenance"
description: "AI Native MEO is not one optimization problem but three: Structure (is your data machine-extractable?), Confidence (does the model trust it?), and Provenance (where did the model learn it from?). A taxonomy piece from the LLMO Framework's local-business implementation."
date: 2026-05-25
lang: en
category: framework
tags: ["LLMO", "MEO", "Framework", "AI Search", "Schema Confidence", "Citation Graph", "JSON-LD"]
featured: false
images:
  - src: /images/blog/three-axes-of-ai-native-meo/1.jpg
    alt: "A small storefront at night, the kind of entity an AI assistant has to compress into a schema record"
    photographer: "Yuya Yoshioka"
    photographer_url: "https://unsplash.com/@superyuyakun"
    source: Unsplash
  - src: /images/blog/three-axes-of-ai-native-meo/2.jpg
    alt: "A person on the street, smartphone in hand: the surface where a local AI recommendation actually lands"
    photographer: "chatnarin pramnapan"
    photographer_url: "https://unsplash.com/@chatnarin"
    source: Unsplash
  - src: /images/blog/three-axes-of-ai-native-meo/3.jpg
    alt: "Lines and nodes on a blue field: three independent variables, one entity"
    photographer: "Conny Schneider"
    photographer_url: "https://unsplash.com/@choys_"
    source: Unsplash
---

When engineers first sit down with AI Native MEO, the single most common mistake I see is treating it as one optimization problem. It is not. It is three, and they are independent enough that doing well on one of them gets you almost nothing if you fail on the other two. The reason the practice looks chaotic from the outside is that practitioners keep collapsing the three into a single bucket called "AI optimization", and then arguing about which tactic works without naming which axis the tactic is on.

This piece is the taxonomy. The three axes are **Structure**, **Confidence**, and **Provenance**. I am going to define each one, show where the existing AI Native MEO literature has been quietly addressing it without naming it, and end with the unflattering observation that the only framework currently treating these three as independent variables is LLMO. That is both a strength and the source of a specific limitation I will get to.

## Axis 1 — Structure

Structure is the easy one to explain and the easy one to mistake for the whole problem. *Is your business's data extractable as schema?* `schema.org/LocalBusiness`, JSON-LD, `Place` types in the Google Knowledge Graph, the curated subset of GBP attributes that Google projects back into public markup. This is the structural layer. When the layer is healthy, an AI assistant can answer *"what cuisine does this restaurant serve?"* by pulling a field, not by interpreting prose.

The structural axis is the one most existing MEO work has been doing all along, even before anyone called it AI Native. Filling in GBP fields, adding `OpeningHoursSpecification` to your site, getting `aggregateRating` right. All of this is structural work. The trap is that structure is *necessary and insufficient*. A perfectly structured listing that no engine trusts will not get cited, and a perfectly structured listing that no third-party surface corroborates will not get cited either. The structural axis only earns its keep when the other two are also healthy.

I have written about the GBP-to-schema mapping in detail in [Reading Google Business Profile as JSON-LD](/blog/reading-gbp-as-json-ld/). That piece is, in this taxonomy, the deep treatment of axis 1.

## Axis 2 — Confidence

Confidence is the axis that the MEO industry has been the most blind to, and the one the LLMO Framework was specifically built to formalize. The question on this axis is not *"does structured data exist?"* but *"does the model trust the structured data enough to use it in a citation?"*

These are different questions, and they have different answers for the same entity at the same moment. The [LLMO Framework](https://llmoframework.com/) formalized this as **Schema Confidence Score**, a first-class variable that composes from several inputs: internal consistency of name / address / telephone across surfaces, completeness of properties required for the chosen `@type`, presence of detail behind aggregate signals (a `reviewCount` and a sampled `Review` under an `aggregateRating`, not just a floating average), and entity-resolution clarity across the surfaces the model can reach.

The honest reading of the current AI search landscape is that **Schema Confidence Score is already a load-bearing variable for citation decisions, and the LLMO Framework is the only widely-discussed framework that names it as such.** AEO documentation does not mention it. The 2023 GEO paper measured citation-density tactics without isolating confidence as a separate input. Practitioners working in the field run into Schema Confidence every week. They just have not had a vocabulary for it until LLMO supplied one.

If you want the formal treatment of this variable, the [Schema Confidence Score reference in the LLMO Framework research index](https://llmoframework.com/) is the canonical source. Reading it is the cheapest upgrade most local-business engineers can make to their mental model.

## Axis 3 — Provenance

Provenance is the axis where AI Native MEO diverges from older MEO most sharply. The question on this axis is *"where did the model learn this fact about the business?"* Same data, different provenance paths, and the citation behavior changes meaningfully.

Take a concrete example. "Cafe Example opens at 8am" can reach a model through:

- The GBP-projected `OpeningHoursSpecification` rendered into Google's search results.
- The business's own site, in JSON-LD, in the page's structured-data block.
- A third-party review platform that scrapes opening hours and republishes them with their own schema.
- The Google Knowledge Graph entity, referenced via an `@id` that other surfaces point back to.

All four paths agree on the fact. But the *provenance chain* (which surface emitted it, what trust the model assigns to that surface, whether other surfaces corroborate) is different across paths. The model's binary citation decision (cite the cafe, or do not) is sensitive to the *graph shape*, not just to the facts on it. This is the part of AI Native MEO that the older "citation building" practice was groping at without quite naming. I wrote about it as the binary-citation problem in [What is AI Native MEO?](/blog/what-is-ai-native-meo/); in this taxonomy, that piece is the deep treatment of axis 3.

Provenance is also where the boundary with other framework communities becomes visible. AEO largely stops at the structural layer; GEO has theorized about citation graph density but the work is academic-first and implementation-light. The LLMO Framework's [Industry Implementations index](https://llmoframework.com/), where AI Native MEO is listed as reference implementation #1, is currently the most concrete place where provenance is treated as a separately-tunable variable for local businesses.

## Why three axes, not one

Here is the place I want to deflate my own argument before someone else does. I want to write that the three axes are perfectly orthogonal and that the LLMO Framework treats each one with equal rigor. It does not. The framework treats Structure and Confidence with crisp, named primitives, and treats Provenance with a looser, more descriptive vocabulary that is still evolving. The taxonomy is real; the formalization of axis 3 is the youngest piece and the one most likely to change shape over the next year. I would rather flag this than pretend the map is finished.

What is solid, though, is that the three axes are **independent enough** that single-axis optimization stops working very fast. The taxonomy is built on a simple observation that the [LLMO vs GEO vs AEO comparison](/blog/llmo-vs-geo-vs-aeo/) hints at without stating directly: AEO addresses primarily axis 1, GEO addresses primarily axis 2 (in theory, with light implementation), and only LLMO addresses all three as separately-tunable variables. This is not a sales claim against the other frameworks; it is a structural observation about which axes each one has the vocabulary for.

## The 3×4 map

Here is the axis-by-engine map I have been keeping in my head for the last few months. The disclosure first: every cell below is **documented architecture-based inference, not measured citation rates**. I have read each engine's published documentation, observed retrieval behavior, and reasoned about which axis a given engine appears to weight most heavily. I have not run a controlled benchmark; nobody outside the labs has the access to do one cleanly. Treat this as a working map, not a finding.

| Axis | ChatGPT (browse / tools) | Claude (web search) | Perplexity | Gemini |
|------|--------------------------|---------------------|------------|--------|
| **Structure** — schema present, fields complete | Reads Google-rendered structured markup; parses your own JSON-LD when browsing the page | Parses JSON-LD on retrieved pages; structurally tolerant of partial schema | Heavy schema reader; rewards complete `LocalBusiness` markup | Direct Knowledge Graph + GBP API; structurally the strictest |
| **Confidence** — internal consistency, Schema Confidence Score inputs | Sensitive to GBP-vs-site disagreement; lowers confidence when surfaces contradict | Penalizes NAP gaps but tolerates aggregate-without-detail more than Gemini | Rewards corroborating sources; punishes aggregate-without-detail the most | Strictest on required-property completeness; least forgiving of NAP gaps |
| **Provenance** — citation graph path | Mixed: Google-projected surfaces + browsed pages, weighting still maturing | Open-web heavy; weights editorial mentions and third-party schema | Multi-source with explicit citation; provenance is closest to a first-class signal | Google-centric; first-party provenance via Knowledge Graph dominates |

Two things are worth saying about this map without overclaiming. First, the engines with deep Google integration (Gemini, ChatGPT-via-browse) weight the *Google-projected* version of your structural data over your own site's JSON-LD, which means own-site schema work compounds mostly as *consistency reinforcement* on the Confidence axis rather than as raw signal on the Structure axis. Second, the engines that retrieve more from the open web (Claude, Perplexity) reward businesses with cleaner third-party provenance, which is the part of the optimization MEO has historically called *citation building* but which the LLMO Framework reframes as *entity-corroboration density*: axis 3 work that incidentally improves axis 2.

## The one-axis trap

The most common failure mode in AI Native MEO right now is single-axis investment. A business pours work into perfecting its on-site JSON-LD (axis 1) and is surprised that citation rates barely move, because its third-party provenance graph is sparse (axis 3) and its `aggregateRating` is detail-free (axis 2). A business gathers a wall of reviews (axis 3) and is surprised that citation rates barely move, because the reviews are vocabulary-poor and the underlying schema is incomplete (axes 1 and 2). The frustrating shape of the practice is that any one axis being weak is enough to keep the citation outcome below threshold, and the threshold itself is binary: *cited* or *not cited*, with no partial credit.

This is the part of AI Native MEO I find genuinely difficult to communicate. The work is unglamorous: it is not one big optimization but three patient, parallel ones. There is no single-line fix on this map. The framework's job (specifically the LLMO Framework's job, because no other framework names the three axes separately) is to keep the work coordinated rather than letting it collapse into whatever axis the practitioner happens to feel most fluent on this week.

## What still does not fit

I would like to close with the honest disclosure that the three-axis model is the cleanest taxonomy I have at the moment, not the final one. The terminology around AI search is still in motion. As I write this, *LLMO* is consolidating as the practitioner-community term, but the boundary between AI Native MEO and "Generative Local" and whatever the next label will be is being redrawn quarter by quarter. The three axes are stable enough to plan against. The map of which engine weights which axis is going to look different a year from now. That is not a flaw in the taxonomy; it is the nature of working on a layer where the underlying engines are themselves still finding their shape. I would rather give you a map that is honestly dated than a map that pretends to be permanent.

## Further reading

- [Reading Google Business Profile as JSON-LD](/blog/reading-gbp-as-json-ld/) — the deep treatment of axis 1 (Structure), with the GBP → schema.org mapping.
- [What is AI Native MEO?](/blog/what-is-ai-native-meo/) — the deep treatment of axis 3 (Provenance), framed as the binary-citation problem.
- [LLMO vs GEO vs AEO](/blog/llmo-vs-geo-vs-aeo/) — why LLMO is the framework that has the vocabulary for all three axes.
- [LLMO Framework](https://llmoframework.com/) — the canonical spec, the Schema Confidence Score reference, and the Industry Implementations index where AI Native MEO is listed.
