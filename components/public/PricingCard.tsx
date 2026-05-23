"use client";

import { Check } from "lucide-react";
import { formatINR } from "@/lib/utils/formatters";
import { getSlotTypeLabel } from "@/lib/utils/slots";
import type { FacilityPackage } from "@/types/database";
import { cn } from "@/lib/utils/formatters";

interface PricingCardProps {
  pkg: FacilityPackage;
  selected?: boolean;
  onSelect?: (pkg: FacilityPackage) => void;
}

export function PricingCard({ pkg, selected, onSelect }: PricingCardProps) {
  const typeLabel = getSlotTypeLabel(pkg.type);
  const isClickable = !!onSelect;

  const timingLabel =
    pkg.start_time && pkg.end_time
      ? `${pkg.start_time} – ${pkg.end_time}`
      : pkg.duration_hours
      ? `${pkg.duration_hours} hour${pkg.duration_hours > 1 ? "s" : ""} per booking`
      : null;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={() => onSelect?.(pkg)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(pkg)}
      className={cn(
        "relative border rounded-xl p-5 transition-all",
        isClickable && "cursor-pointer",
        selected
          ? "border-amber-600 bg-amber-50 shadow-sm"
          : "border-stone-200 bg-white hover:border-stone-300"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 bg-amber-600 text-white rounded-full p-0.5">
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-semibold text-stone-900">{pkg.name}</h4>
          <span className="text-xs text-stone-500 capitalize bg-stone-100 px-2 py-0.5 rounded-full mt-1 inline-block">
            {typeLabel}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-stone-900">{formatINR(pkg.price)}</p>
          {pkg.type === "hourly" && (
            <p className="text-xs text-stone-400">/hour</p>
          )}
        </div>
      </div>

      {timingLabel && (
        <p className="text-xs text-stone-500 mt-2">{timingLabel}</p>
      )}

      {pkg.description && (
        <p className="text-sm text-stone-500 mt-2 leading-relaxed">{pkg.description}</p>
      )}
    </div>
  );
}
