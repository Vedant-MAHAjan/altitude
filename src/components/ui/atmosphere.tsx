"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Animated fog layers with parallax — creates a cinematic mountain atmosphere.
 * Pure CSS gradients, no images or WebGL. 
 */
export function FogLayers() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Deep ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-transparent" />

      {/* Emerald glow — top left */}
      <div className="animate-drift absolute -left-32 -top-32 h-[500px] w-[600px] rounded-full bg-gradient-to-br from-primary/[0.08] to-transparent blur-[100px]" />

      {/* Amber accent glow — right */}
      <div
        className="animate-drift absolute -right-20 top-40 h-[400px] w-[500px] rounded-full bg-gradient-to-bl from-accent/[0.06] to-transparent blur-[80px]"
        style={{ animationDelay: "-8s" }}
      />

      {/* Fog band — mid */}
      <div className="animate-fog absolute left-0 top-1/3 h-48 w-full bg-gradient-to-r from-transparent via-primary/[0.03] to-transparent" />

      {/* Lower fog */}
      <div
        className="animate-fog absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-primary/[0.04] to-transparent"
        style={{ animationDelay: "-12s" }}
      />
    </div>
  );
}

/**
 * Mountain silhouette SVG layers with parallax on scroll.
 * Three depth layers for a sense of depth.
 */
export function MountainParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 140]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute bottom-0 left-0 right-0 h-[300px] overflow-hidden"
      aria-hidden
    >
      {/* Far range — faintest */}
      <motion.svg
        className="absolute bottom-0 w-full text-primary/[0.04]"
        style={{ y: y3 }}
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0 200 L120 100 L240 140 L360 60 L480 110 L600 40 L720 90 L840 30 L960 80 L1080 50 L1200 100 L1320 70 L1440 120 L1440 200 Z" />
      </motion.svg>

      {/* Mid range */}
      <motion.svg
        className="absolute bottom-0 w-full text-primary/[0.07]"
        style={{ y: y2 }}
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0 160 L180 80 L300 120 L420 50 L540 100 L720 30 L900 90 L1080 40 L1260 100 L1440 60 L1440 160 Z" />
      </motion.svg>

      {/* Near range — darkest */}
      <motion.svg
        className="absolute bottom-0 w-full text-primary/[0.12]"
        style={{ y: y1 }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0 120 L200 60 L400 90 L600 30 L800 70 L1000 20 L1200 60 L1440 40 L1440 120 Z" />
      </motion.svg>
    </div>
  );
}

/**
 * Floating ambient particles — tiny dots that drift slowly.
 * Rendered as static elements with CSS animation for zero JS cost.
 */
export function AmbientParticles({ count = 20 }: { count?: number }) {
  // Deterministic positions based on index
  const particles = Array.from({ length: count }, (_, i) => ({
    left: `${(i * 37 + 13) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    size: 1 + (i % 3),
    delay: `${-(i * 2.3)}s`,
    duration: `${15 + (i % 10) * 2}s`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p, i) => (
        <div
          key={i}
          className="animate-drift absolute rounded-full bg-primary/20"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Scroll-reactive gradient that shifts hue based on scroll position.
 */
export function ScrollGradient() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.06, 0.02]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-primary via-accent to-primary"
      style={{ opacity }}
      aria-hidden
    />
  );
}
