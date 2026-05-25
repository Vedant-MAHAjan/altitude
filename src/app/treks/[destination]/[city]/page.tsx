import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPinned, Mountain, TimerReset } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComparisonTable } from "@/components/treks/comparison-table";
import {
  getDestinationCityComparison,
  getPrerenderDestinationRoutePaths,
} from "@/lib/data";
import { formatCurrency, formatDateShort, formatUpdatedAt } from "@/lib/format";
import { departureCityLabels, variantTagLabels } from "@/lib/normalization/catalog";

function parseRoutePath(routePath: string) {
  const segments = routePath.split("/").filter(Boolean);

  if (segments.length < 3) {
    return null;
  }

  const [, destination, city] = segments;
  return { destination, city };
}

export async function generateStaticParams() {
  const routePaths = await getPrerenderDestinationRoutePaths();

  return routePaths
    .map(parseRoutePath)
    .filter((item): item is { destination: string; city: string } => Boolean(item));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ destination: string; city: string }>;
}): Promise<Metadata> {
  const { destination, city } = await params;
  const comparison = await getDestinationCityComparison(destination, city);

  if (!comparison) {
    return {
      title: "Route not found",
    };
  }

  return {
    title: `${comparison.destinationName} ${departureCityLabels[comparison.departureCity]} Trek Comparison`,
    description: comparison.summary
      ? `${comparison.summary} Compare organizers, variants, and pricing for ${comparison.destinationName} from ${departureCityLabels[comparison.departureCity]}.`
      : `Compare organizers, variants, and pricing for ${comparison.destinationName} from ${departureCityLabels[comparison.departureCity]}.`,
    alternates: {
      canonical: comparison.routePath,
    },
  };
}

export default async function DestinationCityPage({
  params,
}: {
  params: Promise<{ destination: string; city: string }>;
}) {
  const { destination, city } = await params;
  const comparison = await getDestinationCityComparison(destination, city);

  if (!comparison) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/treks" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to routes
            </Link>
          </Button>
          <Badge variant="outline">{departureCityLabels[comparison.departureCity]}</Badge>
          <Badge variant="secondary">{comparison.packageCount} packages</Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-4">
            <h1 className="text-5xl leading-none sm:text-6xl">
              {comparison.destinationName} from {departureCityLabels[comparison.departureCity]}
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              {comparison.summary ?? "Destination-first comparison for this departure city."}
            </p>
            <div className="flex flex-wrap gap-2">
              {comparison.availableVariants.map((tag) => (
                <Badge key={tag} variant="outline">
                  {variantTagLabels[tag]}
                </Badge>
              ))}
            </div>
          </div>

          <Card className="border-none bg-[linear-gradient(145deg,rgba(34,84,61,0.96),rgba(53,110,82,0.88))] text-primary-foreground shadow-[0_30px_90px_rgba(34,84,61,0.22)]">
            <CardHeader className="space-y-4">
              <Badge className="w-fit border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground" variant="outline">
                Snapshot
              </Badge>
              <CardTitle className="text-3xl leading-tight">One destination, one city, all live organizer options.</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Last structured update: {formatUpdatedAt(comparison.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                  Starting price
                </div>
                <div className="mt-2 font-display text-4xl">{formatCurrency(comparison.startingPrice)}</div>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                  Next departure
                </div>
                <div className="mt-2 font-display text-4xl">{formatDateShort(comparison.nextDepartureAt)}</div>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                  Organizers
                </div>
                <div className="mt-2 font-display text-4xl">{comparison.organizerCount}</div>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                  Variants
                </div>
                <div className="mt-2 font-display text-4xl">{comparison.availableVariants.length}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {comparison.variantGroups.map((group) => (
          <Card key={group.signature}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">{group.label}</Badge>
                <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {group.packageCount} packages
                </span>
              </div>
              <CardTitle className="text-2xl">Variant group</CardTitle>
              <CardDescription>
                Packages with the same variant stack and similar delivery shape.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/70 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Price floor</div>
                <div className="mt-2 font-semibold">{formatCurrency(group.priceMin)}</div>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Price ceiling</div>
                <div className="mt-2 font-semibold">{formatCurrency(group.priceMax)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Packages</CardDescription>
            <CardTitle className="text-4xl">{comparison.packageCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Organizers</CardDescription>
            <CardTitle className="text-4xl">{comparison.organizerCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Starting price</CardDescription>
            <CardTitle className="text-4xl">{formatCurrency(comparison.startingPrice)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Next departure</CardDescription>
            <CardTitle className="text-4xl">{formatDateShort(comparison.nextDepartureAt)}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-muted-foreground">
              <MapPinned className="h-4 w-4" />
              Route
            </div>
            <CardTitle className="text-2xl">{comparison.destinationName}</CardTitle>
            <CardDescription>{departureCityLabels[comparison.departureCity]}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-muted-foreground">
              <Mountain className="h-4 w-4" />
              Variants
            </div>
            <CardTitle className="text-2xl">{comparison.availableVariants.length}</CardTitle>
            <CardDescription>{comparison.availableVariants.map((tag) => variantTagLabels[tag]).join(", ")}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Freshness
            </div>
            <CardTitle className="text-2xl">{formatUpdatedAt(comparison.updatedAt)}</CardTitle>
            <CardDescription>Snapshot-driven comparison page</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl">Organizer comparison table</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Filter transport, meal plans, and variant stacks while keeping the city fixed to this route.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={comparison.routePath as Route}>
              Open route snapshot
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ComparisonTable packages={comparison.packages} filters={comparison.filters} showCityFilter={false} />
      </section>
    </main>
  );
}
