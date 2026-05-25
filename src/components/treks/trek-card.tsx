"use client";

import type { Route } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";

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
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...defaultTransition, delay: index * 0.05 }}
    >
      <Link href={routePath as Route} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-white/80 p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-[0_8px_40px_rgba(27,67,50,0.1)] hover:-translate-y-1">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
              <MapPin className="h-3 w-3" />
              {departureCityLabels[departureCity]}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {organizerCount} organizers
            </div>
          </div>

          {/* Title + microcopy */}
          <div className="mt-3">
            <h3 className="font-display text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {destinationName}
            </h3>
            <p className="mt-1 text-xs italic text-muted-foreground">
              {getStaticTrekLabel(index)}
            </p>
          </div>

          {/* Variant tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {availableVariants.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              >
                {variantTagLabels[tag]}
              </Badge>
            ))}
            {availableVariants.length > 3 && (
              <Badge
                variant="outline"
                className="rounded-full px-2.5 py-0.5 text-[11px]"
              >
                +{availableVariants.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                From
              </div>
              <div className="mt-0.5 font-display text-sm font-bold text-foreground">
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
