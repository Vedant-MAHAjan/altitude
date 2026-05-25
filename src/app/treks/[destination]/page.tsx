import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getPrerenderTrekSlugs, getTrekComparison } from "@/lib/data";
import { formatPriceRange } from "@/lib/format";
import { difficultyLabels } from "@/lib/normalization/catalog";
import { siteConfig } from "@/lib/site";

const ComparisonTable = dynamic(
  () => import("@/components/treks/comparison-table").then((module) => module.ComparisonTable),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="h-14 animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    ),
  },
);

export async function generateStaticParams() {
  const slugs = await getPrerenderTrekSlugs();
  return slugs.map((destination) => ({ destination }));
}

export async function generateMetadata(
  props: PageProps<"/treks/[destination]">,
): Promise<Metadata> {
  const { destination } = await props.params;
  const comparison = await getTrekComparison(destination);

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

export default async function TrekComparisonPage(props: PageProps<"/treks/[destination]">) {
  const { destination } = await props.params;
  const comparison = await getTrekComparison(destination);

  if (!comparison) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-border md:p-12">

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 text-primary" variant="outline">
              {difficultyLabels[comparison.difficulty]}
            </Badge>
            <Badge className="border-border/50 bg-secondary/50 text-muted-foreground" variant="outline">
              {comparison.region ?? "Maharashtra"}
            </Badge>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            {comparison.name}
          </h1>
          {comparison.summary && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {comparison.summary}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap gap-6 md:gap-10">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Price range</div>
              <div className="mt-1 font-display text-xl font-bold text-primary md:text-2xl">
                {formatPriceRange(comparison.priceMin, comparison.priceMax)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Organizers</div>
              <div className="mt-1 font-display text-xl font-bold text-foreground md:text-2xl">
                {comparison.organizerCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Packages</div>
              <div className="mt-1 font-display text-xl font-bold text-foreground md:text-2xl">
                {comparison.packageCount}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <SummaryCard
          label="Lowest price"
          value={formatPriceRange(comparison.summaryTable.lowestPrice, comparison.summaryTable.lowestPrice)}
        />
        <SummaryCard
          label="Best value from"
          value={comparison.summaryTable.cheapestOrganizerName ?? "Not priced"}
        />
        <SummaryCard
          label="Meals"
          value={comparison.summaryTable.mealsSummary.slice(0, 2).join(", ") || "Check listing"}
        />
        <SummaryCard
          label="Organizers"
          value={String(comparison.summaryTable.organizerCount)}
        />
      </section>

      <ComparisonTable filters={comparison.filters} packages={comparison.packages} />
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border transition-all duration-300 hover:shadow-md hover:ring-primary/30">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 font-display text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}