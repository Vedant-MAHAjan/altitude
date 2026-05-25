import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComparisonTable } from "@/components/treks/comparison-table";
import {
  getCitiesForDestination,
  getDestinationCityComparison,
  getPrerenderDestinationRoutePaths,
} from "@/lib/data";
import { formatCurrency, formatDateShort } from "@/lib/format";
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
  const [comparison, availableCities] = await Promise.all([
    getDestinationCityComparison(destination, city),
    getCitiesForDestination(destination),
  ]);

  if (!comparison) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      {/* Back nav + city toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href="/treks" className="gap-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            All routes
          </Link>
        </Button>

        {availableCities.length > 1 && (
          <div className="flex h-9 items-center gap-0.5 rounded-xl border border-border/60 bg-muted/30 p-0.5">
            {availableCities.map((c) => {
              const cityCode = c.toUpperCase() as "MUMBAI" | "PUNE";
              const isActive = c === city;
              return (
                <Link
                  key={c}
                  href={`/treks/${destination}/${c}`}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {departureCityLabels[cityCode]}
                </Link>
              );
            })}
          </div>
        )}

        {availableCities.length <= 1 && (
          <Badge variant="outline" className="rounded-full">
            {departureCityLabels[comparison.departureCity]}
          </Badge>
        )}
      </div>

      {/* Hero section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/95 via-primary/80 to-emerald-700/70 p-8 text-primary-foreground shadow-[0_16px_48px_rgba(27,67,50,0.18)] md:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative">
          <h1 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            {comparison.destinationName}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            from {departureCityLabels[comparison.departureCity]}
          </p>
          {comparison.summary && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              {comparison.summary}
            </p>
          )}

          {/* Variant tags */}
          <div className="mt-5 flex flex-wrap gap-2">
            {comparison.availableVariants.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur"
              >
                {variantTagLabels[tag]}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-6 md:gap-10">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">From</div>
              <div className="mt-1 font-display text-xl font-bold">
                {formatCurrency(comparison.startingPrice)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">Next departure</div>
              <div className="mt-1 font-display text-xl font-bold">
                {formatDateShort(comparison.nextDepartureAt)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">Organizers</div>
              <div className="mt-1 font-display text-xl font-bold">{comparison.organizerCount}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">Packages</div>
              <div className="mt-1 font-display text-xl font-bold">{comparison.packageCount}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Variant groups */}
      {comparison.variantGroups.length > 1 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comparison.variantGroups.map((group) => (
            <div
              key={group.signature}
              className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="rounded-full text-[11px]">
                  {group.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {group.packageCount} pkgs
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Floor</div>
                  <div className="font-semibold">{formatCurrency(group.priceMin)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ceiling</div>
                  <div className="font-semibold">{formatCurrency(group.priceMax)}</div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Comparison table */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold">
            Compare packages
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter by transport, meals, or variant — city is fixed to {departureCityLabels[comparison.departureCity]}.
          </p>
        </div>

        <ComparisonTable packages={comparison.packages} filters={comparison.filters} showCityFilter={false} />
      </section>
    </main>
  );
}
