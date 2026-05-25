"use client";

import { motion } from "framer-motion";
import { BarChart3, Clock, IndianRupee, Layers, Shield, Zap } from "lucide-react";

import { staggerContainer, fadeUp, defaultTransition } from "@/lib/motion";

const features = [
  {
    icon: IndianRupee,
    title: "Real price comparison",
    description: "Normalized INR prices across organizers. No hidden fees, no guesswork.",
  },
  {
    icon: Layers,
    title: "Side-by-side packages",
    description: "Transport, meals, forest fees, pickups — all stacked for instant clarity.",
  },
  {
    icon: Clock,
    title: "Always fresh",
    description: "Scraped twice daily. Stale data gets flagged so you see what's current.",
  },
  {
    icon: BarChart3,
    title: "Smart filters",
    description: "Sort by price, transport type, meal plan, or departure city in one click.",
  },
  {
    icon: Zap,
    title: "Zero-cost stack",
    description: "Runs on Vercel free tier. No servers, no subscriptions, no catch.",
  },
  {
    icon: Shield,
    title: "No login required",
    description: "Browse, compare, decide. We don't need your email to be useful.",
  },
];

export function ValueProps() {
  return (
    <section className="border-t border-border/50 bg-gradient-to-b from-transparent to-muted/30">
      <motion.div
        className="mx-auto max-w-7xl px-6 py-16 md:py-24"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div
          className="text-center"
          variants={fadeUp}
          transition={defaultTransition}
        >
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Built for trekkers, not tourists
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            We compare what actually matters when you&apos;re choosing between five organizers running the same trail.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group rounded-2xl border border-border/40 bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/15 hover:bg-white/80 hover:shadow-[0_4px_24px_rgba(27,67,50,0.06)]"
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.05 }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary/12">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
