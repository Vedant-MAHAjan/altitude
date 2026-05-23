import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BusFront,
  Database,
  MapPinned,
  ScrollText,
  Soup,
  Trees,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatPriceRange, formatUpdatedAt } from "@/lib/format";
import { getHomepageData } from "@/lib/data";

const comparisonSignals = [
  {
    title: "Price comparison",
    description: "Normalize raw fare strings into an INR integer so sorting stays deterministic.",
    icon: Database,
  },
  {
    title: "Transport type",
    description: "Map raw copy to enum buckets like bus, train, self-drive, and own transport.",
    icon: BusFront,
  },
  {
    title: "Meal inclusion",
    description: "Track included, partial, excluded, or unknown meal coverage for every package.",
    icon: Soup,
  },
  {
    title: "Forest fee",
    description: "Highlight what organizers bundle versus what becomes a day-of-trek extra.",
    icon: Trees,
  },
  {
    title: "Pickup locations",
    description: "Store normalized pickup grids for Mumbai, Thane, Pune, and base-village joins.",
    icon: MapPinned,
  },
  {
    title: "Freshness stamp",
    description: "Expose the last scrape timestamp so comparisons always show how current they are.",
    icon: ScrollText,
  },
];

const infraCards = [
  {
    title: "Next.js App Router",
    body: "SEO-friendly pages, route handlers, and mostly static rendering with cache tags for refreshes.",
  },
  {
    title: "Neon + Prisma",
    body: "Free-tier Postgres with relational structure for organizers, treks, packages, scrape sources, and runs.",
  },
  {
    title: "Playwright + Actions",
    body: "Headless browser scrapers run twice daily on GitHub Actions with retry logic and zero server upkeep.",
  },
];

export default async function Home() {
  const homepageData = await getHomepageData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-12 md:py-16">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <Badge className="w-fit" variant="outline">
            Maharashtra trek package comparison MVP
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl leading-none sm:text-6xl lg:text-7xl">
              Compare trek organizers with structured, static-first comparison pages.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              This starter is shaped for a zero-cost stack: Next.js on Vercel,
              Prisma on Neon, Playwright scrapers on GitHub Actions, and enum-based
              normalization instead of paid AI APIs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/treks">
                Explore treks
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/organizers">Organizer coverage</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardDescription className="text-primary-foreground/70">
                  Treks tracked
                </CardDescription>
                <CardTitle className="text-4xl">{homepageData.trekCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Organizer rows</CardDescription>
                <CardTitle className="text-4xl">{homepageData.organizerCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Lowest live-style price</CardDescription>
                <CardTitle className="text-4xl">{formatCurrency(homepageData.priceFloor)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden border-none bg-[linear-gradient(145deg,rgba(34,84,61,0.96),rgba(53,110,82,0.88))] text-primary-foreground shadow-[0_30px_90px_rgba(34,84,61,0.22)]">
          <CardHeader className="space-y-4">
            <Badge className="w-fit border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground" variant="outline">
              Snapshot
            </Badge>
            <CardTitle className="text-3xl leading-tight">
              Twicedaily scraping, enum normalization, and cached SEO routes.
            </CardTitle>
            <CardDescription className="text-primary-foreground/70">
              Last structured update: {formatUpdatedAt(homepageData.lastUpdatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/10 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                Package rows
              </div>
              <div className="mt-2 font-display text-4xl">{homepageData.packageCount}</div>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                Organizer coverage
              </div>
              <div className="mt-2 font-display text-4xl">{homepageData.organizerCount}</div>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 sm:col-span-2">
              <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                Why this stays cheap
              </div>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Pages can pre-render from cached data, route handlers stay minimal,
                and scraping runs only on a schedule, so there is no always-on backend to pay for.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl">Featured comparison pages</h2>
            <p className="mt-2 text-muted-foreground">
              Each trek page groups organizer packages into a shared comparison surface.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/treks">See all treks</Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {homepageData.featuredTreks.map((trek) => (
            <Card key={trek.slug}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <Badge variant="outline">{trek.region ?? "Maharashtra"}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {trek.packageCount} packages
                  </span>
                </div>
                <CardTitle>{trek.name}</CardTitle>
                <CardDescription>{trek.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/70 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Price band
                    </div>
                    <div className="mt-2 font-semibold">
                      {formatPriceRange(trek.priceMin, trek.priceMax)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Freshness
                    </div>
                    <div className="mt-2 font-semibold">{formatUpdatedAt(trek.updatedAt)}</div>
                  </div>
                </div>
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/treks/${trek.slug}` as Route}>Open comparison</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-3xl">Normalized comparison signals</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Store raw scraped text, but publish stable enum-driven fields so filters,
            API responses, and comparison tables stay consistent across organizers.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {comparisonSignals.map((signal) => (
            <Card key={signal.title}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <signal.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-2xl">{signal.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{signal.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-3xl">Zero-cost infrastructure shape</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            The MVP avoids paid APIs, dedicated backend servers, and heavy ops by using the platform features you already chose.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {infraCards.map((card) => (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle className="text-2xl">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
