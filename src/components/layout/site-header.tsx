import Link from "next/link";
import { Mountain } from "lucide-react";

import { UniversalTrekSearch } from "@/components/layout/universal-trek-search";
import { Button } from "@/components/ui/button";
import { getTrekSearchIndex } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export async function SiteHeader() {
  const treks = await getTrekSearchIndex();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3.5">
        <Link className="flex shrink-0 items-center gap-2.5" href="/">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(27,67,50,0.2)]">
            <Mountain className="h-4 w-4" />
          </div>
          <span className="hidden font-display text-base font-bold tracking-tight sm:inline">
            MahaTrek
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <UniversalTrekSearch treks={treks} />
        </div>

        <nav className="hidden shrink-0 items-center gap-1 md:flex">
          {siteConfig.navItems.map((item) => (
            <Button asChild key={item.href} size="sm" variant="ghost" className="text-sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}