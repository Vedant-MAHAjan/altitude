"use client";

import type { Route } from "next";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { getStaticTrekLabel } from "@/lib/microcopy";
import { fadeUp, defaultTransition } from "@/lib/motion";
import { departureCityLabels, variantTagLabels } from "@/lib/normalization/catalog";
import type { DepartureCityCode, VariantTagCode } from "@/lib/types";

type TrekCardProps = {
  destinationName: string;
  routePath: string;
  departureCity: DepartureCityCode;
  startingPrice: number | null;
  organizerCount: number;
  nextDepartureAt: string | null;
  availableVariants: VariantTagCode[];
  packageCount: number;
  index: number;
};

export function TrekCard({
  destinationName,
  routePath,
  departureCity,
  startingPrice,
  organizerCount,
  nextDepartureAt,
  availableVariants,
  packageCount,
  index,
}: TrekCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect on hover
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...defaultTransition, delay: index * 0.08 }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="will-change-transform"
    >
      <Link href={routePath as Route} className="group block">
        <div className="glass relative overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_40px_rgba(52,211,153,0.1)] hover:-translate-y-1">
          {/* Hover glow effect */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.03] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Header row */}
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <MapPin className="h-3 w-3" />
              {departureCityLabels[departureCity]}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {organizerCount} organizers
            </div>
          </div>

          {/* Title + microcopy */}
          <div className="relative mt-3">
            <h3 className="font-display text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {destinationName}
            </h3>
            <p className="mt-1 text-xs italic text-muted-foreground/60">
              {getStaticTrekLabel(index)}
            </p>
          </div>

          {/* Variant tags — floating chips */}
          <div className="relative mt-3 flex flex-wrap gap-1.5">
            {availableVariants.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full border-primary/10 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary/80"
              >
                {variantTagLabels[tag]}
              </Badge>
            ))}
            {availableVariants.length > 3 && (
              <Badge
                variant="outline"
                className="rounded-full border-border/50 px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                +{availableVariants.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="relative mt-4 grid grid-cols-3 gap-2 rounded-xl bg-secondary/50 p-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                From
              </div>
              <div className="mt-0.5 font-display text-sm font-bold text-primary">
                {formatCurrency(startingPrice)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Packages
              </div>
              <div className="mt-0.5 font-display text-sm font-bold text-foreground">
                {packageCount}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-2.5 w-2.5" />
                Next
              </div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">
                {formatDateShort(nextDepartureAt)}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
