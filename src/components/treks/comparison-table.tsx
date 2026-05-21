"use client";

import { useDeferredValue, useState } from "react";
import { ExternalLink, Filter, MapPin, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatUpdatedAt } from "@/lib/format";
import {
  listingCityLabels,
  mealPlanLabels,
  transportLabels,
} from "@/lib/normalization/catalog";
import type {
  ComparisonPackage,
  ComparisonTransportType,
  ListingCity,
  MealPlan,
} from "@/lib/types";

type SortMode = "price-asc" | "price-desc" | "updated-desc";
type CityFilter = "ALL" | "MUMBAI" | "PUNE";

type ComparisonTableProps = {
  packages: ComparisonPackage[];
};

function sortPackages(packages: ComparisonPackage[], sortMode: SortMode) {
  return [...packages].sort((left, right) => {
    if (sortMode === "price-asc") {
      return (left.priceInr ?? Number.MAX_SAFE_INTEGER) - (right.priceInr ?? Number.MAX_SAFE_INTEGER);
    }

    if (sortMode === "price-desc") {
      return (right.priceInr ?? 0) - (left.priceInr ?? 0);
    }

    return Date.parse(right.lastUpdatedAt) - Date.parse(left.lastUpdatedAt);
  });
}

export function ComparisonTable({ packages }: ComparisonTableProps) {
  const [transportFilter, setTransportFilter] = useState<ComparisonTransportType | "ALL">("ALL");
  const [mealFilter, setMealFilter] = useState<MealPlan | "ALL">("ALL");
  const [cityFilter, setCityFilter] = useState<CityFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("price-asc");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const availableTransports = [...new Set(packages.map((item) => item.transportType))];
  const availableMeals = [...new Set(packages.map((item) => item.mealPlan))];

  function matchesCityFilter(listingCity: ListingCity, filter: CityFilter) {
    if (filter === "ALL") {
      return true;
    }

    if (filter === "MUMBAI") {
      return listingCity === "MUMBAI" || listingCity === "MIXED";
    }

    return listingCity === "PUNE" || listingCity === "MIXED";
  }

  const visiblePackages = sortPackages(
    packages.filter((item) => {
      const matchesTransport = transportFilter === "ALL" || item.transportType === transportFilter;
      const matchesMeal = mealFilter === "ALL" || item.mealPlan === mealFilter;
      const matchesCity = matchesCityFilter(item.listingCity, cityFilter);
      const matchesQuery =
        deferredQuery.trim().length === 0 ||
        [
          item.organizerName,
          item.title,
          item.mealsSummary,
          item.staySummary,
          ...item.inclusionHighlights,
          ...item.pickupLocations,
        ]
          .join(" ")
          .toLowerCase()
          .includes(deferredQuery.toLowerCase());

      return matchesTransport && matchesMeal && matchesCity && matchesQuery;
    }),
    sortMode,
  );

  const cheapest = visiblePackages
    .map((item) => item.priceInr)
    .filter((item): item is number => item !== null)
    .sort((left, right) => left - right)[0] ?? null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/70 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Filter className="h-5 w-5 text-primary" />
              Filters and sorting
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Split Mumbai and Pune treks first, then filter by transport, meals, and concrete inclusion summaries.
            </p>
          </div>
          <div className="grid w-full gap-3 md:max-w-3xl md:grid-cols-4">
            <div className="flex h-11 gap-2 rounded-2xl border border-border bg-white/80 p-1">
              {([
                ["ALL", "All treks"],
                ["MUMBAI", "Mumbai"],
                ["PUNE", "Pune"],
              ] as const).map(([value, label]) => (
                <button
                  className={`flex-1 rounded-xl px-3 text-sm font-medium transition ${
                    cityFilter === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  key={value}
                  onClick={() => setCityFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              className="h-11 rounded-2xl border border-border bg-white/80 px-4 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search organizer, pickup, or city"
              value={query}
            />
            <select
              className="h-11 rounded-2xl border border-border bg-white/80 px-4 text-sm outline-none focus:border-primary"
              onChange={(event) =>
                setTransportFilter(event.target.value as ComparisonTransportType | "ALL")
              }
              value={transportFilter}
            >
              <option value="ALL">All transport</option>
              {availableTransports.map((item) => (
                <option key={item} value={item}>
                  {transportLabels[item]}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-2xl border border-border bg-white/80 px-4 text-sm outline-none focus:border-primary"
              onChange={(event) => setMealFilter(event.target.value as MealPlan | "ALL")}
              value={mealFilter}
            >
              <option value="ALL">All meal plans</option>
              {availableMeals.map((item) => (
                <option key={item} value={item}>
                  {mealPlanLabels[item]}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-2xl border border-border bg-white/80 px-4 text-sm outline-none focus:border-primary"
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              value={sortMode}
            >
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="updated-desc">Most recently updated</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div className="rounded-3xl bg-primary px-5 py-4 text-primary-foreground">
            <div className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
              Visible packages
            </div>
            <div className="mt-2 font-display text-4xl">{visiblePackages.length}</div>
          </div>
          <div className="rounded-3xl bg-white/70 px-5 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Cheapest visible price
            </div>
            <div className="mt-2 font-display text-4xl">{formatCurrency(cheapest)}</div>
          </div>
          <div className="rounded-3xl bg-white/70 px-5 py-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Freshness signal
            </div>
            <div className="mt-2 flex items-center gap-2 font-medium">
              <TimerReset className="h-4 w-4 text-primary" />
              {visiblePackages[0] ? formatUpdatedAt(visiblePackages[0].lastUpdatedAt) : "No results"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/85 shadow-[0_20px_60px_rgba(31,45,36,0.08)] backdrop-blur">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Organizer</TableHead>
                <TableHead className="min-w-56">Package</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead className="min-w-52">Pickup points</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePackages.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-semibold">{item.organizerName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.organizerSlug}</div>
                  </TableCell>
                  <TableCell>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {item.listingCity !== "OTHER" ? (
                        <Badge variant="secondary">{listingCityLabels[item.listingCity]}</Badge>
                      ) : null}
                    </div>
                    <div className="font-medium">{item.title}</div>
                    {item.trekName ? (
                      <div className="mt-1 text-xs text-muted-foreground">{item.trekName}</div>
                    ) : null}
                    {item.inclusionHighlights.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.inclusionHighlights.slice(0, 2).map((highlight) => (
                          <span
                            className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary"
                            key={highlight}
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(item.priceInr)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transportLabels[item.transportType]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{mealPlanLabels[item.mealPlan]}</Badge>
                    {item.mealsSummary ? (
                      <div className="mt-2 text-xs text-muted-foreground">{item.mealsSummary}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {item.pickupLocations.length ? (
                        item.pickupLocations.map((location) => (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs"
                            key={location}
                          >
                            <MapPin className="h-3 w-3 text-primary" />
                            {location}
                          </span>
                        ))
                      ) : item.transportType === "TRAIN" ? (
                        <span className="text-sm text-muted-foreground">Train stops are standardized</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Pickup info not normalized yet</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatUpdatedAt(item.lastUpdatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <a href={item.sourceUrl} rel="noreferrer" target="_blank">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {visiblePackages.length === 0 ? (
          <div className="border-t border-border/80 px-6 py-8 text-sm text-muted-foreground">
            No packages match the current filters. Reset the filter bar to inspect all normalized rows.
          </div>
        ) : null}
      </div>
    </div>
  );
}