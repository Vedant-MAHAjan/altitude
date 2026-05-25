"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/* ============================================================
   ILLUSTRATED MOUNTAIN SCENE — the core visual identity.
   Pure SVG + CSS transforms. No WebGL.
   ============================================================ */

/** Full layered mountain hero scene with sky, peaks, clouds, trees, fog */
export function MountainScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const farY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const nearY = useTransform(scrollYProgress, [0, 1], [0, 25]);
  const cloudsX = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const sunScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87ceeb] via-[#bfe6f7] to-[#faf6f0]" />

      {/* Sun/golden hour glow */}
      <motion.div
        className="absolute left-1/2 top-[8%] h-28 w-28 -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 opacity-80 blur-sm"
        style={{ scale: sunScale }}
      />

      {/* Clouds — CSS animated */}
      <motion.div style={{ x: cloudsX }} className="absolute inset-0">
        <Cloud className="absolute left-[5%] top-[12%] w-36 opacity-80" />
        <Cloud className="absolute left-[55%] top-[8%] w-48 opacity-60 animate-cloud-slow" />
        <Cloud className="absolute left-[30%] top-[18%] w-28 opacity-70 animate-cloud" />
        <Cloud className="absolute right-[10%] top-[22%] w-32 opacity-50" />
      </motion.div>

      {/* Birds — tiny SVG sprites */}
      <div className="animate-bird absolute left-[20%] top-[15%]">
        <Bird />
      </div>
      <div className="animate-bird absolute left-[65%] top-[12%]" style={{ animationDelay: "-4s" }}>
        <Bird />
      </div>

      {/* Far mountains — misty blue */}
      <motion.svg
        className="absolute bottom-0 w-full"
        style={{ y: farY }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="#94a3b8"
      >
        <path d="M0 320 L0 200 Q120 120 240 180 Q360 80 480 150 Q600 60 720 130 Q840 50 960 120 Q1080 70 1200 140 Q1320 90 1440 160 L1440 320 Z" opacity="0.3" />
      </motion.svg>

      {/* Mid mountains — darker slate */}
      <motion.svg
        className="absolute bottom-0 w-full"
        style={{ y: midY }}
        viewBox="0 0 1440 280"
        preserveAspectRatio="none"
        fill="#64748b"
      >
        <path d="M0 280 L0 180 Q180 80 360 160 Q480 60 600 130 Q720 40 840 110 Q960 50 1080 120 Q1200 70 1440 100 L1440 280 Z" opacity="0.5" />
      </motion.svg>

      {/* Fog layer between mountains */}
      <div className="animate-fog-roll absolute bottom-[20%] left-0 h-20 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      {/* Near mountains — forest green */}
      <motion.svg
        className="absolute bottom-0 w-full"
        style={{ y: nearY }}
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <path d="M0 200 L0 120 Q200 40 400 100 Q550 30 700 80 Q850 20 1000 70 Q1150 30 1300 90 Q1400 60 1440 80 L1440 200 Z" fill="#2d6a4f" opacity="0.85" />
        {/* Treeline silhouette */}
        <path d="M0 200 L0 140 Q50 130 80 138 L85 125 L90 138 Q130 132 160 140 L165 120 L170 140 Q220 135 260 142 L265 128 L270 142 Q350 136 400 145 L405 130 L410 145 Q500 138 560 148 L565 132 L570 148 Q650 140 720 150 L725 135 L730 150 Q830 142 900 152 L905 138 L910 152 Q1000 145 1080 155 L1085 140 L1090 155 Q1200 148 1300 158 L1305 142 L1310 158 Q1380 152 1440 160 L1440 200 Z" fill="#1b4332" opacity="0.9" />
      </motion.svg>

      {/* Ground/earth at very bottom */}
      <div className="absolute bottom-0 left-0 h-8 w-full bg-gradient-to-t from-[#faf6f0] to-transparent" />
    </div>
  );
}

