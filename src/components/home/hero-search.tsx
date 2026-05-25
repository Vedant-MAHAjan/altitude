"use client";

import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { fadeUp, defaultTransition } from "@/lib/motion";
import type { TrekSearchEntry } from "@/lib/types";

type HeroSearchProps = {
  treks: TrekSearchEntry[];
};

function normalizeSearchTerm(value: string) {
  return value.trim().toLowerCase();
}

export function HeroSearch({ treks }: HeroSearchProps) {
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
      ).slice(0, 6)
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
    <motion.div
      ref={containerRef}
      className="relative mx-auto w-full max-w-2xl"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ ...defaultTransition, delay: 0.35 }}
    >
      <div className="glass relative flex items-center overflow-hidden rounded-2xl transition-shadow duration-300 focus-within:shadow-[0_0_30px_rgba(52,211,153,0.1)] focus-within:border-primary/30">
        <Search className="ml-5 h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          aria-label="Search treks"
          className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base text-foreground outline-none placeholder:text-muted-foreground md:py-5 md:text-lg"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Harishchandragad, Kalsubai, Rajgad..."
          type="search"
          value={query}
        />
        <button
          className="mr-2 flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(52,211,153,0.3)] active:scale-95 md:mr-3 md:h-11 md:px-5"
          onClick={() => {
            if (matches[0]) navigateToTrek(matches[0].slug);
            else {
              startTransition(() => router.push("/treks"));
              setIsOpen(false);
            }
          }}
          type="button"
        >
          <span className="hidden sm:inline">Explore</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && matches.length > 0 && (
        <motion.div
          className="glass-strong absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.3)]"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ul className="py-2">
            {matches.map((trek, idx) => (
              <li key={trek.slug}>
                <button
                  className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm transition-colors ${
                    idx === focusedIndex
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-primary/5"
                  }`}
                  onClick={() => navigateToTrek(trek.slug)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  type="button"
                >
                  <span className="font-medium">{trek.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
