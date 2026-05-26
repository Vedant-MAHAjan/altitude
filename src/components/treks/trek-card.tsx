"use client";

import type { Route } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { fadeUp, defaultTransition } from "@/lib/motion";
import { departureCityLabels, variantTagLabels } from "@/lib/normalization/catalog";
import { getTaglineForSlug } from "@/lib/taglines";
import type { DepartureCityCode, VariantTagCode } from "@/lib/types";

type TrekCardProps = {
  destinationName: string;
  destinationSlug: string;
  routePath: string;
  departureCity: DepartureCityCode;
  startingPrice: number | null;
  organizerCount: number;
  availableVariants: VariantTagCode[];
  packageCount: number;
  index: number;
};

export function TrekCard({
  destinationName,
  destinationSlug,
  routePath,
  departureCity,
  startingPrice,
  organizerCount,
  availableVariants,
  packageCount,
  index,
}: TrekCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...defaultTransition, delay: index * 0.08 }}
    >
      <Link href={routePath as Route} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:ring-primary/30">
          {/* Top-left corner pine decoration */}
          <svg className="absolute -left-2 -top-2 h-10 w-10 text-primary/10" viewBox="0 0 40 40" fill="currentColor">
            <polygon points="20,2 24,14 16,10 22,22 14,18 20,32 26,18 18,22 24,10 16,14" />
          </svg>

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
            <p className="mt-1 font-editorial text-sm text-muted-foreground/70 italic">
              {getTaglineForSlug(destinationSlug)}
            </p>
          </div>

          {/* Variant tags */}
          <div className="relative mt-3 flex flex-wrap gap-1.5">
            {availableVariants.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                {variantTagLabels[tag]}
              </Badge>
            ))}
            {availableVariants.length > 3 && (
              <Badge
                variant="outline"
                className="rounded-full border-border px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                +{availableVariants.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats row — journal entry style */}
          <div className="relative mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                From
              </div>
              <div className="mt-0.5 font-display text-sm font-bold text-accent">
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
          </div>

          {/* Bottom trail accent */}
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-opacity opacity-0 group-hover:opacity-100" />
        </div>
      </Link>
    </motion.div>
  );
}