/** Drifting clouds SVG */
function Cloud({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="white">
      <ellipse cx="50" cy="25" rx="35" ry="12" opacity="0.9" />
      <ellipse cx="35" cy="22" rx="22" ry="10" opacity="0.8" />
      <ellipse cx="70" cy="23" rx="25" ry="9" opacity="0.85" />
      <ellipse cx="55" cy="18" rx="18" ry="8" opacity="0.7" />
    </svg>
  );
}

/** Bird silhouette */
function Bird() {
  return (
    <svg width="16" height="8" viewBox="0 0 16 8" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
      <path d="M0 4 Q4 0 8 4 Q12 0 16 4" />
    </svg>
  );
}

/** Terrain wave divider — use between sections */
export function TerrainDivider({ variant = "hills" }: { variant?: "hills" | "valley" | "ridge" }) {
  const paths = {
    hills: "M0 40 Q180 0 360 30 Q540 60 720 20 Q900 50 1080 25 Q1260 55 1440 35 L1440 80 L0 80 Z",
    valley: "M0 0 Q360 60 720 30 Q1080 60 1440 0 L1440 80 L0 80 Z",
    ridge: "M0 60 L120 20 L240 45 L360 10 L480 35 L600 5 L720 30 L840 8 L960 40 L1080 15 L1200 38 L1320 12 L1440 45 L1440 80 L0 80 Z",
  };

  return (
    <div className="terrain-divider">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="h-12 w-full md:h-16">
        <path d={paths[variant]} fill="currentColor" />
      </svg>
    </div>
  );
}

/** Trail dashed path — decorative */
export function TrailPath({ className = "" }: { className?: string }) {
  return (
    <svg className={`trail-line ${className}`} viewBox="0 0 200 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M0 10 Q50 2 100 10 Q150 18 200 10" className="animate-trail-dash" style={{ strokeDasharray: "8 6" }} />
    </svg>
  );
}

/** Trekker doodle — tiny illustrated hiker */
export function TrekkerDoodle({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <circle cx="16" cy="8" r="5" fill="#fbbf24" stroke="#92400e" />
      {/* Body */}
      <line x1="16" y1="13" x2="16" y2="30" stroke="#334155" />
      {/* Arms */}
      <line x1="16" y1="18" x2="10" y2="24" stroke="#334155" />
      <line x1="16" y1="18" x2="22" y2="22" stroke="#334155" />
      {/* Legs */}
      <line x1="16" y1="30" x2="12" y2="42" stroke="#334155" />
      <line x1="16" y1="30" x2="20" y2="42" stroke="#334155" />
      {/* Backpack */}
      <rect x="12" y="15" width="8" height="10" rx="2" fill="#c05621" stroke="#92400e" opacity="0.8" />
      {/* Walking stick */}
      <line x1="22" y1="22" x2="26" y2="40" stroke="#92400e" strokeWidth="1" />
    </svg>
  );
}

/** Compass badge — decorative element */
export function CompassBadge({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke="#c05621" strokeWidth="2" opacity="0.6" />
      <circle cx="24" cy="24" r="18" stroke="#c05621" strokeWidth="1" opacity="0.3" />
      <path d="M24 6 L24 10 M24 38 L24 42 M6 24 L10 24 M38 24 L42 24" stroke="#c05621" strokeWidth="1.5" />
      <path d="M24 14 L22 24 L24 34 L26 24 Z" fill="#c05621" opacity="0.7" />
      <path d="M14 24 L24 22 L34 24 L24 26 Z" fill="#2d6a4f" opacity="0.5" />
      <circle cx="24" cy="24" r="2" fill="#c05621" />
    </svg>
  );
}

/** Pine tree cluster — section decoration */
export function PineCluster({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 60" fill="#2d6a4f" opacity="0.7">
      {/* Tree 1 */}
      <polygon points="20,55 25,35 15,40 22,20 13,28 20,8 27,28 18,20 25,40 15,35 20,55" />
      {/* Tree 2 */}
      <polygon points="40,55 45,38 35,42 42,22 34,30 40,10 46,30 38,22 45,42 35,38 40,55" />
      {/* Tree 3 — shorter */}
      <polygon points="58,55 62,42 54,45 59,30 53,36 58,18 63,36 57,30 62,45 54,42 58,55" />
    </svg>
  );
}
