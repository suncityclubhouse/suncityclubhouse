import type { SlotType } from "@/types/database";

// Operating hours for hourly bookings
export const OPERATING_HOURS = {
  start: 6,   // 6:00 AM
  end: 22,    // 10:00 PM
};

export const SLOT_DURATION_MINUTES = 60; // 1-hour slots

/**
 * Generate all possible hourly time slots for a day
 */
export function generateHourlySlots(): Array<{ startTime: string; endTime: string; label: string }> {
  const slots = [];
  for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
    const startLabel = formatHour(hour);
    const endLabel = formatHour(hour + 1);
    slots.push({ startTime, endTime, label: `${startLabel} – ${endLabel}` });
  }
  return slots;
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

/**
 * Check if a time range overlaps with any booked/reserved slots
 */
export function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Get the display label for a slot type
 */
export function getSlotTypeLabel(type: SlotType): string {
  const labels: Record<SlotType, string> = {
    hourly: "Hourly",
    half_day: "Half Day",
    full_day: "Full Day",
    monthly: "Monthly",
    quarterly: "Quarterly",
  };
  return labels[type] ?? type;
}

/**
 * Calculate total price for a booking
 * @param pricePerUnit — price per hour or flat package price
 * @param units — number of hours (for hourly) or 1 (for packages)
 */
export function calculatePrice(pricePerUnit: number, units: number = 1): number {
  return Math.round(pricePerUnit * units * 100) / 100;
}
