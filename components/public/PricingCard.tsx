"use client";

import { Check } from "lucide-react";
import { formatINR } from "@/lib/utils/formatters";
import { getSlotTypeLabel } from "@/lib/utils/slots";
import type { FacilityPackage } from "@/types/database";
import { cn } from "@/lib/utils/formatters";
import { motion } from "framer-motion";

interface PricingCardProps {
  pkg: FacilityPackage;
  selected?: boolean;
  onSelect?: (pkg: FacilityPackage) => void;
  isResident?: boolean | null;
}

export function PricingCard({ pkg, selected, onSelect, isResident }: PricingCardProps) {
  const typeLabel = getSlotTypeLabel(pkg.type);
  const isClickable = !!onSelect;

  const timingLabel =
    pkg.start_time && pkg.end_time
      ? `${pkg.start_time} – ${pkg.end_time}`
      : pkg.duration_hours
      ? `${pkg.duration_hours} hour${pkg.duration_hours > 1 ? "s" : ""} per booking`
      : null;

  const hasResidentPrice = pkg.resident_price !== null && pkg.resident_price < pkg.price;
  const displayPrice = isResident && hasResidentPrice ? pkg.resident_price! : pkg.price;

  return (
    <motion.div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={() => onSelect?.(pkg)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(pkg)}
      whileHover={isClickable ? { scale: 1.02, y: -2 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative border rounded-xl p-5 transition-all duration-200",
        isClickable && "cursor-pointer hover:shadow-md",
        selected
          ? "border-blue-600 bg-blue-50 shadow-sm ring-1 ring-blue-600"
          : "border-slate-200 bg-white hover:border-blue-400"
      )}
    >
      <div className="flex gap-3">
        {isClickable && (
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                selected
                  ? "border-blue-600 bg-blue-600"
                  : "border-slate-300 bg-white group-hover:border-blue-400"
              )}
            >
              {selected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
            </div>
          </div>
        )}

        <div className="flex-grow">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold text-slate-900">{pkg.name}</h4>
              <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                {typeLabel}
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-slate-700">{formatINR(displayPrice)}</p>
              {pkg.type === "hourly" && (
                <p className="text-xs text-slate-400">/hour</p>
              )}
            </div>
          </div>

          {timingLabel && (
            <p className="text-xs text-slate-500 mt-2">{timingLabel}</p>
          )}

          {pkg.description && (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{pkg.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
