import { format, addMinutes, isAfter, isBefore, parseISO } from "date-fns";

/**
 * Format a date for display (e.g. "Saturday, 23 May 2026")
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, d MMMM yyyy");
}

/**
 * Format a short date (e.g. "23 May 2026")
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy");
}

/**
 * Format ISO date to yyyy-MM-dd for DB queries
 */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Format time "HH:MM" to display "10:00 AM"
 */
export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, "h:mm a");
}

/**
 * Get remaining seconds until a target time.
 * Returns 0 if already expired.
 */
export function getRemainingSeconds(expiresAt: string): number {
  const expires = parseISO(expiresAt);
  const now = new Date();
  if (isAfter(now, expires)) return 0;
  return Math.floor((expires.getTime() - now.getTime()) / 1000);
}

/**
 * Format seconds as "MM:SS" countdown display
 */
export function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Check if a date is in the past (before today)
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isBefore(date, today);
}

/**
 * Get the ISO expiry timestamp for a temporary reservation (15 min from now)
 */
export function getReservationExpiry(): string {
  return addMinutes(new Date(), 15).toISOString();
}

/**
 * Get the ISO expiry for a booking awaiting payment (15 min from now)
 */
export function getBookingExpiry(): string {
  return addMinutes(new Date(), 15).toISOString();
}

/**
 * Calculate the end_date for multi-day booking types.
 * monthly  → same date next month minus 1 day (e.g. June 4 → July 3)
 * quarterly → same date + 3 months minus 1 day (e.g. June 4 → September 3)
 * Returns null for slot types that don't span multiple days.
 */
export function calculateEndDate(bookingDate: Date | string, slotType: string): string | null {
  if (slotType !== "monthly" && slotType !== "quarterly") return null;

  const start = typeof bookingDate === "string" ? parseISO(bookingDate) : new Date(bookingDate);
  const end = new Date(start);

  if (slotType === "monthly") {
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1);
  } else if (slotType === "quarterly") {
    end.setMonth(end.getMonth() + 3);
    end.setDate(end.getDate() - 1);
  }

  return format(end, "yyyy-MM-dd");
}
