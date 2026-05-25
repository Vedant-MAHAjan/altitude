import Link from "next/link";
import { Mountain } from "lucide-react";

const footerQuips = [
  "Clouds > visibility.",
  "Leg day regret guaranteed.",
  "Your knees called — they said good luck.",
  "Trek smarter, not harder.",
];

export function SiteFooter() {
  const quip = footerQuips[Math.floor(Date.now() / 86400000) % footerQuips.length];

  return (
    <footer className="relative border-t border-border/30">
      {/* Top glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mountain className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold text-foreground">MahaTrek</div>
            <div className="text-xs italic text-muted-foreground/60">
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
      </div>
    </footer>
  );
}