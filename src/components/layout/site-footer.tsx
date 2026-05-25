import Link from "next/link";
import { Mountain } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mountain className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold">MahaTrek</div>
            <div className="text-xs text-muted-foreground">
              Trek smarter, not harder.
            </div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="/treks" className="transition-colors hover:text-foreground">
            All routes
          </Link>
          <Link href="/organizers" className="transition-colors hover:text-foreground">
            Organizers
          </Link>
        </nav>
      </div>
    </footer>
  );
}