"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

import { MountainScene, CompassBadge, TrailPath } from "@/components/ui/atmosphere";
import { fadeUp, staggerContainer, defaultTransition } from "@/lib/motion";

type HeroStatsProps = {
  routeCount: number;
  organizerCount: number;
  priceFloor: number;
};

const heroQuips = [
  "Comparing trek organizers so you don't need 19 tabs open.",
  "Leg day regret guaranteed.",
  "Because spreadsheets deserve better views.",
];

export function HeroSection({ routeCount, organizerCount, priceFloor }: HeroStatsProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={sectionRef} className="relative min-h-[92vh] overflow-hidden flex items-end pb-16 md:pb-24">
      {/* Illustrated mountain scene */}
      <MountainScene />

      {/* Main content — sits at bottom over the scene */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-7xl px-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Compass badge — decorative */}
        <motion.div
          className="absolute -top-32 right-8 hidden md:block animate-sway"
          variants={fadeUp}
        >
          <CompassBadge className="h-16 w-16 opacity-60" />
        </motion.div>

        {/* Eyebrow — stamp-like */}
        <motion.div variants={fadeUp} transition={defaultTransition}>
          <span className="stamp">
            <span className="mr-1.5">⛰</span>
            Maharashtra Trek Comparison
          </span>
        </motion.div>

        {/* Headline — editorial serif */}
        <motion.h1
          className="mt-6 max-w-4xl font-display text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.1 }}
        >
          Find your trail.{" "}
          <span className="text-primary">
            Compare the rest.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.2 }}
        >
          Stop tab-hopping between organizers. We scrape, normalize, and stack
          every Maharashtra trek package side-by-side — price, transport, meals,
          and route details.{" "}
          <span className="font-editorial text-accent text-xl">No marketing fluff.</span>
        </motion.p>

        {/* Witty quip */}
        <motion.p
          className="mt-3 font-editorial text-base text-muted-foreground/70 italic"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.3 }}
        >
          &ldquo;{heroQuips[0]}&rdquo;
        </motion.p>

        {/* Trail decoration */}
        <motion.div
          className="my-6 text-accent/40"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.35 }}
        >
          <TrailPath className="w-48" />
        </motion.div>

        {/* Stats — like a field journal entry */}
        <motion.div
          className="flex flex-wrap items-center gap-6 md:gap-10"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.4 }}
        >
          <StatBadge label="Routes tracked" value={String(routeCount)} />
          <StatBadge label="Organizers" value={String(organizerCount)} />
          <StatBadge
            label="Prices from"
            value={`₹${priceFloor.toLocaleString("en-IN")}`}
          />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="mt-10 flex items-center gap-3 text-muted-foreground/50"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.6 }}
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="10" height="18" rx="5" />
            <circle cx="6" cy="6" r="1.5" fill="currentColor" className="animate-float-gentle" />
          </svg>
          <span className="text-xs uppercase tracking-widest">
            Scroll to explore
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 rounded-xl bg-white/70 px-4 py-2.5 shadow-sm ring-1 ring-border">
      <span className="font-display text-2xl font-bold text-primary md:text-3xl">
        {value}
      </span>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
