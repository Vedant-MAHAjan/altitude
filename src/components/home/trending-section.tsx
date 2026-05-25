"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

import { TrekCard } from "@/components/treks/trek-card";
import { staggerContainer, fadeUp, defaultTransition, cinematicReveal, cinematicTransition } from "@/lib/motion";
import type { DestinationCitySummary } from "@/lib/types";

type TrendingSectionProps = {
  routes: DestinationCitySummary[];
};

export function TrendingSection({ routes }: TrendingSectionProps) {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-20 md:py-32">
      {/* Section glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <motion.div
        className="flex flex-col gap-12"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Section header */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          variants={cinematicReveal}
          transition={cinematicTransition}
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-accent">
              <TrendingUp className="h-4 w-4" />
              Trending routes
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
              Where everyone&apos;s headed
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              The most compared routes this season — sorted by organizer count and upcoming departures.
            </p>
          </div>
          <Link
            href="/treks"
            className="glass group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:text-primary"
          >
            View all routes
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Trek cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route, index) => (
            <TrekCard
              key={route.routePath}
              destinationName={route.destinationName}
              routePath={route.routePath}
              departureCity={route.departureCity}
              startingPrice={route.startingPrice}
              organizerCount={route.organizerCount}
              nextDepartureAt={route.nextDepartureAt}
              availableVariants={route.availableVariants}
              packageCount={route.packageCount}
              index={index}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
