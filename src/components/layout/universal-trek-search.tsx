"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { TrekSearchEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type UniversalTrekSearchProps = {
  treks: TrekSearchEntry[];
};

function normalizeSearchTerm(value: string) {
  return value.trim().toLowerCase();
}

export function UniversalTrekSearch({ treks }: UniversalTrekSearchProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchTerm(deferredQuery);

  const matches = normalizedQuery
    ? treks.filter((trek) =>
        [trek.name, ...trek.aliases].some((value) =>
          normalizeSearchTerm(value).includes(normalizedQuery),
        ),
      )
    : [];

  const visibleMatches = matches.slice(0, 8);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function navigateToTrek(slug: string) {
    startTransition(() => {
      router.push(`/treks/${slug}`);
    });

    setIsOpen(false);
    setQuery("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedQuery) {
      startTransition(() => {
        router.push("/treks");
      });
      setIsOpen(false);
      return;
    }

    const exactMatch = treks.find((trek) => {
      const searchTerms = [trek.name, ...trek.aliases].map(normalizeSearchTerm);
      return searchTerms.includes(normalizedQuery);
    });

    const fallbackMatch = visibleMatches[0];
    const target = exactMatch ?? fallbackMatch;

    if (target) {
      navigateToTrek(target.slug);
      return;
    }

    setIsOpen(false);
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <form
        className="flex items-center gap-3 rounded-[1.75rem] border border-border/70 bg-white/80 p-2 shadow-[0_12px_36px_rgba(31,45,36,0.08)]"
        onSubmit={handleSubmit}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.1rem] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search all treks"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search all treks, forts, waterfalls, and camping variants"
            type="search"
            value={query}
          />
        </div>
        <Button size="sm" type="submit" variant="outline">
          Search
        </Button>
      </form>

      {isOpen && normalizedQuery ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[1.75rem] border border-border/70 bg-white/95 shadow-[0_20px_50px_rgba(31,45,36,0.14)] backdrop-blur-xl">
          <div className="border-b border-border/60 px-4 py-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            {matches.length} matching trek{matches.length === 1 ? "" : "s"}
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {visibleMatches.length > 0 ? (
              visibleMatches.map((trek) => {
                const matchingAlias = trek.aliases.find((value) =>
                  normalizeSearchTerm(value).includes(normalizedQuery),
                );

                return (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between gap-4 rounded-[1.25rem] px-4 py-3 text-left transition hover:bg-secondary/70",
                      matchingAlias && matchingAlias !== trek.name ? "items-start" : "items-center",
                    )}
                    key={trek.slug}
                    onClick={() => navigateToTrek(trek.slug)}
                    onMouseDown={(event) => event.preventDefault()}
                    type="button"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{trek.name}</div>
                      {matchingAlias && matchingAlias !== trek.name ? (
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          Matched via {matchingAlias}
                        </div>
                      ) : null}
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No trek cards match that search yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}