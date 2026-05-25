"use client";

import { motion } from "framer-motion";
import { BarChart3, Clock, IndianRupee, Layers, Shield, Zap } from "lucide-react";

import { TerrainDivider } from "@/components/ui/atmosphere";
import { staggerContainer, fadeUp, defaultTransition } from "@/lib/motion";

const features = [
  {
    icon: IndianRupee,
    title: "Real price comparison",
    description: "Normalized INR prices across organizers. No hidden fees, no guesswork.",
    quip: "Your wallet says thanks.",
  },
  {
    icon: Layers,
    title: "Side-by-side packages",
    description: "Transport, meals, forest fees, pickups — all stacked for instant clarity.",
    quip: "Spreadsheet energy, zero spreadsheets.",
  },
  {
    icon: Clock,
    title: "Always fresh",
    description: "Scraped twice daily. Stale data gets flagged so you see what's current.",
    quip: "Fresher than morning chai.",
  },
  {
    icon: BarChart3,
    title: "Smart filters",
    description: "Sort by price, transport type, meal plan, or departure city in one click.",
    quip: "Decision fatigue? Not here.",
  },
  {
    icon: Zap,
    title: "Zero-cost stack",
    description: "Runs on Vercel free tier. No servers, no subscriptions, no catch.",
    quip: "Free as the Sahyadri breeze.",
  },
  {
    icon: Shield,
    title: "No login required",
    description: "Browse, compare, decide. We don't need your email to be useful.",
    quip: "Privacy by default.",
  },
];

export function ValueProps() {
  return (
    <section className="relative bg-secondary/40">
      {/* Ridge terrain top */}
      <div className="text-secondary/40">
        <TerrainDivider variant="ridge" />
      </div>

      <motion.div
        className="mx-auto max-w-7xl px-6 py-16 md:py-24"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div className="text-center" variants={fadeUp} transition={defaultTransition}>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">
            Built for trekkers,{" "}
            <span className="text-muted-foreground">not tourists</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            We compare what actually matters when you&apos;re choosing between five organizers running the same trail.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border transition-all duration-300 hover:shadow-md hover:ring-primary/30"
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.06 }}
            >
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <p className="mt-2 font-editorial text-xs text-accent/80 italic">
                  {feature.quip}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
