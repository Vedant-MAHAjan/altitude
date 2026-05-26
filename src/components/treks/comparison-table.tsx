"use client";

import { format } from "date-fns";
import { Fragment, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Filter,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  mealPlanLabels,
  variantTagLabels,
  transportLabels,
} from "@/lib/normalization/catalog";
import type {
  ComparisonFilters,
  ComparisonPackage,
  ComparisonTransportType,
  ListingCity,
  VariantTagCode,
} from "@/lib/types";

/** Threshold in milliseconds after which a package's data is considered stale (72 hours). */
const STALE_THRESHOLD_MS = 72 * 60 * 60 * 1000;
const DETAIL_ROW_COL_SPAN = 8;

type SortMode = "price-asc" | "price-desc" | "updated-desc";
type CityFilter = "ALL" | "MUMBAI" | "PUNE";
type VariantFilter = "ALL" | VariantTagCode;

type ComparisonTableProps = {
  packages: ComparisonPackage[];
  filters: ComparisonFilters;
  showCityFilter?: boolean;
};

function coerceVariantTags(value: VariantTagCode[] | string[] | null | undefined) {
  const tags = (value ?? []).filter(
    (tag): tag is VariantTagCode =>
      tag === "TREK_ONLY" ||
      tag === "CAMPING" ||
      tag === "SUNRISE" ||
      tag === "NIGHT_TREK" ||
      tag === "FIREFLIES",
  );

  return tags.length > 0 ? tags : (["TREK_ONLY"] as VariantTagCode[]);
}

function sortPackages(packages: ComparisonPackage[], sortMode: SortMode) {
  return [...packages].sort((left, right) => {
    if (sortMode === "price-asc") {
      return (left.priceInr ?? Number.MAX_SAFE_INTEGER) - (right.priceInr ?? Number.MAX_SAFE_INTEGER);
    }

    if (sortMode === "price-desc") {
      return (right.priceInr ?? 0) - (left.priceInr ?? 0);
    }

    return right.updatedAtMs - left.updatedAtMs;
  });
}

function getUpcomingDepartureDateLabels(pkg: ComparisonPackage) {
  const upcomingWithIso = (pkg.departureDates ?? [])
    .filter((item) => item.isoDate)
    .map((item) => ({
      label: item.label,
      isoDate: item.isoDate as string,
      timestamp: Date.parse(item.isoDate as string),
    }))
    .filter((item) => Number.isFinite(item.timestamp) && item.timestamp >= Date.now())
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(0, 3)
    .map((item) => format(new Date(item.isoDate), "EEE d MMM"));

  if (upcomingWithIso.length > 0) {
    return upcomingWithIso;
  }

  if (pkg.nextDepartureAt) {
    return [format(new Date(pkg.nextDepartureAt), "EEE d MMM")];
  }

  return (pkg.departureDates ?? [])
    .map((item) => item.label)
    .filter(Boolean)
    .slice(0, 3);
}

