# Frontend Architecture

This document defines a clean, SEO-friendly frontend shape for the trek comparison platform using Next.js App Router, Tailwind, shadcn/ui, and TanStack Table.

## Goals

- Keep trek and organizer pages indexable and mostly static.
- Make comparison interactions feel instant without pushing filtering to the server.
- Preserve a clean mobile experience even when the desktop view uses a dense comparison table.
- Highlight price and freshness signals clearly enough that users can compare organizers in seconds.

## Route structure

Use the existing route surface as the canonical SEO map and extend it with a few App Router conventions for loading and metadata assets.

```text
src/app/
├── layout.tsx
├── page.tsx
├── not-found.tsx
├── robots.ts
├── sitemap.ts
├── opengraph-image.tsx                 # shared site social image
├── twitter-image.tsx                   # shared site social image
├── treks/
│   ├── page.tsx
│   ├── loading.tsx
│   └── [slug]/
│       ├── page.tsx
│       ├── loading.tsx
│       ├── opengraph-image.tsx         # per-trek comparison image
│       └── twitter-image.tsx
├── organizers/
│   ├── page.tsx
│   ├── loading.tsx
│   └── [slug]/
│       ├── page.tsx
│       ├── loading.tsx
│       ├── opengraph-image.tsx         # per-organizer image
│       └── twitter-image.tsx
└── api/
    ├── compare/[slug]/route.ts
    ├── treks/route.ts
    ├── treks/[slug]/route.ts
    └── revalidate/route.ts
```

### Page intent

- `/`: brand and trust-building landing page with featured treks and organizer coverage.
- `/treks`: crawlable index of comparison pages.
- `/treks/[slug]`: primary SEO landing page for trek comparison intent.
- `/organizers`: crawlable organizer directory.
- `/organizers/[slug]`: secondary SEO page for organizer-brand intent.

## Component hierarchy

Keep route files server-first and push interactivity into leaf client components.

```text
src/components/
├── layout/
│   ├── site-header.tsx
│   ├── site-footer.tsx
│   └── breadcrumb-trail.tsx
├── home/
│   ├── hero-section.tsx
│   ├── featured-trek-grid.tsx
│   ├── organizer-coverage-strip.tsx
│   └── signal-card-grid.tsx
├── treks/
│   ├── trek-hero.tsx
│   ├── comparison-summary-cards.tsx
│   ├── comparison-toolbar.tsx          # client
│   ├── comparison-table.tsx            # client, TanStack Table
│   ├── comparison-mobile-cards.tsx     # client
│   ├── price-highlight.tsx
│   ├── freshness-stamp.tsx
│   ├── active-filter-chips.tsx         # client
│   └── empty-state.tsx
├── organizers/
│   ├── organizer-card.tsx
│   ├── organizer-hero.tsx
│   ├── organizer-package-grid.tsx
│   └── organizer-trust-stats.tsx
└── ui/
    ├── button.tsx
    ├── badge.tsx
    ├── card.tsx
    ├── table.tsx
    ├── input.tsx
    ├── select.tsx
    ├── sheet.tsx
    └── tabs.tsx
```

### Server/client split

- Route pages stay server components.
- Metadata, canonical URLs, JSON-LD, and introductory copy all render on the server.
- The comparison toolbar and table become client components backed by TanStack Table.
- Mobile filter drawers and active filter chips stay client-side only.

## UI layout

### 1. Home page

- Hero with a strong comparison-first headline.
- Featured trek cards with price range, organizer count, and last-updated signals.
- Organizer coverage strip showing how many organizers and packages are tracked.
- Trust section explaining normalized fields: transport, meals, pickup points, forest fee, freshness.

### 2. Trek comparison page

Desktop layout:

- Top hero band with trek name, region, difficulty, summary, price range, organizer count, package count, and last updated.
- Secondary row with quick facts: cheapest visible fare, number of upcoming departures, pickup coverage, and scrape freshness.
- Sticky comparison toolbar containing search, transport filter, meal filter, inclusion filters, organizer filter, and sorting.
- Dense comparison table below the fold using TanStack Table.

Mobile layout:

- Hero remains stacked and readable.
- Filters move into a sheet or drawer triggered by a single button.
- Comparison table collapses into package cards with the same sort order and filter state.
- Critical cells surface first: organizer, price, next departure, transport, meals, last updated.

### 3. Organizer pages

- Organizer index uses clean cards with logo, description, price band, trek coverage, and pickup chips.
- Organizer detail page opens with a hero section, followed by trek links and a package grid.
- Price and freshness remain visible above the fold so users can judge trust quickly.

### 4. Price highlighting

