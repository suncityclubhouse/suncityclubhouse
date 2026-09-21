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

  const hasResidentRate = pkg.resident_price !== null && pkg.resident_price !== pkg.price;

  // The price that applies to this user based on their residency
  const applicablePrice =
    isResident && hasResidentRate ? pkg.resident_price! : pkg.price;

  return (
    <motion.div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={() => onSelect?.(pkg)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(pkg)}
      whileHover={isClickable ? { scale: 1.015, y: -1 } : undefined}
      whileTap={isClickable ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.18 }}
      className={cn(
        "group relative border rounded-xl p-5 transition-all duration-200",
        isClickable && "cursor-pointer",
        selected
          ? "border-blue-600 bg-blue-50/60 shadow-[0_0_0_1px_#08428C] shadow-blue-600/20"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      )}
    >
      {/* Selected check */}
      {isClickable && (
        <div className="absolute top-4 right-4">
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
              selected
                ? "border-blue-600 bg-blue-600"
                : "border-slate-300 bg-white group-hover:border-slate-400"
            )}
          >
            {selected && <Check className="w-3 h-3 text-white stroke-[3]" />}
          </div>
        </div>
      )}

      {/* Package name + type label */}
      <div className="mb-3 pr-6">
        <h4 className="font-semibold text-slate-900 text-[15px] leading-snug">{pkg.name}</h4>
        <span className="mt-1 inline-block text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full">
          {typeLabel}
        </span>
        {timingLabel && (
          <p className="text-xs text-slate-400 mt-1.5">{timingLabel}</p>
        )}
        {pkg.description && (
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{pkg.description}</p>
        )}
      </div>

      {/* Pricing tiers */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        {/* Resident rate */}
        {hasResidentRate && (
          <div className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 border",
            isResident
              ? "bg-emerald-50 border-emerald-200"
              : "bg-slate-50 border-slate-200 opacity-60"
          )}>
            <span className={cn(
              "text-xs font-medium",
              isResident ? "text-emerald-700" : "text-slate-500"
            )}>
              Society Member
            </span>
            <span className={cn(
              "font-semibold text-sm",
              isResident ? "text-emerald-800" : "text-slate-600"
            )}>
              {formatINR(pkg.resident_price!)}
              {pkg.type === "hourly" && <span className="text-xs font-normal ml-0.5">/hr</span>}
            </span>
          </div>
        )}

        {/* Non-resident / standard rate */}
        <div className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2 border",
          !isResident || !hasResidentRate
            ? "bg-slate-900 border-slate-900"
            : "bg-slate-50 border-slate-200 opacity-60"
        )}>
          <span className={cn(
            "text-xs font-medium",
            !isResident || !hasResidentRate ? "text-slate-300" : "text-slate-500"
          )}>
            {hasResidentRate ? "Outside Guest" : "Standard Rate"}
          </span>
          <span className={cn(
            "font-bold text-sm",
            !isResident || !hasResidentRate ? "text-white" : "text-slate-600"
          )}>
            {formatINR(pkg.price)}
            {pkg.type === "hourly" && <span className="text-xs font-normal ml-0.5">/hr</span>}
          </span>
        </div>

        {/* GST note */}
        {(pkg.gst_percentage ?? 0) > 0 && (
          <p className="text-[10px] text-slate-400 text-right">
            {pkg.is_gst_inclusive ? `Incl. ${pkg.gst_percentage}% GST` : `+ ${pkg.gst_percentage}% GST extra`}
          </p>
        )}
      </div>
    </motion.div>
  );
}

