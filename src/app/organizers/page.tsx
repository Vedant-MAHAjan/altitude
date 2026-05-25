import type { Metadata, Route } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getOrganizerIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Organizer Coverage",
  description:
    "Browse trekking organizers tracked by the Maharashtra trek comparison MVP.",
  alternates: {
    canonical: "/organizers",
  },
};

export default async function OrganizersPage() {
  const organizers = await getOrganizerIndex();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="space-y-4">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
          Organizers
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
          Who&apos;s running the trails
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          We track pricing and freshness for each organizer so you can compare them side by side.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {organizers.map((organizer) => (
          <div
            key={organizer.slug}
            className="glass group overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(52,211,153,0.06)] hover:-translate-y-0.5"
          >
            <Link href={`/organizers/${organizer.slug}` as Route} className="block">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="rounded-full text-[11px]">
                  {organizer.activeTreks} treks
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {organizer.packageCount} packages
                </span>
              </div>

              <h3 className="mt-3 font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                {organizer.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {organizer.description ?? "Compared across destinations"}
              </p>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                View details
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>

            {organizer.websiteUrl && (
              <a
                href={organizer.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Website
              </a>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}