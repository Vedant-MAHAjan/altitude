"use client";

import Link from "next/link";
import { Mountain } from "lucide-react";

import { PineCluster } from "@/components/ui/atmosphere";

const footerQuips = [
  "Clouds > visibility.",
  "Leg day regret guaranteed.",
  "Your knees called — they said good luck.",
  "Trek smarter, not harder.",
];

export function SiteFooter() {
  const quip = footerQuips[0];

  return (
    <footer className="relative border-t border-border bg-muted/30">
      {/* Decorative terrain silhouette */}
      <div className="pointer-events-none absolute -top-6 left-0 w-full overflow-hidden">
        <svg viewBox="0 0 1440 24" preserveAspectRatio="none" className="h-6 w-full text-muted/30">
          <path d="M0 24 L0 18 Q200 6 400 14 Q600 2 800 12 Q1000 4 1200 10 Q1350 6 1440 8 L1440 24 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mountain className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold text-foreground">MahaTrek</div>
            <div className="font-editorial text-xs text-muted-foreground/70 italic">
              {quip}
            </div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="/treks" className="transition-colors hover:text-primary">
            All routes
          </Link>
          <Link href="/organizers" className="transition-colors hover:text-primary">
            Organizers
          </Link>
        </nav>
        <PineCluster className="hidden h-12 w-20 opacity-30 md:block" />
      </div>
    </footer>
  );
}