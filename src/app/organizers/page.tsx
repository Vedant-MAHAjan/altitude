import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, MapPinned } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrganizerIndex } from "@/lib/data";
import { formatPriceRange, formatUpdatedAt } from "@/lib/format";

export const metadata: Metadata = {
  title: "Organizer Coverage",
  description:
    "Browse trekking organizers tracked by the Maharashtra trek comparison MVP.",
  alternates: {
    canonical: "/organizers",
  },
};

export default async function OrganizersPage() {
  const organizers = await getOrganizerIndex();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="space-y-4">
        <Badge className="w-fit" variant="outline">
          Organizer-level coverage
        </Badge>
        <h1 className="text-5xl leading-none sm:text-6xl">Organizer snapshots</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Each organizer page rolls up active trek rows, price bands, pickup coverage, and freshness into a single summary.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {organizers.map((organizer) => (
          <Card key={organizer.slug}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">{organizer.activeTreks} treks</Badge>
                <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {formatUpdatedAt(organizer.updatedAt)}
                </span>
              </div>
              <CardTitle>{organizer.name}</CardTitle>
              <CardDescription>
                {organizer.description ?? "Rule-based extraction and normalized comparison fields."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Package rows
                  </div>
                  <div className="mt-2 flex items-center gap-2 font-semibold">
                    <Building2 className="h-4 w-4 text-primary" />
                    {organizer.packageCount}
                  </div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Price band
                  </div>
                  <div className="mt-2 font-semibold">
                    {formatPriceRange(organizer.priceMin, organizer.priceMax)}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-white/60 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  <MapPinned className="h-3 w-3" />
                  Pickup coverage
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {organizer.pickupLocations.slice(0, 4).map((location) => (
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs" key={location}>
                      {location}
                    </span>
                  ))}
                </div>
              </div>

              <Button asChild className="w-full" variant="outline">
                <Link href={`/organizers/${organizer.slug}` as Route}>
                  Open organizer page
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}