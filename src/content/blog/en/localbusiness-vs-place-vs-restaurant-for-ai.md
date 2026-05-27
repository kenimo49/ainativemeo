---
title: "LocalBusiness vs Place vs Restaurant: Which Schema.org Type Carries More Weight for AI Assistants"
description: "An engineer's read of the schema.org LocalBusiness inheritance tree, the properties each subtype gains, and how four AI engines appear to resolve the hierarchy when deciding which entity to cite."
date: 2026-05-27
lang: en
category: engineering
tags: ["LLMO", "MEO", "Schema.org", "JSON-LD", "LocalBusiness", "AI Search", "Engineering"]
featured: false
images:
  - src: /images/blog/localbusiness-vs-place-vs-restaurant-for-ai/1.jpg
    alt: "A small storefront with wooden door and windows, the kind of single entity a model has to compress into one schema type"
    photographer: "Alan Jiang"
    photographer_url: "https://unsplash.com/@alan_j"
    source: Unsplash
  - src: /images/blog/localbusiness-vs-place-vs-restaurant-for-ai/2.jpg
    alt: "A smartphone displaying a QR menu, the surface where the choice of type quietly decides what the AI can say about a restaurant"
    photographer: "Markus Winkler"
    photographer_url: "https://unsplash.com/@markuswinkler"
    source: Unsplash
  - src: /images/blog/localbusiness-vs-place-vs-restaurant-for-ai/3.jpg
    alt: "Lines and dots on a blue field, an inheritance graph by another name"
    photographer: "Conny Schneider"
    photographer_url: "https://unsplash.com/@choys_"
    source: Unsplash
---

"Just paste `LocalBusiness` and move on." That is the answer the MEO industry has been giving for a decade, and it is the answer that stops being correct the moment you accept that an AI assistant is going to read the type as a load-bearing hint about how to interpret the rest of the entity. The `@type` field is not a label. It is a contract the model uses to decide which properties it can expect to find, which it is willing to infer, and which it should weight more heavily when ranking your business against a competitor.

Schema.org's `LocalBusiness` is not a single type either. It is the root of an inheritance tree with over a hundred subtypes, and the choice between, say, `Restaurant` and the more generic `FoodEstablishment` and the still-more-generic `LocalBusiness` is the first place engineering judgment enters AI Native MEO. This piece is the deep dive on that judgment: what the inheritance chain actually looks like, what properties each subtype adds, how the four major AI engines appear to resolve the hierarchy from public documentation, and how to decide which type to write for your business without collapsing into a listicle.

## The type tree, drawn out

The bit of the schema.org tree that matters for local-business markup looks like this. I drew this from the live schema.org type hierarchy, not from memory, because the chain is one of those things that everybody half-remembers and nobody quite gets right on the first try.

```
Thing
└── Place
    └── LocalBusiness                  (also inherits from Organization)
        ├── AnimalShelter
        ├── AutomotiveBusiness
        ├── ChildCare
        ├── Dentist
        ├── DryCleaningOrLaundry
        ├── EmergencyService
        ├── EmploymentAgency
        ├── EntertainmentBusiness
        ├── FinancialService
        ├── FoodEstablishment
        │   ├── Bakery
        │   ├── BarOrPub
        │   ├── Brewery
        │   ├── CafeOrCoffeeShop
        │   ├── FastFoodRestaurant
        │   ├── IceCreamShop
        │   ├── Restaurant
        │   └── Winery
        ├── GovernmentOffice
        ├── HealthAndBeautyBusiness
        │   ├── BeautySalon
        │   ├── DaySpa
        │   ├── HairSalon
        │   ├── HealthClub
        │   ├── NailSalon
        │   └── TattooParlor
        ├── HomeAndConstructionBusiness
        ├── InternetCafe
        ├── LegalService
        ├── Library
        ├── LodgingBusiness
        ├── MedicalBusiness
        │   └── ... (Clinic, Hospital, Physician, Pharmacy, ...)
        ├── ProfessionalService
        ├── RadioStation
        ├── RealEstateAgent
        ├── RecyclingCenter
        ├── SelfStorage
        ├── ShoppingCenter
        ├── SportsActivityLocation
        ├── Store
        │   └── ... (BookStore, ClothingStore, GroceryStore, ...)
        ├── TelevisionStation
        ├── TouristInformationCenter
        └── TravelAgency
```

