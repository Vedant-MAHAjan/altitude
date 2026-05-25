import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowUpRight, Mountain, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDestinationCityIndex } from "@/lib/data";
import { formatCurrency, formatDateShort, formatUpdatedAt } from "@/lib/format";
import { departureCityLabels, variantTagLabels } from "@/lib/normalization/catalog";

export const metadata: Metadata = {
  title: "Destination Routes",
  description:
    "Browse cached Maharashtra trek comparison pages grouped by destination and departure city.",
  alternates: {
    canonical: "/treks",
  },
};

export default async function TreksPage() {
  const routes = await getDestinationCityIndex();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="space-y-4">
        <Badge className="w-fit" variant="outline">
          Canonical destination routes
        </Badge>
        <h1 className="text-5xl leading-none sm:text-6xl">Comparison-first destination pages</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Each page aggregates active organizer packages into one normalized table so Mumbai and Pune visitors can
          compare the same destination without scrolling through separate package names.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {routes.map((route) => (
          <Card key={route.routePath}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">{departureCityLabels[route.departureCity]}</Badge>
                <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {route.packageCount} packages
                </span>
              </div>
              <CardTitle>{route.destinationName}</CardTitle>
              <CardDescription>{route.summary ?? "Grouped route comparison"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {route.availableVariants.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {variantTagLabels[tag]}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Starting price
                  </div>
                  <div className="mt-2 font-semibold">
                    {formatCurrency(route.startingPrice)}
                  </div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Organizers
                  </div>
                  <div className="mt-2 font-semibold">{route.organizerCount}</div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    <TimerReset className="h-3 w-3" />
                    Next departure
                  </div>
                  <div className="mt-2 font-semibold">{formatDateShort(route.nextDepartureAt)}</div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    <TimerReset className="h-3 w-3" />
                    Last refreshed
                  </div>
                  <div className="mt-2 font-semibold">{formatUpdatedAt(route.updatedAt)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-3xl border border-border/70 bg-white/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Mountain className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{route.packageCount} package rows</div>
                    <div className="text-sm text-muted-foreground">One route, all operators, one comparison surface.</div>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={route.routePath as Route}>
                    View route
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}