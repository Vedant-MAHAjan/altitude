import type { Variants } from "framer-motion";

// --- Entrance Variants ---

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

// --- Cinematic Variants ---

export const cinematicReveal: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.97, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
};

export const parallaxLayer: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export const glowPulse: Variants = {
  idle: { opacity: 0.4, scale: 1 },
  pulse: { opacity: 0.8, scale: 1.05 },
};

// --- Container Variants ---

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// --- Transitions ---

export const defaultTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const smoothSpring = {
  type: "spring" as const,
  stiffness: 200,
  damping: 30,
  mass: 1,
};

export const springTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
};

export const cinematicTransition = {
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const slowReveal = {
  duration: 1.2,
  ease: [0.22, 1, 0.36, 1] as const,
};
