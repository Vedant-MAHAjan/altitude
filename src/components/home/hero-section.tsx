"use client";

import { motion } from "framer-motion";
import { fadeUp, fadeIn, staggerContainer, defaultTransition } from "@/lib/motion";

type HeroStatsProps = {
  routeCount: number;
  organizerCount: number;
  priceFloor: number;
};

export function HeroSection({ routeCount, organizerCount, priceFloor }: HeroStatsProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <div className="absolute -top-32 left-1/2 h-96 w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-100/40 via-amber-50/30 to-emerald-100/40 blur-3xl" />
      </div>

      <motion.div
        className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 md:pb-24 md:pt-20"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow */}
        <motion.div variants={fadeUp} transition={defaultTransition}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Maharashtra trek comparison
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="mt-8 max-w-4xl font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.1 }}
        >
          Find your trail.{" "}
          <span className="bg-gradient-to-r from-primary via-emerald-700 to-primary bg-clip-text text-transparent">
            Compare the rest.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.2 }}
        >
          Stop tab-hopping between organizers. We scrape, normalize, and stack
          every Maharashtra trek package side-by-side so you can pick by price,
          transport, meals, and departure date — not marketing fluff.
        </motion.p>

        {/* Stats strip */}
        <motion.div
          className="mt-10 flex flex-wrap gap-6 md:gap-10"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.3 }}
        >
          <StatPill label="Routes tracked" value={String(routeCount)} />
          <StatPill label="Organizers" value={String(organizerCount)} />
          <StatPill
            label="Prices from"
            value={`₹${priceFloor.toLocaleString("en-IN")}`}
          />
        </motion.div>

        {/* Decorative mountain range */}
        <motion.div
          className="pointer-events-none absolute -bottom-4 right-0 hidden opacity-[0.04] lg:block"
          variants={fadeIn}
          transition={{ ...defaultTransition, delay: 0.5 }}
        >
          <svg width="400" height="120" viewBox="0 0 400 120" fill="currentColor">
            <path d="M0 120 L60 50 L100 80 L160 20 L220 70 L280 30 L340 60 L400 10 L400 120 Z" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="font-display text-2xl font-bold text-foreground md:text-3xl">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
