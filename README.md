# Altitude

Altitude is a trek package comparison platform for Maharashtra treks. It combines an SEO-friendly Next.js frontend, a normalized Prisma data model, and Playwright scrapers that ingest organizer listings into a comparison-ready dataset.

The public site now follows a snapshot-first delivery path:

- scrapers write normalized rows to PostgreSQL
- a snapshot generator writes lean JSON payloads to `public/snapshots`
- GitHub Actions commits those snapshot files back to the repo
- Vercel deploys the updated snapshot files and serves them from the CDN
- the app falls back to Prisma only when snapshots are missing locally

The repository is set up as a low-cost MVP:

- frontend and API routes on Vercel
- PostgreSQL on Neon
- scheduled scraping on GitHub Actions
- mostly static App Router pages backed by cacheable snapshot JSON

## What the repo does

- Publishes SEO-friendly trek comparison pages at `/treks/[destination]/[city]`
- Keeps legacy `/treks/[slug]` pages as compatibility fallbacks
- Publishes organizer profile pages at `/organizers/[slug]`
- Compares organizer packages by price, transport, meals, forest-fee handling, pickup points, and freshness
- Stores normalized trek data plus raw scraped text for debugging and parser iteration
- Supports departures, inclusions, and price-history data in Prisma for future richer filtering
- Runs rule-based scrapers for real organizer websites

## Current coverage

The scraper registry currently includes these organizers:

- Durgvihar
- Sahyadri Treks and Tours
- Trekhievers
- Treks and Trails India
- Bhatakna

Three of those sites share a Vacation Labs structure, so the scraper system includes a reusable base adapter for that platform. Durgvihar and Sahyadri Treks and Tours use custom adapters because their discovery flows differ.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn-style UI primitives
- TanStack Table for the comparison table layer
- Prisma ORM 7
- Neon PostgreSQL
- Playwright
- GitHub Actions

## Architecture overview

### Frontend

- App Router pages live in `src/app`
- the homepage, trek pages, and organizer pages are built for SEO and static-first rendering
- cached data helpers in `src/lib/data.ts` feed both pages and API routes
- snapshot readers in `src/lib/catalog` let public pages avoid runtime DB reads when static files are present
- the comparison UI uses normalized data so filters stay consistent across organizers

Deeper frontend planning is documented in `docs/frontend-architecture.md`.

### Data model

The Prisma schema lives in `prisma/schema.prisma` and is designed for both clean UI reads and future growth.

Core models:

- `Organizer`: canonical organizer identity
- `Trek`: canonical trek entity used for public comparison pages
- `TrekAlias`: normalization bridge from organizer naming to canonical trek slug
- `TrekPackage`: the main comparison row used by the UI
- `Departure`: date-level availability and optional date-level pricing
- `Inclusion`: normalized package inclusions and exclusions
- `PriceHistory`: historical price snapshots
- `ScrapeSource`: organizer source URLs and parser settings
- `ScrapeRun`: scrape execution history

Important design choice:

- `TrekPackage` keeps read-optimized fields such as `priceInr`, `transportType`, `mealPlan`, `forestFeeStatus`, `pickupLocations`, and `nextDepartureAt` so the comparison UI stays fast
- raw scraped text and JSON snapshots are preserved so parsers can be improved without losing source fidelity

### Snapshot-first delivery

Static catalog files now live in `public/snapshots`.

- `homepage.json`: homepage counters and featured destination-route summaries
- `treks/index.json`: lightweight destination-route cards for `/treks`
- `treks/search.json`: trek name + alias index for the universal search bar
- `treks/[destination]/[city].json`: full comparison payload for a destination-city route page
- `treks/[slug].json`: legacy trek comparison payload for compatibility
- `organizers/index.json`: organizer cards for `/organizers`
- `organizers/[slug].json`: full organizer detail payload
- `manifest.json`: slug lists plus pre-render targets for dynamic routes

These files are generated from the database after successful scrapes and are intentionally smaller than the raw Prisma graph. The app uses them first, then falls back to lean `select`-based Prisma queries only if snapshots are unavailable.

### Scrapers

The scraper system lives in `src/scrapers`.

- `core/` contains shared browser helpers, retry logic, logging, text extraction, detail parsing, normalization, validation, and persistence
- `organizers/` contains one adapter per organizer
- `registry.ts` is the active scraper registry
- `run.ts` is the CLI entrypoint

Deeper scraper design is documented in `src/scrapers/README.md`.

## Repository structure

```text
.
├── .github/
│   └── workflows/
│       └── scrape.yml
├── docs/
│   └── frontend-architecture.md
├── public/
│   └── snapshots/
├── prisma/
│   └── schema.prisma
├── prisma.config.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── organizers/
│   │   ├── treks/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   ├── lib/
│   └── scrapers/
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

## Local development

### Prerequisites

- Node.js 22.x recommended
- npm
- a PostgreSQL database, preferably Neon, because the app now serves live data only

### Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

That starts the snapshot-backed app shell without touching the database.

Add a real `DATABASE_URL` to `.env` before running any database-backed command such as `db:push`, `snapshots:generate`, or `scrape`. The repo no longer ships sample trek data, so an empty or missing database will render empty indexes until you load live rows.

### How to view the live site

Every command set below ends with the site running at `http://localhost:3000`.

