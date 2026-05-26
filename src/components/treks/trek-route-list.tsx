"use client";

import { useState, useMemo } from "react";

import { TrekCard } from "@/components/treks/trek-card";
import { departureCityLabels, variantTagLabels } from "@/lib/normalization/catalog";
import type { DepartureCityCode, VariantTagCode } from "@/lib/types";

type RouteCardData = {
  destinationName: string;
  destinationSlug: string;
  routePath: string;
  departureCity: DepartureCityCode;
  startingPrice: number | null;
  organizerCount: number;
  availableVariants: VariantTagCode[];
  packageCount: number;
};

type TrekRouteListProps = {
  routes: RouteCardData[];
};

export function TrekRouteList({ routes }: TrekRouteListProps) {
  const [activeFilters, setActiveFilters] = useState<Set<VariantTagCode>>(new Set());

  // Derive available variant chips from the data
  const availableChips = useMemo(() => {
    const tagSet = new Set<VariantTagCode>();
    for (const route of routes) {
      for (const tag of route.availableVariants) {
        tagSet.add(tag);
      }
    }
    // Order them consistently
    const order: VariantTagCode[] = ["TREK_ONLY", "CAMPING", "SUNRISE", "NIGHT_TREK", "FIREFLIES"];
    return order.filter((tag) => tagSet.has(tag));
  }, [routes]);

  // Filter routes: a card must have ALL active tags
  const filteredRoutes = useMemo(() => {
    if (activeFilters.size === 0) return routes;
    return routes.filter((route) => {
      for (const tag of activeFilters) {
        if (!route.availableVariants.includes(tag)) return false;
      }
      return true;
    });
  }, [routes, activeFilters]);

  // Group filtered routes by departure city
  const groupedRoutes = useMemo(() => {
    const groups = new Map<DepartureCityCode, RouteCardData[]>();
    for (const route of filteredRoutes) {
      const existing = groups.get(route.departureCity) ?? [];
      existing.push(route);
      groups.set(route.departureCity, existing);
    }
    // Sort city groups: MUMBAI first, then PUNE, then any others
    const cityOrder: DepartureCityCode[] = ["MUMBAI", "PUNE"];
    return cityOrder
      .filter((city) => groups.has(city))
      .map((city) => ({ city, routes: groups.get(city)! }));
  }, [filteredRoutes]);

  function toggleFilter(tag: VariantTagCode) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function resetFilters() {
    setActiveFilters(new Set());
  }

  const isAllActive = activeFilters.size === 0;

  return (
    <>
      {/* Filter chips — horizontally scrollable on mobile */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={resetFilters}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              isAllActive
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground ring-1 ring-border hover:bg-muted"
            }`}
          >
            All
          </button>
          {availableChips.map((tag) => {
            const isActive = activeFilters.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleFilter(tag)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground ring-1 ring-border hover:bg-muted"
                }`}
              >
                {variantTagLabels[tag]}
              </button>
            );
          })}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {filteredRoutes.length === routes.length
            ? `${routes.length} routes`
            : `Showing ${filteredRoutes.length} of ${routes.length} routes`}
        </span>
      </div>

      {/* Grouped results */}
      {groupedRoutes.map(({ city, routes: cityRoutes }) => (
        <section key={city} className="space-y-4">
          <h2 className="sticky top-0 z-10 -mx-6 bg-background/95 px-6 py-2 font-display text-lg font-bold text-foreground backdrop-blur-sm">
            From {departureCityLabels[city]}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cityRoutes.map((route, index) => (
              <TrekCard
                key={route.routePath}
                destinationName={route.destinationName}
                destinationSlug={route.destinationSlug}
                routePath={route.routePath}
                departureCity={route.departureCity}
                startingPrice={route.startingPrice}
                organizerCount={route.organizerCount}
                availableVariants={route.availableVariants}
                packageCount={route.packageCount}
                index={index}
              />
            ))}
          </div>
        </section>
      ))}

      {filteredRoutes.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No routes match the selected filters.
        </div>
      )}
    </>
  );
}
