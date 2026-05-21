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
import { getTreksIndex } from "@/lib/data";
import { formatPriceRange, formatUpdatedAt } from "@/lib/format";
import { difficultyLabels } from "@/lib/normalization/catalog";

export const metadata: Metadata = {
  title: "Trek Comparisons",
  description:
    "Browse cached Maharashtra trek comparison pages grouped by canonical trek name.",
  alternates: {
    canonical: "/treks",
  },
};

export default async function TreksPage() {
  const treks = await getTreksIndex();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="space-y-4">
        <Badge className="w-fit" variant="outline">
          Canonical trek pages
        </Badge>
        <h1 className="text-5xl leading-none sm:text-6xl">Comparison-first trek pages</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Each page aggregates active organizer packages into one normalized table so users can compare price,
          transport, meals, forest fee inclusion, pickup points, and update freshness.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {treks.map((trek) => (
          <Card key={trek.slug}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">{difficultyLabels[trek.difficulty]}</Badge>
                <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {trek.region ?? "Maharashtra"}
                </span>
              </div>
              <CardTitle>{trek.name}</CardTitle>
              <CardDescription>{trek.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Price band
                  </div>
                  <div className="mt-2 font-semibold">
                    {formatPriceRange(trek.priceMin, trek.priceMax)}
                  </div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Organizers
                  </div>
                  <div className="mt-2 font-semibold">{trek.organizerCount}</div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    <TimerReset className="h-3 w-3" />
                    Last refreshed
                  </div>
                  <div className="mt-2 font-semibold">{formatUpdatedAt(trek.updatedAt)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-3xl border border-border/70 bg-white/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Mountain className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{trek.packageCount} package rows</div>
                    <div className="text-sm text-muted-foreground">
                      {trek.durationDays ?? 1}D / {trek.durationNights ?? 1}N listing baseline
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/treks/${trek.slug}` as Route}>
                    View page
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