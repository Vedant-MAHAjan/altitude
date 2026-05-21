# Scraper System

## 1. Scraper architecture

- One organizer adapter per website:
  - `organizers/durgvihar.ts`
  - `organizers/sahyadritreksandtours.ts`
  - `organizers/trekhievers.ts`
  - `organizers/treksandtrails.ts`
  - `organizers/bhatakna.ts`
- Each organizer now also has an explicit parser module under `organizers/parsers/` so detail-page parsing can diverge without cloning the crawler logic.
- Shared discovery and page parsing live in `core/`.
- Trekhievers, Treks & Trails, and Bhatakna use the shared Vacation Labs adapter in `organizers/vacation-labs-base.ts`.
- Durgvihar uses a custom adapter because it exposes trek detail pages under `/trip/`.
- Sahyadri Treks and Tours uses a custom adapter because discovery is button-driven on the homepage and routes into `/trek/` pages.

## 2. Shared utilities

- `core/browser.ts`: Chromium setup plus a `gotoAndSettle` helper for scheduled runs.
- `core/retry.ts`: exponential backoff for brittle pages.
- `core/logger.ts`: structured JSON logging for local runs and GitHub Actions.
- `core/content.ts`: shared text extraction, section parsing, link discovery, and departure-date helpers.
- `core/detail-parser.ts`: common tour-detail parser that extracts raw sections from a detail page.
- `core/raw-section-extraction.ts`: builds the raw section map used by the layered pipeline.
- `core/token-normalizer.ts`: converts raw section lines into normalized transport, meal, and stay tokens.
- `core/derived-fields.ts`: infers semantic summaries such as meal coverage, stay inclusion, and transport mode.
- `core/consistency-validator.ts`: records unresolved or contradictory signals for debugging and regression tests.
- `core/layered-pipeline.ts`: composes sections, tokens, derived fields, and validation issues into one snapshot.
- `core/normalizer.ts`: converts raw page output into the normalized schema used by the persistence pipeline.
- `core/schema.ts`: runtime validation of normalized output with Zod.

## 3. Playwright setup

- Headless Chromium only.
- Locale pinned to `en-IN` and timezone to `Asia/Kolkata`.
- Navigation timeout comes from `SCRAPE_NAV_TIMEOUT_MS`.
- `SCRAPE_TOUR_LIMIT` caps discovery per source so scheduled runs stay bounded.
- The workflow installs Chromium with `npx playwright install --with-deps chromium`.

## 4. Parsing strategy

### Vacation Labs sites

- Discover tour URLs from collection pages by matching same-host links that contain `/tours/`.
- Visit each detail page.
- Parse shared blocks such as:
  - `Basic info`
  - `Cost`
  - `Batches`
  - `Itinerary`
  - `What is included in the tour`
  - `What is NOT included in the tour`
  - `Pickup point`
- Extract departure dates from booking links first, then fall back to text patterns.

### Durgvihar

- Use the homepage plus `/destination` as discovery sources.
- Discover same-host detail pages under `/trip/`.
- Reuse the shared detail parser once the trip page is loaded.

### Sahyadri Treks and Tours

- Start from the homepage.
- Prefer same-host detail routes when standard links are present.
- Fall back to clicking `View Details` buttons because the homepage uses client-side navigation instead of crawlable anchors.
- Reuse the shared detail parser once the trek page is loaded.

## 5. Normalization approach

Normalization now runs in four layers:

- Raw section extraction: keep organizer page text grouped as inclusions, exclusions, transport, meals, stay, pickup, itinerary, and related blocks.
- Token normalization: map phrases like `Kasara`, `AC bus`, `Breakfast`, or `Tent stay` into normalized tokens.
- Derived field inference: compute `transportType`, `mealPlan`, `mealsSummary`, `staySummary`, and public inclusion highlights from those tokens.
- Consistency validation: record warnings when raw text mentions transport, meals, stay, or fees that the token layer could not normalize cleanly.

The normalized output always includes:

- `trekName`
- `priceInr`
- `transportType`
- `mealPlan`
- `pickupLocations`
- `departureDates`
- `inclusions`
- `exclusions`

Raw fidelity is preserved with fields like:

- `rawPriceText`
- `rawTransportText`
- `rawMealText`
- `rawPickupText`
- `rawDepartureText`
- `rawInclusionsText`
- `rawExclusionsText`

This keeps the rule-based scraper deterministic while still storing enough source text for debugging and later parser upgrades.

The layered snapshot is persisted inside `normalizedSnapshot.pipeline`, which makes the public app and admin tooling consume richer summaries without requiring new database columns first.

## 6. Example scraper implementation

The cleanest example is `organizers/trekhievers.ts`:

- it uses the shared Vacation Labs base adapter
- it declares only organizer metadata and source collections
- all retry, logging, detail parsing, and normalization are inherited from shared utilities

This is the pattern to follow for additional Vacation Labs-style trekking websites.