1. Snapshot-backed UI only:

```bash
npm install
cp .env.example .env
npm run dev
```

2. Latest UI with the current data already stored in your database:

Run:

```bash
npm install
cp .env.example .env
```

Then edit `.env` and set a real `DATABASE_URL`, then run:

```bash
npm run snapshots:generate
npm run dev
```

3. Latest UI with the latest scraper/backend refresh written into your database:

Run:

```bash
npm install
cp .env.example .env
```

Then edit `.env` and set a real `DATABASE_URL`, then run:

```bash
npm run scrape
npm run dev
```

`npm run scrape` now performs a full local refresh unless you intentionally cap it with `--limit=<n>` or `SCRAPE_TOUR_LIMIT`.

4. Brand-new blank database, then full local live site:

Use this only when `DATABASE_URL` points to a brand-new Neon project or branch with no existing trek tables or rows.

Run:

```bash
npm install
cp .env.example .env
```

Then edit `.env` and set a real `DATABASE_URL`, then run:

```bash
npm run db:generate
npm run db:push
npm run scrape
npm run dev
```

If `npm run db:push` shows drop warnings like dropping `Trek.location`, `TrekAlias.normalizedValue`, `TrekPackageVariant`, or `VariantTag`, stop immediately. That means the database is not blank. Do not continue with `db:push` on that database. Use the existing-database flow instead:

```bash
npm run scrape
npm run dev
```

Do not use `npm run sync:live` for normal local viewing. It runs `db:push` before `scrape`, and against an existing Neon database it can stop on destructive Prisma prompts.

5. Production-like local smoke test:

```bash
npm install
cp .env.example .env
npm run build
npm run start
```

### Local database workflow

These command sets assume `.env` already contains a real `DATABASE_URL`.

Use these exact database-backed command sets:

1. Existing database, no scrape, just rebuild snapshots and view the site:

```bash
npm run snapshots:generate
npm run dev
```

2. Existing database, refresh live rows from scrapers, then view the site:

```bash
npm run scrape
npm run dev
```

Use `npm run scrape -- --limit=20` only when you intentionally want a bounded test run instead of a full local refresh.

3. Fresh or disposable database, create schema, scrape, then view the site:

```bash
npm run db:generate
npm run db:push
npm run scrape
npm run dev
```

If `db:push` reports drop warnings, stop and use a fresh Neon branch or disposable database instead of accepting the prompt blindly.

If the database already contains trek data, do not run `db:push`. Use this instead:

```bash
npm run scrape
npm run dev
```

### Important Prisma note

This repo uses `prisma.config.ts`, and Prisma CLI commands resolve `DATABASE_URL` from that config. That means:

- `npm install` and `prisma generate` can still run without `DATABASE_URL` because the Prisma config falls back to a harmless local placeholder URL for client generation
- the app data layer no longer falls back to sample rows, so `DATABASE_URL` is required if you want actual trek and organizer content
- database commands such as `prisma db push` still need a real `DATABASE_URL` if you want schema changes to apply to an actual database
- `db:sync` is a schema administration command, not the default startup path; use it only when you expect Prisma to apply the current schema to a database you control
- `sync:live` is a fresh-database shortcut for `db:sync` followed by `scrape`; it is not the normal command for viewing the site against an existing Neon database
- the `scripts/require-database-url.mjs` wrapper now rejects placeholder URLs before Prisma runs, so `db:push`, `snapshots:generate`, `scrape`, and `sync:live` fail fast with a clear message instead of attempting a network connection

If you only want to start the UI, use `npm run dev` after copying `.env.example`.

If a database command fails, check that `DATABASE_URL` is set in your shell or `.env` file and that the target database is reachable.

### Neon setup

If you want a zero-cost live database, use Neon free tier:

1. Create a Neon project.
2. Copy the pooled connection string.
3. Paste it into `.env` as `DATABASE_URL`.
4. For an existing Neon database that already has data you want to keep, run:

```bash
npm run scrape
npm run dev
```

5. For a fresh blank Neon database, run:

```bash
npm run db:generate
npm run db:push
npm run scrape
npm run dev
```

If `db:push` shows destructive warnings, you are not on a fresh blank Neon database. Stop and switch to:

```bash
npm run scrape
npm run dev
```

`npm run scrape` regenerates `public/snapshots`, so you do not need to run `npm run snapshots:generate` afterward unless you changed database rows outside the scraper flow.

