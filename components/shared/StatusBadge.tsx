import { cn, getStatusMeta } from "@/lib/utils/formatters";
import type { BookingStatus } from "@/types/database";

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, color, bgColor } = getStatusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        bgColor,
        color,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", {
        "bg-amber-500": status === "awaiting_payment",
        "bg-blue-500": status === "pending_approval",
        "bg-emerald-500": status === "confirmed",
        "bg-red-500": status === "rejected",
        "bg-stone-400": status === "cancelled" || status === "expired",
        "bg-violet-500": status === "completed",
      })} />
      {label}
    </span>
  );
}