Two things to notice. `LocalBusiness` itself inherits from both `Place` (the spatial side: address, geo, openingHoursSpecification) *and* `Organization` (the entity side: brand, employee, founder, parentOrganization). This double inheritance is the reason `LocalBusiness` is the right merge point for "a thing that has a physical location *and* is also a legal entity that does business." `Place` alone would treat your business like a landmark. `Organization` alone would lose the address graph.

The second thing to notice is that the depth of the subtree matters. `Restaurant` is three levels below `LocalBusiness` (`LocalBusiness → FoodEstablishment → Restaurant`), and at each level it picks up properties that the level above does not have. That is the part the "just paste `LocalBusiness`" advice quietly throws away.

## What you gain at each subtype level

Here is the property delta: what each subtype layer adds that its parent does not have. I traced these by parsing the schema.org JSON-LD spec for each type's `domainIncludes` and `rdfs:subClassOf` chain; this is a curated list, not the full property set, but it is the set that does work for AI citation.

| Type | Inherits from | Properties it adds (selected) | Why a model cares |
|------|--------------|-------------------------------|-------------------|
| `Place` | `Thing` | `address`, `geo`, `hasMap`, `openingHoursSpecification`, `photo` | Anchors the entity in physical space |
| `Organization` | `Thing` | `brand`, `founder`, `employee`, `legalName`, `vatID`, `parentOrganization` | Anchors the entity as a legal/operational unit |
| `LocalBusiness` | `Place` + `Organization` | `priceRange`, `currenciesAccepted`, `paymentAccepted`, `branchOf` | Marks this as a place-that-does-business, not a landmark |
| `FoodEstablishment` | `LocalBusiness` | `acceptsReservations`, `hasMenu`, `servesCuisine`, `starRating` | Lets the model answer cuisine and reservation queries |
| `Restaurant` | `FoodEstablishment` | (no new properties; `Restaurant` is a *labeling* refinement) | Tells the model this is a sit-down restaurant, not a bar or bakery |
| `CafeOrCoffeeShop` | `FoodEstablishment` | (no new properties; same labeling refinement) | Tells the model this is a cafe, with the use-case set that implies |
| `HealthAndBeautyBusiness` | `LocalBusiness` | (no new properties; labeling refinement) | Groups beauty/wellness use cases |
| `BeautySalon` / `HairSalon` | `HealthAndBeautyBusiness` | (no new properties; labeling refinement) | Narrows the use case for AI suggestions like "best hair salon near me" |
| `MedicalBusiness` | `LocalBusiness` | Many medical-specific properties (`medicalSpecialty`, etc.) via `MedicalEntity` co-class | Brings the medical vocabulary in |

The pattern that surprises engineers reading the spec for the first time is the asymmetry: some subtype steps add real properties (`FoodEstablishment` adds four properties that genuinely matter for AI citation), while other subtype steps add nothing structural and exist only as *labels* (`Restaurant`, `CafeOrCoffeeShop`, `BeautySalon`). I had assumed the whole tree was uniformly property-additive, and it is not. The label-only steps are still doing real work, but the work is at the entity-resolution layer, not the property layer.

## Two minimal examples, side by side