## Environment variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | for DB and scrapers | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | yes | Base site URL used for metadata and deployment |
| `VERCEL_REVALIDATE_URL` | for scheduled revalidation | Full URL to `/api/revalidate` |
| `CRON_REVALIDATE_SECRET` | for scheduled revalidation | Secret expected by the revalidation route |
| `SCRAPE_CONCURRENCY` | optional | Number of organizers scraped in parallel |
| `SCRAPE_TOUR_LIMIT` | optional | Per-source discovery cap for bounded runs |
| `SCRAPE_NAV_TIMEOUT_MS` | optional | Playwright navigation timeout |
| `SCRAPE_LOG_LEVEL` | optional | `debug`, `info`, `warn`, or `error` |
| `SCRAPE_USER_AGENT` | recommended | User agent used by scrapers |

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run db:generate
npm run db:push
npm run snapshots:generate
npm run scrape
npm run scrape:dry
npm run test:scrapers
npm run verify:local
```

Schema admin only:

```bash
npm run db:sync
```

Fresh database only:

```bash
npm run sync:live
```

Examples:

```bash
npm run scrape:dry -- --organizer=trekhievers --limit=2
npm run scrape -- --organizer=durgvihar --limit=3
npm run scrape -- --organizer=sahyadri-treks-and-tours --limit=3
```

## Running scrapers locally

### First-time setup

Playwright needs a local Chromium install.

```bash
npx playwright install chromium
```

### Dry-run a scraper

Dry-run mode executes the scrape flow without intending to treat it as a production write path.

```bash
npm run scrape:dry -- --organizer=trekhievers --limit=1
```

### Run real scrapes

To persist data, you need a working `DATABASE_URL`.

```bash
npm run scrape -- --organizer=trekhievers --limit=2
```

### Run scraper regression tests

Use the scraper test suite to lock in parser behavior for organizer-specific HTML shapes and shared extraction rules.

```bash
npm run test:scrapers
```

Recommended local workflow:

1. Start with `scrape:dry`
2. Keep `--limit` low while testing selectors
3. Move to `scrape` only after the dry-run output looks correct
4. Run `npm run snapshots:generate` if you updated DB rows outside the scraper command
5. Use `npm run scrape` for the normal local live-data refresh path

## Repeatable verification routine

Use this every time you touch schema, scraper output, or public UI behavior.

### If DB schema changed

```bash
npm run db:generate
npm run db:push
npm run snapshots:generate
npm run verify:local
```

If `db:push` shows drop warnings, stop and apply the schema on a fresh Neon branch or disposable database instead of accepting the prompt.

### If scraper output or normalized fields changed

```bash
npm run scrape -- --organizer=trekhievers --limit=2
npm run verify:local
```

### If only UI changed

```bash
npm run verify:local
```

### What `verify:local` proves

- TypeScript still compiles
- scraper regression tests still pass
- Next.js can prerender the public routes from the current snapshot/data layer
- dynamic route generation still works for the pre-rendered destination-city and organizer routes

## Where to deploy

Recommended production setup:

- frontend and route handlers: Vercel
- database: Neon PostgreSQL
- scheduled scraping: GitHub Actions

This is the setup the repo is already designed around.

### Why this deployment shape fits the repo

- Vercel fits Next.js App Router and cached route rendering well
- Neon gives you a low-cost Postgres database for Prisma
- GitHub Actions can run Playwright on a schedule without maintaining a dedicated worker service

## Deployment guide

### 1. Database

Create a Neon project and copy the `DATABASE_URL`.

Apply the schema once, after replacing the placeholder value in `.env` and before running any live scrape:

```bash
npm run db:generate
npm run db:push
```

If Prisma reports drop warnings, use a fresh Neon branch or a migration path instead of accepting the prompt blindly.

### 2. Web app deployment

Deploy the repo to Vercel.

Set these Vercel environment variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_REVALIDATE_SECRET`

Recommended values:

- `NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app`
- `CRON_REVALIDATE_SECRET=<strong-random-secret>`

Build settings:

- framework: Next.js
- build command: `npm run build`
- install command: `npm install`

### 3. Scheduled scraping

The workflow file is `.github/workflows/scrape.yml`.

Set these GitHub repository secrets:

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `SCRAPE_USER_AGENT`
- `VERCEL_REVALIDATE_URL`
- `CRON_REVALIDATE_SECRET`

Recommended `VERCEL_REVALIDATE_URL` value:

- `https://your-domain.vercel.app/api/revalidate`

What the workflow does:

1. checks out the repo
2. installs dependencies
3. installs Playwright Chromium
4. runs `npm run scrape`
5. commits refreshed `public/snapshots` files if the static payload changed
6. relies on the normal Vercel Git deployment to ship the new snapshot files to the CDN

This flow keeps the public site static-first and avoids serving most public pages from live database queries.

## Comparison UI behavior

The public comparison experience is centered on normalized package rows.

Current comparison signals:

- price
- transport type
- meal inclusion
- forest-fee inclusion status
- pickup locations
- last updated freshness

The frontend planning document also covers the TanStack Table refactor path, mobile card fallback, filter strategy, and richer SEO treatment.

## SEO and rendering strategy

- App Router pages use route-level metadata
- `robots.ts` and `sitemap.ts` are included
- trek and organizer pages use canonical slugs
- the app is built to stay mostly static where possible
- public routes prefer snapshot JSON and prerender popular trek and organizer pages ahead of time
- cached server helpers only hit Prisma when snapshots are missing locally
- timestamps are rendered as absolute times to stay compatible with cache-based prerendering