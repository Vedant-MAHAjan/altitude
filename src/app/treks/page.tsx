import type { Metadata } from "next";

import { TrekCard } from "@/components/treks/trek-card";
import { getDestinationCityIndex } from "@/lib/data";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Destination Routes",
  description:
    "Browse cached Maharashtra trek comparison pages grouped by destination and departure city.",
  path: "/treks",
});

export default async function TreksPage() {
  const routes = await getDestinationCityIndex();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
          All routes
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
          Every trail, side by side
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Pick a destination, compare organizers on price, transport, meals, and freshness.
          No scrolling through five different websites.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route, index) => (
          <TrekCard
            key={route.routePath}
            destinationName={route.destinationName}
            routePath={route.routePath}
            departureCity={route.departureCity}
            startingPrice={route.startingPrice}
            organizerCount={route.organizerCount}
            nextDepartureAt={route.nextDepartureAt}
            availableVariants={route.availableVariants}
            packageCount={route.packageCount}
            index={index}
          />
        ))}
      </section>
    </main>
  );
}