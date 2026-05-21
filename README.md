# MahaTrek Compare

MahaTrek Compare is a trek package comparison platform for Maharashtra treks. It combines an SEO-friendly Next.js frontend, a normalized Prisma data model, and Playwright scrapers that ingest organizer listings into a comparison-ready dataset.

The repository is set up as a low-cost MVP:

- frontend and API routes on Vercel
- PostgreSQL on Neon
- scheduled scraping on GitHub Actions
- mostly static App Router pages with cache-based refreshes

## What the repo does

- Publishes SEO-friendly trek comparison pages at `/treks/[slug]`
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

## Public route map

- `/`: landing page
- `/treks`: canonical trek listing page
- `/treks/[slug]`: trek comparison page
- `/organizers`: organizer listing page
- `/organizers/[slug]`: organizer detail page
- `/api/treks`: trek summaries API
- `/api/treks/[slug]`: single trek comparison API
- `/api/compare/[slug]`: comparison payload API
- `/api/revalidate`: cache revalidation endpoint used after scraping

## Local development

### Prerequisites

- Node.js 22.x recommended
- npm
- a PostgreSQL database, preferably Neon, because the app now serves live data only

### Quick start

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Open `http://localhost:3000`.

Add a real `DATABASE_URL` to `.env` before starting the app. The repo no longer ships sample trek data, so an empty or missing database will render empty indexes until you sync live rows.

### Local database workflow

If you want Prisma, persisted scrapes, and live comparison rows:

1. Create a PostgreSQL database.
2. Put the connection string in `.env` as `DATABASE_URL`.
3. Apply the schema:

```bash
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

### Important Prisma note

This repo uses `prisma.config.ts`, and Prisma CLI commands resolve `DATABASE_URL` from that config. That means:

- `npm install` and `prisma generate` can still run without `DATABASE_URL` because the Prisma config falls back to a harmless local placeholder URL for client generation
- the app data layer no longer falls back to sample rows, so `DATABASE_URL` is required if you want actual trek and organizer content
- database commands such as `prisma db push` still need a real `DATABASE_URL` if you want schema changes to apply to an actual database

If a database command fails, check that `DATABASE_URL` is set in your shell or `.env` file and that the target database is reachable.

### Neon setup

If you want a zero-cost live database, use Neon free tier:

1. Create a Neon project.
2. Copy the pooled connection string.
3. Paste it into `.env` as `DATABASE_URL`.
4. Run:

```bash
npm run sync:live
```

That command applies the Prisma schema and then runs all registered scrapers so the site starts serving live organizer data.

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
npm run scrape
npm run scrape:dry
npm run test:scrapers
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
4. Use `npm run sync:live` once your Neon URL is configured and you want to refresh the full site dataset

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

Apply the schema once:

```bash
npm run db:push
```

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
5. calls `/api/revalidate` so cached pages refresh after new data lands

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
- cached server helpers provide fresh-enough pages without turning every request dynamic
- timestamps are rendered as absolute times to stay compatible with cache-based prerendering

## Notes about the current state of the project

- the app already contains real pages for treks and organizers
- the scraper system already has real organizer adapters
- the Prisma schema already supports departures, inclusions, and historical pricing
- the frontend architecture is documented, but some of the richer TanStack Table work is still an implementation path rather than a fully completed UI refactor

## Troubleshooting

### Playwright browser missing

If a scraper fails with an error about `browserType.launch` or a missing executable, install Chromium locally:

```bash
npx playwright install chromium
```

### Prisma environment variable error

If a database command fails because `DATABASE_URL` is missing or unreachable, set the variable in `.env` or export it in your shell.

### No live data in the UI

If the app runs but shows empty trek and organizer indexes:

- verify `DATABASE_URL`
- run `npm run db:push`
- run at least one scraper against the database

### Scrapers taking too long locally

Use a bounded run:

```bash
npm run scrape:dry -- --organizer=trekhievers --limit=1
```

You can also reduce `SCRAPE_TOUR_LIMIT` in `.env`.

## Recommended next steps after cloning

1. Add a real `DATABASE_URL` and apply the schema.
2. Install Playwright Chromium.
3. Dry-run one organizer scraper.
4. Deploy the web app to Vercel.
5. Add GitHub secrets and enable the scrape workflow.

## Additional docs

- `docs/frontend-architecture.md`: route structure, component hierarchy, mobile behavior, SEO strategy, filtering approach
- `src/scrapers/README.md`: scraper architecture, parsing strategy, normalization, organizer adapter pattern