The "just use `LocalBusiness`" version, written as conservatively as a defensible deployment would write it:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://example.com/#cafe",
  "name": "Cafe Example",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1-2-3 Jingumae",
    "addressLocality": "Shibuya",
    "addressRegion": "Tokyo",
    "postalCode": "150-0001",
    "addressCountry": "JP"
  },
  "telephone": "+81-3-xxxx-xxxx",
  "priceRange": "¥¥",
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "08:00",
    "closes": "22:00"
  }]
}
```

The same entity, written as `CafeOrCoffeeShop` with the FoodEstablishment-layer properties filled in:

```json
{
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  "@id": "https://example.com/#cafe",
  "name": "Cafe Example",
  "address": { "@type": "PostalAddress", "streetAddress": "1-2-3 Jingumae",
               "addressLocality": "Shibuya", "addressRegion": "Tokyo",
               "postalCode": "150-0001", "addressCountry": "JP" },
  "telephone": "+81-3-xxxx-xxxx",
  "priceRange": "¥¥",
  "servesCuisine": ["Coffee", "Light meals"],
  "acceptsReservations": false,
  "hasMenu": "https://example.com/menu/",
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "08:00", "closes": "22:00"
  }]
}
```

The second emission carries strictly more information for an AI assistant that gets the query *"a cafe in Shibuya that does not require a reservation and has light food"*. Without `acceptsReservations` and `servesCuisine`, the model is going to have to infer both from prose elsewhere on the page or fall back on a competitor whose schema does answer directly.

## How the four engines appear to resolve the hierarchy

The honest disclosure, repeated from [Reading Google Business Profile as JSON-LD](/blog/reading-gbp-as-json-ld/) because it matters more here: the table below is documented-architecture-based inference, not measured citation rates. I built it from each engine's public documentation, their retrieval-side behavior, and how they cite an entity I know the schema of. Where it is a hypothesis rather than a measurement, the cell says so.

| Engine | Treatment of generic `LocalBusiness` | Treatment of leaf subtype (`Restaurant`, `CafeOrCoffeeShop`, etc.) | Inheritance resolution |
|--------|--------------------------------------|----------------------------------------------------------------------|------------------------|
| **ChatGPT** (with browse) | Accepted, but properties on `FoodEstablishment` cannot be inferred | Preferred for use-case-specific queries; treats leaf subtype as a hint to look for cuisine/reservation properties | Walks the chain up; will use `LocalBusiness` properties when set on a `Restaurant` |
| **Gemini** | Accepted; tends to fall back on Google's own Knowledge Graph type rather than the page-emitted one | Preferred when the leaf subtype matches a GBP category the KG already knows about | Reconciles page schema against KG type; mismatches reduce confidence |
| **Claude** (with web search) | Accepted; relies more heavily on prose context to infer the use case | Preferred when the page also contains corroborating prose ("our cafe", "our restaurant") | Hypothesis: walks the chain conservatively, weighting leaf subtype only when prose agrees |
| **Perplexity** | Accepted; multi-source retrieval often surfaces a competitor with a more specific type | Preferred; the explicit citation model rewards specific types because they survive into the answer | Treats leaf subtype as a quotable fact; less reliant on inheritance walking |

The pattern I would tentatively draw from this (and the strategist log says to mark this as a hypothesis, so I will) is that engines doing multi-source retrieval with explicit citations (Perplexity, Claude with browsing) reward subtype precision more than engines doing primarily Knowledge-Graph-mediated retrieval (Gemini). ChatGPT sits in the middle. The implication is not "always use the deepest subtype." It is that the cost of using a generic type is asymmetric across engines, and the engines where the cost is highest are also the engines whose answers are most visible to users.

## Choosing the type for your business

This is the part that wants to become a listicle and that I am going to resist turning into one. Here are the four cases that come up most often in implementation, written as judgment notes rather than rules.

**A cafe.** The choice is between `CafeOrCoffeeShop` and `Restaurant`. `CafeOrCoffeeShop` is the right call if more than half of your revenue is beverages and light food and customers are not making reservations; `Restaurant` is the right call if you have a full kitchen, a real menu, and people book tables. The `FoodEstablishment` parent gets you `acceptsReservations` and `servesCuisine` either way, but the leaf type is the signal the engine uses to decide which use-case bucket to surface you in. If the kitchen-vs-counter split is genuinely 50/50, I would write `CafeOrCoffeeShop` and let `servesCuisine` and the menu carry the food story, because the cost of being recommended as a cafe to someone who wanted a restaurant is lower than the reverse.

**A hair salon.** The choice is between `BeautySalon`, `HairSalon`, and the parent `HealthAndBeautyBusiness`. There is essentially no reason to use the parent unless your business genuinely spans several sub-categories (a combined salon-and-spa). `HairSalon` is the right call if hair is your primary service. `BeautySalon` is the right call if you sell a broader menu including nails, makeup, and skin. The instinct to use the more generic type "in case" is the same instinct that produces a 1990s metadata page with twenty meta keywords; resist it.

**A clinic.** This one has a structural quirk: `MedicalClinic` does not sit under `LocalBusiness` at all; it inherits from `MedicalOrganization` via `MedicalBusiness`. If you want both the local-business properties (`address`, `openingHoursSpecification`, `priceRange`) and the medical properties (`medicalSpecialty`), the canonical move is multi-typing with `["MedicalClinic", "LocalBusiness"]`. I have seen models tolerate this without complaint and I have seen them silently drop the medical type, so this is a place where running your own test of how an engine cites your entity is worth the hour.

**A combined business.** "Cafe and restaurant," "salon and spa," "clinic and pharmacy." The temptation is to climb the tree to a more abstract type that covers both, and that temptation is mostly wrong. Use the multi-type pattern (`@type: ["CafeOrCoffeeShop", "Restaurant"]` if you genuinely are both) rather than climbing to `FoodEstablishment`. Multi-typing tells the model "this entity satisfies both contracts"; climbing the tree tells the model "I am not sure which contract this entity satisfies." Those are different statements and the model treats them differently.

## Back to the three axes

Type selection is, in the [three-axes taxonomy I sketched two days ago](/blog/three-axes-of-ai-native-meo/), the first independent variable on the Structure axis. The [LLMO Framework](https://llmoframework.com/) treats schema.org type selection as exactly that: the first decision an engineer makes once they have committed to publishing JSON-LD at all. AEO and GEO conversations rarely descend to the type-hierarchy layer; the LLMO-anchored implementations are the first place this conversation gets serious, which is part of what makes [AI Native MEO](/blog/what-is-ai-native-meo/) a deeper engineering practice than the discipline it grew out of.

There is also a hypothesis I will flag without claiming to have proven. The Confidence axis (the one Schema Confidence Score lives on) is sensitive to subtype precision because each step down the inheritance chain raises the floor on which properties the model expects to see. `@type: "LocalBusiness"` with eight properties is internally consistent. `@type: "Restaurant"` with the same eight properties is internally consistent *and* answers cuisine/reservation queries; it is also more vulnerable to looking incomplete if the cuisine/reservation properties are absent. The right read, I think, is that going deeper in the tree raises both the ceiling and the floor of your Schema Confidence Score. The right call is therefore not always "go as deep as you can." It is "go as deep as the properties you can honestly populate will support." The [LLMO Framework's research index](https://llmoframework.com/) is the canonical place to track how this hypothesis hardens or fails as engines update.

## A short closing thought

The schema.org `LocalBusiness` tree is one of the more stable corners of the open semantic web. It has not had a major restructuring in years. That stability is exactly why the choice between `LocalBusiness` and one of its hundred-odd subtypes is worth being careful about: the type you write today is the type a model will read about your business for a long time. The properties an engine privileges may shift; the inheritance chain probably will not. What we get right at the type-selection layer is the part of this work that ages best, which is a quieter consolation than the field usually offers, but a real one.

## Further reading

- [The Three Axes of AI Native MEO: Structure, Confidence, and Provenance](/blog/three-axes-of-ai-native-meo/). The taxonomy this piece is a deep dive on (Structure axis).
- [Reading Google Business Profile as JSON-LD](/blog/reading-gbp-as-json-ld/). The prior piece on what an AI actually sees of your business once you stop treating GBP as a form.
- [What is AI Native MEO?](/blog/what-is-ai-native-meo/). The binary-citation framing this piece's subtype-precision argument leans on.
- [LLMO Framework](https://llmoframework.com/). The canonical spec and the Industry Implementations index where AI Native MEO is listed as reference implementation #1.
