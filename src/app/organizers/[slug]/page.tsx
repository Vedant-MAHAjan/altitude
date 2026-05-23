import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ExternalLink, Rows3, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrganizerBySlug, getPrerenderOrganizerSlugs } from "@/lib/data";
import { formatCurrency, formatPriceRange, formatUpdatedAt } from "@/lib/format";
import {
  mealPlanLabels,
  transportLabels,
} from "@/lib/normalization/catalog";
import { siteConfig } from "@/lib/site";

export async function generateStaticParams() {
  const slugs = await getPrerenderOrganizerSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/organizers/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    return {
      title: "Organizer not found",
    };
  }

  const title = `${organizer.name} organizer profile`;
  const description = `Review ${organizer.name} package coverage, price band, pickup locations, and concise meal or stay summaries.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/organizers/${organizer.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/organizers/${organizer.slug}`,
    },
  };
}

export default async function OrganizerDetailPage(
  props: PageProps<"/organizers/[slug]">,
) {
  const { slug } = await props.params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{organizer.activeTreks} active treks</Badge>
              <Badge variant="outline">{organizer.packageCount} package rows</Badge>
            </div>
            <CardTitle className="text-4xl sm:text-5xl">{organizer.name}</CardTitle>
            <CardDescription>
              {organizer.description ?? "Organizer-level summary based on normalized trek package rows."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-primary px-5 py-4 text-primary-foreground">
              <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
                Price band
              </div>
              <div className="mt-2 font-display text-3xl">
                {formatPriceRange(organizer.priceMin, organizer.priceMax)}
              </div>
            </div>
            <div className="rounded-3xl bg-white/70 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Last updated
              </div>
              <div className="mt-2 font-medium">{formatUpdatedAt(organizer.updatedAt)}</div>
            </div>
            <div className="rounded-3xl bg-white/70 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Pickup points
              </div>
              <div className="mt-2 font-medium">{organizer.pickupLocations.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Rows3 className="h-5 w-5 text-primary" />
              Trek coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {organizer.treks.map((trek) => (
              <Button asChild key={trek.slug} size="sm" variant="outline">
                <Link href={`/treks/${trek.slug}` as Route}>
                  {trek.name}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {organizer.packages.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline">{item.trekName ?? "Canonical trek pending"}</Badge>
                <span className="text-sm font-medium">{formatCurrency(item.priceInr)}</span>
              </div>
              <CardTitle className="text-2xl">{item.title}</CardTitle>
              <CardDescription>{formatUpdatedAt(item.lastUpdatedAt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Transport
                  </div>
                  <div className="mt-2 font-medium">{transportLabels[item.transportType]}</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Meals
                  </div>
                  <div className="mt-2 font-medium">{mealPlanLabels[item.mealPlan]}</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Stay
                  </div>
                  <div className="mt-2 font-medium">{item.staySummary ?? "Not confirmed"}</div>
                </div>
              </div>

              {item.inclusionHighlights.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.inclusionHighlights.map((highlight) => (
                    <span
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      key={highlight}
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="rounded-2xl border border-border/70 bg-white/60 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  <TimerReset className="h-3 w-3" />
                  Pickup locations
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.pickupLocations.map((location) => (
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs" key={location}>
                      {location}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {item.trekSlug ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/treks/${item.trekSlug}` as Route}>
                      Open comparison page
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="ghost">
                  <a href={item.sourceUrl} rel="noreferrer" target="_blank">
                    Source listing
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}