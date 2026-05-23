import { type LucideIcon } from "lucide-react";
import { cn, formatINR, formatCompactNumber } from "@/lib/utils/formatters";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  isCurrency?: boolean;
  trend?: { value: number; label: string };
  className?: string;
  accentColor?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  isCurrency,
  trend,
  className,
  accentColor = "#8b6914",
}: KPICardProps) {
  const displayValue =
    isCurrency && typeof value === "number"
      ? formatINR(value)
      : typeof value === "number"
      ? formatCompactNumber(value)
      : value;

  return (
    <div className={cn("bg-white border border-stone-200 rounded-xl p-5 hover:shadow-sm transition-shadow", className)}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-md",
              trend.value >= 0
                ? "text-emerald-700 bg-emerald-50"
                : "text-red-700 bg-red-50"
            )}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-stone-900 mb-0.5">{displayValue}</p>
      <p className="text-sm font-medium text-stone-500">{title}</p>
      {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
