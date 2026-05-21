import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock3, IndianRupee, MapPinned, Trees } from "lucide-react";

import { ComparisonTable } from "@/components/treks/comparison-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrekComparison, getTrekSlugs } from "@/lib/data";
import { formatPriceRange, formatUpdatedAt } from "@/lib/format";
import { difficultyLabels } from "@/lib/normalization/catalog";
import { siteConfig } from "@/lib/site";

export async function generateStaticParams() {
  const slugs = await getTrekSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/treks/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const comparison = await getTrekComparison(slug);

  if (!comparison) {
    return {
      title: "Trek not found",
    };
  }

  const title = `${comparison.name} comparison`;
  const description = `Compare ${comparison.name} trek packages across ${comparison.organizerCount} organizers by price, transport, meals, and pickup points.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/treks/${comparison.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/treks/${comparison.slug}`,
    },
  };
}

export default async function TrekComparisonPage(props: PageProps<"/treks/[slug]">) {
  const { slug } = await props.params;
  const comparison = await getTrekComparison(slug);

  if (!comparison) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-none bg-[linear-gradient(145deg,rgba(34,84,61,0.96),rgba(53,110,82,0.88))] text-primary-foreground shadow-[0_30px_90px_rgba(34,84,61,0.22)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground" variant="outline">
                {difficultyLabels[comparison.difficulty]}
              </Badge>
              <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground" variant="outline">
                {comparison.region ?? "Maharashtra"}
              </Badge>
            </div>
            <CardTitle className="text-4xl sm:text-5xl">{comparison.name}</CardTitle>
            <CardDescription className="max-w-3xl text-primary-foreground/70">
              {comparison.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                Price range
              </div>
              <div className="mt-2 font-display text-3xl">
                {formatPriceRange(comparison.priceMin, comparison.priceMax)}
              </div>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                Active organizers
              </div>
              <div className="mt-2 font-display text-3xl">{comparison.organizerCount}</div>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/60">
                Package rows
              </div>
              <div className="mt-2 font-display text-3xl">{comparison.packageCount}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <IndianRupee className="h-5 w-5 text-primary" />
                Comparison scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Price, transport, meals, pickup points, and update freshness.</p>
              <p>Raw scraped text is preserved in the database; filters operate on normalized enum fields.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  Last updated
                </div>
                <div className="mt-2 font-medium">{formatUpdatedAt(comparison.updatedAt)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  <MapPinned className="h-3 w-3" />
                  Pickup coverage
                </div>
                <div className="mt-2 font-medium">
                  {new Set(comparison.packages.flatMap((item) => item.pickupLocations)).size} normalized pickup points
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  <Trees className="h-3 w-3" />
                  Train listings
                </div>
                <div className="mt-2 font-medium">
                  {comparison.packages.filter((item) => item.transportType === "TRAIN").length} train-led packages
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <ComparisonTable packages={comparison.packages} />
    </main>
  );
}