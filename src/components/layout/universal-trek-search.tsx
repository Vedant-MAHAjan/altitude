"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import type { TrekSearchEntry } from "@/lib/types";

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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchTerm(deferredQuery);

  const matches = normalizedQuery
    ? treks.filter((trek) =>
        [trek.name, ...trek.aliases].some((value) =>
          normalizeSearchTerm(value).includes(normalizedQuery),
        ),
      ).slice(0, 8)
    : [];

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

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (focusedIndex >= 0 && matches[focusedIndex]) {
        navigateToTrek(matches[focusedIndex].slug);
      } else if (matches[0]) {
        navigateToTrek(matches[0].slug);
      } else {
        startTransition(() => router.push("/treks"));
        setIsOpen(false);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative w-full max-w-lg" ref={containerRef}>
      <div className="flex items-center rounded-xl border border-border/50 bg-secondary/50 transition-all focus-within:border-primary/30 focus-within:bg-secondary focus-within:shadow-[0_0_20px_rgba(52,211,153,0.08)]">
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          aria-label="Search treks"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search treks..."
          type="search"
          value={query}
        />
      </div>

      {/* Dropdown */}
      {isOpen && matches.length > 0 && (
        <div className="glass-strong absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
          <ul className="py-1.5">
            {matches.map((trek, idx) => (
              <li key={trek.slug}>
                <button
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    idx === focusedIndex
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-primary/5"
                  }`}
                  onClick={() => navigateToTrek(trek.slug)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  type="button"
                >
                  <span className="font-medium">{trek.name}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