export function ComparisonTable({ packages, filters, showCityFilter = true }: ComparisonTableProps) {
  const [transportFilter, setTransportFilter] = useState<ComparisonTransportType | "ALL">("ALL");
  const [cityFilter, setCityFilter] = useState<CityFilter>("ALL");
  const [variantFilter, setVariantFilter] = useState<VariantFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("price-asc");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const availableTransports = filters.transportTypes;
  const availableVariants = coerceVariantTags(filters.variantTags);

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
      const matchesCity = showCityFilter ? matchesCityFilter(item.listingCity, cityFilter) : true;
      const itemVariantTags = coerceVariantTags(item.variantTags);
      const matchesVariant = variantFilter === "ALL" || itemVariantTags.includes(variantFilter);
      const matchesQuery =
        debouncedQuery.length === 0 || item.searchText.includes(debouncedQuery);

      return matchesTransport && matchesCity && matchesVariant && matchesQuery;
    }),
    sortMode,
  );

  const cheapest = visiblePackages
    .map((item) => item.priceInr)
    .filter((item): item is number => item !== null)
    .sort((left, right) => left - right)[0] ?? null;

  useEffect(() => {
    if (expandedPackageId && !visiblePackages.some((item) => item.id === expandedPackageId)) {
      setExpandedPackageId(null);
    }
  }, [expandedPackageId, visiblePackages]);

  function toggleExpandedRow(packageId: string) {
    setExpandedPackageId((current) => (current === packageId ? null : packageId));
  }

  return (
    <div className="space-y-5">
      {/* Sticky filter bar */}
      <div className="sticky top-[73px] z-30 -mx-1 px-1">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border">
          {/* Filter header */}
          <button
            className="flex w-full items-center justify-between px-5 py-3.5 text-left"
            onClick={() => setFiltersOpen(!filtersOpen)}
            type="button"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Filters</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {visiblePackages.length} results
              </span>
              {cheapest !== null && (
                <span className="hidden rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent sm:inline">
                  from {formatCurrency(cheapest)}
                </span>
              )}
            </div>
            <Filter className={`h-4 w-4 text-muted-foreground transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Filter controls */}
          {filtersOpen && (
            <div className="border-t border-border/30 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <input
                  className="h-9 min-w-[180px] flex-1 rounded-xl border border-border/50 bg-secondary/50 px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/30 focus:bg-secondary"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search organizer or package..."
                  value={query}
                />

                {/* City filter */}
                {showCityFilter && (
                  <div className="flex h-9 items-center gap-0.5 rounded-xl border border-border/50 bg-secondary/50 p-0.5">
                    {([
                      ["ALL", "All"],
                      ["MUMBAI", "Mumbai"],
                      ["PUNE", "Pune"],
                    ] as const).map(([value, label]) => (
                      <button
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                          cityFilter === value
                            ? "bg-primary text-primary-foreground shadow-sm"
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
                )}

                {/* Transport */}
                <select
                  className="h-9 rounded-xl border border-border/50 bg-secondary/50 px-3 text-xs font-medium text-foreground outline-none focus:border-primary/30"
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

                {/* Variant */}
                <select
                  className="h-9 rounded-xl border border-border/50 bg-secondary/50 px-3 text-xs font-medium text-foreground outline-none focus:border-primary/30"
                  onChange={(event) => setVariantFilter(event.target.value as VariantFilter)}
                  value={variantFilter}
                >
                  <option value="ALL">All variants</option>
                  {availableVariants.map((item) => (
                    <option key={item} value={item}>
                      {variantTagLabels[item]}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  className="h-9 rounded-xl border border-border/50 bg-secondary/50 px-3 text-xs font-medium text-foreground outline-none focus:border-primary/30"
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  value={sortMode}
                >
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="updated-desc">Recently updated</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/50">
                <TableHead className="w-10" />
                <TableHead className="min-w-44 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organizer</TableHead>
                <TableHead className="min-w-52 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Package</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transport</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meals</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Updated</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePackages.map((item) => {
                const isCheapest = cheapest !== null && item.priceInr === cheapest;
                const isExpanded = expandedPackageId === item.id;

                if (item.isPending) {
                  return (
                    <TableRow
                      key={item.id}
                      className="border-border/20 opacity-50"
                    >
                      <TableCell className="w-10" />
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.organizerName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-muted-foreground italic">Data under review</div>
                      </TableCell>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        <a
                          href={item.organizerWebsiteUrl ?? item.sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Check organizer website
                        </a>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  );
                }

                const departureDateLabels = getUpcomingDepartureDateLabels(item);

                return (
                  <Fragment key={item.id}>
                    <TableRow
                      aria-expanded={isExpanded}
                      className={`border-border/20 cursor-pointer transition-colors hover:bg-primary/[0.03] ${isCheapest ? "bg-primary/[0.04]" : ""} ${isExpanded ? "bg-primary/[0.05]" : ""}`}
                      onClick={() => toggleExpandedRow(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleExpandedRow(item.id);
                        }
                      }}
                      tabIndex={0}
                    >
                      <TableCell className="w-10">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180 text-primary" : "text-muted-foreground"}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.organizerName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {coerceVariantTags(item.variantTags).map((tag) => (
                            <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {variantTagLabels[tag]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-display text-base font-bold ${isCheapest ? "text-primary" : "text-foreground"}`}>
                          {formatCurrency(item.priceInr)}
                        </span>
                        {isCheapest && (
                          <div className="mt-0.5 text-[10px] font-medium uppercase text-primary/80">
                            Best price
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg text-[11px]">
                          {transportLabels[item.transportType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.mealPlan !== "UNKNOWN" ? (
                          <Badge variant="secondary" className="rounded-lg text-[11px]">
                            {mealPlanLabels[item.mealPlan]}
                          </Badge>
                        ) : null}
                        {item.mealsSummary ? (
                          <div className={`${item.mealPlan !== "UNKNOWN" ? "mt-1 " : ""}max-w-[140px] text-[11px] leading-tight text-muted-foreground`}>
                            {item.mealsSummary}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span
                          title={
                            Date.now() - item.updatedAtMs > STALE_THRESHOLD_MS
                              ? `Data may be outdated — last checked ${formatUpdatedAt(item.lastUpdatedAt)}`
                              : undefined
                          }
                          className="inline-flex items-center gap-1"
                        >
                          {Date.now() - item.updatedAtMs > STALE_THRESHOLD_MS && (
                            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                          )}
                          {formatUpdatedAt(item.lastUpdatedAt)}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg px-3">
                          <a
                            href={item.sourceUrl}
                            onClick={(event) => event.stopPropagation()}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="ml-1.5 text-xs">Visit</span>
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className={isExpanded ? "border-border/20 bg-muted/20" : "border-0"}>
                      <TableCell colSpan={DETAIL_ROW_COL_SPAN} className="p-0">
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? "max-h-[30rem] opacity-100" : "max-h-0 opacity-0"}`}
                        >
                          <div className="bg-muted/35 px-5 py-4 sm:px-6">
                            <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_auto] md:items-start">
                              <div className="space-y-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Pickup points
                                </div>
                                <div className="inline-flex items-start gap-2 text-sm text-foreground">
                                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                  <span className="leading-relaxed text-muted-foreground">
                                    {item.pickupLocations.length > 0
                                      ? item.pickupLocations.join(", ")
                                      : "Check organizer for pickup details"}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  Departure dates
                                </div>
                                {departureDateLabels.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {departureDateLabels.map((label) => (
                                      <span
                                        key={`${item.id}:${label}`}
                                        className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-foreground"
                                      >
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">
                                    Check organizer for dates
                                  </div>
                                )}
                              </div>

                              <div className="md:justify-self-end">
                                <Button asChild className="w-full rounded-xl md:w-auto">
                                  <a href={item.sourceUrl} rel="noreferrer" target="_blank">
                                    Book with {item.organizerName}
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {visiblePackages.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No packages match your filters. Try broadening your search.
          </div>
        )}
      </div>

      <p className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground/70">
        Prices and availability are scraped from organizer websites and may not reflect real-time changes. Always confirm before booking.
      </p>
    </div>
  );
}