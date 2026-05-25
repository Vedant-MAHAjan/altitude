"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { FogLayers, MountainParallax, AmbientParticles } from "@/components/ui/atmosphere";
import { fadeUp, staggerContainer, defaultTransition, cinematicReveal, cinematicTransition } from "@/lib/motion";

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
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const statsY = useTransform(scrollYProgress, [0, 1], [0, -20]);

  return (
    <section ref={sectionRef} className="relative min-h-[90vh] overflow-hidden flex items-center">
      {/* Atmospheric layers */}
      <FogLayers />
      <MountainParallax />
      <AmbientParticles count={15} />

      {/* Main content */}
      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-32"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow chip */}
        <motion.div variants={fadeUp} transition={defaultTransition}>
          <span className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            Maharashtra trek comparison
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="mt-8 max-w-5xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
          variants={cinematicReveal}
          transition={{ ...cinematicTransition, delay: 0.1 }}
          style={{ y: titleY }}
        >
          Find your trail.{" "}
          <span className="bg-gradient-to-r from-primary via-emerald-300 to-primary bg-clip-text text-transparent text-glow">
            Compare the rest.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.25 }}
        >
          Stop tab-hopping between organizers. We scrape, normalize, and stack
          every Maharashtra trek package side-by-side — price, transport, meals,
          departure dates.{" "}
          <span className="text-primary/80 italic">No marketing fluff.</span>
        </motion.p>

        {/* Witty quip - rotates on mount */}
        <motion.p
          className="mt-4 text-sm text-muted-foreground/60 italic"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.35 }}
        >
          &ldquo;{heroQuips[Math.floor(Date.now() / 86400000) % heroQuips.length]}&rdquo;
        </motion.p>

        {/* Stats strip */}
        <motion.div
          className="mt-12 flex flex-wrap gap-8 md:gap-12"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.4 }}
          style={{ y: statsY }}
        >
          <StatPill label="Routes tracked" value={String(routeCount)} />
          <StatPill label="Organizers" value={String(organizerCount)} />
          <StatPill
            label="Prices from"
            value={`₹${priceFloor.toLocaleString("en-IN")}`}
          />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="mt-16 flex items-center gap-3"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.6 }}
        >
          <div className="flex flex-col items-center">
            <div className="h-8 w-px bg-gradient-to-b from-primary/60 to-transparent" />
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground/50">
            Scroll to explore
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="group flex items-center gap-3">
      <div className="font-display text-3xl font-bold text-foreground transition-colors group-hover:text-primary md:text-4xl">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