- Highlight the cheapest visible package with a strong badge such as `Best price`.
- Highlight ties if multiple organizers share the minimum visible price.
- Use a lighter accent for packages within a narrow delta of the cheapest price, for example within 5%.
- Keep the color system restrained: one strong accent for best price, neutral styling for the rest.

### 5. Last updated timestamps

- Always show an absolute timestamp, not relative time, so pages remain static-generation-safe.
- Preferred format: `Updated 19 May 2026, 7:42 PM IST`.
- Show one route-level freshness stamp near the hero and one row-level stamp inside the table or mobile cards.

## Comparison table strategy with TanStack Table

TanStack Table should power the comparison surface, but the data still arrives from the server page in already normalized form.

### Recommended columns

- `Organizer`
- `Package`
- `Price`
- `Next departure`
- `Transport`
- `Meals`
- `Forest fee`
- `Pickup points`
- `Updated`
- `Source`

### Table behavior

- Sorting: price ascending, price descending, next departure, last updated, organizer.
- Filtering: transport enum, meal enum, forest fee enum, organizer, search text, departure month.
- Faceting: derive unique filter values from normalized package rows.
- Row highlighting: apply a special cell treatment to the cheapest visible rows.
- Mobile fallback: use the same filtered row model, but render cards instead of a wide table.

## Filtering strategy

The filtering model should be SEO-safe and shareable without making filtered states themselves canonical pages.

### Source of truth

- The canonical route is always the unfiltered trek or organizer page.
- Filter state lives on the client.
- URL query params mirror that state for shareability.

Example:

```text
/treks/kalsubai?transport=BUS&meal=INCLUDED&sort=price-asc
```

### Recommended implementation

- The server page renders the full normalized dataset and the page metadata.
- A client `comparison-toolbar` reads initial state from `searchParams` and hydrates TanStack Table.
- On filter changes, update the query string with `replaceState` or the App Router client navigation APIs.
- Keep the page canonical pointed at `/treks/[slug]` without query params.

### Why this split works

- Search engines see a stable, content-rich comparison page.
- Users can still share filtered states.
- Static generation and cache tagging remain intact.
- The route avoids duplicate-index problems caused by many filter combinations.

## SEO metadata strategy

The existing `metadata` and `generateMetadata` pattern is correct and should be expanded, not replaced.

### Global metadata

- Define `metadataBase` in `layout.tsx`.
- Set title template, base description, Open Graph defaults, and Twitter defaults globally.
- Keep `robots.ts` and `sitemap.ts` as first-class route files.

### Trek pages

Each trek comparison page should set:

- unique title with trek name and comparison intent
- strong description mentioning price, organizer count, and comparison signals
- canonical URL without filter params
- Open Graph title, description, and URL
- optional `keywords` only if they are based on real trek taxonomy, not keyword stuffing

Suggested pattern:

- Title: `Kalsubai Trek Package Comparison`
- Description: `Compare Kalsubai trek packages across 6 organizers by price, departure dates, transport, meals, pickup points, and last updated freshness.`

### Organizer pages

Organizer pages should target organizer-brand and trust intent:

- Title: `Trekhievers Packages and Coverage`
- Description: `Review Trekhievers trek coverage, price band, pickup points, and normalized package details.`

### Structured data

Add JSON-LD to the main crawlable routes:

- Home: `WebSite`
- Trek index: `CollectionPage`
- Trek detail: `BreadcrumbList` + `ItemList`
- Organizer detail: `Organization` + `BreadcrumbList`

The trek detail `ItemList` should contain the visible organizer package rows with price and source URL when available.

### Social previews

- Add route-level `opengraph-image.tsx` for trek and organizer pages.
- The image should show trek or organizer name, price range, package count, and freshness.
- Keep the design bold and legible instead of using generic template art.

### Freshness and index quality

- Put `last updated` timestamps in visible UI copy.
- Keep long-form descriptive copy above the table so the page is useful before JavaScript runs.
- Do not create dedicated indexable URLs for filter-only states.

## Recommended data flow

1. Server route loads a normalized comparison payload.
2. Route generates metadata and JSON-LD from the same payload.
3. Server renders hero, summary cards, editorial copy, and filter metadata.
4. Client comparison components receive the rows and hydrate TanStack Table.
5. Filter state updates the table instantly and mirrors to the URL.

## Implementation notes for this repo

- Keep existing route paths: they already match the right SEO surface.
- Refactor the current `comparison-table.tsx` into a TanStack-powered client component rather than moving filtering to the API.
- Add route-level loading states for trek and organizer pages.
- Keep absolute timestamp formatting so static rendering remains safe under cache components.