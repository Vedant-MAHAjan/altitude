"use client";

import { motion } from "framer-motion";
import { BarChart3, Clock, IndianRupee, Layers, Shield, Zap } from "lucide-react";

import { staggerContainer, fadeUp, defaultTransition, cinematicReveal, cinematicTransition } from "@/lib/motion";

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
    <section className="relative border-t border-border/30">
      {/* Top glow line */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <motion.div
        className="mx-auto max-w-7xl px-6 py-20 md:py-32"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div
          className="text-center"
          variants={cinematicReveal}
          transition={cinematicTransition}
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Built for trekkers,{" "}
            <span className="text-muted-foreground/40">not tourists</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            We compare what actually matters when you&apos;re choosing between five organizers running the same trail.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(52,211,153,0.06)]"
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.06 }}
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/[0.04] opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <p className="mt-2 text-xs italic text-primary/50">
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
