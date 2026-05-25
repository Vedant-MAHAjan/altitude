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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/95 via-primary/80 to-emerald-700/70 p-8 text-primary-foreground shadow-[0_16px_48px_rgba(27,67,50,0.18)] md:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white" variant="outline">
              {difficultyLabels[comparison.difficulty]}
            </Badge>
            <Badge className="border-white/20 bg-white/10 text-white" variant="outline">
              {comparison.region ?? "Maharashtra"}
            </Badge>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            {comparison.name}
          </h1>
          {comparison.summary && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
              {comparison.summary}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap gap-6 md:gap-10">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">Price range</div>
              <div className="mt-1 font-display text-xl font-bold md:text-2xl">
                {formatPriceRange(comparison.priceMin, comparison.priceMax)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">Organizers</div>
              <div className="mt-1 font-display text-xl font-bold md:text-2xl">
                {comparison.organizerCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">Packages</div>
              <div className="mt-1 font-display text-xl font-bold md:text-2xl">
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
    <div className="rounded-2xl border border-border/50 bg-white/70 p-5 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 font-display text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}