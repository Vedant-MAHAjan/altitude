import Link from "next/link";
import { Mountain, Rows3, Zap } from "lucide-react";

import { UniversalTrekSearch } from "@/components/layout/universal-trek-search";
import { Button } from "@/components/ui/button";
import { getTrekSearchIndex } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export async function SiteHeader() {
  const treks = await getTrekSearchIndex();

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/65 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(34,84,61,0.2)]">
              <Mountain className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg leading-none">MahaTrek Compare</div>
              <div className="mt-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Zero-cost trek comparisons
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {siteConfig.navItems.map((item) => (
              <Button asChild key={item.href} size="sm" variant="ghost">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-2 text-xs text-muted-foreground lg:flex">
              <Rows3 className="h-4 w-4" />
              Static pages + cached data
            </div>
            <Button asChild size="sm">
              <Link href="/treks">
                <Zap className="h-4 w-4" />
                Compare now
              </Link>
            </Button>
          </div>
        </div>

        <UniversalTrekSearch treks={treks} />
      </div>
    </header>
  );
}